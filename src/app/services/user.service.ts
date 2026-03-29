import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/users`;

  getAllStaffs(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/admin/users?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  createStaff(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateStaff(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteStaff(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}