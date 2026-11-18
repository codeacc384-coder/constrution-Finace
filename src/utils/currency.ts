// ============================================================================
// DECIMAL-SAFE INR CURRENCY ENGINE (Integer Paise Arithmetic)
// Avoids IEEE-754 floating-point drift on all salary, GST, TDS, and ledger totals.
// ============================================================================

export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

export function sumPaise(values: number[]): number {
  return values.reduce((acc, v) => acc + Math.round(v), 0);
}

export function multiplyPaise(amountPaise: number, factor: number): number {
  // Multiply using scaled integer arithmetic where possible
  return Math.round(amountPaise * factor);
}

export function percentOfPaise(amountPaise: number, percent: number): number {
  return Math.round((amountPaise * percent) / 100);
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrPreciseFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(paise: number, showDecimals = false): string {
  const rupees = fromPaise(paise);
  return showDecimals ? inrPreciseFormatter.format(rupees) : inrFormatter.format(Math.round(rupees));
}

export function formatINRCompact(paise: number): string {
  const rupees = fromPaise(paise);
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

export function formatIndianNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

export function maskAccountNumber(maskedOrFull: string): string {
  const clean = maskedOrFull.replace(/\s+/g, '');
  if (clean.length <= 4) return `•••• ${clean}`;
  return `•••• ${clean.slice(-4)}`;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
