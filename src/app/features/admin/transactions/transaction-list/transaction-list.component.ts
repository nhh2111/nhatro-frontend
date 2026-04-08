import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);

  transactions: any[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';
  selectedMonth: string = new Date().toISOString().substring(0, 7); // Mặc định tháng hiện tại (YYYY-MM)

  // Các biến thống kê Báo cáo
  totalIncome: number = 0;
  totalExpense: number = 0;
  netProfit: number = 0;

  currentPage: number = 1;
  pageSize: number = 50;
  totalRecords: number = 0;
  totalPages: number = 0;

  ngOnInit(): void {
    this.loadTransactions();
  }

  onMonthChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getAllTransactions(this.currentPage, this.pageSize, this.searchQuery, this.selectedMonth).subscribe({
      next: (res) => { 
        if (res.errorCode === 200) {
          this.transactions = res.result.records || []; 
          this.totalRecords = res.result.recordCount || 0;
          this.totalPages = res.result.pageCount || 0;
          
          this.calculateSummary(); 
        }
        this.isLoading = false; 
      },
      error: () => this.isLoading = false
    });
  }

  calculateSummary(): void {
    this.totalIncome = 0;
    this.totalExpense = 0;

    this.transactions.forEach(tx => {
      if (tx.type === 'INCOME') {
        this.totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        this.totalExpense += tx.amount;
      }
    });

    this.netProfit = this.totalIncome - this.totalExpense;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  deleteTx(id: number): void {
    if (confirm('Báo cáo sẽ bị sai lệch nếu bạn xóa phiếu tự động này. Bạn có chắc chắn xóa?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => { 
          alert('Xóa thành công'); 
          this.loadTransactions(); 
        },
        error: (err) => alert(err.error?.error || 'Lỗi xóa')
      });
    }
  }
}