import { Component, OnInit, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TenantService } from '../../../../services/tenant.service';
import { AuthService } from '../../../../services/auth.service';
import { UploadService } from '../../../../services/upload.service'; // Bổ sung UploadService

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
  public uploadService = inject(UploadService); // Inject để dùng formatImageUrl trên HTML

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

  // BIẾN XỬ LÝ ẢNH
  selectedImageFile: File | null = null;
  previewImageUrl: string | null = null;

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
    image_url: [''] // Chứa URL cũ để gửi xuống Backend nếu update
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
    this.selectedImageFile = null;
    this.previewImageUrl = null;

    this.tenantForm.reset();
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
    this.selectedImageFile = null;

    // Load ảnh cũ
    this.previewImageUrl = tenant.image_url ? this.uploadService.formatImageUrl(tenant.image_url) : null;

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

  // LOGIC XỬ LÝ CHỌN ẢNH TỪ MÁY TÍNH
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      // Tạo URL ảo để hiển thị preview ngay lập tức
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedImage(): void {
    this.selectedImageFile = null;
    this.previewImageUrl = null;
  }

  saveTenant(): void {
    if (this.tenantForm.invalid) {
      alert('Vui lòng điền đúng và đủ thông tin bắt buộc (Họ tên, SĐT, CCCD)');
      return;
    }

    this.isLoading = true;

    // CHUYỂN JSON THÀNH FORMDATA ĐỂ GỬI KÈM FILE ẢNH
    const formData = new FormData();
    const rawValue = this.tenantForm.value;

    formData.append('full_name', rawValue.full_name);
    formData.append('phone', rawValue.phone);
    formData.append('cccd', rawValue.cccd);
    formData.append('dob', rawValue.dob || '');
    formData.append('gender', rawValue.gender);
    formData.append('motorbike_count', rawValue.motorbike_count.toString());
    formData.append('car_count', rawValue.car_count.toString());
    formData.append('license_plates', rawValue.license_plates || '');
    formData.append('address', rawValue.address || '');

    // Nếu người dùng có chọn ảnh mới
    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    // Nếu là Update và có ảnh cũ (để Backend biết đường xóa file rác)
    if (this.isEditMode) {
      formData.append('old_image_url', rawValue.image_url || '');
    }

    if (this.isEditMode && this.currentTenantId) {
      this.tenantService.updateTenant(this.currentTenantId, formData).subscribe({
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
      this.tenantService.createTenant(formData).subscribe({
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