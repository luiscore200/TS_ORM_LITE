import * as fs from 'fs';
import * as path from 'path';
import { UserRoles, Users } from '../db.schema';

// 📥 Importa todos los `TableSchema`




const schemas = [
  
  Users,
  UserRoles
 
];

const sqlTypeToTsType = (sqlType: any): string => {
  switch (sqlType.type) {
    case 'VARCHAR':
    case 'TEXT':
      return 'string';
    case 'ENUM':
      return `'${sqlType.values.join(`' | '`)}'`;
    case 'BOOLEAN':
      return 'boolean';
    case 'DATETIME':
      return 'string'; // o Date
    case 'INT':
      return 'number';
    default:
      return 'any';
  }
};

function generateInterfaces() {
  const output: string[] = [
    '// AUTO-GENERATED FILE. DO NOT EDIT.',
    '// Run: `ts-node src/common/providers/Iorm.provider.ts` to update.',
    '',
  ];

  for (const schema of schemas) {
    const rows: string[] = [];

    for (const col of Object.values(schema.columns)) {
      const tsType = sqlTypeToTsType(col.sqlType);

      let optional = '';
      if (col.name === 'id') {
        optional = ''; // Nunca opcional en ROW final
      } else if (col.nullable) {
        optional = '?';
      }

      rows.push(`  ${col.name}${optional}: ${tsType};`);
    }

    const tableName = schema.name;
    const interfaceName =
      tableName
        .split('_')
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join('') + 'Row';

    const iface = `export interface ${interfaceName} {\n${rows.join('\n')}\n}`;
    output.push(iface);
  }

  const outputPath = path.join(__dirname, '../interfaces/orm.d.ts');
  const backupPath = outputPath + '.bak';

  // ⚡️ Si existe backup anterior, bórralo
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    console.log(`🗑️  [Iorm.provider] Backup antiguo eliminado.`);
  }

  // ⚡️ Si existe el archivo actual, crear backup primero
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, backupPath);
    console.log(`📦 [Iorm.provider] Backup creado en: ${backupPath}`);
    fs.unlinkSync(outputPath);
    console.log(`🗑️  [Iorm.provider] Archivo antiguo eliminado.`);
  }

  fs.writeFileSync(outputPath, output.join('\n\n'));
  console.log(`✅ [Iorm.provider] Interfaces actualizadas -> ${outputPath}`);
}

generateInterfaces();
