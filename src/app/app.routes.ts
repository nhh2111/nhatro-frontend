import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // KHU VỰC XÁC THỰC (KHÔNG CẦN ĐĂNG NHẬP)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
  },
  {
    path: 'first-login-change-password',
    loadComponent: () => import('./features/auth/first-login-change-password/first-login-change-password.component').then(m => m.FirstLoginChangePasswordComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) 
  },

  // KHU VỰC QUẢN TRỊ (YÊU CẦU ĐĂNG NHẬP)
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'houses', pathMatch: 'full' },
      {
        path: 'houses',
        loadComponent: () => import('./features/admin/houses/house-list/house-list.component').then(m => m.HouseListComponent)
      },
      {
        path: 'rooms',
        loadComponent: () => import('./features/admin/rooms/room-list/room-list.component').then(m => m.RoomListComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./features/admin/services/service-list/service-list.component').then(m => m.ServiceListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'tenants',
        loadComponent: () => import('./features/admin/tenants/tenant-list/tenant-list.component').then(m => m.TenantListComponent)
      },
      {
        path: 'contracts',
        loadComponent: () => import('./features/admin/contracts/contract-list/contract-list.component').then(m => m.ContractListComponent)
      },
      {
        path: 'meter-readings',
        loadComponent: () => import('./features/admin/meter-readings/meter-reading-list/meter-reading-list.component').then(m => m.MeterReadingListComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/admin/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
      },
      // THÊM ROUTE SỔ QUỸ (THU/CHI) VÀO ĐÂY
      {
        path: 'transactions',
        loadComponent: () => import('./features/admin/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/admin/tasks/task-list/task-list.component').then(m => m.TaskListComponent)
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) 
      }
    ]
  },

  // WILDCARD (ĐIỀU HƯỚNG KHI NHẬP SAI LINK)
  {
    path: '**',
    redirectTo: 'login'
  }
];