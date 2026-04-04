import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TaskService } from '../../../../services/task.service';
import { HouseService } from '../../../../services/house.service'; 
import { RoomService } from '../../../../services/room.service';   

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private houseService = inject(HouseService);
  private roomService = inject(RoomService);

  taskList: any[] = [];
  houseList: any[] = [];
  filteredRoomList: any[] = []; 
  isLoading: boolean = false;
  errorMessage: string = '';

  // BIẾN PHÂN TRANG
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  editingTaskId: number | null = null;
  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.fb.group({
      house_id: ['', Validators.required],
      room_id: [null], 
      title: ['', Validators.required],
      content: [''],
      status: ['OPEN'],
      assignee: [''], 
      cost: [0, Validators.min(0)] 
    });

    this.taskForm.get('house_id')?.valueChanges.subscribe(houseId => {
      this.onHouseChange(Number(houseId));
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.loadDropdownData();
  }

  // TÁCH RIÊNG HÀM LOAD NHÀ VÀ PHÒNG DÙNG CHO DROPDOWN
  loadDropdownData(): void {
    // Truyền số lượng lớn để lấy tất cả nhà bỏ vào thẻ Select
    this.houseService.getAllHouses(1, 100, '').subscribe({
      next: (res) => { 
        if(res.errorCode === 200) {
           this.houseList = res.result.records; 
        }
      }
    });
  }

  // CHUẨN HÓA HÀM LOAD TASK THEO PHÂN TRANG
  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getAllTasks(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if(res.errorCode === 200) {
           this.taskList = res.result.records; 
           this.totalRecords = res.result.recordCount;
           this.totalPages = res.result.pageCount;
           this.currentPage = res.result.currentPage;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể lấy danh sách sự cố.';
        this.isLoading = false;
      }
    });
  }

  // Xử lý khi chọn Nhà trong Form -> Lọc Phòng
  onHouseChange(houseId: number): void {
    if (!houseId) {
      this.filteredRoomList = [];
      this.taskForm.get('room_id')?.disable();
      return;
    }

    this.taskForm.get('room_id')?.enable();
    
    // Gọi API lấy toàn bộ phòng (pageSize lớn) rồi lọc bằng JS
    this.roomService.getAllRooms(1, 200, '').subscribe({
      next: (res) => {
        if(res.errorCode === 200) {
          this.filteredRoomList = res.result.records.filter((room: any) => room.house_id === houseId);
        }
      }
    });
  }

  // --- LOGIC TÌM KIẾM VÀ PHÂN TRANG ---
  onSearch(): void {
    this.currentPage = 1;
    this.loadTasks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  // Hàm cập nhật trạng thái nhanh ngay trên bảng danh sách
  changeStatus(taskId: number, newStatus: string): void {
    this.taskService.updateTask(taskId, { status: newStatus }).subscribe({
      next: (res) => {
        // Cập nhật lại UI mà không cần load lại cả danh sách
        const taskIndex = this.taskList.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this.taskList[taskIndex].status = newStatus;
          this.loadTasks(); // Gọi lại loadTasks để cập nhật ngày hoàn thành từ DB
        }
      },
      error: (err) => alert('Lỗi cập nhật: ' + err.error?.error)
    });
  }

  // --- Logic Modal ---
  openAddModal(): void {
    this.isEditMode = false;
    this.editingTaskId = null;
    this.taskForm.reset({ status: 'OPEN', house_id: '', room_id: null, cost: 0, assignee: '' });
    this.showModal = true;
  }

  openEditModal(task: any): void {
    this.isEditMode = true;
    this.editingTaskId = task.id;
    
    this.taskForm.patchValue({
      house_id: task.house_id,
      room_id: task.room_id,
      title: task.title,
      content: task.content,
      status: task.status,
      assignee: task.assignee || '', 
      cost: task.cost || 0
    });
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTaskId = null;
    this.filteredRoomList = [];
  }

  // --- Logic Xử lý dữ liệu ---
  saveTask(): void {
    if (this.taskForm.invalid) return;
    this.isLoading = true;

    const rawValue = this.taskForm.value;
    const payload = {
      ...rawValue,
      house_id: Number(rawValue.house_id),
      room_id: rawValue.room_id ? Number(rawValue.room_id) : null,
      cost: Number(rawValue.cost) || 0
    };

    if (this.isEditMode && this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: (res) => {
          alert('Cập nhật sự cố thành công!');
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.error || err.message));
          this.isLoading = false;
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (res) => {
          alert('Đã ghi nhận sự cố mới!');
          this.closeModal();
          this.loadTasks();
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.error || err.message));
          this.isLoading = false;
        }
      });
    }
  }

  deleteTask(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu sự cố này không?')) {
      this.isLoading = true;
      this.taskService.deleteTask(id).subscribe({
        next: (res) => {
          alert('Xóa thành công!');
          this.loadTasks();
        },
        error: (err) => {
          alert('Lỗi xóa: ' + err.error?.error);
          this.isLoading = false;
        }
      });
    }
  }
}