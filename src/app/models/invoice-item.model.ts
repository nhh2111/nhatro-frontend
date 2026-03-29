export interface InvoiceItem {
  id?: number;
  invoice_id: number;
  service_id?: number;
  description: string;
  amount: number;
}