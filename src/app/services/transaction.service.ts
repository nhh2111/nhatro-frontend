import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/transactions`;

  getAllTransactions(page: number = 1, pageSize: number = 10, search: string = '', monthYear: string = ''): Observable<any> {
    const url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}&search=${search}&month_year=${monthYear}`;
    return this.http.get<any>(url);
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  deleteTransaction(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}