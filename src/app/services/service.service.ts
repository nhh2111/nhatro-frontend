import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private http = inject(HttpClient);
  
  private generalUrl = `${environment.apiUrl}/general/services`; 
  private adminUrl = `${environment.apiUrl}/admin/services`;    

  getAllServices(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/general/services?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  createService(data: any): Observable<any> {
    return this.http.post<any>(this.adminUrl, data);
  }

  updateService(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/${id}`, data);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminUrl}/${id}`);
  }
}