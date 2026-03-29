export interface Transaction {
	id?: number;
	house_id?: number;
	room_id?: number;
	type: string;
	category: string;
	amount: number;
	transaction_date?: string;
	payer_payee_name: string;
	description: string;
} 