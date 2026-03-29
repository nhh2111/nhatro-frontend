import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { RoomService } from '../../../../services/room.service';
import { ServiceService } from '../../../../services/service.service';

@Component({
  selector: 'app-meter-reading-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './meter-reading-list.component.html',
  styleUrls: ['./meter-reading-list.component.scss'] 
})
export class MeterReadingListComponent implements OnInit {
  private http = inject(HttpClient);
  private roomService = inject(RoomService);
  private serviceService = inject(ServiceService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  rooms: any[] = [];
  meterServices: any[] = []; 
  isLoading: boolean = false;
  isEditMode: boolean = false;
  currentReadingId?: number;

  selectedMonth: string = new Date().toISOString().substring(0, 7); 
  readingsList: any[] = [];

  readingForm: FormGroup = this.fb.group({
    room_id: ['', Validators.required],
    service_id: ['', Validators.required],
    reading_date: ['', Validators.required],
    old_index: [0, [Validators.required, Validators.min(0)]],
    new_index: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDropdownData();
      this.loadReadings(); 
    }
  }

  loadDropdownData(): void {
    // 1. Sửa lỗi lấy danh sách phòng (Truyền tham số và dùng res.result.records)
    this.roomService.getAllRooms(1, 100, '').subscribe(res => {
      if (res.errorCode === 200 && res.result && res.result.records) {
        this.rooms = res.result.records.filter((r: any) => r.status === 'OCCUPIED');
      }
    });

    // 2. Sửa lỗi lấy danh sách dịch vụ
    this.serviceService.getAllServices(1, 100, '').subscribe(res => {
      if (res.errorCode === 200 && res.result && res.result.records) {
        this.meterServices = res.result.records.filter((s: any) => s.service_type === 'METERED' || s.service_type === 'METER');
      }
    });
  }

  loadReadings(): void {
    this.http.get(`${environment.apiUrl}/general/meter-readings?month=${this.selectedMonth}`).subscribe({
      next: (res: any) => {
        if(res.errorCode === 200) {
           this.readingsList = res.result; 
        } else {
           this.readingsList = res.data || [];
        }
      },
      error: (err) => console.error('Lỗi tải lịch sử:', err)
    });
  }

  editReading(reading: any): void {
    this.isEditMode = true;
    this.currentReadingId = reading.id; 
    
    const formattedDate = reading.reading_date ? reading.reading_date.substring(0, 10) : '';
    
    this.readingForm.patchValue({
      room_id: reading.room_id,
      service_id: reading.service_id,
      reading_date: formattedDate,
      old_index: reading.old_index,
      new_index: reading.new_index
    });
    
    this.readingForm.get('room_id')?.disable();
    this.readingForm.get('service_id')?.disable();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.currentReadingId = undefined;
    this.readingForm.reset({ old_index: 0, new_index: 0 });
    this.readingForm.get('room_id')?.enable();
    this.readingForm.get('service_id')?.enable();
  }

  submitReading(): void {
    if (this.readingForm.invalid) {
      alert('Vui lòng điền đủ thông tin!');
      return;
    }
    const rawValue = this.readingForm.getRawValue();

    if (rawValue.new_index < rawValue.old_index) {
      alert('Lỗi: Chỉ số mới không thể nhỏ hơn chỉ số cũ!');
      return;
    }

    this.isLoading = true;
    const formattedDate = new Date(rawValue.reading_date).toISOString();

    const payload = {
      room_id: Number(rawValue.room_id),
      service_id: Number(rawValue.service_id),
      reading_date: formattedDate,
      old_index: Number(rawValue.old_index),
      new_index: Number(rawValue.new_index)
    };

    if (this.isEditMode && this.currentReadingId) {
      this.http.put(`${environment.apiUrl}/general/meter-readings/${this.currentReadingId}`, payload).subscribe({
        next: (res: any) => {
          alert('Cập nhật thành công!');
          this.cancelEdit(); 
          this.loadReadings();
          this.isLoading = false;
        },
        error: (err) => { alert('Lỗi: ' + err.message); this.isLoading = false; }
      });
    } else {
      this.http.post(`${environment.apiUrl}/general/meter-readings`, payload).subscribe({
        next: (res: any) => {
          alert('Ghi chỉ số thành công!');
          this.readingForm.patchValue({ old_index: payload.new_index, new_index: 0 }); 
          this.loadReadings(); 
          this.isLoading = false;
        },
        error: (err) => { alert('Lỗi: ' + err.message); this.isLoading = false; }
      });
    }
  }

  deleteReading(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi chỉ số này không?')) {
      this.http.delete(`${environment.apiUrl}/general/meter-readings/${id}`).subscribe({
        next: (res: any) => {
          alert('Đã xóa thành công!');
          this.loadReadings();
        },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || err.message))
      });
    }
  }
}