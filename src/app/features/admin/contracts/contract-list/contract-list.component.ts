import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// BỔ SUNG FormsModule vào đây
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ContractService } from '../../../../services/contract.service';
import { RoomService } from '../../../../services/room.service';
import { TenantService } from '../../../../services/tenant.service';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  // BỔ SUNG FormsModule vào imports
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contract-list.component.html',
  styleUrls: ['./contract-list.component.scss'] 
})
export class ContractListComponent implements OnInit {
  private contractService = inject(ContractService);
  private roomService = inject(RoomService);
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  contractList: any[] = [];
  availableRooms: any[] = [];
  tenantList: any[] = [];

  isLoading: boolean = false;
  showModal: boolean = false;
  errorMessage: string = '';

  // BỔ SUNG BIẾN PHÂN TRANG
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  contractForm: FormGroup = this.fb.group({
    room_id: ['', Validators.required],
    tenant_id: ['', Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    deposit_amount: [0, [Validators.required, Validators.min(0)]],
    terms: [''],
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadContracts();
    }
  }

  // CHUẨN HÓA HÀM LOAD CÓ PHÂN TRANG
  loadContracts(): void {
    this.isLoading = true;
    this.contractService.getAllContracts(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.contractList = res.result.records; 
          this.totalRecords = res.result.recordCount;
          this.totalPages = res.result.pageCount;
          this.currentPage = res.result.currentPage;
        }
        this.isLoading = false; 
      },
      error: (err) => { 
        this.errorMessage = 'Lỗi tải hợp đồng: ' + (err.error?.errorMessage || err.error?.error || err.message); 
        this.isLoading = false; 
      }
    });
  }

  // BỔ SUNG LOGIC TÌM KIẾM & CHUYỂN TRANG
  onSearch(): void {
    this.currentPage = 1;
    this.loadContracts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadContracts();
    }
  }

  openAddModal(): void {
    this.contractForm.reset({ deposit_amount: 0 });
    this.showModal = true;
    this.loadDropdownData();
  }

  // CHUẨN HÓA HÀM LOAD DROPDOWN (SỬ DỤNG res.result.records VÀ SỬA LOGIC ĐẾM)
  loadDropdownData(): void {
    // Truyền pageSize = 100 để lấy đủ danh sách khách thuê
    this.tenantService.getAllTenants(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) {
        this.tenantList = res.result.records;
      }
    });
    
    // Truyền pageSize = 100 để lấy đủ danh sách phòng
    this.roomService.getAllRooms(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) {
        this.availableRooms = res.result.records.filter((room: any) => {
          if (room.status === 'MAINTENANCE') return false;
          // Sửa lỗi logic đếm người: Dùng trực tiếp dữ liệu từ bảng Room
          const currentOccupants = room.current_occupants || 0;
          return currentOccupants < room.max_occupants;
        });
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveContract(): void {
    if (this.contractForm.invalid) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    const rawValue = this.contractForm.value;
    const contractData = {
      ...rawValue,
      room_id: Number(rawValue.room_id),
      tenant_id: Number(rawValue.tenant_id),
      deposit_amount: Number(rawValue.deposit_amount),
      terms: rawValue.terms
    };

    this.contractService.createContract(contractData).subscribe({
      next: (res) => { 
        alert(res.message || 'Tạo hợp đồng thành công!'); 
        this.closeModal(); 
        this.loadContracts(); 
      },
      error: (err) => alert('Lỗi: ' + (err.error?.error || err.message))
    });
  }

  terminateContract(id: number): void {
    if (confirm('BẠN CÓ CHẮC MUỐN THANH LÝ HỢP ĐỒNG NÀY?\nPhòng sẽ được cập nhật lại trạng thái trống/còn chỗ.')) {
      this.contractService.terminateContract(id).subscribe({
        next: (res) => { 
          alert(res.message || 'Thanh lý thành công!'); 
          this.loadContracts(); 
        },
        error: (err) => alert('Lỗi thanh lý: ' + (err.error?.error || err.message))
      });
    }
  }
}