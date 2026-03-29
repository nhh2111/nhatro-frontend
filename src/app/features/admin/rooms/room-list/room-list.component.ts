import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormsModule, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../../../services/room.service';
import { HouseService } from '../../../../services/house.service';
import { ServiceService } from '../../../../services/service.service';
import { ContractService } from '../../../../services/contract.service'; 
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private houseService = inject(HouseService);
  private platformId = inject(PLATFORM_ID);
  private srvService = inject(ServiceService);
  private contractService = inject(ContractService); 
  private authService = inject(AuthService);

  userRole: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  availableServices: any[] = [];
  showServiceModal: boolean = false;
  selectedRoomIdForService?: number;
  selectedServiceIds: number[] = [];

  houseList: any[] = [];
  roomList: any[] = []; 
  isLoading: boolean = false;
  errorMessage: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentRoomId?: number;

  roomForm: FormGroup = this.fb.group({
    house_id: ['', Validators.required],
    room_number: ['', Validators.required],
    floor: [1, [Validators.required, Validators.min(1)]],
    width: [0, Validators.required],
    length: [0, Validators.required],
    base_price: [0, [Validators.required, Validators.min(0)]],
    max_occupants: [1, [Validators.required, Validators.min(1)]],
    gender_restriction: ['ALL', Validators.required],
    status: ['AVAILABLE', Validators.required],
    description: [''],
    images: ['']
  });

  getHouseName(houseId: number): string {
    if (!this.houseList || this.houseList.length === 0) return 'Đang tải...';
    
    const foundHouse = this.houseList.find((h: any) => h.id === houseId);
    return foundHouse ? foundHouse.name : 'Chưa xác định';
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRooms();
      this.loadHouses();
      this.loadAvailableServices();
      this.userRole = this.authService.getUserRole();
    }
  }

  loadAvailableServices(): void {
    this.srvService.getAllServices(1, 100, '').subscribe({
      next: (res) => {
        if (res.errorCode === 200) {
          this.availableServices = res.result.records;
        }
      },
      error: (err) => console.error('Lỗi tải danh sách dịch vụ:', err)
    });
  }

  loadHouses(): void {
    this.houseService.getAllHouses(1, 100, '').subscribe({
      next: (res) => {
        if (res.errorCode === 200) {
          this.houseList = res.result.records; 
        }
      },
      error: (err) => console.error('Lỗi tải danh sách nhà:', err)
    });
  }

  loadRooms(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.roomService.getAllRooms(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.roomList = res.result.records; 
          this.totalRecords = res.result.recordCount;
          this.totalPages = res.result.pageCount;
          this.currentPage = res.result.currentPage;
        }
        this.isLoading = false; 
      },
      error: (err) => {
        this.errorMessage = 'Lỗi tải dữ liệu: ' + (err.error?.errorMessage || err.message);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRooms();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRooms();
    }
  }

  deleteRoom(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa phòng này? Các dữ liệu liên quan cũng sẽ bị xóa!')) {
      this.roomService.deleteRoom(id).subscribe({
        next: () => {
          alert('Xóa phòng thành công!');
          this.loadRooms();
        },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || 'Không xác định'))
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentRoomId = undefined;
    this.roomForm.reset({
      house_id: '', floor: 1, width: 0, length: 0, base_price: 0,
      max_occupants: 1, gender_restriction: 'ALL', status: 'AVAILABLE'
    });
    this.showModal = true;
  }

  openEditModal(room: any): void {
    this.isEditMode = true;
    this.currentRoomId = room.id;
    this.roomForm.patchValue(room);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveRoom(): void {
    if (this.roomForm.invalid) {
      alert('Vui lòng điền đầy đủ và chính xác thông tin bắt buộc!');
      return;
    }
    const rawValue = this.roomForm.value;
    const roomData = {
      ...rawValue,
      house_id: Number(rawValue.house_id),
      floor: Number(rawValue.floor),
      width: Number(rawValue.width),
      length: Number(rawValue.length),
      base_price: Number(rawValue.base_price),
      max_occupants: Number(rawValue.max_occupants)
    };

    if (this.isEditMode && this.currentRoomId) {
      this.roomService.updateRoom(this.currentRoomId, roomData).subscribe({
        next: () => {
          alert('Cập nhật phòng thành công!');
          this.closeModal();
          this.loadRooms();
        },
        error: (err) => alert('Lỗi cập nhật: ' + (err.error?.detail || err.error?.message || err.message))
      });
    } else {
      this.roomService.createRoom(roomData).subscribe({
        next: () => {
          alert('Thêm phòng mới thành công!');
          this.closeModal();
          this.loadRooms();
        },
        error: (err) => alert('Lỗi thêm mới: ' + (err.error?.detail || err.error?.message || err.message))
      });
    }
  }

  openServiceModal(roomId: number | undefined): void {
    if (!roomId) return;
    this.selectedRoomIdForService = roomId;
    this.selectedServiceIds = []; 
    this.showServiceModal = true;

    this.roomService.getRoomServices(roomId).subscribe({
      next: (res) => {
        if (res.errorCode === 200 && res.result) {
          this.selectedServiceIds = res.result; 
        }
      },
      error: () => alert('Lỗi tải dịch vụ của phòng này')
    });
  }

  closeServiceModal(): void {
    this.showServiceModal = false;
    this.selectedRoomIdForService = undefined;
  }

  toggleService(serviceId: number, event: any): void {
    if (event.target.checked) {
      this.selectedServiceIds.push(serviceId);
    } else {
      this.selectedServiceIds = this.selectedServiceIds.filter(id => id !== serviceId);
    }
  }

  saveRoomServices(): void {
    if (!this.selectedRoomIdForService) return;
    this.roomService.assignServicesToRoom(this.selectedRoomIdForService, this.selectedServiceIds).subscribe({
      next: () => {
        alert('Cập nhật dịch vụ cho phòng thành công!');
        this.closeServiceModal();
      },
      error: (err) => alert('Lỗi cập nhật dịch vụ: ' + (err.error?.error || err.message))
    });
  }
}