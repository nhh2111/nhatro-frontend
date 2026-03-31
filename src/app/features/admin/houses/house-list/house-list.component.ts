import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HouseService } from '../../../../services/house.service';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-house-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,RouterModule],
  templateUrl: './house-list.component.html',
  styleUrls: ['./house-list.component.scss']
})
export class HouseListComponent implements OnInit {
  private houseService = inject(HouseService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  
  houseList: any[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false; // BỔ SUNG: Cờ khóa nút bấm
  errorMessage: string = '';
  userRole: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  totalPages: number = 0;
  searchQuery: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  currentHouseId?: number;

  houseForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    district: ['', Validators.required],
    ward: ['', Validators.required],
    address: ['', Validators.required]
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHouses();
      this.userRole = this.authService.getUserRole();
    }
  }

  loadHouses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.houseService.getAllHouses(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.houseList = res.result.records; 
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
    this.loadHouses();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHouses();
    }
  }

  deleteHouse(id: number): void {
    if (confirm('BẠN CÓ CHẮC MUỐN XÓA NHÀ NÀY?\n\nCẢNH BÁO: Mọi phòng và dữ liệu liên quan đến nhà này sẽ bị XÓA VĨNH VIỄN!')) {
      this.houseService.deleteHouse(id).subscribe({
        next: () => { alert('Đã xóa thành công!'); this.loadHouses(); },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.error || err.message))
      });
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentHouseId = undefined;
    this.houseForm.reset();
    this.showModal = true;
  }

  openEditModal(house: any): void {
    this.isEditMode = true;
    this.currentHouseId = house.id;
    this.houseForm.patchValue(house);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveHouse(): void {
    if (this.houseForm.invalid) {
      alert('Vui lòng điền đủ thông tin!');
      return;
    }

    this.isSaving = true; // Bắt đầu xử lý, khóa nút
    const houseData = this.houseForm.value;

    if (this.isEditMode && this.currentHouseId) {
      this.handleUpdateHouse(houseData);
    } else {
      this.handleCreateHouse(houseData);
    }
  }

  private handleUpdateHouse(houseData: any): void {
    this.houseService.updateHouse(this.currentHouseId!, houseData).subscribe({
      next: () => { 
        this.isSaving = false;
        alert('Cập nhật thành công!'); 
        this.closeModal(); 
        this.loadHouses(); 
      },
      error: (err) => {
        this.isSaving = false;
        alert('Lỗi cập nhật: ' + err.error?.error);
      }
    });
  }

  private handleCreateHouse(houseData: any): void {
    this.houseService.createHouse(houseData).subscribe({
      next: () => { 
        this.isSaving = false;
        alert('Thêm nhà thành công!'); 
        this.closeModal(); 
        this.loadHouses(); 
      },
      error: (err) => {
        this.isSaving = false;
        alert('Lỗi thêm mới: ' + err.error?.error);
      }
    });
  }
}