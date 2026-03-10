(function () {
  const PROFILE_KEY = 'cmsIndustryProfile';
  const CUSTOMERS_KEY = 'cmsDemoCustomers';
  const LEADS_KEY = 'cmsDemoLeads';
  const DELIVERIES_KEY = 'cmsDemoDeliveries';

  const templates = {
    'local-service': {
      key: 'local-service',
      label: '本地生活服务',
      loginSubtitle: '适合本地门店、生活服务、线下经营行业',
      industries: ['餐厅', '美甲', '按摩', '美容', '超市', '其他'],
      customers: ['金龙餐厅', '美丽人生美甲', '东方按摩SPA', '时尚美容沙龙'],
      leads: ['海洋餐厅', '星光餐厅', '都市美甲', '活力SPA'],
      deliveryScopes: ['门店活动策划', '社媒内容运营', 'Google商家优化', '私域SOP搭建']
    },
    medical: {
      key: 'medical',
      label: '医疗服务',
      loginSubtitle: '适合口腔、医美、中医、体检等医疗服务行业',
      industries: ['口腔诊所', '医美机构', '中医馆', '体检中心', '其他'],
      customers: ['安心口腔', '悦美医疗', '仁和中医馆', '新康体检'],
      leads: ['嘉禾口腔', '颜值医美', '同济中医', '百姓体检'],
      deliveryScopes: ['预约流程优化', '复诊转化策略', '品牌视觉升级', '患者回访体系']
    },
    education: {
      key: 'education',
      label: '教育培训',
      loginSubtitle: '适合语言学校、职业培训、K12课后服务行业',
      industries: ['语言学校', '职业培训', 'K12课后', '兴趣课程', '其他'],
      customers: ['领航语言学校', '启航职业教育', '卓越K12', '艺启兴趣课堂'],
      leads: ['新东方语培', '青藤职业学院', '小牛课后', '星光艺术班'],
      deliveryScopes: ['招生漏斗优化', '课程包装设计', '转介绍机制搭建', '续费流程优化']
    }
  };

  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }

  function slug(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
  }

  function getActiveProfile() {
    const saved = safeParse(localStorage.getItem(PROFILE_KEY), null);
    if (saved && saved.label && Array.isArray(saved.industries) && saved.industries.length) return saved;
    const tpl = templates['local-service'];
    return {
      key: tpl.key,
      label: tpl.label,
      loginSubtitle: tpl.loginSubtitle,
      industries: tpl.industries.map((x) => ({ value: slug(x), label: x }))
    };
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem('cmsIndustryConfig', JSON.stringify({ label: profile.label, industries: profile.industries }));
  }

  function createSeedCustomers(profile) {
    const tpl = templates[profile.key] || templates['local-service'];
    const inds = profile.industries.length ? profile.industries : tpl.industries.map((x) => ({ value: slug(x), label: x }));
    const statuses = ['following', 'unclosed', 'closed', 'paused'];
    return tpl.customers.map((name, i) => ({
      id: String(i + 1), customerNumber: `C2026${String(i + 1).padStart(4, '0')}`,
      businessName: name, contactPerson: `联系人${i + 1}`, phone: `+1 (212) 555-${String(1200 + i).padStart(4, '0')}`,
      industry: inds[i % inds.length].value, salesPerson: ['张三', '李四', '王五'][i % 3], level: ['high','normal','vip','low'][i%4], status: statuses[i%4], createdAt: `2026-03-0${i+1}`
    }));
  }

  function createSeedLeads(profile) {
    const tpl = templates[profile.key] || templates['local-service'];
    const statuses = ['new', 'following', 'proposal', 'closed'];
    return tpl.leads.map((name, i) => ({
      id: String(i+1), leadNumber: `L2026${String(i+1).padStart(4,'0')}`, customerName: name,
      contactPerson: `线索联系人${i+1}`, phone: `+1 (646) 555-${String(2100+i).padStart(4,'0')}`,
      source: ['referral','social','website','cold'][i%4],
      status: statuses[i%4], intent: ['high','normal','low','high'][i%4],
      salesPerson: ['张三','李四','王五'][i%3], createdAt: `2026-03-0${i+2}`
    }));
  }

  function createSeedDeliveries(profile) {
    const tpl = templates[profile.key] || templates['local-service'];
    return tpl.customers.slice(0,4).map((name, i)=>({
      id:`D2026${String(i+1).padStart(3,'0')}`, customer:name, scope:tpl.deliveryScopes[i%tpl.deliveryScopes.length], owner:['王设计','李运营','张三','王五'][i%4], priority:['high','medium','low','high'][i%4], status:['progress','review','completed','pending'][i%4], dueDate:`2026-03-${String(12+i*3).padStart(2,'0')}`
    }));
  }

  function ensureDemoData() {
    const profile = getActiveProfile();
    if (!safeParse(localStorage.getItem(CUSTOMERS_KEY), null)) localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(createSeedCustomers(profile)));
    if (!safeParse(localStorage.getItem(LEADS_KEY), null)) localStorage.setItem(LEADS_KEY, JSON.stringify(createSeedLeads(profile)));
    if (!safeParse(localStorage.getItem(DELIVERIES_KEY), null)) localStorage.setItem(DELIVERIES_KEY, JSON.stringify(createSeedDeliveries(profile)));
  }

  function resetAllDemoData(profile) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(createSeedCustomers(profile)));
    localStorage.setItem(LEADS_KEY, JSON.stringify(createSeedLeads(profile)));
    localStorage.setItem(DELIVERIES_KEY, JSON.stringify(createSeedDeliveries(profile)));
  }

  window.CMSConfig = {
    templates,
    slug,
    getActiveProfile,
    saveProfile,
    ensureDemoData,
    resetAllDemoData,
    getCustomers: () => safeParse(localStorage.getItem(CUSTOMERS_KEY), []),
    setCustomers: (rows) => localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(rows)),
    getLeads: () => safeParse(localStorage.getItem(LEADS_KEY), []),
    setLeads: (rows) => localStorage.setItem(LEADS_KEY, JSON.stringify(rows)),
    getDeliveries: () => safeParse(localStorage.getItem(DELIVERIES_KEY), []),
    setDeliveries: (rows) => localStorage.setItem(DELIVERIES_KEY, JSON.stringify(rows))
  };
})();
