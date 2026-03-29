export interface Invoice {
  id?: number;
  contract_id: number;
  month_year: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at?: string;
}