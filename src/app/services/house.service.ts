import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HouseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/rooms`; 
  private adminUrl = `${environment.apiUrl}/admin/houses`;

  getAllHouses(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/general/houses?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  // 2. Thêm nhà mới
  createHouse(houseData: any): Observable<any> {
    return this.http.post<any>(this.adminUrl, houseData);
  }

  // 3. Sửa thông tin nhà
  updateHouse(id: number, houseData: any): Observable<any> {
    return this.http.put<any>(`${this.adminUrl}/${id}`, houseData);
  }

  // 4. Xóa nhà
  deleteHouse(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminUrl}/${id}`);
  }
}