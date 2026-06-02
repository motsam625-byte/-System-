
    <!-- ==================== الجزء الثاني: JavaScript ==================== -->
    
    // ====================قاعدة البيانات الموسعة====================
    const DB_KEY = 'erp_pro_max_v4';
    const BUSINESS_TYPES = {
        general: { name: 'تجارة عامة', icon: '🏪' },
        food: { name: 'مواد غذائية وبقالة', icon: '🥫' },
        electronics: { name: 'أجهزة إلكترونية', icon: '📱' },
        construction: { name: 'مواد بناء', icon: '🏗️' },
        pharmacy: { name: 'صيدلية وأدوية', icon: '💊' },
        clothing: { name: 'ملابس وأزياء', icon: '👗' },
        furniture: { name: 'أثاث ومفروشات', icon: '🛋️' },
        spareparts: { name: 'قطع غيار سيارات', icon: '🔧' },
        stationery: { name: 'قرطاسية ومكتبات', icon: '📚' },
        jewelry: { name: 'مجوهرات وساعات', icon: '💍' }
    };
    let DB;
    let currentCameraStream = null;

    // ==================== تحميل وحفظ قاعدة البيانات ====================
    function loadDB() {
        try {
            let saved = localStorage.getItem(DB_KEY);
            if (saved) {
                DB = JSON.parse(saved);
                if (!DB.itemCategories) DB.itemCategories = [];
                if (!DB.cashTransactions) DB.cashTransactions = [];
                if (!DB.stockAlerts) DB.stockAlerts = [];
                if (!DB.backups) DB.backups = [];
                if (!DB.settings.businessType) DB.settings.businessType = 'general';
                if (!DB.settings.enableExpiryDates) DB.settings.enableExpiryDates = false;
                if (!DB.settings.enableSerialNumbers) DB.settings.enableSerialNumbers = false;
                if (!DB.nextId.backup) DB.nextId.backup = 1;
                if (!DB.nextId.category) DB.nextId.category = 1;
                if (!DB.nextId.transaction) DB.nextId.transaction = 1;
            } else {
                DB = {
                    settings: { 
                        company: 'شركة التجارة العامة', 
                        prefix: 'INV-', 
                        defaultCurrency: 'YER',
                        businessType: 'general',
                        enableExpiryDates: false,
                        enableSerialNumbers: false,
                        autoBackup: false,
                        backupFrequency: 'daily'
                    },
                    users: [
                        { id: 1, username: 'Motsam', password: '779749412', role: 'admin', permissions: { all: true } },
                        { id: 2, username: 'موظف', password: '123456', role: 'employee', permissions: { 
                            dashboard: true, sales: true, purchases: true, inventory: true, 
                            contacts: true, cash: true, barcode: true 
                        }}
                    ],
                    currentUser: null,
                    items: [],
                    itemCategories: [],
                    customers: [],
                    suppliers: [],
                    invoices: [],
                    purchases: [],
                    cashAccounts: [
                        { id: 1, name: 'الصندوق الرئيسي', balance: 0 },
                        { id: 2, name: 'البنك', balance: 0 }
                    ],
                    cashTransactions: [],
                    employees: [],
                    salaryPayments: [],
                    assets: [],
                    projects: [],
                    barcodeHistory: [],
                    stockAlerts: [],
                    backups: [],
                    nextId: { 
                        invoice: 1, purchase: 1, item: 1, customer: 1, supplier: 1, 
                        cash: 3, employee: 1, asset: 1, project: 1, user: 3, 
                        category: 1, transaction: 1, backup: 1 
                    }
                };
            }
        } catch(e) {
            console.error('خطأ في تحميل البيانات:', e);
            DB = null;
        }
        saveDB();
    }

    function saveDB() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(DB));
        } catch(e) {
            console.error('خطأ في حفظ البيانات:', e);
            showToast('⚠️ خطأ في حفظ البيانات - قد يكون التخزين ممتلئاً', 'error');
        }
    }

    // ==================== دوال مساعدة ====================
    function $(id) { return document.getElementById(id); }
    function fm(v) { return (v || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function cn(id) { let c = DB.customers.find(x => x.id === id); return c ? c.name : 'نقدي'; }
    function sn(id) { let s = DB.suppliers.find(x => x.id === id); return s ? s.name : '?'; }
    function getCurrSymbol(c) { return c === 'YER' ? '﷼' : c === 'SAR' ? '﷼' : '$'; }

    function showToast(msg, type) {
        let types = {success: 'toast-success', error: 'toast-error', info: 'toast-info'};
        let t = document.createElement('div');
        t.className = 'toast ' + (types[type] || 'toast-info');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    function togglePassword() {
        let inp = $('loginPass');
        let btn = document.querySelector('.pass-toggle');
        if (inp.type === 'password') {
            inp.type = 'text';
            btn.textContent = '🙈';
        } else {
            inp.type = 'password';
            btn.textContent = '👁️';
        }
    }

    // ==================== تسجيل الدخول (تم الإصلاح) ====================
    function doLogin() {
        console.log('🟢 زر الدخول تم الضغط عليه');
        
        if (!DB) {
            console.error('❌ قاعدة البيانات غير محملة');
            showToast('❌ خطأ في النظام - أعد تحميل الصفحة', 'error');
            return;
        }
        
        let username = $('loginUser').value.trim();
        let password = $('loginPass').value.trim();
        
        console.log('محاولة تسجيل الدخول:', username);
        
        if (!username || !password) {
            let errorEl = $('loginError');
            errorEl.textContent = '❌ الرجاء إدخال اسم المستخدم وكلمة المرور';
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 3000);
            return;
        }
        
        let user = DB.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            console.log('✅ تم العثور على المستخدم:', user.username, 'الدور:', user.role);
            DB.currentUser = user;
            
            if (DB.settings.autoBackup && user.role === 'admin') {
                autoBackup();
            }
            
            saveDB();
            
            $('loginOverlay').style.display = 'none';
            $('mainHeader').style.display = 'flex';
            $('mainLayout').style.display = 'flex';
            
            updateUI();
            buildAllPages();
            showPage('dashboard');
            checkStockLevels();
            
            showToast('✅ مرحباً ' + user.username + '!', 'success');
        } else {
            console.log('❌ فشل تسجيل الدخول');
            let errorEl = $('loginError');
            errorEl.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 3000);
        }
    }

    // ==================== ربط زر الدخول (إصلاح) ====================
    document.addEventListener('DOMContentLoaded', function() {
        let loginBtn = document.getElementById('loginButton');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doLogin();
            });
            console.log('✅ زر الدخول جاهز');
        }
    });

    // السماح بالدخول بالضغط على Enter
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && $('loginOverlay').style.display !== 'none') {
            e.preventDefault();
            doLogin();
        }
    });

    function logout() {
        if (DB.settings.autoBackup && DB.currentUser && DB.currentUser.role === 'admin') {
            autoBackup();
        }
        
        DB.currentUser = null;
        saveDB();
        $('loginOverlay').style.display = 'flex';
        $('mainHeader').style.display = 'none';
        $('mainLayout').style.display = 'none';
        $('mainContent').innerHTML = '';
        $('loginUser').value = '';
        $('loginPass').value = '';
        $('loginError').classList.remove('show');
        stopCamera();
    }

    function updateUI() {
        if (!DB.currentUser) return;
        $('displayUser').textContent = DB.currentUser.username;
        $('userInitial').textContent = DB.currentUser.username.charAt(0);
        let roleEl = $('displayRole');
        roleEl.textContent = DB.currentUser.role === 'admin' ? '👑 مدير' : '👤 موظف';
        roleEl.className = 'role-badge ' + (DB.currentUser.role === 'admin' ? 'role-admin' : 'role-employee');
        
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = DB.currentUser.role === 'admin' ? 'flex' : 'none';
        });
        
        $('companyDisplay').textContent = DB.settings.company;
        updateLowStockBadge();
    }

    function updateLowStockBadge() {
        let low = DB.items.filter(i => (i.qty || 0) <= (i.minStock || 10)).length;
        let badge = $('lowStockBadge');
        if (badge) {
            if (low > 0) { badge.style.display = 'inline'; badge.textContent = low; }
            else { badge.style.display = 'none'; }
        }
    }

    // ==================== القائمة ====================
    function toggleMobileMenu() {
        $('sidebar').classList.toggle('mobile-open');
        $('mobileOverlay').classList.toggle('show');
    }

    function closeMobileMenu() {
        $('sidebar').classList.remove('mobile-open');
        $('mobileOverlay').classList.remove('show');
    }

    function toggleSidebar() {
        let sidebar = $('sidebar');
        let mainContent = $('mainContent');
        let btn = sidebar.querySelector('.sidebar-toggle');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        if (sidebar.classList.contains('collapsed')) {
            btn.textContent = '▶';
        } else {
            btn.textContent = '◀';
        }
    }

    // ==================== الكاميرا ====================
    function startCamera(videoElement) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('❌ متصفحك لا يدعم الكاميرا', 'error');
            return;
        }
        
        stopCamera();
        
        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        }).then(stream => {
            currentCameraStream = stream;
            videoElement.srcObject = stream;
            videoElement.style.display = 'block';
            videoElement.play();
            showToast('📷 الكاميرا جاهزة - وجهها نحو الباركود', 'info');
        }).catch(err => {
            showToast('❌ لم نتمكن من الوصول للكاميرا', 'error');
        });
    }

    function stopCamera() {
        if (currentCameraStream) {
            currentCameraStream.getTracks().forEach(track => track.stop());
            currentCameraStream = null;
        }
        document.querySelectorAll('.camera-preview').forEach(v => {
            v.style.display = 'none';
            v.srcObject = null;
        });
    }

    function toggleBarcodeCamera() {
        let video = $('barcodeCamera');
        if (video && video.style.display === 'block') {
            stopCamera();
            if (video) video.style.display = 'none';
        } else if (video) {
            startCamera(video);
        }
    }

    function toggleInvCamera() {
        let video = $('invCamera');
        if (video && video.style.display === 'block') {
            stopCamera();
            if (video) video.style.display = 'none';
        } else if (video) {
            startCamera(video);
        }
    }

    function toggleGlobalCamera() {
        let video = $('globalCamera');
        if (video && video.style.display === 'block') {
            stopCamera();
            if (video) video.style.display = 'none';
        } else if (video) {
            startCamera(video);
        }
    }

    // ==================== الباركود ====================
    function generateBarcodeText(text) {
        return '||' + text.split('').map(c => '|' + c.charCodeAt(0).toString(2).padStart(8,'0').replace(/0/g,' ').replace(/1/g,'█')).join('') + '||';
    }

    function scanBarcode() {
        let barcode = $('barcodeInput')?.value.trim();
        if (!barcode) return;
        
        let item = DB.items.find(i => i.barcode === barcode);
        if (item) {
            let rows = document.querySelectorAll('#invoiceItems .row');
            let lastRow = rows[rows.length - 1];
            let select = lastRow?.querySelector('.item-select');
            let qtyInput = lastRow?.querySelector('.item-qty');
            let priceInput = lastRow?.querySelector('.item-price');
            
            if (select) {
                select.value = item.id;
                if (qtyInput) qtyInput.value = 1;
                if (priceInput) priceInput.value = item.salePrice || 0;
                calcInvoiceTotal();
                showToast('✅ تم إضافة: ' + item.name, 'success');
                addInvoiceItem();
            }
        } else {
            showToast('❌ لم يتم العثور على: ' + barcode, 'error');
        }
        
        DB.barcodeHistory.push({ barcode, time: new Date().toISOString(), found: !!item });
        if (DB.barcodeHistory.length > 200) DB.barcodeHistory.splice(0, 50);
        saveDB();
        $('barcodeInput').value = '';
    }

    function processGlobalBarcode() {
        let barcode = $('globalBarcodeScanner')?.value.trim();
        if (!barcode) return;
        
        let item = DB.items.find(i => i.barcode === barcode);
        let customer = DB.customers.find(c => c.barcode === barcode);
        let supplier = DB.suppliers.find(s => s.barcode === barcode);
        let result = '';
        
        if (item) result = `📦 <strong>${item.name}</strong> | سعر: ${fm(item.salePrice||0)} | كمية: ${item.qty||0}`;
        else if (customer) result = `👤 <strong>${customer.name}</strong> | هاتف: ${customer.phone||'-'} | رصيد: ${fm(customer.balance||0)}`;
        else if (supplier) result = `🏭 <strong>${supplier.name}</strong> | هاتف: ${supplier.phone||'-'}`;
        else result = `❌ لم يتم العثور على: ${barcode}`;
        
        $('barcodeScanResult').innerHTML = `<div class="card" style="margin-top:8px;"><p>${result}</p></div>`;
        
        DB.barcodeHistory.push({ barcode, time: new Date().toISOString(), found: !!(item||customer||supplier) });
        saveDB();
        $('globalBarcodeScanner').value = '';
    }

    function scanInventoryBarcode() {
        let barcode = $('invBarcodeScan')?.value.trim();
        if (!barcode) return;
        
        let item = DB.items.find(i => i.barcode === barcode);
        if (item) {
            $('invScanResult').innerHTML = `
                <div class="card" style="margin-top:8px;">
                    <p><strong>📦 ${item.name}</strong></p>
                    <p>الكمية الحالية: ${item.qty||0} ${item.unit} | السعر: ${fm(item.salePrice||0)}</p>
                    <div class="row" style="margin-top:8px;">
                        <div class="col"><input type="number" class="form-input" id="invQtyUpdate" value="${item.qty||0}" placeholder="الكمية الجديدة"></div>
                        <div class="col"><button class="btn btn-success btn-sm" onclick="updateInvQty(${item.id})">📝 تحديث الكمية</button></div>
                    </div>
                </div>
            `;
        } else {
            $('invScanResult').innerHTML = `<div class="card" style="margin-top:8px;color:var(--coral);">❌ غير موجود: ${barcode}</div>`;
        }
        
        $('invBarcodeScan').value = '';
    }

    function updateInvQty(itemId) {
        let item = DB.items.find(i => i.id === itemId);
        if (item) {
            let newQty = parseInt($('invQtyUpdate')?.value);
            if (!isNaN(newQty)) {
                item.qty = newQty;
                saveDB();
                showToast('✅ تم تحديث كمية ' + item.name + ' إلى ' + newQty, 'success');
                refreshInventory();
                refreshDashboard();
                checkStockLevels();
            }
        }
    }

    function generateBarcodeForItem() {
        let barcode = $('itemBarcode')?.value || Date.now().toString();
        $('itemBarcode').value = barcode;
        showToast('📱 باركود: ' + barcode, 'info');
    }

    function generateBarcodeForInvoice() {
        let lastInv = DB.invoices[DB.invoices.length - 1];
        if (!lastInv) { showToast('❌ لا توجد فاتورة', 'error'); return; }
        $('barcodePreview').innerHTML = `
            <div class="card" style="text-align:center;">
                <h4>📱 باركود الفاتورة</h4>
                <div class="barcode-display">${generateBarcodeText(lastInv.number)}</div>
                <p>${lastInv.number}</p>
            </div>
        `;
    }

    function generateBarcodeFromInput() {
        let text = $('generateBarcodeInput')?.value.trim();
        if (!text) return;
        $('generatedBarcode').innerHTML = `
            <div class="barcode-display">${generateBarcodeText(text)}</div>
            <p style="color:var(--text-muted);text-align:center;">${text}</p>
        `;
    }

    function printGeneratedBarcode() {
        let text = $('generateBarcodeInput')?.value.trim();
        if (!text) return;
        let html = `<div style="text-align:center;"><div style="font-family:monospace;font-size:14pt;letter-spacing:3pt;">${generateBarcodeText(text)}</div><p>${text}</p></div>`;
        $('printPage').innerHTML = html;
        $('printPage').style.display = 'block';
        window.print();
        setTimeout(() => $('printPage').style.display = 'none', 500);
    }

    function refreshBarcodePage() {}

    // ==================== التنقل بين الصفحات ====================
    function showPage(name) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        let page = $('page-' + name);
        if (page) page.classList.add('active');
        
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(m => {
            let onclick = m.getAttribute('onclick');
            if (onclick && onclick.includes("'" + name + "'")) m.classList.add('active');
        });
        
        closeMobileMenu();
        
        switch(name) {
            case 'dashboard': refreshDashboard(); break;
            case 'sales': refreshSales(); break;
            case 'purchases': refreshPurchases(); break;
            case 'inventory': refreshInventory(); break;
            case 'contacts': refreshContacts(); break;
            case 'cash': refreshCash(); break;
            case 'employees': refreshEmployees(); break;
            case 'assets': refreshAssets(); break;
            case 'reports': showTrialBalance(); showIncomeStatement(); showBalanceSheet(); break;
            case 'projects': refreshProjects(); break;
            case 'barcode': refreshBarcodePage(); break;
            case 'users': refreshUsers(); break;
            case 'systemCopy': refreshSystemCopy(); break;
            case 'settings': refreshSettings(); break;
        }
    }

    function switchTab(page, tab) {
        let container = $('page-' + page);
        if (!container) return;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        let tabEl = container.querySelector(`[onclick*="'${tab}'"]`);
        if (tabEl) tabEl.classList.add('active');
        let contentEl = $(page + '-' + tab);
        if (contentEl) contentEl.classList.add('active');
    }

    // ==================== المبيعات ====================
    function refreshSales() {
        $('invCustomer').innerHTML = '<option value="">-- نقدي --</option>' + DB.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        $('invNumber').value = DB.settings.prefix + DB.nextId.invoice;
        $('invDate').value = new Date().toISOString().split('T')[0];
        $('invoiceItems').innerHTML = '';
        addInvoiceItem();
        calcInvoiceTotal();
        
        $('invoicesTable').innerHTML = `<table><thead><tr><th>رقم</th><th>تاريخ</th><th>عميل</th><th>طريقة</th><th>إجمالي</th><th>صافي</th><th>عملة</th></tr></thead><tbody>
            ${DB.invoices.slice(-20).reverse().map(i => `<tr><td>${i.number}</td><td>${i.date}</td><td>${cn(i.customerId)}</td><td>${i.payment==='cash'?'نقدي':i.payment==='bank'?'تحويل':'آجل'}</td><td>${fm(i.total)}</td><td>${fm(i.net)}</td><td>${getCurrSymbol(i.currency)}</td></tr>`).join('')}
        </tbody></table>`;
    }

    function addInvoiceItem() {
        let div = document.createElement('div');
        div.className = 'row';
        div.style.marginTop = '6px';
        div.innerHTML = `
            <div class="col"><select class="form-select item-select">${DB.items.map(i => `<option value="${i.id}">${i.name} (${fm(i.salePrice||0)})</option>`).join('')}</select></div>
            <div class="col"><input type="number" class="form-input item-qty" value="1" min="1" onchange="calcInvoiceTotal()"></div>
            <div class="col"><input type="number" class="form-input item-price" value="0" step="0.01" onchange="calcInvoiceTotal()"></div>
            <div class="col"><button class="btn btn-danger btn-sm" onclick="this.closest('.row').remove();calcInvoiceTotal();">🗑️</button></div>
        `;
        $('invoiceItems').appendChild(div);
    }

    function calcInvoiceTotal() {
        let total = 0;
        document.querySelectorAll('#invoiceItems .row').forEach(row => {
            let qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
            let price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            total += qty * price;
        });
        $('invTotal').value = total.toFixed(2);
        let disc = parseFloat($('invDiscount').value) || 0;
        $('invNet').value = (total - disc).toFixed(2);
    }

    function updateCurrencySymbol() {
        let curr = $('invCurrency')?.value || 'YER';
        let sym = $('currencySymbol');
        if (sym) sym.textContent = getCurrSymbol(curr);
    }

    function saveInvoice() {
        let items = [];
        document.querySelectorAll('#invoiceItems .row').forEach(row => {
            let sel = row.querySelector('.item-select');
            let qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
            let price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            if (sel && sel.value && qty > 0) {
                let item = DB.items.find(i => i.id === parseInt(sel.value));
                items.push({ itemId: item?.id, itemName: item?.name || '?', qty, price, total: qty * price, barcode: item?.barcode || '' });
                if (item) item.qty = (item.qty || 0) - qty;
            }
        });
        
        if (items.length === 0) { showToast('❌ أضف صنف واحد على الأقل', 'error'); return; }
        
        let inv = {
            id: DB.nextId.invoice++,
            number: $('invNumber').value,
            date: $('invDate').value,
            customerId: parseInt($('invCustomer').value) || null,
            payment: $('invPayment').value,
            currency: $('invCurrency').value,
            items,
            total: parseFloat($('invTotal').value),
            discount: parseFloat($('invDiscount').value) || 0,
            net: parseFloat($('invNet').value)
        };
        
        if (inv.customerId) {
            let cust = DB.customers.find(c => c.id === inv.customerId);
            if (cust) cust.balance = (cust.balance || 0) + inv.net;
        }
        
        if (inv.payment === 'cash' && DB.cashAccounts.length > 0) {
            DB.cashAccounts[0].balance = (DB.cashAccounts[0].balance || 0) + inv.net;
        }
        
        DB.invoices.push(inv);
        saveDB();
        showToast('✅ تم حفظ الفاتورة بنجاح', 'success');
        refreshSales();
        $('invNumber').value = DB.settings.prefix + DB.nextId.invoice;
        refreshDashboard();
        checkStockLevels();
    }

    function printInvoice(mode) {
        let inv = DB.invoices[DB.invoices.length - 1];
        if (!inv) { showToast('❌ لا توجد فاتورة', 'error'); return; }
        
        let html = `
            <div style="text-align:center;margin-bottom:20px;">
                <h1 style="color:#2c3e50;">${DB.settings.company}</h1>
                <h2 style="color:#e74c3c;">فاتورة مبيعات</h2>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
                <p><strong>رقم:</strong> ${inv.number}</p>
                <p><strong>التاريخ:</strong> ${inv.date}</p>
            </div>
            <p><strong>العميل:</strong> ${cn(inv.customerId)} | <strong>طريقة الدفع:</strong> ${inv.payment==='cash'?'نقدي':inv.payment==='bank'?'تحويل':'آجل'}</p>
            <table border="1" style="width:100%;border-collapse:collapse;margin:15px 0;">
                <thead><tr style="background:#f9ca24;"><th>الصنف</th><th>الباركود</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
                <tbody>
                    ${inv.items.map(i => `<tr><td>${i.itemName}</td><td>${i.barcode||'-'}</td><td>${i.qty}</td><td>${fm(i.price)}</td><td>${fm(i.total)}</td></tr>`).join('')}
                    <tr><td colspan="4" style="text-align:left;"><strong>الإجمالي</strong></td><td>${fm(inv.total)}</td></tr>
                    <tr><td colspan="4" style="text-align:left;"><strong>الخصم</strong></td><td>${fm(inv.discount)}</td></tr>
                    <tr style="background:#f9ca24;font-weight:bold;"><td colspan="4" style="text-align:left;"><strong>الصافي</strong></td><td>${fm(inv.net)} ${inv.currency}</td></tr>
                </tbody>
            </table>
            <div style="text-align:center;margin-top:20px;font-family:monospace;">${generateBarcodeText(inv.number)}</div>
            <p style="text-align:center;margin-top:20px;color:#666;">شكراً لتعاملكم معنا - ${DB.settings.company}</p>
        `;
        
        if (mode === 'pdf') {
            let w = window.open('', '_blank', 'width=800,height=600');
            w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${inv.number}</title><style>body{font-family:Tahoma,sans-serif;color:#1a1a2e;padding:1.5cm;}table{border:2px solid #2c3e50;}th{background:#f9ca24;padding:8px;border:1px solid #2c3e50;}td{padding:6px;border:1px solid #2c3e50;}</style></head><body>${html}</body></html>`);
            w.document.close();
            setTimeout(() => w.print(), 500);
        } else {
            $('printPage').innerHTML = html;
            $('printPage').style.display = 'block';
            window.print();
            setTimeout(() => $('printPage').style.display = 'none', 500);
        }
    }

    function checkStockLevels() {
        DB.items.forEach(item => {
            if ((item.qty || 0) <= (item.minStock || 10)) {
                let existing = DB.stockAlerts.find(a => a.itemId === item.id && !a.resolved);
                if (!existing) {
                    DB.stockAlerts.push({ 
                        itemId: item.id, 
                        itemName: item.name, 
                        qty: item.qty, 
                        minStock: item.minStock, 
                        resolved: false, 
                        time: new Date().toISOString() 
                    });
                }
            }
        });
        saveDB();
        updateLowStockBadge();
    }

    // ==================== المشتريات ====================
    function refreshPurchases() {
        $('purSupplier').innerHTML = DB.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        $('purDate').value = new Date().toISOString().split('T')[0];
        $('purchaseItems').innerHTML = '';
        addPurchaseItem();
        calcPurchaseTotal();
        
        $('purchasesTable').innerHTML = `<table><thead><tr><th>رقم</th><th>تاريخ</th><th>مورد</th><th>إجمالي</th></tr></thead><tbody>
            ${DB.purchases.slice(-20).reverse().map(p => `<tr><td>PO-${p.id}</td><td>${p.date}</td><td>${sn(p.supplierId)}</td><td>${fm(p.total)}</td></tr>`).join('')}
        </tbody></table>`;
    }

    function addPurchaseItem() {
        let div = document.createElement('div');
        div.className = 'row';
        div.style.marginTop = '6px';
        div.innerHTML = `
            <div class="col"><select class="form-select pur-item-select">${DB.items.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
            <div class="col"><input type="number" class="form-input pur-qty" value="1" onchange="calcPurchaseTotal()"></div>
            <div class="col"><input type="number" class="form-input pur-price" value="0" step="0.01" onchange="calcPurchaseTotal()"></div>
            <div class="col"><button class="btn btn-danger btn-sm" onclick="this.closest('.row').remove();calcPurchaseTotal();">🗑️</button></div>
        `;
        $('purchaseItems').appendChild(div);
    }

    function calcPurchaseTotal() {
        let total = 0;
        document.querySelectorAll('#purchaseItems .row').forEach(row => {
            total += (parseFloat(row.querySelector('.pur-qty')?.value) || 0) * (parseFloat(row.querySelector('.pur-price')?.value) || 0);
        });
        $('purTotal').value = total.toFixed(2);
    }

    function savePurchase() {
        let items = [];
        document.querySelectorAll('#purchaseItems .row').forEach(row => {
            let sel = row.querySelector('.pur-item-select');
            let qty = parseFloat(row.querySelector('.pur-qty')?.value) || 0;
            let price = parseFloat(row.querySelector('.pur-price')?.value) || 0;
            if (sel && sel.value && qty > 0) {
                let item = DB.items.find(i => i.id === parseInt(sel.value));
                items.push({ itemId: item?.id, itemName: item?.name, qty, price, total: qty * price });
                if (item) item.qty = (item.qty || 0) + qty;
            }
        });
        
        if (items.length === 0) { showToast('❌ أضف صنف واحد على الأقل', 'error'); return; }
        
        let total = parseFloat($('purTotal').value);
        
        DB.purchases.push({
            id: DB.nextId.purchase++,
            date: $('purDate').value,
            supplierId: parseInt($('purSupplier').value),
            items,
            total
        });
        
        if (DB.cashAccounts.length > 0) {
            DB.cashAccounts[0].balance = (DB.cashAccounts[0].balance || 0) - total;
        }
        
        saveDB();
        showToast('✅ تم حفظ أمر الشراء', 'success');
        refreshPurchases();
        refreshDashboard();
        checkStockLevels();
    }

    // ==================== المخزون ====================
    function refreshInventory() {
        let totalValue = DB.items.reduce((s, i) => s + (i.qty||0) * (i.salePrice||0), 0);
        
        $('stockTable').innerHTML = `<table><thead><tr><th>باركود</th><th>الصنف</th><th>الكمية</th><th>الوحدة</th><th>سعر البيع</th><th>سعر الشراء</th><th>القيمة</th><th>الربح المتوقع</th></tr></thead><tbody>
            ${DB.items.map(i => {
                let value = (i.qty||0) * (i.salePrice||0);
                let cost = (i.qty||0) * (i.purchasePrice||0);
                let profit = value - cost;
                return `<tr class="${(i.qty||0) <= (i.minStock||10) ? 'warning-row' : ''}">
                    <td>${i.barcode||'-'}</td>
                    <td>${i.name}</td>
                    <td>${i.qty||0}</td>
                    <td>${i.unit}</td>
                    <td>${fm(i.salePrice||0)}</td>
                    <td>${fm(i.purchasePrice||0)}</td>
                    <td>${fm(value)}</td>
                    <td style="color:${profit>=0?'var(--emerald)':'var(--coral)'};">${fm(profit)}</td>
                </tr>`;
            }).join('') || '<tr><td colspan="8">لا توجد أصناف</td></tr>'}
            <tr style="font-weight:bold;background:rgba(240,192,64,0.1);"><td colspan="6">القيمة الإجمالية للمخزون</td><td colspan="2">${fm(totalValue)}</td></tr>
        </tbody></table>`;
    }

    function addStockItem() {
        let barcode = $('itemBarcode').value || Date.now().toString();
        let item = {
            id: DB.nextId.item++,
            barcode,
            name: $('itemName').value || 'بدون اسم',
            unit: $('itemUnit').value,
            salePrice: parseFloat($('itemSalePrice').value) || 0,
            purchasePrice: parseFloat($('itemPurchasePrice').value) || 0,
            qty: parseInt($('itemInitQty').value) || 0,
            minStock: parseInt($('itemMinStock').value) || 10,
            price: parseFloat($('itemSalePrice').value) || 0
        };
        
        if (DB.settings.enableExpiryDates) {
            item.expiryDate = $('itemExpiry')?.value || null;
        }
        
        DB.items.push(item);
        saveDB();
        showToast('✅ تم حفظ الصنف - باركود: ' + barcode, 'success');
        refreshInventory();
        refreshDashboard();
        
        ['itemBarcode','itemName','itemSalePrice','itemPurchasePrice','itemInitQty'].forEach(id => {
            let el = $(id); if (el) el.value = '';
        });
        $('itemMinStock').value = '10';
    }

    // ==================== العملاء والموردين ====================
    function refreshContacts() {
        $('customersTable').innerHTML = `<table><thead><tr><th>اسم</th><th>هاتف</th><th>باركود</th><th>بريد</th><th>رصيد</th></tr></thead><tbody>
            ${DB.customers.map(c => `<tr><td>${c.name}</td><td>${c.phone||'-'}</td><td>${c.barcode||'-'}</td><td>${c.email||'-'}</td><td style="color:${(c.balance||0)>=0?'var(--emerald)':'var(--coral)'};">${fm(c.balance||0)}</td></tr>`).join('') || '<tr><td colspan="5">لا يوجد عملاء</td></tr>'}
        </tbody></table>`;
        
        $('suppliersTable').innerHTML = `<table><thead><tr><th>اسم</th><th>هاتف</th><th>باركود</th><th>بريد</th></tr></thead><tbody>
            ${DB.suppliers.map(s => `<tr><td>${s.name}</td><td>${s.phone||'-'}</td><td>${s.barcode||'-'}</td><td>${s.email||'-'}</td></tr>`).join('') || '<tr><td colspan="4">لا يوجد موردين</td></tr>'}
        </tbody></table>`;
    }

    function saveContact() {
        let type = $('contactType').value;
        let contact = {
            id: type === 'customer' ? DB.nextId.customer++ : DB.nextId.supplier++,
            name: $('contactName').value || 'بدون اسم',
            phone: $('contactPhone').value,
            email: $('contactEmail').value,
            barcode: $('contactBarcode')?.value || '',
            balance: 0
        };
        
        if (type === 'customer') DB.customers.push(contact);
        else DB.suppliers.push(contact);
        
        saveDB();
        showToast('✅ تم حفظ ' + (type === 'customer' ? 'العميل' : 'المورد') + ' بنجاح', 'success');
        refreshContacts();
        ['contactName','contactPhone','contactEmail','contactBarcode'].forEach(id => {
            let el = $(id); if (el) el.value = '';
        });
    }

    // ==================== الخزينة ====================
    function refreshCash() {
        let totalBalance = DB.cashAccounts.reduce((s, a) => s + (a.balance||0), 0);
        
        $('cashAccountsTable').innerHTML = `<table><thead><tr><th>اسم الحساب</th><th>الرصيد</th><th>إجراءات</th></tr></thead><tbody>
            ${DB.cashAccounts.map(a => `<tr>
                <td>${a.name}</td>
                <td style="color:${(a.balance||0)>=0?'var(--emerald)':'var(--coral)'};">${fm(a.balance||0)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="depositCash(${a.id})">➕ إيداع</button>
                    <button class="btn btn-danger btn-sm" onclick="withdrawCash(${a.id})">➖ سحب</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="3">لا توجد حسابات</td></tr>'}
            <tr style="font-weight:bold;background:rgba(240,192,64,0.1);"><td>الإجمالي</td><td colspan="2">${fm(totalBalance)}</td></tr>
        </tbody></table>`;
    }

    function addCashAccount() {
        let name = prompt('🏦 اسم الحساب النقدي الجديد:');
        if (name && name.trim()) {
            DB.cashAccounts.push({ id: DB.nextId.cash++, name: name.trim(), balance: 0 });
            saveDB();
            refreshCash();
            showToast('✅ تم إضافة الحساب', 'success');
        }
    }

    function depositCash(accountId) {
        let amount = parseFloat(prompt('💰 مبلغ الإيداع:'));
        if (amount && amount > 0) {
            let account = DB.cashAccounts.find(a => a.id === accountId);
            if (account) {
                account.balance = (account.balance || 0) + amount;
                DB.cashTransactions.push({
                    id: DB.nextId.transaction++,
                    accountId,
                    type: 'income',
                    amount,
                    date: new Date().toISOString().split('T')[0],
                    desc: 'إيداع نقدي'
                });
                saveDB();
                refreshCash();
                refreshDashboard();
                showToast('✅ تم الإيداع: ' + fm(amount), 'success');
            }
        }
    }

    function withdrawCash(accountId) {
        let amount = parseFloat(prompt('💸 مبلغ السحب:'));
        if (amount && amount > 0) {
            let account = DB.cashAccounts.find(a => a.id === accountId);
            if (account) {
                account.balance = (account.balance || 0) - amount;
                DB.cashTransactions.push({
                    id: DB.nextId.transaction++,
                    accountId,
                    type: 'expense',
                    amount,
                    date: new Date().toISOString().split('T')[0],
                    desc: 'سحب نقدي'
                });
                saveDB();
                refreshCash();
                refreshDashboard();
                showToast('✅ تم السحب: ' + fm(amount), 'success');
            }
        }
    }

    // ==================== الموظفين ====================
    function refreshEmployees() {
        $('employeesTable').innerHTML = `<table><thead><tr><th>الكود</th><th>الاسم</th><th>القسم</th><th>الراتب الأساسي</th><th>إجمالي المدفوع</th></tr></thead><tbody>
            ${DB.employees.map(e => {
                let totalPaid = DB.salaryPayments.filter(s => s.employeeId === e.id).reduce((sum, s) => sum + (s.net||0), 0);
                return `<tr><td>${e.code||'-'}</td><td>${e.name}</td><td>${e.dept||'-'}</td><td>${fm(e.salary)}</td><td>${fm(totalPaid)}</td></tr>`;
            }).join('') || '<tr><td colspan="5">لا يوجد موظفين</td></tr>'}
        </tbody></table>`;
        
        $('salaryEmp').innerHTML = '<option value="">-- اختر موظف --</option>' + DB.employees.map(e => `<option value="${e.id}">${e.name} (${fm(e.salary)})</option>`).join('');
        $('salaryMonth').value = new Date().toISOString().slice(0, 7);
    }

    function saveEmployee() {
        let emp = {
            id: DB.nextId.employee++,
            code: $('empCode').value || '',
            name: $('empName').value || 'بدون اسم',
            dept: $('empDept').value || '',
            salary: parseFloat($('empSalary').value) || 0
        };
        DB.employees.push(emp);
        saveDB();
        showToast('✅ تم حفظ الموظف', 'success');
        refreshEmployees();
        ['empName','empCode','empDept','empSalary'].forEach(id => {
            let el = $(id); if (el) el.value = '';
        });
    }

    function paySalary() {
        let empId = parseInt($('salaryEmp').value);
        if (!empId) { showToast('❌ اختر موظفاً', 'error'); return; }
        
        let emp = DB.employees.find(e => e.id === empId);
        if (!emp) return;
        
        let month = $('salaryMonth').value;
        let existing = DB.salaryPayments.find(s => s.employeeId === empId && s.month === month);
        if (existing) { showToast('⚠️ تم صرف راتب هذا الشهر مسبقاً', 'error'); return; }
        
        let allowance = parseFloat($('salaryAllow')?.value) || 0;
        let deduction = parseFloat($('salaryDeduct')?.value) || 0;
        let net = emp.salary + allowance - deduction;
        
        DB.salaryPayments.push({ employeeId: empId, month, net, allowance, deduction, date: new Date().toISOString() });
        
        if (DB.cashAccounts.length > 0) {
            DB.cashAccounts[0].balance = (DB.cashAccounts[0].balance || 0) - net;
        }
        
        saveDB();
        showToast('✅ تم صرف راتب ' + emp.name + ': ' + fm(net), 'success');
        
        $('salaryLog').innerHTML = `<table><thead><tr><th>موظف</th><th>شهر</th><th>الراتب</th><th>بدلات</th><th>خصومات</th><th>الصافي</th></tr></thead><tbody>
            ${DB.salaryPayments.slice(-10).reverse().map(s => {
                let e = DB.employees.find(x => x.id === s.employeeId);
                return `<tr><td>${e?.name||'?'}</td><td>${s.month}</td><td>${fm(e?.salary||0)}</td><td>${fm(s.allowance||0)}</td><td>${fm(s.deduction||0)}</td><td style="color:var(--emerald);">${fm(s.net)}</td></tr>`;
            }).join('')}
        </tbody></table>`;
        
        refreshDashboard();
        refreshCash();
    }

    // ==================== الأصول والمشاريع ====================
    function refreshAssets() {
        let totalValue = DB.assets.reduce((s, a) => s + (a.value||0), 0);
        
        $('assetsTable').innerHTML = `<table><thead><tr><th>اسم الأصل</th><th>التصنيف</th><th>الباركود</th><th>القيمة</th><th>الإهلاك %</th><th>القيمة بعد الإهلاك</th></tr></thead><tbody>
            ${DB.assets.map(a => {
                let depreciated = (a.value||0) * (1 - (a.dep||0)/100);
                return `<tr><td>${a.name}</td><td>${a.cat}</td><td>${a.barcode||'-'}</td><td>${fm(a.value||0)}</td><td>${a.dep||10}%</td><td>${fm(depreciated)}</td></tr>`;
            }).join('') || '<tr><td colspan="6">لا توجد أصول</td></tr>'}
            <tr style="font-weight:bold;background:rgba(240,192,64,0.1);"><td colspan="3">إجمالي قيمة الأصول</td><td colspan="3">${fm(totalValue)}</td></tr>
        </tbody></table>`;
    }

    function saveAsset() {
        let asset = {
            id: DB.nextId.asset++,
            name: $('assetName').value || 'بدون اسم',
            cat: $('assetCat').value,
            value: parseFloat($('assetValue').value) || 0,
            dep: parseFloat($('assetDep').value) || 10,
            barcode: $('assetBarcode')?.value || ''
        };
        DB.assets.push(asset);
        saveDB();
        showToast('✅ تم حفظ الأصل', 'success');
        refreshAssets();
        ['assetName','assetValue'].forEach(id => {
            let el = $(id); if (el) el.value = '';
        });
    }

    function refreshProjects() {
        $('projectsTable').innerHTML = `<table><thead><tr><th>المشروع</th><th>الميزانية</th><th>المصروف</th><th>المتبقي</th><th>نسبة الإنجاز</th></tr></thead><tbody>
            ${DB.projects.map(p => {
                let spent = DB.invoices.filter(i => i.projectId === p.id).reduce((s, i) => s + (i.net||0), 0);
                let remaining = (p.budget||0) - spent;
                let progress = (p.budget||0) > 0 ? ((spent / p.budget) * 100).toFixed(1) : 0;
                return `<tr>
                    <td>${p.name}</td><td>${fm(p.budget||0)}</td><td>${fm(spent)}</td>
                    <td style="color:${remaining>=0?'var(--emerald)':'var(--coral)'};">${fm(remaining)}</td>
                    <td>${progress}%</td>
                </tr>`;
            }).join('') || '<tr><td colspan="5">لا توجد مشاريع</td></tr>'}
        </tbody></table>`;
    }

    function saveProject() {
        let name = $('projectName').value;
        if (!name) { showToast('❌ أدخل اسم المشروع', 'error'); return; }
        DB.projects.push({
            id: DB.nextId.project++,
            name,
            budget: parseFloat($('projectBudget').value) || 0
        });
        saveDB();
        showToast('✅ تم حفظ المشروع', 'success');
        refreshProjects();
        $('projectName').value = '';
        $('projectBudget').value = '';
    }

    // ==================== التقارير المالية ====================
    function showTrialBalance() {
        let accs = {};
        let add = (code, name, type) => { 
            if (!accs[code]) accs[code] = { code, name, type, debit: 0, credit: 0 }; 
        };
        
        add('111', 'الصندوق', 'أصول');
        add('112', 'البنك', 'أصول');
        add('12', 'العملاء', 'أصول');
        add('13', 'المخزون', 'أصول');
        add('14', 'الأصول الثابتة', 'أصول');
        add('21', 'الموردين', 'خصوم');
        add('31', 'رأس المال', 'حقوق ملكية');
        add('41', 'المبيعات', 'إيرادات');
        add('51', 'المشتريات', 'مصروفات');
        add('52', 'الرواتب', 'مصروفات');
        add('53', 'مصروفات تشغيلية', 'مصروفات');
        
        DB.invoices.forEach(i => {
            accs['41'].credit += i.net || 0;
            if (i.customerId) accs['12'].debit += i.net || 0;
            else accs['111'].debit += i.net || 0;
        });
        
        DB.purchases.forEach(p => {
            accs['51'].debit += p.total || 0;
            accs['21'].credit += p.total || 0;
        });
        
        DB.salaryPayments.forEach(s => {
            accs['52'].debit += s.net || 0;
            accs['111'].credit += s.net || 0;
        });
        
        DB.cashTransactions.forEach(t => {
            if (t.type === 'income') {
                accs['111'].debit += t.amount || 0;
            } else if (t.type === 'expense') {
                accs['53'].debit += t.amount || 0;
                accs['111'].credit += t.amount || 0;
            }
        });
        
        let invValue = DB.items.reduce((s, i) => s + (i.qty||0) * (i.purchasePrice||0), 0);
        accs['13'].debit = invValue;
        accs['31'].credit += invValue;
        
        let assetValue = DB.assets.reduce((s, a) => s + (a.value||0) * (1 - (a.dep||0)/100), 0);
        accs['14'].debit = assetValue;
        accs['31'].credit += assetValue;
        
        let html = '<table><thead><tr><th>الكود</th><th>الحساب</th><th>النوع</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>';
        let td = 0, tc = 0;
        
        Object.values(accs).forEach(a => {
            let bal = Math.abs(a.debit - a.credit);
            let balType = a.debit > a.credit ? 'مدين' : 'دائن';
            html += `<tr>
                <td>${a.code}</td><td>${a.name}</td><td>${a.type}</td>
                <td>${fm(a.debit)}</td><td>${fm(a.credit)}</td>
                <td style="color:${balType==='مدين'?'var(--sapphire)':'var(--coral)'};">${fm(bal)} ${balType}</td>
            </tr>`;
            td += a.debit;
            tc += a.credit;
        });
        
        html += `<tr style="font-weight:bold;background:rgba(240,192,64,0.1);">
            <td colspan="3">المجموع</td>
            <td>${fm(td)}</td><td>${fm(tc)}</td>
            <td>${fm(Math.abs(td-tc))} ${td>tc?'مدين':'دائن'}</td>
        </tr></tbody></table>`;
        
        $('trialBalanceTable').innerHTML = html;
    }

    function showIncomeStatement() {
        let revenues = DB.invoices.reduce((s, i) => s + (i.net || 0), 0);
        DB.cashTransactions.filter(t => t.type === 'income').forEach(t => revenues += t.amount || 0);
        
        let expenses = DB.purchases.reduce((s, p) => s + (p.total || 0), 0);
        expenses += DB.salaryPayments.reduce((s, sp) => s + (sp.net || 0), 0);
        DB.cashTransactions.filter(t => t.type === 'expense').forEach(t => expenses += t.amount || 0);
        
        let net = revenues - expenses;
        
        $('incomeTable').innerHTML = `<table><thead><tr><th>البيان</th><th>المبلغ</th><th>النسبة</th></tr></thead><tbody>
            <tr><td style="color:var(--emerald);">📈 إجمالي الإيرادات</td><td>${fm(revenues)}</td><td>100%</td></tr>
            <tr><td style="color:var(--coral);">📉 إجمالي المصروفات</td><td>(${fm(expenses)})</td><td>${revenues>0?fm((expenses/revenues)*100):0}%</td></tr>
            <tr style="font-weight:bold;background:${net>=0?'rgba(0,210,160,0.15)':'rgba(255,107,107,0.15)'};">
                <td>${net>=0?'🟢 صافي الربح':'🔴 صافي الخسارة'}</td>
                <td style="color:${net>=0?'var(--emerald)':'var(--coral)'};">${fm(Math.abs(net))}</td>
                <td>${revenues>0?fm((Math.abs(net)/revenues)*100):0}%</td>
            </tr>
        </tbody></table>`;
    }

    function showBalanceSheet() {
        let cashAssets = DB.cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        let invAssets = DB.items.reduce((s, i) => s + (i.qty||0) * (i.purchasePrice||0), 0);
        let fixedAssets = DB.assets.reduce((s, a) => s + (a.value||0) * (1 - (a.dep||0)/100), 0);
        let customerAssets = DB.customers.reduce((s, c) => s + (c.balance||0), 0);
        
        let totalAssets = cashAssets + invAssets + fixedAssets + customerAssets;
        
        let supplierLiab = DB.suppliers.reduce((s, sup) => s + (sup.balance||0), 0);
        let equity = totalAssets - supplierLiab;
        
        $('balanceTable').innerHTML = `<table><thead><tr><th colspan="2">البيان</th><th>المبلغ</th></tr></thead><tbody>
            <tr style="background:rgba(79,172,254,0.1);"><td colspan="2"><strong>💰 الأصول</strong></td><td></td></tr>
            <tr><td></td><td>النقدية والبنوك</td><td>${fm(cashAssets)}</td></tr>
            <tr><td></td><td>المخزون</td><td>${fm(invAssets)}</td></tr>
            <tr><td></td><td>الأصول الثابتة</td><td>${fm(fixedAssets)}</td></tr>
            <tr><td></td><td>ذمم العملاء</td><td>${fm(customerAssets)}</td></tr>
            <tr style="font-weight:bold;"><td colspan="2">إجمالي الأصول</td><td>${fm(totalAssets)}</td></tr>
            
            <tr style="background:rgba(255,107,107,0.1);"><td colspan="2"><strong>📋 الخصوم</strong></td><td></td></tr>
            <tr><td></td><td>ذمم الموردين</td><td>${fm(supplierLiab)}</td></tr>
            <tr style="font-weight:bold;"><td colspan="2">إجمالي الخصوم</td><td>${fm(supplierLiab)}</td></tr>
            
            <tr style="background:rgba(0,210,160,0.1);"><td colspan="2"><strong>💎 حقوق الملكية</strong></td><td></td></tr>
            <tr style="font-weight:bold;color:var(--emerald);"><td colspan="2">صافي حقوق الملكية</td><td>${fm(equity)}</td></tr>
        </tbody></table>`;
    }

    function printReport(type) {
        let title = '', tableHTML = '';
        if (type === 'trial') { title = 'ميزان المراجعة'; tableHTML = $('trialBalanceTable')?.innerHTML || ''; }
        else if (type === 'income') { title = 'قائمة الدخل'; tableHTML = $('incomeTable')?.innerHTML || ''; }
        else { title = 'الميزانية العمومية'; tableHTML = $('balanceTable')?.innerHTML || ''; }
        
        let html = `<div style="text-align:center;"><h1>${DB.settings.company}</h1><h2>${title}</h2></div><table border="1" style="width:100%;border-collapse:collapse;">${tableHTML}</table>
        <p style="text-align:center;margin-top:20px;">تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>`;
        
        $('printPage').innerHTML = html;
        $('printPage').style.display = 'block';
        window.print();
        setTimeout(() => $('printPage').style.display = 'none', 500);
    }

    // ==================== المستخدمين ====================
    function refreshUsers() {
        $('usersTable').innerHTML = `<table><thead><tr><th>المستخدم</th><th>الدور</th><th>القسم</th><th>آخر دخول</th></tr></thead><tbody>
            ${DB.users.map(u => `<tr>
                <td>${u.username}</td>
                <td>${u.role==='admin'?'👑 مدير':'👤 موظف'}</td>
                <td>${u.department||'-'}</td>
                <td>${u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-SA') : '-'}</td>
            </tr>`).join('')}
        </tbody></table>`;
    }

    function addUser() {
        let username = $('newUsername').value.trim();
        let password = $('newPassword').value.trim();
        
        if (!username || !password) { showToast('❌ املأ جميع الحقول', 'error'); return; }
        if (DB.users.find(u => u.username === username)) { showToast('❌ اسم المستخدم موجود مسبقاً', 'error'); return; }
        
        DB.users.push({
            id: DB.nextId.user++,
            username,
            password,
            role: 'employee',
            permissions: {
                dashboard: true, sales: true, purchases: true,
                inventory: true, contacts: true, barcode: true
            },
            department: ''
        });
        saveDB();
        showToast('✅ تم إضافة المستخدم بنجاح', 'success');
        refreshUsers();
        $('newUsername').value = '';
        $('newPassword').value = '';
    }

    // ==================== نسخة من النظام (مركز النسخ الاحتياطية) ====================
    function autoBackup() {
        let backupName = 'نسخة تلقائية - ' + new Date().toLocaleString('ar-SA');
        let backup = {
            id: DB.nextId.backup++,
            name: backupName,
            businessType: DB.settings.businessType || 'general',
            date: new Date().toISOString(),
            type: 'auto',
            data: JSON.parse(JSON.stringify({
                settings: DB.settings,
                items: DB.items,
                itemCategories: DB.itemCategories,
                customers: DB.customers,
                suppliers: DB.suppliers,
                invoices: DB.invoices,
                purchases: DB.purchases,
                cashAccounts: DB.cashAccounts,
                cashTransactions: DB.cashTransactions,
                employees: DB.employees,
                salaryPayments: DB.salaryPayments,
                assets: DB.assets,
                projects: DB.projects,
                barcodeHistory: DB.barcodeHistory
            }))
        };
        
        DB.backups.unshift(backup);
        if (DB.backups.length > 50) DB.backups.splice(50);
        saveDB();
        console.log('✅ نسخ احتياطي تلقائي: ' + backupName);
    }

    function refreshSystemCopy() {
        let html = `
            <div class="card">
                <h2 class="card-title">💿 نسخة من النظام</h2>
                <p style="color:var(--text-secondary);margin-bottom:1.5vw;">أنشئ نسخاً مستقلة من النظام لكل تاجر أو فرع أو موظف. يمكنك استعادتها في أي وقت.</p>
                
                <div class="row">
                    <div class="col">
                        <div class="card backup-card" style="border:2px dashed var(--gold);text-align:center;">
                            <h3 style="color:var(--gold);">➕ إنشاء نسخة جديدة</h3>
                            <div class="form-group"><label class="form-label">اسم النسخة</label>
                            <input class="form-input" id="backupName" placeholder="مثلاً: نسخة تاجر أحمد - فرع الرياض"></div>
                            <div class="form-group"><label class="form-label">نوع المجال التجاري</label>
                            <select class="form-select" id="backupBusinessType">
                                ${Object.entries(BUSINESS_TYPES).map(([k,v]) => `<option value="${k}" ${k===DB.settings.businessType?'selected':''}>${v.icon} ${v.name}</option>`).join('')}
                            </select></div>
                            <div class="form-group"><label class="form-label">ملاحظات</label>
                            <textarea class="form-textarea" id="backupNotes" rows="2" placeholder="ملاحظات إضافية..."></textarea></div>
                            <div class="btn-group">
                                <button class="btn btn-success" onclick="createSystemCopy()">💾 إنشاء نسخة كاملة</button>
                                <button class="btn btn-primary" onclick="createQuickCopy()">⚡ نسخة سريعة</button>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="card backup-card" style="text-align:center;">
                            <h3 style="color:var(--sapphire);">📂 أدوات النسخ</h3>
                            <div class="btn-group" style="flex-direction:column;gap:0.8vw;">
                                <button class="btn btn-primary" onclick="exportAllBackups()">📤 تصدير جميع النسخ</button>
                                <button class="btn btn-warning" onclick="importBackupPrompt()">📥 استيراد نسخة من ملف</button>
                                <button class="btn btn-danger btn-sm" onclick="clearAllBackups()">🗑️ حذف جميع النسخ</button>
                            </div>
                            <div style="margin-top:1vw;">
                                <label class="form-label"><input type="checkbox" id="autoBackupCheck" ${DB.settings.autoBackup?'checked':''} onchange="toggleAutoBackup()"> تفعيل النسخ الاحتياطي التلقائي</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="color:var(--gold);">📋 النسخ المحفوظة (${DB.backups.length})</h3>
                <div class="row" style="margin-top:1vw;">
                    <div class="col"><input type="text" class="form-input" id="backupSearch" placeholder="🔍 بحث في النسخ..." oninput="filterBackups()"></div>
                </div>
                <div id="backupsList" style="margin-top:1vw;">
                    ${renderBackupsList()}
                </div>
            </div>
        `;
        
        $('page-systemCopy').innerHTML = html;
    }

    function renderBackupsList(filter = '') {
        let backups = DB.backups;
        if (filter) {
            let q = filter.toLowerCase();
            backups = backups.filter(b => b.name.toLowerCase().includes(q) || (BUSINESS_TYPES[b.businessType]?.name||'').includes(q));
        }
        
        if (backups.length === 0) {
            return '<div style="text-align:center;padding:2vw;color:var(--text-muted);">لا توجد نسخ محفوظة. قم بإنشاء نسختك الأولى! 🚀</div>';
        }
        
        return backups.map((b, i) => `
            <div class="backup-card">
                <div class="backup-card-header">
                    <span class="backup-card-title">${BUSINESS_TYPES[b.businessType]?.icon||'💾'} ${b.name}</span>
                    <span class="backup-card-date">${new Date(b.date).toLocaleString('ar-SA')}</span>
                </div>
                <div class="backup-card-info">
                    🏪 المجال: ${BUSINESS_TYPES[b.businessType]?.name||'عام'} | 
                    📦 الأصناف: ${b.data?.items?.length||0} | 
                    💰 الفواتير: ${b.data?.invoices?.length||0} |
                    ${b.notes ? '📝 ' + b.notes : ''}
                </div>
                <div class="btn-group" style="margin-top:0.5vw;">
                    <button class="btn btn-primary btn-sm" onclick="restoreSystemCopy(${b.id})" title="استعادة هذه النسخة">🔄 استعادة</button>
                    <button class="btn btn-print btn-sm" onclick="exportSingleBackup(${b.id})" title="تصدير كملف">📤 تصدير</button>
                    <button class="btn btn-barcode btn-sm" onclick="duplicateBackup(${b.id})" title="إنشاء نسخة مطابقة">📋 نسخ</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSystemCopy(${b.id})" title="حذف">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    function filterBackups() {
        let filter = $('backupSearch')?.value || '';
        let listEl = $('backupsList');
        if (listEl) listEl.innerHTML = renderBackupsList(filter);
    }

    function createSystemCopy() {
        let name = $('backupName')?.value.trim();
        if (!name) { showToast('❌ أدخل اسم النسخة', 'error'); return; }
        
        let backup = {
            id: DB.nextId.backup++,
            name,
            businessType: $('backupBusinessType')?.value || 'general',
            notes: $('backupNotes')?.value || '',
            date: new Date().toISOString(),
            type: 'manual',
            data: JSON.parse(JSON.stringify({
                settings: DB.settings,
                items: DB.items,
                itemCategories: DB.itemCategories,
                customers: DB.customers,
                suppliers: DB.suppliers,
                invoices: DB.invoices,
                purchases: DB.purchases,
                cashAccounts: DB.cashAccounts,
                cashTransactions: DB.cashTransactions,
                employees: DB.employees,
                salaryPayments: DB.salaryPayments,
                assets: DB.assets,
                projects: DB.projects,
                barcodeHistory: DB.barcodeHistory,
                stockAlerts: DB.stockAlerts,
                nextId: DB.nextId
            }))
        };
        
        DB.backups.unshift(backup);
        if (DB.backups.length > 50) DB.backups.splice(50);
        saveDB();
        showToast('✅ تم إنشاء النسخة: ' + name, 'success');
        refreshSystemCopy();
        $('backupName').value = '';
        $('backupNotes').value = '';
    }

    function createQuickCopy() {
        let backup = {
            id: DB.nextId.backup++,
            name: 'نسخة سريعة - ' + new Date().toLocaleString('ar-SA'),
            businessType: DB.settings.businessType || 'general',
            date: new Date().toISOString(),
            type: 'quick',
            data: JSON.parse(JSON.stringify({
                settings: DB.settings,
                items: DB.items,
                customers: DB.customers,
                suppliers: DB.suppliers,
                invoices: DB.invoices,
                purchases: DB.purchases,
                cashAccounts: DB.cashAccounts,
                employees: DB.employees
            }))
        };
        
        DB.backups.unshift(backup);
        if (DB.backups.length > 50) DB.backups.splice(50);
        saveDB();
        showToast('⚡ تم إنشاء نسخة سريعة', 'success');
        refreshSystemCopy();
    }

    function restoreSystemCopy(id) {
        let backup = DB.backups.find(b => b.id === id);
        if (!backup) { showToast('❌ النسخة غير موجودة', 'error'); return; }
        
        if (!confirm(`⚠️ هل أنت متأكد من استعادة النسخة "${backup.name}"؟\n\nسيتم استبدال جميع البيانات الحالية بالنسخة المحددة.\n\nتاريخ النسخة: ${new Date(backup.date).toLocaleString('ar-SA')}`)) return;
        
        let currentBackup = {
            id: DB.nextId.backup++,
            name: 'قبل استعادة - ' + backup.name,
            businessType: DB.settings.businessType,
            date: new Date().toISOString(),
            type: 'pre-restore',
            data: JSON.parse(JSON.stringify({
                settings: DB.settings, items: DB.items, customers: DB.customers,
                suppliers: DB.suppliers, invoices: DB.invoices, purchases: DB.purchases,
                cashAccounts: DB.cashAccounts, employees: DB.employees, projects: DB.projects
            }))
        };
        DB.backups.unshift(currentBackup);
        
        if (backup.data.settings) Object.assign(DB.settings, backup.data.settings);
        if (backup.data.items) DB.items = backup.data.items;
        if (backup.data.itemCategories) DB.itemCategories = backup.data.itemCategories;
        if (backup.data.customers) DB.customers = backup.data.customers;
        if (backup.data.suppliers) DB.suppliers = backup.data.suppliers;
        if (backup.data.invoices) DB.invoices = backup.data.invoices;
        if (backup.data.purchases) DB.purchases = backup.data.purchases;
        if (backup.data.cashAccounts) DB.cashAccounts = backup.data.cashAccounts;
        if (backup.data.cashTransactions) DB.cashTransactions = backup.data.cashTransactions;
        if (backup.data.employees) DB.employees = backup.data.employees;
        if (backup.data.salaryPayments) DB.salaryPayments = backup.data.salaryPayments;
        if (backup.data.assets) DB.assets = backup.data.assets;
        if (backup.data.projects) DB.projects = backup.data.projects;
        if (backup.data.nextId) DB.nextId = backup.data.nextId;
        
        DB.settings.businessType = backup.businessType || 'general';
        
        saveDB();
        showToast('✅ تم استعادة النسخة بنجاح', 'success');
        updateUI();
        buildAllPages();
        refreshSystemCopy();
        setTimeout(() => showPage('dashboard'), 300);
    }

    function deleteSystemCopy(id) {
        let backup = DB.backups.find(b => b.id === id);
        if (!backup) return;
        
        if (!confirm(`🗑️ هل أنت متأكد من حذف النسخة "${backup.name}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
        
        DB.backups = DB.backups.filter(b => b.id !== id);
        saveDB();
        showToast('🗑️ تم حذف النسخة', 'info');
        refreshSystemCopy();
    }

  async function exportSingleBackup(id) {
    let backup = DB.backups.find(b => b.id === id);
    if (!backup) return;
    
    // تجهيز بيانات العميل
    let newDB = {
        settings: backup.data.settings || {},
        users: [{ id: 1, username: 'admin', password: '123456', role: 'admin', permissions: { all: true } }],
        currentUser: { id: 1, username: 'admin', password: '123456', role: 'admin', permissions: { all: true } },
        items: backup.data.items || [],
        itemCategories: backup.data.itemCategories || [],
        customers: backup.data.customers || [],
        suppliers: backup.data.suppliers || [],
        invoices: backup.data.invoices || [],
        purchases: backup.data.purchases || [],
        cashAccounts: backup.data.cashAccounts || [],
        cashTransactions: backup.data.cashTransactions || [],
        employees: backup.data.employees || [],
        salaryPayments: backup.data.salaryPayments || [],
        assets: backup.data.assets || [],
        projects: backup.data.projects || [],
        barcodeHistory: backup.data.barcodeHistory || [],
        stockAlerts: backup.data.stockAlerts || [],
        backups: [],
        nextId: backup.data.nextId || { invoice: 1, purchase: 1, item: 1, customer: 1, supplier: 1, cash: 3, employee: 1, asset: 1, project: 1, user: 2, category: 1, transaction: 1, backup: 1 }
    };
    
    let dataStr = JSON.stringify(newDB);
    let newKey = 'erp_' + Date.now();
    let fileName = backup.name.replace(/\s/g, '_') + '.html';
    
    // نجيب محتوى style.css و script.js
    let styleContent = '';
    let scriptContent = '';
    
    try {
        let styleRes = await fetch('style.css');
        if (styleRes.ok) styleContent = '<style>\n' + await styleRes.text() + '\n<\/style>';
    } catch(e) { console.log('ما قدرنا نجيب style.css'); }
    
    try {
        let scriptRes = await fetch('script.js');
        if (scriptRes.ok) scriptContent = await scriptRes.text();
    } catch(e) { console.log('ما قدرنا نجيب script.js'); }
    
    // إذا ما جبنا الملفات، نسخنا اللي في الصفحة الحالية (كخطة بديلة)
    if (!styleContent) {
        document.querySelectorAll('style').forEach(s => styleContent += s.outerHTML + '\n');
    }
    if (!scriptContent) {
        document.querySelectorAll('script:not([src])').forEach(s => {
            if (s.textContent && !s.textContent.includes('eruda')) scriptContent += s.textContent + '\n';
        });
    }
    
    // تجهيز هيكل HTML النهائي
    let fullHTML = '<!DOCTYPE html>\n<html dir="rtl" lang="ar">\n<head>\n';
    fullHTML += '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    fullHTML += '<title>نظام ERP - ' + backup.name + '</title>\n';
    fullHTML += styleContent;
    fullHTML += '\n<script>\nvar DB_KEY = "' + newKey + '";\nvar DB;\n<\/script>\n';
    fullHTML += '</head>\n<body>\n';
    
    // نحضر body نظيف (بدون صفحة دخول)
    let bodyClone = document.body.cloneNode(true);
    bodyClone.querySelectorAll('script[src]').forEach(s => s.remove());
    bodyClone.querySelectorAll('link[href*="style.css"]').forEach(s => s.remove());
    bodyClone.querySelectorAll('#eruda, .__chobitsu-hide__').forEach(s => s.remove());
    bodyClone.querySelectorAll('.toast').forEach(s => s.remove());
    
    let loginOverlay = bodyClone.querySelector('#loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'none';
    let mainHeader = bodyClone.querySelector('#mainHeader');
    if (mainHeader) mainHeader.style.display = 'flex';
    let mainLayout = bodyClone.querySelector('#mainLayout');
    if (mainLayout) mainLayout.style.display = 'flex';
    
    fullHTML += bodyClone.innerHTML;
    
    // نضيف السكربتات والتحميل التلقائي
    fullHTML += '\n<script>\n' + scriptContent + '\n';
    fullHTML += '(function(){\n';
    fullHTML += 'var d=' + JSON.stringify(dataStr) + ';\n';
    fullHTML += 'if(!localStorage.getItem("' + newKey + '")){localStorage.setItem("' + newKey + '",d);}\n';
    fullHTML += 'if(typeof loadDB === "function"){loadDB();}\n';
    fullHTML += 'if(typeof updateUI === "function"){updateUI();}\n';
    fullHTML += 'if(typeof buildAllPages === "function"){buildAllPages();}\n';
    fullHTML += 'if(typeof showPage === "function"){showPage("dashboard");}\n';
    fullHTML += '})();\n';
    fullHTML += '<\/script>\n</body>\n</html>';
    
    // تحميل الملف
    let blob = new Blob([fullHTML], { type: 'text/html;charset=UTF-8' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    
    showToast('✅ تم تصدير نظام ' + backup.name, 'success');
}

    function importBackupPrompt() {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            let file = e.target.files[0];
            if (!file) return;
            
            let reader = new FileReader();
            reader.onload = function(event) {
                try {
                    let data = JSON.parse(event.target.result);
                    
                    if (Array.isArray(data)) {
                        if (!confirm(`📥 تم العثور على ${data.length} نسخة. هل تريد استيرادها جميعاً؟`)) return;
                        data.forEach(b => {
                            if (b.id && b.name && b.data) {
                                b.id = DB.nextId.backup++;
                                DB.backups.unshift(b);
                            }
                        });
                    } else if (data.id && data.name && data.data) {
                        if (!confirm(`📥 استيراد النسخة "${data.name}"؟`)) return;
                        data.id = DB.nextId.backup++;
                        DB.backups.unshift(data);
                    } else {
                        showToast('❌ ملف غير صالح', 'error');
                        return;
                    }
                    
                    if (DB.backups.length > 100) DB.backups.splice(100);
                    saveDB();
                    showToast('📥 تم الاستيراد بنجاح', 'success');
                    refreshSystemCopy();
                } catch(err) {
                    showToast('❌ خطأ في قراءة الملف', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearAllBackups() {
        if (!confirm('⚠️ هل أنت متأكد من حذف جميع النسخ الاحتياطية؟\nهذا الإجراء لا يمكن التراجع عنه!')) return;
        if (!confirm('تأكيد نهائي: حذف جميع النسخ؟')) return;
        
        DB.backups = [];
        saveDB();
        showToast('🗑️ تم حذف جميع النسخ', 'info');
        refreshSystemCopy();
    }

    function toggleAutoBackup() {
        DB.settings.autoBackup = $('autoBackupCheck')?.checked || false;
        saveDB();
        showToast(DB.settings.autoBackup ? '✅ تم تفعيل النسخ التلقائي' : '⏸️ تم إيقاف النسخ التلقائي', 'info');
    }

    // ==================== الإعدادات ====================
    function refreshSettings() {
        $('settingCompany').value = DB.settings.company;
        $('settingPrefix').value = DB.settings.prefix;
        $('settingBusinessType').value = DB.settings.businessType;
        $('settingExpiry').checked = DB.settings.enableExpiryDates;
        $('settingSerial').checked = DB.settings.enableSerialNumbers;
        $('autoBackupCheck').checked = DB.settings.autoBackup;
    }

    function saveSettings() {
        DB.settings.company = $('settingCompany').value || 'شركة التجارة العامة';
        DB.settings.prefix = $('settingPrefix').value || 'INV-';
        DB.settings.businessType = $('settingBusinessType').value;
        DB.settings.enableExpiryDates = $('settingExpiry')?.checked || false;
        DB.settings.enableSerialNumbers = $('settingSerial')?.checked || false;
        DB.settings.autoBackup = $('autoBackupCheck')?.checked || false;
        
        saveDB();
        showToast('✅ تم حفظ الإعدادات', 'success');
        updateUI();
        buildAllPages();
        setTimeout(() => showPage('settings'), 100);
    }

    function resetAll() {
        if (confirm('⚠️ هل أنت متأكد من مسح جميع البيانات؟\nهذا الإجراء لا يمكن التراجع عنه!')) {
            if (confirm('تأكيد نهائي: مسح جميع البيانات؟')) {
                localStorage.removeItem(DB_KEY);
                location.reload();
            }
        }
    }

    // ==================== لوحة التحكم مع الرسوم البيانية ====================
    function refreshDashboard() {
        let today = new Date().toISOString().split('T')[0];
        let todaySales = DB.invoices.filter(i => i.date === today).reduce((s, i) => s + (i.net || 0), 0);
        let todayPurchases = DB.purchases.filter(p => p.date === today).reduce((s, p) => s + (p.total || 0), 0);
        let lowStock = DB.items.filter(i => (i.qty || 0) <= (i.minStock || 10));
        let totalCash = DB.cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        
        $('dashboardStats').innerHTML = `
            <div class="stat-card" onclick="showPage('sales')"><div class="stat-icon">💰</div><div class="stat-value">${fm(todaySales)}</div><div class="stat-label">مبيعات اليوم</div></div>
            <div class="stat-card" onclick="showPage('purchases')"><div class="stat-icon">📥</div><div class="stat-value">${fm(todayPurchases)}</div><div class="stat-label">مشتريات اليوم</div></div>
            <div class="stat-card" onclick="showPage('inventory')"><div class="stat-icon">📦</div><div class="stat-value">${DB.items.length}</div><div class="stat-label">إجمالي الأصناف</div></div>
            <div class="stat-card" onclick="showPage('inventory')"><div class="stat-icon">⚠️</div><div class="stat-value">${lowStock.length}</div><div class="stat-label">أصناف منخفضة</div></div>
            <div class="stat-card" onclick="showPage('contacts')"><div class="stat-icon">👥</div><div class="stat-value">${DB.customers.length}</div><div class="stat-label">العملاء</div></div>
            <div class="stat-card" onclick="showPage('cash')"><div class="stat-icon">💵</div><div class="stat-value">${fm(totalCash)}</div><div class="stat-label">النقدية المتاحة</div></div>
        `;
        
        $('recentActivities').innerHTML = `<table><thead><tr><th>النوع</th><th>الرقم</th><th>التاريخ</th><th>الطرف</th><th>المبلغ</th></tr></thead><tbody>
            ${[...DB.invoices.slice(-3), ...DB.purchases.slice(-3)].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5).map(item => {
                if (item.number) return `<tr><td>💰 فاتورة</td><td>${item.number}</td><td>${item.date}</td><td>${cn(item.customerId)}</td><td style="color:var(--emerald);">${fm(item.net)}</td></tr>`;
                else return `<tr><td>📦 شراء</td><td>PO-${item.id}</td><td>${item.date}</td><td>${sn(item.supplierId)}</td><td style="color:var(--coral);">${fm(item.total)}</td></tr>`;
            }).join('') || '<tr><td colspan="5">لا توجد عمليات حديثة</td></tr>'}
        </tbody></table>`;
        
        setTimeout(() => {
            drawSalesChart();
            drawCustomerChart();
            drawTopItemsChart();
            drawIncomeExpenseChart();
            drawLowStockChart();
            drawCashChart();
        }, 300);
    }

    // ==================== الرسوم البيانية ====================
    function drawChart(canvasId, type, data) {
        let canvas = $(canvasId);
        if (!canvas) return;
        let ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            let y = 25 + (i * (h - 45) / 5);
            ctx.beginPath();
            ctx.moveTo(45, y);
            ctx.lineTo(w - 25, y);
            ctx.stroke();
        }
        
        if (type === 'bar') {
            let { labels, values, colors } = data;
            let maxVal = Math.max(...values, 1);
            let barWidth = (w - 100) / values.length - 12;
            
            values.forEach((val, i) => {
                let x = 55 + i * (barWidth + 12);
                let barHeight = (val / maxVal) * (h - 65);
                let y = h - 25 - barHeight;
                
                let gradient = ctx.createLinearGradient(x, y, x, h - 25);
                gradient.addColorStop(0, colors[i] || '#f0c040');
                gradient.addColorStop(1, 'rgba(240,192,64,0.2)');
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                ctx.moveTo(x + 4, y);
                ctx.lineTo(x + barWidth - 4, y);
                ctx.arcTo(x + barWidth, y, x + barWidth, y + 4, 4);
                ctx.lineTo(x + barWidth, h - 25);
                ctx.lineTo(x, h - 25);
                ctx.lineTo(x, y + 4);
                ctx.arcTo(x, y, x + 4, y, 4);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Tajawal';
                ctx.textAlign = 'center';
                ctx.fillText(fm(val), x + barWidth/2, y - 10);
                
                ctx.fillStyle = '#a0a0b8';
                ctx.font = '9px Tajawal';
                ctx.fillText(labels[i] || '', x + barWidth/2, h - 6);
            });
        } else if (type === 'pie') {
            let { labels, values, colors } = data;
            let total = values.reduce((a, b) => a + b, 0);
            let cx = w / 2, cy = h / 2;
            let radius = Math.min(cx, cy) - 45;
            
            if (total === 0) {
                ctx.fillStyle = '#707088';
                ctx.font = '14px Tajawal';
                ctx.textAlign = 'center';
                ctx.fillText('لا توجد بيانات كافية', cx, cy);
                return;
            }
            
            let startAngle = -Math.PI / 2;
            
            values.forEach((val, i) => {
                let sliceAngle = (val / total) * Math.PI * 2;
                
                ctx.beginPath();
                ctx.moveTo(cx + 2, cy + 2);
                ctx.arc(cx + 2, cy + 2, radius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = colors[i];
                ctx.fill();
                
                ctx.strokeStyle = '#1a1a35';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                let midAngle = startAngle + sliceAngle / 2;
                let percent = ((val / total) * 100).toFixed(1);
                if (parseFloat(percent) > 5) {
                    let lx = cx + Math.cos(midAngle) * (radius * 0.65);
                    let ly = cy + Math.sin(midAngle) * (radius * 0.65);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px Tajawal';
                    ctx.textAlign = 'center';
                    ctx.fillText(percent + '%', lx, ly);
                }
                
                startAngle += sliceAngle;
            });
            
            let legendX = 10, legendY = 15;
            labels.forEach((label, i) => {
                ctx.fillStyle = colors[i];
                ctx.fillRect(legendX, legendY + i * 18, 10, 10);
                ctx.fillStyle = '#a0a0b8';
                ctx.font = '9px Tajawal';
                ctx.textAlign = 'left';
                ctx.fillText(label.substring(0, 12) + ' (' + fm(values[i]) + ')', legendX + 14, legendY + 9 + i * 18);
            });
        }
    }

    function drawSalesChart() {
        let months = [], sales = [];
        let colors = ['#ff6b6b', '#f0932b', '#f0c040', '#00d2a0', '#4facfe', '#9b59b6'];
        
        for (let i = 5; i >= 0; i--) {
            let d = new Date();
            d.setMonth(d.getMonth() - i);
            let mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            months.push(d.toLocaleDateString('ar-SA', { month: 'short' }));
            sales.push(DB.invoices.filter(inv => inv.date.startsWith(mk)).reduce((s, inv) => s + (inv.net || 0), 0));
        }
        
        drawChart('salesChart', 'bar', { labels: months, values: sales, colors });
    }

    function drawCustomerChart() {
        let cs = {};
        DB.invoices.forEach(inv => {
            let n = inv.customerId ? cn(inv.customerId) : 'نقدي';
            cs[n] = (cs[n] || 0) + (inv.net || 0);
        });
        
        let entries = Object.entries(cs).sort((a, b) => b[1] - a[1]).slice(0, 6);
        let colors = ['#ff6b6b', '#4facfe', '#00d2a0', '#f0932b', '#9b59b6', '#f0c040'];
        
        drawChart('customerChart', 'pie', {
            labels: entries.map(e => e[0]),
            values: entries.map(e => e[1]),
            colors: colors.slice(0, entries.length)
        });
    }

    function drawTopItemsChart() {
        let is = {};
        DB.invoices.forEach(inv => {
            inv.items.forEach(i => {
                is[i.itemName] = (is[i.itemName] || 0) + (i.total || 0);
            });
        });
        
        let entries = Object.entries(is).sort((a, b) => b[1] - a[1]).slice(0, 6);
        let colors = ['#f0c040', '#ff6b6b', '#00d2a0', '#4facfe', '#9b59b6', '#f0932b'];
        
        drawChart('topItemsChart', 'bar', {
            labels: entries.map(e => e[0].substring(0, 8)),
            values: entries.map(e => e[1]),
            colors: colors.slice(0, entries.length)
        });
    }

    function drawIncomeExpenseChart() {
        let canvas = $('incomeExpenseChart');
        if (!canvas) return;
        let ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a35';
        ctx.fillRect(0, 0, w, h);
        
        let months = [], inc = [], exp = [];
        for (let i = 5; i >= 0; i--) {
            let d = new Date();
            d.setMonth(d.getMonth() - i);
            let mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            months.push(d.toLocaleDateString('ar-SA', { month: 'short' }));
            inc.push(DB.invoices.filter(inv => inv.date.startsWith(mk)).reduce((s, inv) => s + (inv.net || 0), 0));
            exp.push(DB.purchases.filter(p => p.date.startsWith(mk)).reduce((s, p) => s + (p.total || 0), 0));
        }
        
        let max = Math.max(...inc, ...exp, 1);
        let bw = (w - 120) / months.length / 2 - 6;
        
        months.forEach((m, i) => {
            let x = 55 + i * (bw * 2 + 14);
            let ih = (inc[i] / max) * (h - 65);
            let eh = (exp[i] / max) * (h - 65);
            
            let ig = ctx.createLinearGradient(x, h - 25 - ih, x, h - 25);
            ig.addColorStop(0, '#00d2a0');
            ig.addColorStop(1, 'rgba(0,210,160,0.2)');
            ctx.fillStyle = ig;
            ctx.fillRect(x, h - 25 - ih, bw, ih);
            
            let eg = ctx.createLinearGradient(x + bw + 4, h - 25 - eh, x + bw + 4, h - 25);
            eg.addColorStop(0, '#ff6b6b');
            eg.addColorStop(1, 'rgba(255,107,107,0.2)');
            ctx.fillStyle = eg;
            ctx.fillRect(x + bw + 4, h - 25 - eh, bw, eh);
            
            ctx.fillStyle = '#a0a0b8';
            ctx.font = '8px Tajawal';
            ctx.textAlign = 'center';
            ctx.fillText(m, x + bw + 2, h - 6);
        });
        
        ctx.fillStyle = '#00d2a0';
        ctx.fillRect(w - 90, 12, 10, 10);
        ctx.fillStyle = '#a0a0b8';
        ctx.font = '9px Tajawal';
        ctx.textAlign = 'left';
        ctx.fillText('إيرادات', w - 75, 21);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(w - 90, 32, 10, 10);
        ctx.fillText('مصروفات', w - 75, 41);
    }

    function drawLowStockChart() {
        let low = DB.items.filter(i => (i.qty || 0) <= (i.minStock || 10));
        
        if (low.length === 0) {
            let canvas = $('lowStockChart');
            if (canvas) {
                let ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#1a1a35';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#00d2a0';
                ctx.font = 'bold 14px Tajawal';
                ctx.textAlign = 'center';
                ctx.fillText('✅ جميع الأصناف متوفرة', canvas.width / 2, canvas.height / 2);
            }
            return;
        }
        
        drawChart('lowStockChart', 'bar', {
            labels: low.map(i => i.name.substring(0, 8)),
            values: low.map(i => i.qty || 0),
            colors: low.map((_, i) => ['#ff6b6b', '#f0932b', '#e056a0'][i % 3])
        });
    }

    function drawCashChart() {
        let accs = DB.cashAccounts.slice(0, 6);
        let colors = ['#f0c040', '#00d2a0', '#4facfe', '#9b59b6', '#ff6b6b', '#f0932b'];
        
        drawChart('cashChart', 'pie', {
            labels: accs.length > 0 ? accs.map(a => a.name.substring(0, 10)) : ['لا توجد حسابات'],
            values: accs.length > 0 ? accs.map(a => a.balance || 0) : [1],
            colors: colors.slice(0, Math.max(accs.length, 1))
        });
    }

    // ==================== بناء جميع الصفحات ====================
    function buildAllPages() {
        $('mainContent').innerHTML = `
            <div class="page active" id="page-dashboard">
                <h2 class="card-title">📊 لوحة التحكم - ${BUSINESS_TYPES[DB.settings.businessType]?.icon||'🏪'} ${BUSINESS_TYPES[DB.settings.businessType]?.name||'تجارة عامة'}</h2>
                <div class="stats-grid" id="dashboardStats"></div>
                <div class="charts-container">
                    <div class="chart-card"><h4>📈 المبيعات الشهرية</h4><canvas id="salesChart" width="400" height="200"></canvas></div>
                    <div class="chart-card"><h4>🍩 توزيع المبيعات حسب العملاء</h4><canvas id="customerChart" width="400" height="200"></canvas></div>
                    <div class="chart-card"><h4>📦 أكثر الأصناف مبيعاً</h4><canvas id="topItemsChart" width="400" height="200"></canvas></div>
                    <div class="chart-card"><h4>💰 الإيرادات مقابل المصروفات</h4><canvas id="incomeExpenseChart" width="400" height="200"></canvas></div>
                    <div class="chart-card"><h4>⚠️ المخزون المنخفض</h4><canvas id="lowStockChart" width="400" height="200"></canvas></div>
                    <div class="chart-card"><h4>💵 ملخص النقدية</h4><canvas id="cashChart" width="400" height="200"></canvas></div>
                </div>
                <div class="card"><h3 style="color:var(--gold);">📋 آخر العمليات</h3><div class="table-container" id="recentActivities"></div></div>
            </div>

            <div class="page" id="page-sales">
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('sales','newInvoice')">📝 فاتورة جديدة</div>
                    <div class="tab" onclick="switchTab('sales','invoiceList')">📋 قائمة الفواتير</div>
                </div>
                <div class="tab-content active" id="sales-newInvoice">
                    <div class="card"><h3 style="color:var(--coral);">فاتورة مبيعات جديدة</h3>
                        <div class="barcode-scanner-area">
                            <p style="margin-bottom:8px;">📷 <strong>مسح الباركود بالكاميرا</strong></p>
                            <video class="camera-preview" id="barcodeCamera" autoplay playsinline></video>
                            <input type="text" class="form-input" id="barcodeInput" placeholder="🔍 امسح الباركود هنا أو استخدم الكاميرا..." onchange="scanBarcode()" style="text-align:center;">
                            <button class="btn btn-barcode btn-sm" onclick="toggleBarcodeCamera()" style="margin-top:5px;">📷 تشغيل/إيقاف الكاميرا</button>
                        </div>
                        <div class="row">
                            <div class="col"><div class="form-group"><label class="form-label">رقم الفاتورة</label><input class="form-input" id="invNumber" readonly></div></div>
                            <div class="col"><div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="invDate"></div></div>
                        </div>
                        <div class="row">
                            <div class="col"><div class="form-group"><label class="form-label">العميل</label><select class="form-select" id="invCustomer"></select></div></div>
                            <div class="col"><div class="form-group"><label class="form-label">طريقة الدفع</label><select class="form-select" id="invPayment"><option value="cash">نقدي</option><option value="bank">تحويل</option><option value="credit">آجل</option></select></div></div>
                            <div class="col"><div class="form-group"><label class="form-label">العملة</label><select class="form-select" id="invCurrency" onchange="updateCurrencySymbol()"><option value="YER">﷼ YER</option><option value="SAR">﷼ SAR</option><option value="USD">$ USD</option></select></div></div>
                        </div>
                        <h4 style="color:var(--sapphire);margin-top:1vw;">📋 تفاصيل الفاتورة</h4>
                        <div id="invoiceItems"></div>
                        <button class="btn btn-warning btn-sm" onclick="addInvoiceItem()">➕ إضافة صنف</button>
                        <div class="row" style="margin-top:1vw;">
                            <div class="col"><div class="form-group"><label class="form-label">الإجمالي</label><input class="form-input" id="invTotal" readonly></div></div>
                            <div class="col"><div class="form-group"><label class="form-label">الخصم</label><input type="number" class="form-input" id="invDiscount" value="0" onchange="calcInvoiceTotal()"></div></div>
                            <div class="col"><div class="form-group"><label class="form-label">الصافي <span id="currencySymbol">﷼</span></label><input class="form-input" id="invNet" readonly></div></div>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-success" onclick="saveInvoice()">💾 حفظ الفاتورة</button>
                            <button class="btn btn-print" onclick="printInvoice('printer')">🖨️ طباعة</button>
                            <button class="btn btn-barcode" onclick="generateBarcodeForInvoice()">📱 باركود الفاتورة</button>
                        </div>
                        <div id="barcodePreview" style="margin-top:1vw;"></div>
                    </div>
                </div>
                <div class="tab-content" id="sales-invoiceList">
                    <div class="card"><h3 style="color:var(--coral);">قائمة الفواتير</h3><div class="table-container" id="invoicesTable"></div></div>
                </div>
            </div>

            <div class="page" id="page-purchases">
                <div class="card"><h3 style="color:var(--sapphire);">أمر شراء جديد</h3>
                    <div class="row">
                        <div class="col"><label class="form-label">المورد</label><select class="form-select" id="purSupplier"></select></div>
                        <div class="col"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="purDate"></div>
                    </div>
                    <div id="purchaseItems"></div>
                    <button class="btn btn-warning btn-sm" onclick="addPurchaseItem()">➕ إضافة صنف</button>
                    <div class="row" style="margin-top:1vw;"><div class="col"><label class="form-label">الإجمالي</label><input class="form-input" id="purTotal" readonly></div></div>
                    <button class="btn btn-success" onclick="savePurchase()">💾 حفظ أمر الشراء</button>
                    <div class="table-container" style="margin-top:1vw;" id="purchasesTable"></div>
                </div>
            </div>

            <div class="page" id="page-inventory">
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('inventory','stockList')">📋 الأصناف</div>
                    <div class="tab" onclick="switchTab('inventory','stockAdd')">➕ إضافة صنف</div>
                    <div class="tab" onclick="switchTab('inventory','barcodeInventory')">📷 مسح باركود</div>
                </div>
                <div class="tab-content active" id="inventory-stockList">
                    <div class="card"><h3 style="color:var(--emerald);">المخزون الحالي</h3><div class="table-container" id="stockTable"></div></div>
                </div>
                <div class="tab-content" id="inventory-stockAdd">
                    <div class="card"><h3 style="color:var(--emerald);">إضافة صنف جديد</h3>
                        <div class="row">
                            <div class="col"><label class="form-label">الباركود</label><input class="form-input" id="itemBarcode"></div>
                            <div class="col"><label class="form-label">اسم الصنف</label><input class="form-input" id="itemName"></div>
                        </div>
                        <div class="row">
                            <div class="col"><label class="form-label">سعر البيع</label><input type="number" class="form-input" id="itemSalePrice" step="0.01"></div>
                            <div class="col"><label class="form-label">سعر الشراء</label><input type="number" class="form-input" id="itemPurchasePrice" step="0.01"></div>
                        </div>
                        <div class="row">
                            <div class="col"><label class="form-label">الكمية الافتتاحية</label><input type="number" class="form-input" id="itemInitQty" value="0"></div>
                            <div class="col"><label class="form-label">حد التنبيه</label><input type="number" class="form-input" id="itemMinStock" value="10"></div>
                        </div>
                        <div class="form-group"><label class="form-label">الوحدة</label><select class="form-select" id="itemUnit"><option>قطعة</option><option>كيلو</option><option>كرتون</option><option>متر</option><option>لتر</option></select></div>
                        <button class="btn btn-success" onclick="addStockItem()">💾 حفظ الصنف</button>
                        <button class="btn btn-barcode" onclick="generateBarcodeForItem()" style="margin-right:0.5vw;">📱 توليد باركود</button>
                    </div>
                </div>
                <div class="tab-content" id="inventory-barcodeInventory">
                    <div class="card"><h3 style="color:var(--emerald);">مسح باركود المخزون</h3>
                        <div class="barcode-scanner-area">
                            <video class="camera-preview" id="invCamera" autoplay playsinline></video>
                            <input type="text" class="form-input" id="invBarcodeScan" placeholder="🔍 امسح الباركود..." onchange="scanInventoryBarcode()">
                            <button class="btn btn-barcode btn-sm" onclick="toggleInvCamera()">📷 تشغيل الكاميرا</button>
                        </div>
                        <div id="invScanResult"></div>
                    </div>
                </div>
            </div>

            <div class="page" id="page-contacts">
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('contacts','customerList')">👤 العملاء</div>
                    <div class="tab" onclick="switchTab('contacts','supplierList')">🏭 الموردين</div>
                    <div class="tab" onclick="switchTab('contacts','addContact')">➕ إضافة</div>
                </div>
                <div class="tab-content active" id="contacts-customerList"><div class="card"><h3 style="color:var(--amethyst);">العملاء</h3><div class="table-container" id="customersTable"></div></div></div>
                <div class="tab-content" id="contacts-supplierList"><div class="card"><h3 style="color:var(--amethyst);">الموردين</h3><div class="table-container" id="suppliersTable"></div></div></div>
                <div class="tab-content" id="contacts-addContact">
                    <div class="card"><h3 style="color:var(--amethyst);">إضافة جهة اتصال</h3>
                        <div class="row">
                            <div class="col"><label class="form-label">النوع</label><select class="form-select" id="contactType"><option value="customer">عميل</option><option value="supplier">مورد</option></select></div>
                            <div class="col"><label class="form-label">الاسم</label><input class="form-input" id="contactName"></div>
                        </div>
                        <div class="row">
                            <div class="col"><label class="form-label">الهاتف</label><input class="form-input" id="contactPhone"></div>
                            <div class="col"><label class="form-label">البريد الإلكتروني</label><input type="email" class="form-input" id="contactEmail"></div>
                        </div>
                        <div class="form-group"><label class="form-label">الباركود الخاص</label><input class="form-input" id="contactBarcode" placeholder="اختياري"></div>
                        <button class="btn btn-success" onclick="saveContact()">💾 حفظ</button>
                    </div>
                </div>
            </div>

            <div class="page" id="page-cash">
                <div class="card"><h3 style="color:var(--sunset);">حسابات النقدية والبنوك</h3>
                    <button class="btn btn-primary" onclick="addCashAccount()">➕ إضافة حساب جديد</button>
                    <div class="table-container" style="margin-top:1vw;" id="cashAccountsTable"></div>
                </div>
            </div>

            <div class="page" id="page-employees">
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('employees','empList')">👥 قائمة الموظفين</div>
                    <div class="tab" onclick="switchTab('employees','empAdd')">➕ إضافة موظف</div>
                    <div class="tab" onclick="switchTab('employees','salary')">💰 صرف الرواتب</div>
                </div>
                <div class="tab-content active" id="employees-empList"><div class="card"><h3 style="color:var(--rose);">الموظفين</h3><div class="table-container" id="employeesTable"></div></div></div>
                <div class="tab-content" id="employees-empAdd">
                    <div class="card"><h3 style="color:var(--rose);">إضافة موظف جديد</h3>
                        <div class="row">
                            <div class="col"><label class="form-label">الاسم الكامل</label><input class="form-input" id="empName"></div>
                            <div class="col"><label class="form-label">الرقم الوظيفي (باركود)</label><input class="form-input" id="empCode"></div>
                        </div>
                        <div class="row">
                            <div class="col"><label class="form-label">القسم</label><input class="form-input" id="empDept"></div>
                            <div class="col"><label class="form-label">الراتب الأساسي</label><input type="number" class="form-input" id="empSalary" step="0.01"></div>
                        </div>
                        <button class="btn btn-success" onclick="saveEmployee()">💾 حفظ الموظف</button>
                    </div>
                </div>
                <div class="tab-content" id="employees-salary">
                    <div class="card"><h3 style="color:var(--rose);">صرف راتب شهري</h3>
                        <div class="row">
                            <div class="col"><label class="form-label">الموظف</label><select class="form-select" id="salaryEmp"></select></div>
                            <div class="col"><label class="form-label">الشهر</label><input type="month" class="form-input" id="salaryMonth"></div>
                        </div>
                        <div class="row">
                            <div class="col"><label class="form-label">بدلات</label><input type="number" class="form-input" id="salaryAllow" value="0" step="0.01"></div>
                            <div class="col"><label class="form-label">خصومات</label><input type="number" class="form-input" id="salaryDeduct" value="0" step="0.01"></div>
                        </div>
                        <button class="btn btn-success" onclick="paySalary()">💾 صرف الراتب</button>
                        <div class="table-container" style="margin-top:1vw;" id="salaryLog"></div>
                    </div>
                </div>
            </div>

            <div class="page" id="page-assets">
                <div class="card"><h3 style="color:var(--gold);">الأصول الثابتة</h3>
                    <div class="row">
                        <div class="col"><label class="form-label">اسم الأصل</label><input class="form-input" id="assetName"></div>
                        <div class="col"><label class="form-label">التصنيف</label><select class="form-select" id="assetCat"><option>أثاث</option><option>أجهزة</option><option>عقارات</option><option>سيارات</option></select></div>
                    </div>
                    <div class="row">
                        <div class="col"><label class="form-label">القيمة</label><input type="number" class="form-input" id="assetValue" step="0.01"></div>
                        <div class="col"><label class="form-label">نسبة الإهلاك %</label><input type="number" class="form-input" id="assetDep" value="10"></div>
                    </div>
                    <div class="form-group"><label class="form-label">باركود الأصل</label><input class="form-input" id="assetBarcode" placeholder="اختياري"></div>
                    <button class="btn btn-success" onclick="saveAsset()">💾 حفظ الأصل</button>
                    <div class="table-container" style="margin-top:1vw;" id="assetsTable"></div>
                </div>
            </div>

            <div class="page" id="page-reports">
                <div class="tabs">
                    <div class="tab active" onclick="switchTab('reports','trial')">📊 ميزان المراجعة</div>
                    <div class="tab" onclick="switchTab('reports','income')">📈 قائمة الدخل</div>
                    <div class="tab" onclick="switchTab('reports','balance')">📋 الميزانية العمومية</div>
                </div>
                <div class="tab-content active" id="reports-trial">
                    <div class="card"><h3 style="color:var(--sapphire);">ميزان المراجعة</h3>
                        <div class="btn-group"><button class="btn btn-primary" onclick="showTrialBalance()">🔄 تحديث</button><button class="btn btn-print" onclick="printReport('trial')">🖨️ طباعة</button></div>
                        <div class="table-container" style="margin-top:1vw;" id="trialBalanceTable"></div>
                    </div>
                </div>
                <div class="tab-content" id="reports-income">
                    <div class="card"><h3 style="color:var(--emerald);">قائمة الدخل</h3>
                        <div class="btn-group"><button class="btn btn-primary" onclick="showIncomeStatement()">🔄 تحديث</button><button class="btn btn-print" onclick="printReport('income')">🖨️ طباعة</button></div>
                        <div class="table-container" style="margin-top:1vw;" id="incomeTable"></div>
                    </div>
                </div>
                <div class="tab-content" id="reports-balance">
                    <div class="card"><h3 style="color:var(--amethyst);">الميزانية العمومية</h3>
                        <div class="btn-group"><button class="btn btn-primary" onclick="showBalanceSheet()">🔄 تحديث</button><button class="btn btn-print" onclick="printReport('balance')">🖨️ طباعة</button></div>
                        <div class="table-container" style="margin-top:1vw;" id="balanceTable"></div>
                    </div>
                </div>
            </div>

            <div class="page" id="page-projects">
                <div class="card"><h3 style="color:var(--sunset);">المشاريع</h3>
                    <div class="row">
                        <div class="col"><label class="form-label">اسم المشروع</label><input class="form-input" id="projectName"></div>
                        <div class="col"><label class="form-label">الميزانية</label><input type="number" class="form-input" id="projectBudget" step="0.01"></div>
                    </div>
                    <button class="btn btn-success" onclick="saveProject()">💾 حفظ المشروع</button>
                    <div class="table-container" style="margin-top:1vw;" id="projectsTable"></div>
                </div>
            </div>

            <div class="page" id="page-barcode">
                <div class="card"><h3 style="color:var(--sapphire);">📷 نظام الباركود والماسح الضوئي</h3>
                    <div class="row">
                        <div class="col">
                            <div class="card" style="text-align:center;">
                                <h4>📷 مسح بالكاميرا</h4>
                                <video class="camera-preview" id="globalCamera" autoplay playsinline></video>
                                <button class="btn btn-barcode" onclick="toggleGlobalCamera()">📷 تشغيل الكاميرا</button>
                                <input type="text" class="form-input" id="globalBarcodeScanner" placeholder="🔍 أو اكتب الباركود..." onchange="processGlobalBarcode()" style="margin-top:8px;">
                                <div id="barcodeScanResult"></div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="card" style="text-align:center;">
                                <h4>📱 توليد باركود</h4>
                                <input class="form-input" id="generateBarcodeInput" placeholder="أدخل النص لتوليد الباركود...">
                                <button class="btn btn-barcode" onclick="generateBarcodeFromInput()" style="margin-top:8px;">📱 توليد باركود</button>
                                <button class="btn btn-print" onclick="printGeneratedBarcode()" style="margin-top:8px;">🖨️ طباعة الباركود</button>
                                <div id="generatedBarcode" style="margin-top:10px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="page" id="page-users">
                <div class="card"><h3 style="color:var(--coral);">إدارة المستخدمين</h3>
                    <div class="row">
                        <div class="col"><label class="form-label">اسم المستخدم</label><input class="form-input" id="newUsername"></div>
                        <div class="col"><label class="form-label">كلمة المرور</label><input type="password" class="form-input" id="newPassword"></div>
                    </div>
                    <button class="btn btn-success" onclick="addUser()">💾 حفظ المستخدم</button>
                    <div class="table-container" style="margin-top:1vw;" id="usersTable"></div>
                </div>
            </div>

            <div class="page" id="page-systemCopy">
                <!-- يتم بناؤه ديناميكياً عبر refreshSystemCopy() -->
            </div>

            <div class="page" id="page-settings">
                <div class="card"><h3 style="color:var(--text-muted);">⚙️ الإعدادات العامة</h3>
                    <div class="row">
                        <div class="col"><label class="form-label">اسم الشركة</label><input class="form-input" id="settingCompany"></div>
                        <div class="col"><label class="form-label">بادئة الفواتير</label><input class="form-input" id="settingPrefix"></div>
                    </div>
                    <div class="row">
                        <div class="col"><label class="form-label">نوع المجال التجاري</label><select class="form-select" id="settingBusinessType">
                            ${Object.entries(BUSINESS_TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${v.name}</option>`).join('')}
                        </select></div>
                    </div>
                    <div class="row">
                        <div class="col"><label class="form-label"><input type="checkbox" id="settingExpiry" onchange="DB.settings.enableExpiryDates=this.checked;saveDB();"> تفعيل تواريخ الصلاحية (للمواد الغذائية والصيدليات)</label></div>
                        <div class="col"><label class="form-label"><input type="checkbox" id="settingSerial" onchange="DB.settings.enableSerialNumbers=this.checked;saveDB();"> تفعيل الأرقام التسلسلية (للأجهزة الإلكترونية)</label></div>
                    </div>
                    <div class="row">
                        <div class="col"><label class="form-label"><input type="checkbox" id="autoBackupCheck" onchange="toggleAutoBackup()"> تفعيل النسخ الاحتياطي التلقائي عند الدخول والخروج</label></div>
                    </div>
                    <button class="btn btn-success" onclick="saveSettings()">💾 حفظ الإعدادات</button>
                    <button class="btn btn-danger" onclick="resetAll()" style="margin-top:1.5vw;">🗑️ مسح جميع البيانات</button>
                </div>
            </div>
        `;
    }

    // ==================== بدء التشغيل ====================
    console.log('🟢 بدء تحميل نظام ERP المتكامل...');
    loadDB();
    console.log('📦 قاعدة البيانات:', DB ? 'تم التحميل بنجاح' : 'فشل التحميل');

    if (DB && DB.currentUser) {
        console.log('👤 مستخدم مسجل:', DB.currentUser.username);
        $('loginOverlay').style.display = 'none';
        $('mainHeader').style.display = 'flex';
        $('mainLayout').style.display = 'flex';
        updateUI();
        buildAllPages();
        showPage('dashboard');
        checkStockLevels();
        
        if (DB.settings.autoBackup && DB.currentUser.role === 'admin') {
            autoBackup();
        }
    } else {
        console.log('👋 في انتظار تسجيل الدخول...');
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            let sidebar = $('sidebar');
            let menuBtn = document.querySelector('.mobile-menu-btn');
            if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            let activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id.includes('sales') && document.querySelector('#sales-newInvoice.active')) {
                    saveInvoice();
                } else if (activePage.id.includes('purchases')) {
                    savePurchase();
                }
            }
        }
        
        if (e.key === 'Escape') {
            closeMobileMenu();
            stopCamera();
        }
        
        if (e.key === 'F5') {
            e.preventDefault();
            let activePage = document.querySelector('.page.active');
            if (activePage) {
                let pageName = activePage.id.replace('page-', '');
                showPage(pageName);
                showToast('🔄 تم تحديث الصفحة', 'info');
            }
        }
    });

    console.log('💎 نظام ERP متكامل v4.0 جاهز للاستخدام');
    console.log('📊 6 رسوم بيانية | 📷 كاميرا باركود | 💿 نسخ احتياطية متعددة');
    console.log('🏪 يدعم 10 مجالات تجارية | 👑 المدير: Motsam');
    console.log('✅ جميع الميزات مفعلة وجاهزة');
    