import { Component, OnInit, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { UploadService } from '../../../../services/upload.service'; // BỔ SUNG

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  public uploadService = inject(UploadService); // BỔ SUNG

  userRole: string = '';
  userList: any[] = [];
  isSaving: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentUserId?: number;

  userForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', Validators.required],
    status: [true] 
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
      this.userRole = this.authService.getUserRole();
    }
  }

  // TÁCH HÀM: Xử lý hiển thị Avatar nhân viên
  getAvatarUrl(user: any): string {
    if (!user.avatar) {
      return `https://ui-avatars.com/api/?name=${user.full_name}&background=random`;
    }
    return this.uploadService.formatImageUrl(user.avatar);
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getAllStaffs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.userList = res.result.records; 
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
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  deleteUser(id: number): void {
    if (confirm('BẠN CÓ CHẮC MUỐN XÓA NHÂN VIÊN NÀY?\n\nTài khoản sẽ bị xóa vĩnh viễn khỏi hệ thống!')) {
      this.userService.deleteStaff(id).subscribe({
        next: () => { alert('Xóa thành công!'); this.loadUsers(); },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || err.message))
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentUserId = undefined;
    this.userForm.reset({ status: true });
    this.userForm.get('email')?.enable(); 
    this.showModal = true;
  }

  openEditModal(user: any): void {
    this.isEditMode = true;
    this.currentUserId = user.id;
    this.userForm.patchValue(user);
    this.userForm.get('email')?.disable(); 
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      alert('Vui lòng kiểm tra lại thông tin nhập!');
      return;
    }

    this.isSaving = true; 
    const rawValue = this.userForm.getRawValue();

    if (this.isEditMode && this.currentUserId) {
      this.handleUpdateUser(rawValue);
      return;
    }

    this.handleCreateUser(rawValue);
  }

  private handleUpdateUser(rawValue: any): void {
    const updateData = {
      full_name: rawValue.full_name,
      status: rawValue.status === 'true' || rawValue.status === true
    };
    
    this.userService.updateStaff(this.currentUserId!, updateData).subscribe({
      next: () => { 
        this.isSaving = false; 
        alert('Cập nhật thành công!'); 
        this.closeModal(); 
        this.loadUsers(); 
      },
      error: (err) => {
        this.isSaving = false; 
        alert('Lỗi cập nhật: ' + (err.error?.error || err.message));
      }
    });
  }

  private handleCreateUser(rawValue: any): void {
    const createData = {
      email: rawValue.email,
      full_name: rawValue.full_name
    };

    this.userService.createStaff(createData).subscribe({
      next: (res) => { 
        this.isSaving = false; 
        alert(res.message || 'Thêm mới thành công!'); 
        this.closeModal(); 
        this.loadUsers(); 
      },
      error: (err) => {
        this.isSaving = false; 
        alert('Lỗi thêm mới: ' + (err.error?.error || err.message));
      }
    });
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