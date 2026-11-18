import {
  Activity,
  ArrowLeftRight,
  BadgeIndianRupee,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  CheckSquare,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileBarChart2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderLock,
  Hammer,
  History,
  Landmark,
  LayoutDashboard,
  PieChart,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { SidebarModuleId } from '../../types/finance';

export interface NavItemConfig {
  id: SidebarModuleId;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const SIDEBAR_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Finance Overview',
    items: [
      { id: 'finance_dashboard', label: 'Finance Dashboard', path: '/', icon: LayoutDashboard },
      { id: 'financial_overview', label: 'Financial Overview', path: '/financial-overview', icon: TrendingUp },
      { id: 'project_budgets', label: 'Project Budgets', path: '/project-budgets', icon: PieChart },
      { id: 'cash_flow', label: 'Cash Flow', path: '/cash-flow', icon: Activity },
    ],
  },
  {
    title: 'Payroll Management',
    items: [
      { id: 'payroll_overview', label: 'Payroll Overview', path: '/payroll-overview', icon: Users },
      { id: 'employee_payroll', label: 'Employee Payroll', path: '/employee-payroll', icon: UserCheck },
      { id: 'labour_wages', label: 'Labour Wages', path: '/labour-wages', icon: Hammer },
      { id: 'payroll_processing', label: 'Payroll Processing', path: '/payroll-processing', icon: Calculator },
      { id: 'overtime_incentives', label: 'Overtime & Incentives', path: '/overtime-incentives', icon: Clock },
      { id: 'advances_loans', label: 'Advances & Loans', path: '/advances-loans', icon: Wallet },
      { id: 'payslips', label: 'Payslips', path: '/payslips', icon: FileText },
      { id: 'salary_payments', label: 'Salary Payments', path: '/salary-payments', icon: BadgeIndianRupee },
    ],
  },
  {
    title: 'Accounts Payable',
    items: [
      { id: 'supplier_invoices', label: 'Supplier Invoices', path: '/supplier-invoices', icon: FileCheck2 },
      { id: 'purchase_bills', label: 'Purchase Bills', path: '/purchase-bills', icon: Receipt },
      { id: 'contractor_payments', label: 'Contractor Payments', path: '/contractor-payments', icon: Briefcase },
      { id: 'reimbursements', label: 'Employee Reimbursements', path: '/reimbursements', icon: CreditCard },
      { id: 'site_expenses', label: 'Site Expenses', path: '/site-expenses', icon: Wrench },
    ],
  },
  {
    title: 'Financial Operations',
    items: [
      { id: 'payment_processing', label: 'Payment Processing', path: '/payment-processing', icon: ArrowLeftRight },
      { id: 'payment_approvals', label: 'Payment Approvals', path: '/payment-approvals', icon: CheckSquare },
      { id: 'transactions', label: 'Transactions', path: '/transactions', icon: FileSpreadsheet },
      { id: 'bank_reconciliation', label: 'Bank Reconciliation', path: '/bank-reconciliation', icon: Landmark },
    ],
  },
  {
    title: 'Tax & Compliance',
    items: [
      { id: 'statutory_compliance', label: 'Statutory Compliance', path: '/statutory-compliance', icon: Scale },
      { id: 'tax_records', label: 'Tax Records', path: '/tax-records', icon: FileBarChart2 },
      { id: 'payroll_compliance', label: 'Payroll Compliance', path: '/payroll-compliance', icon: ClipboardCheck },
      { id: 'financial_documents', label: 'Financial Documents', path: '/financial-documents', icon: FolderLock },
    ],
  },
  {
    title: 'Reports',
    items: [
      { id: 'payroll_reports', label: 'Payroll Reports', path: '/reports/payroll', icon: BarChart3 },
      { id: 'expense_reports', label: 'Expense Reports', path: '/reports/expense', icon: BarChart3 },
      { id: 'project_cost_reports', label: 'Project Cost Reports', path: '/reports/project-cost', icon: BarChart3 },
      { id: 'supplier_reports', label: 'Supplier Reports', path: '/reports/supplier', icon: BarChart3 },
      { id: 'financial_statements', label: 'Financial Statements', path: '/reports/statements', icon: Building2 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'approval_workflows', label: 'Approval Workflows', path: '/approval-workflows', icon: ShieldCheck },
      { id: 'roles_permissions', label: 'Finance Roles & Permissions', path: '/roles-permissions', icon: Users },
      { id: 'finance_settings', label: 'Finance Settings', path: '/finance-settings', icon: Settings },
      { id: 'audit_logs', label: 'Audit Logs', path: '/audit-logs', icon: History },
    ],
  },
];
