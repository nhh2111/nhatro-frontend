import { Component, OnInit, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ContractService } from '../../../../services/contract.service';
import { RoomService } from '../../../../services/room.service';
import { TenantService } from '../../../../services/tenant.service';
import { HouseService } from '../../../../services/house.service';
import { NgSelectModule } from '@ng-select/ng-select'; // TÍCH HỢP BỘ TÌM KIẾM
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule], // Kéo NgSelectModule vào đây
  templateUrl: './contract-list.component.html',
  styleUrls: ['./contract-list.component.scss']
})
export class ContractListComponent implements OnInit {
  private contractService = inject(ContractService);
  private roomService = inject(RoomService);
  private tenantService = inject(TenantService);
  private houseService = inject(HouseService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  contractList: any[] = [];

  // BIẾN QUẢN LÝ DỮ LIỆU DROPDOWN
  houseList: any[] = [];
  allAvailableRooms: any[] = [];
  filteredAvailableRooms: any[] = [];
  allTenants: any[] = [];
  filteredTenants: any[] = []; // Biến chứa khách đã lọc giới tính

  isLoading: boolean = false;
  showModal: boolean = false;
  errorMessage: string = '';

  // BIẾN QUẢN LÝ XUẤT PDF
  showDetailModal: boolean = false;
  selectedContract: any = null;
  isExporting: boolean = false;

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  contractForm: FormGroup = this.fb.group({
    house_id: [null, Validators.required],
    room_id: [null, Validators.required],
    tenant_id: [null, Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    deposit_amount: [0, [Validators.required, Validators.min(0)]],
    terms: [''],
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadContracts();
      this.loadDropdownData();
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
    this.contractForm.reset({ deposit_amount: 0, house_id: null, room_id: null, tenant_id: null });
    this.filteredAvailableRooms = [];
    this.filteredTenants = [...this.allTenants]; // Mặc định hiển thị tất cả khách
    this.showModal = true;
  }

  loadDropdownData(): void {
    this.houseService.getAllHouses(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) this.houseList = res.result.records;
    });

    this.tenantService.getAllTenants(1, 100, '').subscribe(res => {
      if (res.errorCode === 200) {
        this.allTenants = res.result.records;
        this.filteredTenants = [...this.allTenants];
      }
    });

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

  // KHI ĐỔI NHÀ -> LỌC PHÒNG
  onHouseChange(): void {
    const selectedHouseId = Number(this.contractForm.value.house_id);
    this.filteredAvailableRooms = this.allAvailableRooms.filter(r => r.house_id === selectedHouseId);
    this.contractForm.patchValue({ room_id: null, tenant_id: null }); // Reset phòng và khách
    this.filteredTenants = [...this.allTenants];
  }

  // LOGIC MỚI: KHI ĐỔI PHÒNG -> LỌC GIỚI TÍNH KHÁCH THUÊ
  onRoomChange(): void {
    const selectedRoomId = Number(this.contractForm.value.room_id);
    const selectedRoom = this.filteredAvailableRooms.find(r => r.id === selectedRoomId);

    this.contractForm.patchValue({ tenant_id: null }); // Reset ô chọn khách

    if (selectedRoom) {
      const restriction = selectedRoom.gender_restriction;
      // Lọc nếu phòng chỉ cho Nam hoặc chỉ cho Nữ
      if (restriction === 'MALE' || restriction === 'FEMALE') {
        this.filteredTenants = this.allTenants.filter(t => t.gender === restriction);
      } else {
        this.filteredTenants = [...this.allTenants]; // Nếu là ALL thì hiện tất cả
      }
    }
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

  // ============================================
  // KHU VỰC QUẢN LÝ XUẤT PDF HỢP ĐỒNG
  // ============================================
  viewDetail(contract: any): void {
    this.selectedContract = contract;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedContract = null;
  }

  exportPDF(): void {
    const element = document.getElementById('contract-print-area');
    if (element) {
      this.isExporting = true;
      const originalOverflow = element.style.overflow;
      const originalHeight = element.style.height;

      element.style.overflow = 'visible';
      element.style.height = 'max-content';

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowHeight: element.scrollHeight
      }).then(canvas => {
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const fileName = `Hop_Dong_P${this.selectedContract?.Room?.room_number}_${this.selectedContract?.Tenant?.full_name}.pdf`;
        pdf.save(fileName);
        this.isExporting = false;
      }).catch(err => {
        alert("Lỗi khi tạo PDF!");
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
        this.isExporting = false;
      });
    }
  }

  activeDropdownId: number | null = null;

  @HostListener('document:click', ['$event'])
  onClickOutside() {
    this.activeDropdownId = null;
  }

  toggleDropdown(id: number, event: Event) {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }
}