export interface Contract {
  id?: number;
  room_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  status: string;
}