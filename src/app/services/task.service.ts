import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/general/tasks`;

  getAllTasks(page: number = 1, pageSize: number = 10, search: string = '') {
    const url = `${environment.apiUrl}/general/tasks?page=${page}&pageSize=${pageSize}&search=${search}`;
    return this.http.get<any>(url);
  }

  createTask(taskData: any): Observable<any> {
    return this.http.post(this.apiUrl, taskData);
  }

  updateTask(id: number, updatedData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updatedData);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}