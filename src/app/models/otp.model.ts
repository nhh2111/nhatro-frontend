export interface OTP {
  id?: number;
  email: string;
  code: string;
  expires_at: string; 
  is_used: boolean;
}