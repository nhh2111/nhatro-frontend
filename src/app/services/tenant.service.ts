import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private generalUrl = `${environment.apiUrl}/general/tenants`;
  private adminUrl = `${environment.apiUrl}/admin/tenants`;

  getAllTenants(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/general/tenants?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  createTenant(data: any): Observable<any> {
    return this.http.post<any>(this.generalUrl, data);
  }

  updateTenant(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.generalUrl}/${id}`, data);
  }

  deleteTenant(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminUrl}/${id}`);
  }
}