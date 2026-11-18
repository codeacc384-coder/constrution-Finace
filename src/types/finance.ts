// ============================================================================
// BUILDFLOW FINANCE & PAYROLL — DATABASE-READY ENTERPRISE DATA MODELS
// All monetary amounts are stored as integer paise (1 INR = 100 paise)
// to guarantee decimal-safe financial arithmetic across all calculations.
// ============================================================================

export type CompanySize = 'small' | 'medium' | 'large';

export type FinanceRoleId =
  | 'company_admin'
  | 'finance_head'
  | 'finance_manager'
  | 'payroll_manager'
  | 'payroll_officer'
  | 'accounts_payable_manager'
  | 'accounts_executive'
  | 'procurement_accounts'
  | 'project_accountant'
  | 'treasury_officer'
  | 'compliance_officer'
  | 'internal_auditor'
  | 'hr_executive';

export type SidebarModuleId =
  | 'finance_dashboard'
  | 'financial_overview'
  | 'project_budgets'
  | 'cash_flow'
  | 'payroll_overview'
  | 'employee_payroll'
  | 'labour_wages'
  | 'payroll_processing'
  | 'overtime_incentives'
  | 'advances_loans'
  | 'payslips'
  | 'salary_payments'
  | 'supplier_invoices'
  | 'purchase_bills'
  | 'contractor_payments'
  | 'reimbursements'
  | 'site_expenses'
  | 'payment_processing'
  | 'payment_approvals'
  | 'transactions'
  | 'bank_reconciliation'
  | 'statutory_compliance'
  | 'tax_records'
  | 'payroll_compliance'
  | 'financial_documents'
  | 'payroll_reports'
  | 'expense_reports'
  | 'project_cost_reports'
  | 'supplier_reports'
  | 'financial_statements'
  | 'approval_workflows'
  | 'roles_permissions'
  | 'finance_settings'
  | 'audit_logs';

export interface RolePermissionConfig {
  roleId: FinanceRoleId;
  roleName: string;
  description: string;
  supportedCompanySizes: CompanySize[];
  allowedModules: SidebarModuleId[];
  canViewConfidentialSalaries: boolean;
  canViewEmployeeHRRecords: boolean;
  canRunPayroll: boolean;
  canApprovePayroll: boolean;
  canCreatePayment: boolean;
  canReleasePayment: boolean;
  canApproveInvoices: boolean;
  canExportReports: boolean;
  canProcessRefundsAdjustments: boolean;
  canModifyBudgets: boolean;
  paymentApprovalLimitPaise: number; // -1 means unlimited
  invoiceApprovalLimitPaise: number; // -1 means unlimited
  assignedProjectIds: string[] | 'ALL';
  assignedSiteIds: string[] | 'ALL';
}

export interface FinanceUserAccount {
  id: string;
  companyId: string;
  name: string;
  email: string;
  roleId: FinanceRoleId;
  department: string;
  branchId: string;
}

export interface TenantCompany {
  id: string;
  name: string;
  legalName: string;
  size: CompanySize;
  gstin: string;
  tan: string;
  pan: string;
  cin: string;
  financialYear: string;
  currentPeriodLabel: string;
  registeredAddress: string;
  primaryBankRef: string;
  primaryBankIfsc: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  city: string;
  state: string;
  gstin: string;
}

export interface Project {
  id: string;
  companyId: string;
  branchId: string;
  code: string;
  name: string;
  clientName: string;
  projectManager: string;
  status: 'Active' | 'On Hold' | 'Completed';
  startDate: string;
  expectedCompletion: string;
}

export interface Site {
  id: string;
  companyId: string;
  projectId: string;
  code: string;
  name: string;
  location: string;
  siteManager: string;
  activeWorkersCount: number;
}

// ---------------- PAYROLL & EMPLOYEE SALARY MODELS ----------------

export type EmploymentType =
  | 'Monthly Salaried'
  | 'Contractual'
  | 'Project-Based';

export type WorkerWageType =
  | 'Daily'
  | 'Hourly'
  | 'Weekly'
  | 'Monthly'
  | 'Piece-Rate'
  | 'Task-Based';

export interface EmployeeSalaryStructure {
  id: string;
  companyId: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  basicPaise: number;
  hraPaise: number;
  conveyanceAllowancePaise: number;
  siteAllowancePaise: number;
  specialAllowancePaise: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  tdsMonthlyPaise: number;
  approvedBy: string;
  approvedAt: string;
  revisionReason: string;
}

export interface EmployeeSalaryHistory {
  id: string;
  employeeId: string;
  structureId: string;
  effectiveFrom: string;
  effectiveTo: string;
  grossMonthlyPaise: number;
  basicPaise: number;
  hraPaise: number;
  allowancesPaise: number;
  changedBy: string;
  changeReason: string;
}

export interface EmployeeRecord {
  id: string;
  companyId: string;
  branchId: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  projectId: string;
  siteId: string;
  dateOfJoining: string;
  bankAccountMasked: string;
  bankIfsc: string;
  bankVerified: boolean;
  panMasked: string;
  uanNumber: string;
  currentSalaryStructureId: string;
  confidentialHrNotes?: string;
  status: 'Active' | 'On Hold' | 'Notice Period';
}

export interface WageRateStructure {
  id: string;
  companyId: string;
  trade: string;
  skillCategory: 'Unskilled' | 'Semi-Skilled' | 'Skilled' | 'Highly Skilled';
  wageType: WorkerWageType;
  ratePaise: number;
  overtimeHourlyRatePaise: number;
  effectiveFrom: string;
}

export interface SiteTransferAllocation {
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  fromDate: string;
  toDate: string;
  approvedDays: number;
  approvedHours: number;
  approvedHalfDays: number;
  approvedUnits: number;
}

export interface LabourWorkerRecord {
  id: string;
  companyId: string;
  branchId: string;
  workerCode: string;
  name: string;
  trade: string;
  skillCategory: 'Unskilled' | 'Semi-Skilled' | 'Skilled' | 'Highly Skilled';
  employmentType: 'Daily Wage' | 'Temporary Labour' | 'Piece-Rate Worker' | 'Hourly Worker' | 'Weekly Wage';
  wageType: WorkerWageType;
  agreedRatePaise: number;
  overtimeHourlyRatePaise: number;
  unitLabel?: string; // e.g., 'sq.ft', 'cubic m' for piece-rate
  assignedProjectId: string;
  assignedSiteId: string;
  supervisorName: string;
  bankAccountMasked: string;
  bankVerified: boolean;
  attendanceVerified: boolean;
  approvedDays: number;
  halfDays: number;
  approvedHours: number;
  approvedUnits: number;
  approvedOvertimeHours: number;
  siteTransfers: SiteTransferAllocation[];
}

export interface PayrollPeriod {
  id: string;
  companyId: string;
  label: string; // e.g. 'November 2026'
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: 'Open' | 'Processing' | 'Locked' | 'Closed';
}

export type PayrollRunStatus =
  | 'Draft'
  | 'Calculating'
  | 'Calculation Completed'
  | 'Exceptions Found'
  | 'Under Review'
  | 'Pending Approval'
  | 'Approved'
  | 'Locked'
  | 'Payment Processing'
  | 'Partially Paid'
  | 'Paid'
  | 'Failed'
  | 'Cancelled';

export interface PayrollException {
  id: string;
  payrollRunId: string;
  personId: string;
  personName: string;
  personType: 'Employee' | 'Worker';
  category:
    | 'Missing Attendance'
    | 'Unapproved Overtime'
    | 'Missing Salary Structure'
    | 'Salary Mid-Period Change'
    | 'Duplicate Worker Record'
    | 'Missing Bank Info'
    | 'Negative Net Pay'
    | 'Unexpected Deduction'
    | 'Site Assignment Conflict'
    | 'Unverified Attendance';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  resolutionAction?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface PayrollEarningItem {
  label: string;
  category: 'Basic' | 'HRA' | 'Allowance' | 'Overtime' | 'Incentive' | 'Reimbursement' | 'Base Wage';
  amountPaise: number;
}

export interface PayrollDeductionItem {
  label: string;
  category: 'PF' | 'ESI' | 'PT' | 'TDS' | 'LWF' | 'Advance' | 'Loan' | 'Other';
  amountPaise: number;
}

export interface PayrollRunEmployee {
  id: string;
  payrollRunId: string;
  personId: string;
  personCode: string;
  personName: string;
  personType: 'Employee' | 'Worker';
  departmentOrTrade: string;
  projectId: string;
  siteId: string;
  payableDays: number;
  payableHours: number;
  earnings: PayrollEarningItem[];
  deductions: PayrollDeductionItem[];
  grossEarningsPaise: number;
  totalDeductionsPaise: number;
  statutoryDeductionsPaise: number;
  netPayablePaise: number;
  salaryStructureVersionId?: string;
  attendanceRef: string;
  excludedFromRun: boolean;
  holdReason?: string;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  periodId: string;
  periodLabel: string;
  branchId: string | 'ALL';
  projectId: string | 'ALL';
  scopeLabel: string;
  status: PayrollRunStatus;
  createdBy: string;
  createdByUserId: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  lockedAt?: string;
  totalHeadcount: number;
  totalGrossPaise: number;
  totalDeductionsPaise: number;
  totalNetPayablePaise: number;
  exceptionsCount: number;
  unresolvedExceptionsCount: number;
  items: PayrollRunEmployee[];
  exceptions: PayrollException[];
}

export interface OvertimeRecord {
  id: string;
  companyId: string;
  personId: string;
  personName: string;
  personType: 'Employee' | 'Worker';
  projectId: string;
  siteId: string;
  date: string;
  regularHours: number;
  reportedOvertimeHours: number;
  approvedOvertimeHours: number;
  category: 'Weekday Extended' | 'Sunday / Holiday' | 'Night Shift Concrete Pour' | 'Emergency Breakdown';
  hourlyRatePaise: number;
  multiplier: number;
  calculatedAmountPaise: number;
  verifiedBySiteManager?: string;
  approvalStatus: 'Submitted' | 'Site Verified' | 'Approved' | 'Rejected';
  approvedBy?: string;
}

export interface IncentiveRecord {
  id: string;
  companyId: string;
  personId: string;
  personName: string;
  projectId: string;
  siteId: string;
  type: 'Productivity' | 'Project Milestone' | 'Attendance' | 'Performance' | 'Piece-Rate Bonus';
  ruleDescription: string;
  effectivePeriod: string;
  amountPaise: number;
  supportingRef: string;
  status: 'Pending Approval' | 'Approved' | 'Paid';
  approver?: string;
}

export interface AdvanceRepayment {
  id: string;
  advanceId: string;
  periodLabel: string;
  date: string;
  amountPaise: number;
  payrollRunId?: string;
  mode: 'Payroll Deduction' | 'Direct Cash/UPI';
}

export interface EmployeeAdvance {
  id: string;
  companyId: string;
  advanceCode: string;
  personId: string;
  personName: string;
  personType: 'Employee' | 'Worker';
  projectId: string;
  requestDate: string;
  reason: string;
  requestedAmountPaise: number;
  approvedAmountPaise: number;
  disbursedAmountPaise: number;
  outstandingAmountPaise: number;
  monthlyDeductionPaise: number;
  installmentsTotal: number;
  installmentsPaid: number;
  status:
    | 'Requested'
    | 'Under Review'
    | 'Approved'
    | 'Rejected'
    | 'Disbursed'
    | 'Partially Repaid'
    | 'Fully Repaid'
    | 'Cancelled';
  createdByUserId: string;
  approvedBy?: string;
  repayments: AdvanceRepayment[];
}

export interface Payslip {
  id: string;
  companyId: string;
  payslipNumber: string;
  payrollRunId: string;
  periodLabel: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  projectId: string;
  uanNumber: string;
  panMasked: string;
  bankAccountMasked: string;
  payableDays: number;
  workingDays: number;
  earnings: PayrollEarningItem[];
  deductions: PayrollDeductionItem[];
  grossEarningsPaise: number;
  totalDeductionsPaise: number;
  netPayPaise: number;
  paymentStatus: 'Pending Payment' | 'Paid' | 'On Hold' | 'Revised';
  generatedAt: string;
  correctionNote?: string;
}

export type SalaryBatchStatus =
  | 'Ready for Payment'
  | 'Awaiting Authorization'
  | 'Processing'
  | 'Partially Paid'
  | 'Paid'
  | 'Failed'
  | 'Reconciliation Pending';

export interface SalaryPaymentTransaction {
  id: string;
  batchId: string;
  personId: string;
  personCode: string;
  personName: string;
  bankAccountMasked: string;
  ifsc: string;
  netPayablePaise: number;
  paymentReference: string;
  transferStatus: 'Queued' | 'Processing' | 'Success' | 'Failed';
  transactionDate: string;
  failureReason?: string;
}

export interface SalaryPaymentBatch {
  id: string;
  companyId: string;
  batchCode: string;
  payrollRunId: string;
  periodLabel: string;
  totalEmployees: number;
  totalPayablePaise: number;
  approvedAmountPaise: number;
  paymentMethod: 'NEFT Bulk' | 'IMPS Instant' | 'RTGS' | 'Bank Host-to-Host';
  bankAccountRef: string;
  status: SalaryBatchStatus;
  createdByUserId: string;
  createdByName: string;
  authorizedBy?: string;
  authorizedAt?: string;
  transactions: SalaryPaymentTransaction[];
}

// ---------------- ACCOUNTS PAYABLE & SITE EXPENSES ----------------

export interface Supplier {
  id: string;
  companyId: string;
  supplierCode: string;
  name: string;
  category: 'Cement & Steel' | 'Aggregates & Sand' | 'Electrical & Plumbing' | 'Equipment & Tools' | 'Safety & Consumables';
  gstin: string;
  pan: string;
  bankAccountMasked: string;
  ifsc: string;
  contactPerson: string;
  phone: string;
  paymentTermsDays: number;
}

export interface PurchaseOrderReference {
  id: string;
  poNumber: string;
  supplierId: string;
  projectId: string;
  siteId: string;
  materialSummary: string;
  orderedQuantity: number;
  unit: string;
  agreedUnitPricePaise: number;
  totalOrderedPaise: number;
  poDate: string;
}

export interface MaterialReceiptReference {
  id: string;
  grnNumber: string;
  poNumber: string;
  projectId: string;
  siteId: string;
  receivedQuantity: number;
  unit: string;
  verifiedBySiteEngineer: string;
  receivedDate: string;
  conditionNote: string;
}

export interface SupplierInvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  taxRatePercent: number;
  taxAmountPaise: number;
  lineTotalPaise: number;
}

export type SupplierInvoiceStatus =
  | 'Uploaded'
  | 'Under Review'
  | 'Verification Required'
  | 'Pending Approval'
  | 'Approved'
  | 'Partially Paid'
  | 'Paid'
  | 'Rejected'
  | 'Disputed'
  | 'On Hold';

export interface ThreeWayMatchResult {
  matched: boolean;
  poFound: boolean;
  grnFound: boolean;
  duplicateDetected: boolean;
  quantityMatch: boolean;
  priceMatch: boolean;
  taxMatch: boolean;
  flags: string[];
  variancePaise: number;
}

export interface SupplierInvoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  gstin: string;
  poNumber: string;
  grnNumber: string;
  projectId: string;
  siteId: string;
  invoiceDate: string;
  dueDate: string;
  subtotalPaise: number;
  taxAmountPaise: number;
  tdsApplicablePaise: number;
  totalAmountPaise: number;
  paidAmountPaise: number;
  status: SupplierInvoiceStatus;
  items: SupplierInvoiceItem[];
  matchResult: ThreeWayMatchResult;
  uploadedFileName: string;
  createdByUserId: string;
  approvalHistory: ApprovalHistoryEntry[];
}

export interface ContractorRecord {
  id: string;
  companyId: string;
  contractorCode: string;
  name: string;
  companyName: string;
  projectId: string;
  siteId: string;
  contractRef: string;
  contractType: 'Milestone' | 'Quantity-Based (BOQ)' | 'Labour Rate Contract';
  workCategory: string;
  retentionPercent: number;
  tdsPercent: number;
  gstin: string;
  paymentTerms: string;
}

export interface ContractorInvoice {
  id: string;
  companyId: string;
  billNumber: string;
  contractorId: string;
  contractorName: string;
  companyName: string;
  contractRef: string;
  projectId: string;
  siteId: string;
  workCategory: string;
  workCompletedSummary: string;
  claimedQuantity: string;
  verifiedQuantity: string;
  grossBillAmountPaise: number;
  retentionDeductedPaise: number;
  advanceRecoveryPaise: number;
  otherDeductionsPaise: number;
  gstAmountPaise: number;
  tdsDeductedPaise: number;
  netPayablePaise: number;
  billDate: string;
  dueDate: string;
  siteVerifiedBy?: string;
  pmVerifiedBy?: string;
  status:
    | 'Submitted'
    | 'Site Verified'
    | 'PM Verified'
    | 'Pending Finance Approval'
    | 'Approved'
    | 'Paid'
    | 'Rejected'
    | 'Disputed';
  createdByUserId: string;
  approvalHistory: ApprovalHistoryEntry[];
}

export type ReimbursementStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Ready for Payment'
  | 'Paid';

export interface EmployeeReimbursement {
  id: string;
  companyId: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  category: 'Travel' | 'Transportation' | 'Food Allowance' | 'Accommodation' | 'Site Purchase' | 'Miscellaneous';
  projectId: string;
  siteId: string;
  expenseDate: string;
  amountPaise: number;
  paymentMethod: 'Bank Transfer' | 'UPI' | 'Payroll Addition';
  businessPurpose: string;
  receiptFileName: string;
  remarks: string;
  status: ReimbursementStatus;
  duplicateFlag: boolean;
  createdByUserId: string;
  approvalHistory: ApprovalHistoryEntry[];
}

export type SiteExpenseCategory =
  | 'Material Purchases'
  | 'Labour Expenses'
  | 'Transportation'
  | 'Equipment Rental'
  | 'Fuel'
  | 'Maintenance'
  | 'Food & Accommodation'
  | 'Safety Equipment'
  | 'Site Utilities'
  | 'Other Expenses';

export interface SiteExpense {
  id: string;
  companyId: string;
  expenseCode: string;
  projectId: string;
  siteId: string;
  category: SiteExpenseCategory;
  description: string;
  requestedBy: string;
  amountPaise: number;
  date: string;
  receiptRef: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected';
  paymentStatus: 'Unpaid' | 'Paid';
  createdByUserId: string;
}

// ---------------- BUDGETS, CASH FLOW, RECONCILIATION, COMPLIANCE ----------------

export type BudgetCategoryName =
  | 'Labour'
  | 'Materials'
  | 'Contractors'
  | 'Equipment'
  | 'Transportation'
  | 'Site Overhead'
  | 'Administration'
  | 'Contingency'
  | 'Other';

export interface BudgetCategoryAllocation {
  category: BudgetCategoryName;
  approvedBudgetPaise: number;
  committedPaise: number;
  approvedSpentPaise: number;
  actualPaidPaise: number;
  forecastFinalPaise: number;
}

export interface ProjectBudget {
  id: string;
  companyId: string;
  projectId: string;
  projectName: string;
  projectManager: string;
  approvedBudgetPaise: number;
  committedPaise: number;
  approvedExpensesPaise: number;
  actualPaidPaise: number;
  outstandingPayablesPaise: number;
  forecastFinalCostPaise: number;
  alertThresholdWarningPct: number; // default 70
  alertThresholdCriticalPct: number; // default 85
  categories: BudgetCategoryAllocation[];
}

export interface CashFlowEntry {
  id: string;
  companyId: string;
  monthLabel: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  sourceType: 'Connected Bank Feed' | 'Projected / Scheduled';
  category: 'Client RA Receipt' | 'Mobilization Advance' | 'Payroll' | 'Supplier Payable' | 'Contractor Bill' | 'Site Operations' | 'Tax & Statutory';
  description: string;
  projectId?: string;
  amountPaise: number;
}

export interface FinancialTransaction {
  id: string;
  companyId: string;
  transactionRef: string;
  utrNumber: string;
  date: string;
  direction: 'Debit' | 'Credit';
  module: 'Salary Payment' | 'Supplier Payment' | 'Contractor Payment' | 'Reimbursement' | 'Site Expense' | 'Tax Challan' | 'Client Receipt';
  counterparty: string;
  projectId?: string;
  siteId?: string;
  paymentMode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'Cheque';
  bankAccountRef: string;
  amountPaise: number;
  status: 'Confirmed' | 'Pending' | 'Failed';
  reconciled: boolean;
  createdByUserId: string;
  releasedByUserId?: string;
}

export interface BankStatementRecord {
  id: string;
  statementDate: string;
  bankRef: string;
  description: string;
  direction: 'Debit' | 'Credit';
  amountPaise: number;
  matchedTransactionId?: string;
  matchStatus: 'Matched' | 'Unmatched' | 'Duplicate' | 'Amount Discrepancy';
  discrepancyNote?: string;
  resolved: boolean;
}

export interface BankReconciliationSession {
  id: string;
  companyId: string;
  bankAccountRef: string;
  statementPeriod: string;
  importedAt: string;
  importedBy: string;
  status: 'In Progress' | 'Submitted' | 'Locked';
  records: BankStatementRecord[];
}

export interface ComplianceRateVersion {
  id: string;
  versionTag: string;
  effectiveFrom: string;
  epfEmployeePct: number;
  epfEmployerPct: number;
  epfWageCeilingPaise: number;
  esiEmployeePct: number;
  esiEmployerPct: number;
  esiWageCeilingPaise: number;
  ptStandardMonthlyPaise: number;
  lwfHalfYearlyPaise: number;
  tdsContractorIndividualPct: number;
  tdsContractorCompanyPct: number;
  configuredBy: string;
  disclaimerAccepted: boolean;
}

export interface TaxComplianceRecord {
  id: string;
  companyId: string;
  category: 'EPF' | 'ESI' | 'Professional Tax' | 'LWF' | 'TDS 192 (Salary)' | 'TDS 194C (Contractors)' | 'GST Input & GSTR-2B' | 'Minimum Wage Register';
  applicableEntity: string;
  period: string;
  amountPaise: number;
  dueDate: string;
  filingStatus: 'Pending Preparation' | 'Ready to File' | 'Filed' | 'Overdue';
  paymentStatus: 'Unpaid' | 'Challan Generated' | 'Paid';
  supportingDocument: string;
  assignedOfficer: string;
}

export interface FinancialDocument {
  id: string;
  companyId: string;
  title: string;
  category: 'Tax Challan' | 'Supplier Invoice PDF' | 'Contractor RA Bill' | 'Payroll Register' | 'Bank Statement' | 'Compliance Certificate';
  referenceCode: string;
  projectId?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  accessLevel: 'Finance & Audit' | 'Payroll Restricted' | 'Company Admin Only';
}

// ---------------- APPROVALS, WORKFLOWS & AUDIT LOGS ----------------

export interface ApprovalHistoryEntry {
  stage: string;
  actorName: string;
  actorRole: string;
  decision: 'Submitted' | 'Verified' | 'Approved' | 'Rejected' | 'Clarification Requested' | 'Escalated' | 'Sent Back';
  timestamp: string;
  reason: string;
}

export type ApprovalCategory =
  | 'Payroll Run'
  | 'Salary Payment Batch'
  | 'Overtime'
  | 'Advance Disbursement'
  | 'Supplier Invoice'
  | 'Contractor Invoice'
  | 'Employee Reimbursement'
  | 'Site Expense'
  | 'Budget Adjustment';

export interface ApprovalItem {
  id: string;
  companyId: string;
  requestCode: string;
  category: ApprovalCategory;
  sourceRecordId: string;
  title: string;
  requesterName: string;
  createdByUserId: string;
  projectId?: string;
  siteId?: string;
  amountPaise: number;
  supportingDocsCount: number;
  currentStage: string;
  requiredMinRole: FinanceRoleId;
  deadline: string;
  status: 'Pending' | 'Clarification Requested' | 'Approved' | 'Rejected' | 'Escalated';
  history: ApprovalHistoryEntry[];
}

export interface ApprovalWorkflowRule {
  id: string;
  companyId: string;
  category: ApprovalCategory;
  ruleName: string;
  minAmountPaise: number;
  maxAmountPaise: number | null;
  stages: string[];
  makerCheckerEnforced: boolean;
  active: boolean;
}

export interface FinancialAuditLog {
  id: string;
  companyId: string;
  eventCode: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  recordReference: string;
  module: string;
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
  approvalReference?: string;
}
