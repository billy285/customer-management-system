(function () {
  const KEYS = {
    payments: 'cmsFinancePayments',
    expenses: 'cmsFinanceExpenses',
    companyExpenses: 'cmsFinanceCompanyExpenses',
    subscriptions: 'cmsFinanceSubscriptions',
    logs: 'cmsOperationLogs'
  };

  function parse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }

  function nowISO() { return new Date().toISOString(); }
  function monthKey(date) {
    const d = new Date(date || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function code(prefix, rows) {
    return `${prefix}${String((rows?.length || 0) + 1).padStart(6, '0')}`;
  }

  function read(key) { return parse(localStorage.getItem(key), []); }
  function write(key, rows) { localStorage.setItem(key, JSON.stringify(rows)); }

  function addLog(action, objectType, objectId, beforeData, afterData, operatorName) {
    const logs = read(KEYS.logs);
    logs.unshift({
      id: code('LOG', logs),
      module: 'finance',
      action,
      object_type: objectType,
      object_id: objectId,
      operator_name: operatorName || '系统',
      before_data: beforeData || null,
      after_data: afterData || null,
      created_at: nowISO()
    });
    write(KEYS.logs, logs);
  }

  function seedIfNeeded() {
    const customers = (window.CMSConfig && CMSConfig.getCustomers && CMSConfig.getCustomers()) || [];
    if (!read(KEYS.payments).length) {
      const rows = customers.slice(0, 4).map((c, i) => ({
        id: code('PAY', Array.from({ length: i })),
        payment_code: `PAY2026${String(i + 1).padStart(4, '0')}`,
        customer_id: c.id,
        customer_name: c.businessName,
        income_type: ['管理费收入', '投流费收入', '点餐系统订阅费', '续费收入'][i % 4],
        package_name: ['基础套餐', '增长套餐', '订阅套餐', '年度续费'][i % 4],
        amount: [1200, 2000, 399, 1500][i % 4],
        currency: 'USD',
        payment_date: `2026-03-${String(3 + i * 3).padStart(2, '0')}`,
        month_key: '2026-03',
        payment_cycle: ['月付', '月付', '月付', '年付'][i % 4],
        payment_method: ['银行转账', '信用卡', '信用卡', '支票'][i % 4],
        is_received: true,
        created_at: nowISO(),
        updated_at: nowISO()
      }));
      write(KEYS.payments, rows);
    }

    if (!read(KEYS.expenses).length) {
      const rows = customers.slice(0, 4).map((c, i) => ({
        id: code('EXP', Array.from({ length: i })),
        expense_code: `EXP2026${String(i + 1).padStart(4, '0')}`,
        customer_id: c.id,
        customer_name: c.businessName,
        expense_type: ['广告投流费', '平台费', '客户代付费用', '其他客户支出'][i % 4],
        amount: [600, 180, 220, 90][i % 4],
        currency: 'USD',
        expense_date: `2026-03-${String(5 + i * 3).padStart(2, '0')}`,
        month_key: '2026-03',
        payment_method: ['信用卡', '银行转账', '现金', '信用卡'][i % 4],
        remark: '',
        created_at: nowISO()
      }));
      write(KEYS.expenses, rows);
    }

    if (!read(KEYS.companyExpenses).length) {
      const rows = [
        ['工资', 32000], ['办公室租金', 10000], ['电话费', 800], ['软件订阅费', 2000]
      ].map((item, i) => ({
        id: code('CEX', Array.from({ length: i })),
        company_expense_code: `CEX2026${String(i + 1).padStart(4, '0')}`,
        category_name: item[0],
        amount: item[1],
        currency: 'RMB',
        expense_date: `2026-03-${String(2 + i * 6).padStart(2, '0')}`,
        month_key: '2026-03',
        payment_method: ['银行转账', '银行转账', '银行卡', '信用卡'][i % 4],
        remark: '',
        created_at: nowISO(),
        updated_at: nowISO()
      }));
      write(KEYS.companyExpenses, rows);
    }

    if (!read(KEYS.subscriptions).length) {
      const rows = customers.slice(0, 4).map((c, i) => ({
        id: code('SUB', Array.from({ length: i })),
        customer_id: c.id,
        customer_name: c.businessName,
        package_name: ['基础套餐', '增长套餐', '订阅套餐', '广告套餐'][i % 4],
        package_price: [1200, 2000, 399, 1500][i % 4],
        currency: 'USD',
        payment_cycle: ['月付', '月付', '月付', '年付'][i % 4],
        start_at: `2026-02-${String(2 + i).padStart(2, '0')}`,
        end_at: `2026-04-${String(5 + i * 4).padStart(2, '0')}`,
        renew_status: ['正常', '即将到期', '已到期', '未续费'][i % 4],
        is_overdue: i >= 2,
        last_payment_at: `2026-03-${String(1 + i * 3).padStart(2, '0')}`,
        next_payment_at: `2026-04-${String(5 + i * 4).padStart(2, '0')}`,
        remark: ''
      }));
      write(KEYS.subscriptions, rows);
    }
  }

  function summary() {
    const payments = read(KEYS.payments);
    const expenses = read(KEYS.expenses);
    const company = read(KEYS.companyExpenses);
    const subs = read(KEYS.subscriptions);
    const totalIncome = payments.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExpense = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const companyExpense = company.reduce((s, x) => s + Number(x.amount || 0), 0);
    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      managementFeeIncome: payments.filter(x => x.income_type === '管理费收入').reduce((s, x) => s + Number(x.amount || 0), 0),
      adFeeIncome: payments.filter(x => x.income_type === '投流费收入').reduce((s, x) => s + Number(x.amount || 0), 0),
      subscriptionIncome: payments.filter(x => x.income_type.includes('订阅') || x.income_type.includes('续费')).reduce((s, x) => s + Number(x.amount || 0), 0),
      companyExpense,
      overdueSubs: subs.filter(x => x.is_overdue || x.renew_status === '已到期' || x.renew_status === '未续费').length,
      activeSubs: subs.filter(x => x.renew_status === '正常').length
    };
  }

  function list(type) {
    if (type === 'income') return read(KEYS.payments);
    if (type === 'customer_expense') return read(KEYS.expenses);
    if (type === 'company_expense') return read(KEYS.companyExpenses);
    if (type === 'subscription') return read(KEYS.subscriptions);
    return [];
  }

  function add(type, payload, operator) {
    let key = KEYS.payments;
    let row = {};
    if (type === 'income') {
      key = KEYS.payments;
      const rows = read(key);
      row = {
        id: code('PAY', rows),
        payment_code: payload.payment_code || `PAY${new Date().getFullYear()}${String(rows.length + 1).padStart(4, '0')}`,
        customer_id: payload.customer_id || '',
        customer_name: payload.customer_name,
        income_type: payload.income_type,
        package_name: payload.package_name || '',
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        payment_date: payload.payment_date,
        month_key: monthKey(payload.payment_date),
        payment_cycle: payload.payment_cycle || '月付',
        payment_method: payload.payment_method || '银行转账',
        is_received: true,
        remark: payload.remark || '',
        created_at: nowISO(),
        updated_at: nowISO()
      };
      rows.unshift(row);
      write(key, rows);
      addLog('create', 'payment', row.id, null, row, operator);
      return row;
    }

    if (type === 'customer_expense') {
      key = KEYS.expenses;
      const rows = read(key);
      row = {
        id: code('EXP', rows),
        expense_code: payload.expense_code || `EXP${new Date().getFullYear()}${String(rows.length + 1).padStart(4, '0')}`,
        customer_id: payload.customer_id || '',
        customer_name: payload.customer_name,
        expense_type: payload.expense_type,
        amount: Number(payload.amount),
        currency: payload.currency || 'USD',
        expense_date: payload.expense_date,
        month_key: monthKey(payload.expense_date),
        payment_method: payload.payment_method || '银行转账',
        remark: payload.remark || '',
        created_at: nowISO()
      };
      rows.unshift(row);
      write(key, rows);
      addLog('create', 'customer_expense', row.id, null, row, operator);
      return row;
    }

    if (type === 'company_expense') {
      key = KEYS.companyExpenses;
      const rows = read(key);
      row = {
        id: code('CEX', rows),
        company_expense_code: payload.company_expense_code || `CEX${new Date().getFullYear()}${String(rows.length + 1).padStart(4, '0')}`,
        category_name: payload.category_name,
        amount: Number(payload.amount),
        currency: 'RMB',
        expense_date: payload.expense_date,
        month_key: monthKey(payload.expense_date),
        payment_method: payload.payment_method || '银行转账',
        remark: payload.remark || '',
        created_at: nowISO(),
        updated_at: nowISO()
      };
      rows.unshift(row);
      write(key, rows);
      addLog('create', 'company_expense', row.id, null, row, operator);
      return row;
    }

    if (type === 'subscription') {
      key = KEYS.subscriptions;
      const rows = read(key);
      row = {
        id: code('SUB', rows),
        customer_id: payload.customer_id || '',
        customer_name: payload.customer_name,
        package_name: payload.package_name,
        package_price: Number(payload.package_price),
        currency: payload.currency || 'USD',
        payment_cycle: payload.payment_cycle || '月付',
        start_at: payload.start_at,
        end_at: payload.end_at,
        renew_status: payload.renew_status || '正常',
        is_overdue: ['已到期', '未续费'].includes(payload.renew_status),
        last_payment_at: payload.last_payment_at || payload.start_at,
        next_payment_at: payload.next_payment_at || payload.end_at,
        remark: payload.remark || ''
      };
      rows.unshift(row);
      write(key, rows);
      addLog('create', 'subscription', row.id, null, row, operator);
      return row;
    }

    return null;
  }

  window.FinanceService = { seedIfNeeded, summary, list, add };
})();
