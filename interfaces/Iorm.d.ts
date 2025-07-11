export interface UsersRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRolesRow {
  id: number;
  userId: number;
  role: 'admin' | 'editor' | 'viewer';
}