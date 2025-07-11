export interface TableColumn {
  name: string;
  sqlType:SqlType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string | number;
  onUpdate?: string;

}


  export interface ForeignKeyConfig {
    column: string;
    scheme: TableSchema;
    references: {
      table: string;
      column: string;
    };
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  }
  
  export type SqlType =
  | { type: 'VARCHAR'; length: number }
  | { type: 'INT' }
  | { type: 'BOOLEAN' }
  | { type: 'TEXT' }
  | { type: 'DATETIME' }
  | { type: 'ENUM'; values: string[] };

  
  export type ForeignKeysMap = Record<
  string, // nombre de la tabla relacionada
  ForeignKeyConfig
>;
  
export interface TableSchema<T = unknown> {
  name: string;
  columns: Record<string, TableColumn>;
  foreignKeys?: ForeignKeysMap;
}

