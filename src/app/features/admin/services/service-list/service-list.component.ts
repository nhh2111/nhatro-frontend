import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceService } from '../../../../services/service.service';
import { AuthService } from '../../../../services/auth.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnInit {
  private srvService = inject(ServiceService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  userRole: string = '';
  serviceList: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentServiceId?: number;

  serviceForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    service_type: ['METER', Validators.required],
    unit_price: [0, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadServices();
      this.userRole = this.authService.getUserRole();
    }
  }

  loadServices(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.srvService.getAllServices(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => {
        if (res.errorCode === 200) {
          this.serviceList = res.result.records;
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
    this.loadServices();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadServices();
    }
  }

  deleteService(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
      this.srvService.deleteService(id).subscribe({
        next: () => { alert('Xóa thành công!'); this.loadServices(); },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || err.message))
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentServiceId = undefined;
    this.serviceForm.reset({ unit_price: 0 });
    this.showModal = true;
  }

  openEditModal(srv: any): void {
    this.isEditMode = true;
    this.currentServiceId = srv.id;
    this.serviceForm.patchValue(srv);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const rawValue = this.serviceForm.value;

    const serviceData = {
      ...rawValue,
      unit_price: Number(rawValue.unit_price)
    };

    if (this.isEditMode && this.currentServiceId) {
      this.srvService.updateService(this.currentServiceId, serviceData).subscribe({
        next: () => { alert('Cập nhật thành công!'); this.closeModal(); this.loadServices(); },
        error: (err) => alert('Lỗi cập nhật: ' + (err.error?.error || err.message))
      });
    } else {
      this.srvService.createService(serviceData).subscribe({
        next: () => { alert('Thêm mới thành công!'); this.closeModal(); this.loadServices(); },
        error: (err) => alert('Lỗi thêm mới: ' + (err.error?.error || err.message))
      });
    }
  }

  getServiceTypeName(type: string): string {
    switch (type) {
      case 'FIXED': return 'Cố định';
      case 'METER': return 'Có đồng hồ (Điện/Nước)';
      case 'PER_PERSON': return 'Đầu người';
      case 'PER_MOTORBIKE': return 'Xe Máy';
      case 'PER_CAR': return 'Ô Tô';
      default: return type;
    }
  }

  getServiceTypeClass(type: string): string {
    switch (type) {
      case 'FIXED': return 'badge-fixed';
      case 'METER': return 'badge-metered';
      case 'PER_PERSON': return 'badge-person';
      case 'PER_MOTORBIKE': return 'badge-warning';
      case 'PER_CAR': return 'badge-success';
      default: return 'badge-secondary';
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