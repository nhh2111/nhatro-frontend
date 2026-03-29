import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/contracts`; 

  getAllContracts(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/general/contracts?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  createContract(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  terminateContract(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/terminate`, {});
  }
}