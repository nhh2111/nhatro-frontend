import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TenantService } from '../../../../services/tenant.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss']
})
export class TenantListComponent implements OnInit {
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  userRole: string = '';

  tenantList: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentTenantId?: number;

  tenantForm: FormGroup = this.fb.group({
    full_name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
    cccd: ['', [Validators.required, Validators.pattern('^[0-9]{9,12}$')]],
    dob: [''],
    gender: ['MALE'],
    motorbike_count: [0, [Validators.required, Validators.min(0)]], 
    car_count: [0, [Validators.required, Validators.min(0)]],      
    license_plates: [''],
    address: [''],
    image_url: ['']
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTenants();
      this.userRole = this.authService.getUserRole();
    }
  }

  loadTenants(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.tenantService.getAllTenants(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.tenantList = res.result.records; 
          this.totalRecords = res.result.recordCount;
          this.totalPages = res.result.pageCount;
          this.currentPage = res.result.currentPage;
        }
        this.isLoading = false; 
      },
      error: (err) => {
        const backendMsg = err.error?.errorMessage || err.error?.message || err.error?.error || err.error?.detail || err.message;
        this.errorMessage = 'Lỗi tải danh sách khách: ' + backendMsg;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadTenants();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTenants();
    }
  }

  deleteTenant(id: number): void {
    if (confirm('BẠN CÓ CHẮC MUỐN XÓA KHÁCH THUÊ NÀY?\n\nChỉ Chủ trọ mới có quyền thực hiện thao tác này!')) {
      this.tenantService.deleteTenant(id).subscribe({
        next: () => { alert('Xóa thành công!'); this.loadTenants(); },
        error: (err) => {
          const backendMsg = err.error?.errorMessage || err.error?.message || err.error?.error || err.error?.detail || err.message;
          alert('Lỗi khi xóa: ' + backendMsg);
        }
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentTenantId = undefined;
    this.tenantForm.reset();
    // Đặt lại các giá trị mặc định cho form
    this.tenantForm.patchValue({
      gender: 'MALE',
      motorbike_count: 0,
      car_count: 0
    });
    this.showModal = true;
  }

  openEditModal(tenant: any): void {
    this.isEditMode = true;
    this.currentTenantId = tenant.id;

    const formattedDob = tenant.dob ? tenant.dob.substring(0, 10) : '';

    this.tenantForm.patchValue({
      full_name: tenant.full_name,
      phone: tenant.phone,
      cccd: tenant.cccd,
      dob: formattedDob, 
      gender: tenant.gender,
      motorbike_count: tenant.motorbike_count || 0,
      car_count: tenant.car_count || 0,
      license_plates: tenant.license_plates || '',
      address: tenant.address,
      image_url: tenant.image_url
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveTenant(): void {
    if (this.tenantForm.invalid) {
      alert('Vui lòng điền đúng và đủ thông tin bắt buộc (Họ tên, SĐT, CCCD)');
      return;
    }

    const tenantData = { ...this.tenantForm.value };
    if (!tenantData.dob) {
      tenantData.dob = ""; 
    }

    this.isLoading = true;

    if (this.isEditMode && this.currentTenantId) {
      this.tenantService.updateTenant(this.currentTenantId, tenantData).subscribe({
        next: () => { 
          alert('Cập nhật thành công!'); 
          this.closeModal(); 
          this.loadTenants(); 
        },
        error: (err) => {
          const backendMsg = err.error?.errorMessage || err.error?.message || err.error?.error || err.error?.detail || err.message;
          alert('Lỗi cập nhật: ' + backendMsg);
          this.isLoading = false;
        }
      });
    } else {
      this.tenantService.createTenant(tenantData).subscribe({
        next: () => { 
          alert('Thêm khách mới thành công!'); 
          this.closeModal(); 
          this.loadTenants(); 
        },
        error: (err) => {
          const backendMsg = err.error?.errorMessage || err.error?.message || err.error?.error || err.error?.detail || err.message;
          alert('Lỗi thêm mới: ' + backendMsg);
          this.isLoading = false;
        }
      });
    }
  }
}