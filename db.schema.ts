// UserSchema.ts
import { TableSchema } from "./interfaces/scheme.type";
import { UserRolesRow, UsersRow } from "./interfaces/Iorm";

export const Users: TableSchema<UsersRow> = {
  name: 'users',
  columns: {
    id: {
      name: 'id',
      sqlType: { type: 'INT' },
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      name: 'username',
      sqlType: { type: 'VARCHAR', length: 150 },
      unique: true,
      nullable: false,
    },
    email: {
      name: 'email',
      sqlType: { type: 'VARCHAR', length: 255 },
      unique: true,
      nullable: false,
    },
    created_at: {
      name: 'created_at',
      sqlType: { type: 'DATETIME' },
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      name: 'updated_at',
      sqlType: { type: 'DATETIME' },
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
  },
};


// UserRolesSchema.ts



export const UserRoles: TableSchema<UserRolesRow> = {
  name: 'user_roles',
  columns: {
    id: {
      name: 'id',
      sqlType: { type: 'INT' },
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      name: 'userId',
      sqlType: { type: 'INT' },
      nullable: false,
    },
    role: {
      name: 'role',
      sqlType: { type: 'ENUM', values: ['admin', 'editor', 'viewer'] },
      nullable: false,
    },
  },
  foreignKeys: {
    user_fk: {
      column: 'userId',
      scheme: Users,
      references: {
        table: 'users',
        column: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
};
