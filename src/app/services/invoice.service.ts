import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/invoices`;

  getAllInvoices(page: number = 1, pageSize: number = 10, monthYear: string = '') {
    const url = `${environment.apiUrl}/general/invoices?page=${page}&pageSize=${pageSize}&month_year=${monthYear}`;
    return this.http.get<any>(url);
  }

  generateInvoices(monthYear: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate`, { month_year: monthYear });
  }

  payInvoice(invoiceId: number, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/pay`, { invoice_id: invoiceId, amount: amount });
  }
}