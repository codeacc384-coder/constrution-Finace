import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/ui/ToastContainer';
import { useCurrentUser } from './store/useFinanceStore';
import { canAccessModule } from './services/rbacService';
import { SidebarModuleId } from './types/finance';
import { Button, SurfaceCard } from './components/ui/primitives';

import FinanceDashboard from './pages/FinanceDashboard';
import FinancialOverview from './pages/FinancialOverview';
import ProjectBudgets from './pages/ProjectBudgets';
import CashFlow from './pages/CashFlow';
import PayrollOverview from './pages/PayrollOverview';
import EmployeePayroll from './pages/EmployeePayroll';
import LabourWages from './pages/LabourWages';
import PayrollProcessing from './pages/PayrollProcessing';
import OvertimeIncentives from './pages/OvertimeIncentives';
import AdvancesLoans from './pages/AdvancesLoans';
import Payslips from './pages/Payslips';
import SalaryPayments from './pages/SalaryPayments';
import SupplierInvoices from './pages/SupplierInvoices';
import PurchaseBills from './pages/PurchaseBills';
import ContractorPayments from './pages/ContractorPayments';
import Reimbursements from './pages/Reimbursements';
import SiteExpenses from './pages/SiteExpenses';
import PaymentProcessing from './pages/PaymentProcessing';
import PaymentApprovals from './pages/PaymentApprovals';
import Transactions from './pages/Transactions';
import BankReconciliation from './pages/BankReconciliation';
import ComplianceWorkspace from './pages/ComplianceWorkspace';
import ReportsHub from './pages/ReportsHub';
import AdminWorkspace from './pages/AdminWorkspace';

const queryClient = new QueryClient();

function ModuleGuard({
  moduleId,
  children,
}: {
  moduleId: SidebarModuleId;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { role } = useCurrentUser();

  if (!canAccessModule(role, moduleId)) {
    return (
      <SurfaceCard className="p-10 text-center max-w-lg mx-auto mt-10 space-y-3">
        <Lock className="w-8 h-8 text-[#D97706] mx-auto" />
        <h2 className="text-base font-bold text-[#172B4D]">Module Access Restricted</h2>
        <p className="text-xs text-[#64748B]">
          Your active role (<strong>{role.roleName}</strong>) is not authorized to access this finance module. Switch roles via the top-right profile menu or ask Company Admin to update permissions.
        </p>
        <div className="pt-2">
          <Button size="sm" onClick={() => navigate('/')}>Return to Finance Dashboard</Button>
        </div>
      </SurfaceCard>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<ModuleGuard moduleId="finance_dashboard"><FinanceDashboard /></ModuleGuard>} />
            <Route path="/financial-overview" element={<ModuleGuard moduleId="financial_overview"><FinancialOverview /></ModuleGuard>} />
            <Route path="/project-budgets" element={<ModuleGuard moduleId="project_budgets"><ProjectBudgets /></ModuleGuard>} />
            <Route path="/cash-flow" element={<ModuleGuard moduleId="cash_flow"><CashFlow /></ModuleGuard>} />

            <Route path="/payroll-overview" element={<ModuleGuard moduleId="payroll_overview"><PayrollOverview /></ModuleGuard>} />
            <Route path="/employee-payroll" element={<ModuleGuard moduleId="employee_payroll"><EmployeePayroll /></ModuleGuard>} />
            <Route path="/labour-wages" element={<ModuleGuard moduleId="labour_wages"><LabourWages /></ModuleGuard>} />
            <Route path="/payroll-processing" element={<ModuleGuard moduleId="payroll_processing"><PayrollProcessing /></ModuleGuard>} />
            <Route path="/overtime-incentives" element={<ModuleGuard moduleId="overtime_incentives"><OvertimeIncentives /></ModuleGuard>} />
            <Route path="/advances-loans" element={<ModuleGuard moduleId="advances_loans"><AdvancesLoans /></ModuleGuard>} />
            <Route path="/payslips" element={<ModuleGuard moduleId="payslips"><Payslips /></ModuleGuard>} />
            <Route path="/salary-payments" element={<ModuleGuard moduleId="salary_payments"><SalaryPayments /></ModuleGuard>} />

            <Route path="/supplier-invoices" element={<ModuleGuard moduleId="supplier_invoices"><SupplierInvoices /></ModuleGuard>} />
            <Route path="/purchase-bills" element={<ModuleGuard moduleId="purchase_bills"><PurchaseBills /></ModuleGuard>} />
            <Route path="/contractor-payments" element={<ModuleGuard moduleId="contractor_payments"><ContractorPayments /></ModuleGuard>} />
            <Route path="/reimbursements" element={<ModuleGuard moduleId="reimbursements"><Reimbursements /></ModuleGuard>} />
            <Route path="/site-expenses" element={<ModuleGuard moduleId="site_expenses"><SiteExpenses /></ModuleGuard>} />

            <Route path="/payment-processing" element={<ModuleGuard moduleId="payment_processing"><PaymentProcessing /></ModuleGuard>} />
            <Route path="/payment-approvals" element={<ModuleGuard moduleId="payment_approvals"><PaymentApprovals /></ModuleGuard>} />
            <Route path="/transactions" element={<ModuleGuard moduleId="transactions"><Transactions /></ModuleGuard>} />
            <Route path="/bank-reconciliation" element={<ModuleGuard moduleId="bank_reconciliation"><BankReconciliation /></ModuleGuard>} />

            <Route path="/statutory-compliance" element={<ModuleGuard moduleId="statutory_compliance"><ComplianceWorkspace /></ModuleGuard>} />
            <Route path="/tax-records" element={<ModuleGuard moduleId="tax_records"><ComplianceWorkspace /></ModuleGuard>} />
            <Route path="/payroll-compliance" element={<ModuleGuard moduleId="payroll_compliance"><ComplianceWorkspace /></ModuleGuard>} />
            <Route path="/financial-documents" element={<ModuleGuard moduleId="financial_documents"><ComplianceWorkspace /></ModuleGuard>} />

            <Route path="/reports" element={<Navigate to="/reports/payroll" replace />} />
            <Route path="/reports/:reportType" element={<ReportsHub />} />

            <Route path="/approval-workflows" element={<ModuleGuard moduleId="approval_workflows"><AdminWorkspace /></ModuleGuard>} />
            <Route path="/roles-permissions" element={<ModuleGuard moduleId="roles_permissions"><AdminWorkspace /></ModuleGuard>} />
            <Route path="/finance-settings" element={<ModuleGuard moduleId="finance_settings"><AdminWorkspace /></ModuleGuard>} />
            <Route path="/audit-logs" element={<ModuleGuard moduleId="audit_logs"><AdminWorkspace /></ModuleGuard>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
