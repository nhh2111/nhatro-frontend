import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/rooms`; 
  private adminUrl = `${environment.apiUrl}/admin/rooms`; 

  getAllRooms(page: number, pageSize: number, search: string, houseId: string = ''): Observable<any> {
    let url = `${this.apiUrl}/?page=${page}&pageSize=${pageSize}&search=${search}`;
    if (houseId) {
      url += `&house_id=${houseId}`;
    }
    return this.http.get(url);
  }

  createRoom(roomData: Room): Observable<any> {
    return this.http.post(this.adminUrl, roomData);
  }

  updateRoom(id: number, roomData: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/${id}`, roomData);
  }

  deleteRoom(id: number): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${id}`);
  }

  getRoomServices(roomId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${roomId}/services`);
  }

  assignServicesToRoom(roomId: number, serviceIds: number[]): Observable<any> {
    return this.http.post(`${this.adminUrl}/${roomId}/services`, { service_ids: serviceIds });
  }
}