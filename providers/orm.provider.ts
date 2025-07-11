import { OkPacket, Pool, RowDataPacket } from 'mysql2/promise';
import { TableSchema } from '../interfaces/scheme.type';

 type SQLOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IN';

 interface OrmCriteria {
  field: string;
  operator?: SQLOperator; // Opcional, por defecto '='
  value: any;
}

export class MiniOrm {
  constructor(private readonly pool: Pool) {}

  private buildWhereClause(criteria: OrmCriteria[]): { where: string; values: any[] } {
    if (!criteria.length) throw new Error('Criteria required');

    const clauses: string[] = [];
    const values: any[] = [];

    for (const c of criteria) {
      const op = c.operator ?? '=';
      if (op === 'IN') {
        if (!Array.isArray(c.value) || !c.value.length) {
          throw new Error(`Operator 'IN' requires a non-empty array`);
        }
        clauses.push(`\`${c.field}\` IN (${c.value.map(() => '?').join(', ')})`);
        values.push(...c.value);
      } else {
        clauses.push(`\`${c.field}\` ${op} ?`);
        values.push(c.value);
      }
    }

    return { where: clauses.join(' AND '), values };
  }

  async createTable(schema: TableSchema): Promise<{ rawQuery: string; rawResult: any; ormResult: string }> {
    const columnsArray = Object.values(schema.columns);

    const columnsSql = columnsArray.map(col => {
      let type = '';
      switch (col.sqlType.type) {
        case 'VARCHAR': type = `VARCHAR(${col.sqlType.length})`; break;
        case 'INT': type = 'INT'; break;
        case 'BOOLEAN': type = 'BOOLEAN'; break;
        case 'DATETIME': type = 'DATETIME'; break;
        case 'TEXT': type = 'TEXT'; break;
        case 'ENUM':
          const enumVals = col.sqlType.values.map(v => `'${v}'`).join(', ');
          type = `ENUM(${enumVals})`;
          break;
        default: throw new Error(`Unknown sqlType`);
      }

      let def = `\`${col.name}\` ${type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement) def += ' AUTO_INCREMENT';
      if (col.unique) def += ' UNIQUE';
      if (!col.nullable) def += ' NOT NULL';
      if (col.default !== undefined) {
        def += ` DEFAULT ${
          typeof col.default === 'string' && !col.default.startsWith('CURRENT_')
            ? `'${col.default}'` : col.default
        }`;
      }
      if (col.onUpdate) def += ` ON UPDATE ${col.onUpdate}`;
      return def;
    });

    const foreignKeysSql = Object.entries(schema.foreignKeys || {}).map(([_, fk]) => {
      let sql = `FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.references.table}\`(\`${fk.references.column}\`)`;
      if (fk.onDelete) sql += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate) sql += ` ON UPDATE ${fk.onUpdate}`;
      return sql;
    });

    const parts = [...columnsSql, ...foreignKeysSql].filter(Boolean);
    const sql = `CREATE TABLE IF NOT EXISTS \`${schema.name}\` (${parts.join(', ')}) ENGINE=InnoDB;`;

    const [result] = await this.pool.execute(sql);
    return { rawQuery: sql, rawResult: result, ormResult: `Table '${schema.name}' created (if not exists)` };
  }

  async insert<T>(
    schema: TableSchema,
    rows: T[],
  ): Promise<{ rawQuery: string; rawResult: OkPacket; ormResult: { insertId: number; affectedRows: number } }> {
    if (!rows.length) throw new Error('No rows provided for insert.');

    const columns = Object.keys(schema.columns).filter(
      c => !schema.columns[c].primaryKey && !schema.columns[c].autoIncrement && !['created_at', 'updated_at'].includes(c)
    );

    const placeholders = columns.map(() => '?').join(', ');
    const values: any[] = [];

    const group = rows.map(row => {
      const rowValues = columns.map(col => (row as any)[col]);
      values.push(...rowValues);
      return `(${placeholders})`;
    }).join(', ');

    const sql = `INSERT INTO \`${schema.name}\` (${columns.join(', ')}) VALUES ${group}`;
    const [result] = await this.pool.execute<OkPacket>(sql, values);

    return { rawQuery: sql, rawResult: result, ormResult: { insertId: result.insertId, affectedRows: result.affectedRows } };
  }

  async find<T>(
    schema: TableSchema<T>,
    criteria: OrmCriteria[] = [],
    columns: string[] = ['*'],
  ): Promise<{ rawQuery: string; rawResult: RowDataPacket[]; ormResult: T[] }> {
    let sql = `SELECT ${columns.join(', ')} FROM \`${schema.name}\``;
    let values: any[] = [];

    if (criteria.length) {
      const { where, values: whereValues } = this.buildWhereClause(criteria);
      sql += ` WHERE ${where}`;
      values = whereValues;
    }

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, values);
    return { rawQuery: sql, rawResult: rows, ormResult: rows as T[] };
  }

  async update<T>(
    schema: TableSchema,
    data: Partial<T>,
    criteria: OrmCriteria[],
  ): Promise<{ rawQuery: string; rawResult: OkPacket; ormResult: { affectedRows: number } }> {
    const setFields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    const setClause = setFields.map(f => `\`${f}\` = ?`).join(', ');
    const setValues = setFields.map(f => (data as any)[f]);

    const { where, values: whereValues } = this.buildWhereClause(criteria);

    const sql = `UPDATE \`${schema.name}\` SET ${setClause} WHERE ${where}`;
    const [result] = await this.pool.execute<OkPacket>(sql, [...setValues, ...whereValues]);

    return { rawQuery: sql, rawResult: result, ormResult: { affectedRows: result.affectedRows } };
  }

  async delete(
    schema: TableSchema,
    criteria: OrmCriteria[],
  ): Promise<{ rawQuery: string; rawResult: OkPacket; ormResult: { affectedRows: number } }> {
    const { where, values } = this.buildWhereClause(criteria);

    const sql = `DELETE FROM \`${schema.name}\` WHERE ${where}`;
    const [result] = await this.pool.execute<OkPacket>(sql, values);

    return { rawQuery: sql, rawResult: result, ormResult: { affectedRows: result.affectedRows } };
  }

  // ✅ Mantengo tu JOIN tal cual
  async indexWithRelations(
    mainTable: { tableSchema: TableSchema; alias?: string },
    relatedTables: {
      tableSchema: TableSchema;
      alias: string;
      foreignKey: string;
      outputName?: string;
    }[],
    whereClause?: string,
    inner: boolean = false,
  ): Promise<{ rawQuery: string; rawResult: RowDataPacket[]; ormResult: any }> {
    const mainAlias = mainTable.alias ?? 'main';

    const mainCols = Object.keys(mainTable.tableSchema.columns).map(
      col => `${mainAlias}.${col} AS ${mainAlias}_${col}`
    );

    const relCols = relatedTables.flatMap(rt =>
      Object.keys(rt.tableSchema.columns).map(
        col => `${rt.alias}.${col} AS ${rt.alias}_${col}`
      )
    );

    const joins = relatedTables.map(rt =>
      `${inner ? 'INNER' : 'LEFT'} JOIN \`${rt.tableSchema.name}\` ${rt.alias} ON ${rt.alias}.${rt.foreignKey} = ${mainAlias}.id`
    );

    const sql = `
      SELECT ${[...mainCols, ...relCols].join(', ')}
      FROM \`${mainTable.tableSchema.name}\` ${mainAlias}
      ${joins.join(' ')}
      ${whereClause ? `WHERE ${whereClause}` : ''}
    `.trim();

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql);
    const ormResult = this.mapToNested(rows, mainTable, relatedTables);
    return { rawQuery: sql, rawResult: rows, ormResult };
  }

  private mapToNested(
    rows: RowDataPacket[],
    mainTable: { tableSchema: TableSchema; alias?: string },
    relatedTables: {
      tableSchema: TableSchema;
      alias: string;
      foreignKey: string;
      outputName?: string;
    }[]
  ) {
    if (!rows.length) return null;

    const mainAlias = mainTable.alias ?? 'main';
    const mainCols = mainTable.tableSchema.columns;

    const mainEntity: any = {};
    for (const col of Object.keys(mainCols)) {
      mainEntity[col] = rows[0][`${mainAlias}_${col}`];
    }

    if (!relatedTables.length) return mainEntity;

    let currentLevelMap = new Map<number, any>();
    let parent = mainEntity;

    relatedTables.forEach((rt, index) => {
      const cols = rt.tableSchema.columns;
      const nextLevelMap = new Map<number, any>();
      const outputName = rt.outputName ?? rt.alias + 's';

      for (const row of rows) {
        const id = row[`${rt.alias}_${cols.id.name}`];
        if (!id) continue;

        if (!nextLevelMap.has(id)) {
          const item: any = {};
          for (const col of Object.keys(cols)) {
            item[col] = row[`${rt.alias}_${col}`];
          }
          nextLevelMap.set(id, item);
        }

        if (index > 0) {
          const parentId = row[`${relatedTables[index - 1].alias}_${relatedTables[index - 1].tableSchema.columns.id.name}`];
          if (currentLevelMap.has(parentId)) {
            const parentObj = currentLevelMap.get(parentId);
            const childList = parentObj[outputName] ?? [];
            if (!childList.find((c: any) => c.id === id)) {
              childList.push(nextLevelMap.get(id));
              parentObj[outputName] = childList;
            }
          }
        }
      }

      if (index === 0) {
        parent[outputName] = Array.from(nextLevelMap.values());
      }

      currentLevelMap = nextLevelMap;
    });

    return mainEntity;
  }
}
