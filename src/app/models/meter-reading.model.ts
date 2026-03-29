export interface MeterReading {
  id?: number;
  room_id: number;
  service_id: number;
  billing_month: string;
  reading_date: string;
  old_index: number;
  new_index: number;
  usage_value?: number;
}