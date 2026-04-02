export interface User {
  id?: number;
  full_name: string;
  email: string;
  phone: string;
  cccd: string;
  role: string;
  status: boolean;
  is_first_login: boolean;
  created_at?: string;
  employer_id: number;
}