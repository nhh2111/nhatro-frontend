import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';

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
  userRole: string = '';

  userList: any[] = [];
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

    // Lấy giá trị bao gồm cả trường bị disable (như email)
    const rawValue = this.userForm.getRawValue();

    if (this.isEditMode && this.currentUserId) {
      // Khi cập nhật, chỉ gửi full_name và status theo đúng API của bạn
      const updateData = {
        full_name: rawValue.full_name,
        status: rawValue.status === 'true' || rawValue.status === true
      };
      
      this.userService.updateStaff(this.currentUserId, updateData).subscribe({
        next: () => { alert('Cập nhật thành công!'); this.closeModal(); this.loadUsers(); },
        error: (err) => alert('Lỗi cập nhật: ' + (err.error?.error || err.message))
      });
    } else {
      // Khi thêm mới, gửi email và full_name
      const createData = {
        email: rawValue.email,
        full_name: rawValue.full_name
      };

      this.userService.createStaff(createData).subscribe({
        next: (res) => { alert(res.message || 'Thêm mới thành công!'); this.closeModal(); this.loadUsers(); },
        error: (err) => alert('Lỗi thêm mới: ' + (err.error?.error || err.message))
      });
    }
  }
}