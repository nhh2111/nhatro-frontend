import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ContractService } from '../../../../services/contract.service';
import { RoomService } from '../../../../services/room.service';
import { TenantService } from '../../../../services/tenant.service';
import { HouseService } from '../../../../services/house.service'; // BỔ SUNG

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contract-list.component.html',
  styleUrls: ['./contract-list.component.scss']
})
export class ContractListComponent implements OnInit {
  private contractService = inject(ContractService);
  private roomService = inject(RoomService);
  private tenantService = inject(TenantService);
  private houseService = inject(HouseService); // BỔ SUNG
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  contractList: any[] = [];
  tenantList: any[] = [];

  // BIẾN CHO PHÂN CẤP NHÀ -> PHÒNG
  houseList: any[] = [];
  allAvailableRooms: any[] = [];
  filteredAvailableRooms: any[] = [];

  isLoading: boolean = false;
  showModal: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  contractForm: FormGroup = this.fb.group({
    house_id: ['', Validators.required], // BỔ SUNG
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
      this.loadDropdownData(); // Lấy data nhà/phòng/khách ngay từ đầu cho mượt
    }
  }

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
    this.contractForm.reset({ deposit_amount: 0, house_id: '', room_id: '', tenant_id: '' });
    this.filteredAvailableRooms = []; // Reset danh sách phòng
    this.showModal = true;
  }

  loadDropdownData(): void {
    // 1. Tải danh sách Khu trọ
    this.houseService.getAllHouses(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) this.houseList = res.result.records;
    });

    // 2. Tải danh sách Khách thuê
    this.tenantService.getAllTenants(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) this.tenantList = res.result.records;
    });

    // 3. Tải TẤT CẢ các phòng đang trống/còn chỗ
    this.roomService.getAllRooms(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) {
        this.allAvailableRooms = res.result.records.filter((room: any) => {
          if (room.status === 'MAINTENANCE') return false;
          const currentOccupants = room.current_occupants || 0;
          return currentOccupants < room.max_occupants;
        });
      }
    });
  }

  onHouseChange(): void {
    const selectedHouseId = Number(this.contractForm.value.house_id);
    this.filteredAvailableRooms = this.allAvailableRooms.filter(r => r.house_id === selectedHouseId);
    this.contractForm.patchValue({ room_id: '' });
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
        this.loadDropdownData();
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
          this.loadDropdownData();
        },
        error: (err) => alert('Lỗi thanh lý: ' + (err.error?.error || err.message))
      });
    }
  }
}