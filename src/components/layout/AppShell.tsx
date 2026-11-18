import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutDashboard,
  Menu,
  Receipt,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { SIDEBAR_SECTIONS } from './navigationConfig';
import { useCurrentUser, useFinanceStore } from '../../store/useFinanceStore';
import { canAccessModule, getRolesForCompanySize } from '../../services/rbacService';
import { cn, SelectField } from '../ui/primitives';
import { SideSheet } from '../ui/ModalDrawer';
import { CompanySize } from '../../types/finance';
import { formatINRCompact } from '../../utils/currency';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const company = useFinanceStore((s) => s.company);
  const branches = useFinanceStore((s) => s.branches);
  const projects = useFinanceStore((s) => s.projects);
  const sites = useFinanceStore((s) => s.sites);
  const filters = useFinanceStore((s) => s.filters);
  const setFilters = useFinanceStore((s) => s.setFilters);
  const users = useFinanceStore((s) => s.users);
  const roleConfigs = useFinanceStore((s) => s.roleConfigs);
  const switchCurrentUser = useFinanceStore((s) => s.switchCurrentUser);
  const switchCompanySize = useFinanceStore((s) => s.switchCompanySize);
  const approvals = useFinanceStore((s) => s.approvals);
  const payrollRuns = useFinanceStore((s) => s.payrollRuns);

  const { user, role } = useCurrentUser();

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
  const latestRun = payrollRuns[0];
  const unresolvedExceptions = latestRun?.unresolvedExceptionsCount || 0;
  const alertCount = pendingApprovals.length + (unresolvedExceptions > 0 ? 1 : 0);

  const availableRolesForSize = getRolesForCompanySize(company.size);
  const availableUsersForSize = users.filter((u) =>
    availableRolesForSize.some((r) => r.roleId === u.roleId)
  );

  const visibleSections = SIDEBAR_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => canAccessModule(role, item.id)),
  })).filter((sec) => sec.items.length > 0);

  const filteredProjects =
    filters.branchId === 'ALL'
      ? projects
      : projects.filter((p) => p.branchId === filters.branchId);

  const filteredSites =
    filters.projectId === 'ALL'
      ? sites
      : sites.filter((st) => st.projectId === filters.projectId);

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#101F35] text-slate-200 select-none">
      {/* Brand header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shrink-0">
            BF
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <span className="font-display font-bold text-[15px] tracking-tight text-white whitespace-nowrap truncate">
              BuildFlow Finance
            </span>
          )}
        </div>
        {!isMobile ? (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.title}>
            {(!sidebarCollapsed || isMobile) && (
              <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400/90 uppercase">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => isMobile && setMobileMenuOpen(false)}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-[#2563EB] text-white'
                            : 'text-slate-300 hover:text-white hover:bg-white/8',
                          sidebarCollapsed && !isMobile && 'justify-center px-2'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {(!sidebarCollapsed || isMobile) &&
                        item.id === 'payment_approvals' &&
                        pendingApprovals.length > 0 && (
                          <span className="ml-auto text-[11px] font-mono-num tabular-nums px-1.5 py-0.5 rounded bg-white/15 text-white">
                            {pendingApprovals.length}
                          </span>
                        )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Tenant Info Footer (Clean, non-telemetry) */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3 border-t border-white/10 text-xs text-slate-300 bg-[#0B1628]/60 shrink-0">
          <div className="font-semibold text-white truncate">{company.name}</div>
          <div className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="capitalize">{company.size} Tier</span>
            <span>·</span>
            <span>FY {company.financialYear}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#172B4D] overflow-x-hidden">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 border-r border-slate-800 z-30',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile / Tablet Slide-Over Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#101F35]/60 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-2xl">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Hamburger + Company/Context */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-[#172B4D] hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#2563EB] shrink-0 hidden sm:block" />
              <span className="font-display font-semibold text-sm text-[#172B4D] truncate">
                {company.name}
              </span>
              <span className="hidden md:inline text-slate-300">/</span>
              <span className="hidden md:inline text-xs text-[#64748B] whitespace-nowrap">
                {filters.periodLabel}
              </span>
            </div>
          </div>

          {/* Center-Right: Desktop Context Selectors */}
          <div className="hidden xl:flex items-center gap-2">
            <select
              aria-label="Select branch"
              value={filters.branchId}
              onChange={(e) =>
                setFilters({ branchId: e.target.value, projectId: 'ALL', siteId: 'ALL' })
              }
              className="h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Select project"
              value={filters.projectId}
              onChange={(e) => setFilters({ projectId: e.target.value, siteId: 'ALL' })}
              className="h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#2563EB] max-w-[180px]"
            >
              <option value="ALL">All Projects</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Select financial period"
              value={filters.periodLabel}
              onChange={(e) => setFilters({ periodLabel: e.target.value })}
              className="h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="November 2026">November 2026</option>
              <option value="October 2026">October 2026</option>
              <option value="December 2026">December 2026</option>
              <option value="Q3 FY 2026–2027">Q3 FY 2026–2027</option>
            </select>
          </div>

          {/* Right: Filter Drawer (Mobile/Tablet) + Notifications + Persona/Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="xl:hidden h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#172B4D] hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              aria-label="Open filters"
            >
              <Filter className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-[#172B4D] cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-md bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center font-mono-num tabular-nums">
                    {alertCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172B4D]">Finance Action Alerts</span>
                      <span className="text-[11px] text-[#64748B] font-mono-num">
                        {alertCount} active
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {unresolvedExceptions > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate('/payroll-processing');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-[#D97706]">
                            Payroll Exceptions ({unresolvedExceptions})
                          </div>
                          <div className="text-xs text-[#64748B] mt-0.5">
                            {latestRun?.id} requires exception resolution before approval.
                          </div>
                        </button>
                      )}
                      {pendingApprovals.map((apr) => (
                        <button
                          key={apr.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate('/payment-approvals');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#172B4D] truncate">
                              {apr.requestCode} · {apr.category}
                            </span>
                            <span className="text-xs font-mono-num font-semibold text-[#2563EB] shrink-0">
                              {formatINRCompact(apr.amountPaise)}
                            </span>
                          </div>
                          <div className="text-xs text-[#64748B] truncate mt-0.5">{apr.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Role & User Persona Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="h-9 pl-2 pr-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer max-w-[200px]"
              >
                <div className="w-6 h-6 rounded-md bg-[#101F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <div className="text-xs font-semibold text-[#172B4D] truncate leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate leading-tight">
                    {role.roleName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-4 space-y-4">
                    <div>
                      <div className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Company Size Adaptation</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Test dynamic role & module visibility across company tiers.
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {(['small', 'medium', 'large'] as CompanySize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => switchCompanySize(sz)}
                            className={cn(
                              'py-1.5 px-2 text-xs font-medium rounded-md border capitalize cursor-pointer transition-colors',
                              company.size === sz
                                ? 'bg-[#101F35] text-white border-[#101F35]'
                                : 'bg-white text-[#64748B] border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-xs font-bold text-[#172B4D] mb-2">
                        Switch Active Finance Role ({availableUsersForSize.length})
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {availableUsersForSize.map((u) => {
                          const r = roleConfigs[u.roleId];
                          const active = u.id === user.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                switchCurrentUser(u.id);
                                setProfileOpen(false);
                              }}
                              className={cn(
                                'w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between gap-2',
                                active
                                  ? 'bg-blue-50 text-[#1D4ED8] font-semibold'
                                  : 'hover:bg-slate-50 text-[#172B4D]'
                              )}
                            >
                              <div className="min-w-0">
                                <div className="truncate">{u.name}</div>
                                <div className="text-[11px] text-[#64748B] truncate">{r.roleName}</div>
                              </div>
                              {active && <span className="text-[10px] font-semibold shrink-0">Active</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 p-3 sm:p-6 pb-20 lg:pb-8 max-w-[1600px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Compact <= 56px, total sticky < 15% viewport) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-slate-200 grid grid-cols-5">
        {[
          { label: 'Home', path: '/', icon: LayoutDashboard, show: canAccessModule(role, 'finance_dashboard') },
          { label: 'Payroll', path: '/payroll-processing', icon: Users, show: canAccessModule(role, 'payroll_processing') || canAccessModule(role, 'payroll_overview') },
          { label: 'Payables', path: '/supplier-invoices', icon: Receipt, show: canAccessModule(role, 'supplier_invoices') },
          { label: 'Approvals', path: '/payment-approvals', icon: CheckSquare, show: canAccessModule(role, 'payment_approvals') },
        ].map((nav) => {
          const Icon = nav.icon;
          const active = location.pathname === nav.path;
          return (
            <button
              key={nav.path}
              type="button"
              onClick={() => navigate(nav.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer',
                active ? 'text-[#2563EB]' : 'text-[#64748B]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{nav.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[#64748B] cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Modules</span>
        </button>
      </nav>

      {/* Filter Drawer for Tablet/Mobile */}
      <SideSheet
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Financial Scope Filters"
        subtitle="Filter dashboard KPIs, ledgers, and project views"
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <SelectField
            label="Company Branch"
            value={filters.branchId}
            onChange={(e) =>
              setFilters({ branchId: e.target.value, projectId: 'ALL', siteId: 'ALL' })
            }
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Project"
            value={filters.projectId}
            onChange={(e) => setFilters({ projectId: e.target.value, siteId: 'ALL' })}
          >
            <option value="ALL">All Projects</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Construction Site"
            value={filters.siteId}
            onChange={(e) => setFilters({ siteId: e.target.value })}
          >
            <option value="ALL">All Sites</option>
            {filteredSites.map((st) => (
              <option key={st.id} value={st.id}>
                {st.code} · {st.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Financial Year"
            value={filters.financialYear}
            onChange={(e) => setFilters({ financialYear: e.target.value })}
          >
            <option value="2026–2027">FY 2026–2027</option>
            <option value="2025–2026">FY 2025–2026</option>
          </SelectField>

          <SelectField
            label="Reporting Period"
            value={filters.periodLabel}
            onChange={(e) => setFilters({ periodLabel: e.target.value })}
          >
            <option value="November 2026">November 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="December 2026">December 2026</option>
            <option value="Q3 FY 2026–2027">Q3 FY 2026–2027</option>
          </SelectField>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters({
                  branchId: 'ALL',
                  projectId: 'ALL',
                  siteId: 'ALL',
                  financialYear: '2026–2027',
                  periodLabel: 'November 2026',
                })
              }
              className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-[#64748B] hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(false)}
              className="flex-1 h-10 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
            >
              Apply Scope
            </button>
          </div>
        </div>
      </SideSheet>
    </div>
  );
}
