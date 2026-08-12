const DB_NAME='maghraby_store_db', DB_VER=1;
let db, state={page:'dashboard',cart:[]};

const navItems=[
 ['dashboard','🏠','الرئيسية'],['sale','🛒','المبيعات'],['repair','🔧','الصيانة'],
 ['inventory','📦','المخزون'],['purchases','🛍️','المشتريات'],['customers','👥','العملاء'],
 ['staff','👨‍🔧','الفنيين والموظفين'],['cash','💰','الخزنة'],['expenses','💸','المصروفات'],
 ['needs','📋','الاحتياجات'],['reports','📊','التقارير والأرباح'],['invoices','🧾','الفواتير']
];
const seedProducts=[
 {id:'p1',name:'PS5 Disc',cat:'أجهزة',emoji:'🎮',price:25000,cost:21000,stock:2,min:1},
 {id:'p2',name:'PS5 Digital',cat:'أجهزة',emoji:'🎮',price:23000,cost:19500,stock:1,min:1},
 {id:'p3',name:'PS4 Slim',cat:'أجهزة',emoji:'🎮',price:9000,cost:7500,stock:3,min:1},
 {id:'p4',name:'DualSense',cat:'دراعات',emoji:'🕹️',price:3400,cost:2800,stock:5,min:2},
 {id:'p5',name:'DualShock 4',cat:'دراعات',emoji:'🕹️',price:2400,cost:1900,stock:4,min:2},
 {id:'p6',name:'HDMI Cable',cat:'إكسسوارات',emoji:'🔌',price:250,cost:120,stock:8,min:3},
 {id:'p7',name:'شنطة جهاز',cat:'شنط',emoji:'🎒',price:700,cost:450,stock:3,min:1},
 {id:'p8',name:'تنزيل ألعاب',cat:'خدمات',emoji:'💾',price:300,cost:30,stock:999,min:0},
 {id:'p9',name:'تحديث سوفتوير',cat:'خدمات',emoji:'⚙️',price:250,cost:20,stock:999,min:0},
 {id:'p10',name:'تعديل جهاز',cat:'خدمات',emoji:'🛠️',price:600,cost:80,stock:999,min:0}
];

function openDB(){
 return new Promise((res,rej)=>{
  const r=indexedDB.open(DB_NAME,DB_VER);
  r.onupgradeneeded=()=>{db=r.result;
   ['products','sales','repairs','cash','expenses','purchases','customers','staff','invoices','settings'].forEach(s=>{if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'});});
  };
  r.onsuccess=()=>{db=r.result;res(db)}; r.onerror=()=>rej(r.error);
 });
}
function all(store){return new Promise((res,rej)=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error)})}
function put(store,obj){return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).put(obj);q.onsuccess=()=>res(obj);q.onerror=()=>rej(q.error)})}
function del(store,id){return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).delete(id);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}
const id=()=>crypto.randomUUID();
const money=n=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(Number(n)||0)+' ج';
const dateNow=()=>new Date().toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'});
const today=()=>new Date().toISOString().slice(0,10);

async function init(){
 await openDB();
 const ps=await all('products'); if(!ps.length) for(const p of seedProducts) await put('products',p);
 renderNav(); render(); clock();
 if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
 document.getElementById('menuBtn').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
 document.getElementById('closeModal').onclick=closeModal;
 document.getElementById('backupBtn').onclick=backup;
}
function renderNav(){document.getElementById('nav').innerHTML=navItems.map(([p,i,t])=>`<button class="nav-btn ${state.page===p?'active':''}" data-page="${p}">${i} ${t}</button>`).join('')+
'<button class="nav-btn" data-page="settings">⚙️ الإعدادات</button>';document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render()})}
async function render(){
 renderNav();
 const item=navItems.find(x=>x[0]===state.page); document.getElementById('pageTitle').textContent=item?item[2]:'الإعدادات';
 const c=document.getElementById('content');
 if(state.page==='dashboard') return dashboard(c);
 if(state.page==='sale') return sale(c);
 if(state.page==='repair') return repairs(c);
 if(state.page==='inventory') return inventory(c);
 if(state.page==='purchases') return purchases(c);
 if(state.page==='cash') return cash(c);
 if(state.page==='expenses') return expenses(c);
 if(state.page==='needs') return needs(c);
 if(state.page==='reports') return reports(c);
 if(state.page==='customers') return simpleList(c,'customers','العملاء',['الاسم','الهاتف']);
 if(state.page==='staff') return simpleList(c,'staff','الفنيين والموظفين',['الاسم','الدور']);
 if(state.page==='invoices') return invoices(c);
 if(state.page==='settings') return settings(c);
}
async function dashboard(c){
 const [sales,repairs,exp,cash,products]=await Promise.all([all('sales'),all('repairs'),all('expenses'),all('cash'),all('products')]);
 const daySales=sales.filter(x=>x.date?.slice(0,10)===today()).reduce((a,x)=>a+x.total,0);
 const dayExp=exp.filter(x=>x.date?.slice(0,10)===today()).reduce((a,x)=>a+x.amount,0);
 const pending=repairs.filter(x=>x.status!=='تم التسليم').length;
 const low=products.filter(x=>x.stock<=x.min).length;
 const net=cash.filter(x=>x.date?.slice(0,10)===today()).reduce((a,x)=>a+(x.type==='in'?x.amount:-x.amount),0);
 c.innerHTML=`<div class="grid stats">
 <div class="card stat"><div class="label">💰 مبيعات اليوم</div><div class="value">${money(daySales)}</div><div class="hint">من عمليات البيع المسجلة</div></div>
 <div class="card stat"><div class="label">💸 خرج اليوم</div><div class="value">${money(dayExp)}</div><div class="hint">مصروفات اليوم</div></div>
 <div class="card stat"><div class="label">🔧 صيانة معلقة</div><div class="value">${pending}</div><div class="hint">أجهزة لم تُسلّم</div></div>
 <div class="card stat"><div class="label">📈 حركة الخزنة</div><div class="value">${money(net)}</div><div class="hint">دخل ناقص خرج</div></div></div>
 <div class="section-head"><h2>اختصارات سريعة</h2></div>
 <div class="actions">
  <button class="btn primary" onclick="state.page='sale';render()">🛒 بيع جديد</button>
  <button class="btn green" onclick="state.page='repair';render()">🔧 استلام صيانة</button>
  <button class="btn" onclick="openCashModal('in')">💵 دخل سريع</button>
  <button class="btn" onclick="openCashModal('out')">💸 خرج سريع</button>
 </div>
 <div class="section-head"><h2>تنبيهات</h2></div>
 <div class="grid two">
  <div class="card"><strong>🔴 أجهزة الصيانة</strong><p>${pending?`لديك ${pending} جهاز يحتاج متابعة أو تسليم.`:'لا توجد أجهزة معلقة.'}</p></div>
  <div class="card"><strong>📦 المخزون</strong><p>${low?`لديك ${low} منتجات عند الحد الأدنى أو أقل.`:'المخزون الأساسي تمام.'}</p></div>
 </div>`;
}
async function sale(c){
 const products=await all('products'); const cats=[...new Set(products.map(p=>p.cat))];
 const filtered=state.saleCat?products.filter(p=>p.cat===state.saleCat):products;
 c.innerHTML=`<div class="actions" style="margin-bottom:12px">${cats.map(x=>`<button class="btn ${state.saleCat===x?'primary':''}" onclick="state.saleCat='${x}';render()"> ${x}</button>`).join('')}<button class="btn" onclick="state.saleCat=null;render()">الكل</button></div>
 <div class="grid two">
 <div class="card"><input class="search" id="prodSearch" placeholder="🔎 بحث سريع عن منتج..." oninput="filterSale(this.value)">
 <div id="prodGrid" class="product-grid">${filtered.map(p=>productButton(p)).join('')}</div></div>
 <div class="card cart"><h2 style="margin-top:0">🧺 السلة</h2><div id="cart" class="cart-list">${cartHTML()}</div>
 <div class="actions"><button class="btn" onclick="clearCart()">تفريغ</button><button class="btn" onclick="discountModal()">➖ خصم</button><button class="btn primary" onclick="checkout()">💾 حفظ البيع</button></div></div></div>`;
}
function productButton(p){return `<button class="product-btn" onclick="addCart('${p.id}')"><span class="emoji">${p.emoji}</span><strong>${p.name}</strong><small>${money(p.price)} · ${p.stock>100?'خدمة':'متاح '+p.stock}</small></button>`}
function filterSale(v){all('products').then(ps=>{const arr=ps.filter(p=>(!state.saleCat||p.cat===state.saleCat)&&p.name.includes(v));document.getElementById('prodGrid').innerHTML=arr.map(productButton).join('')})}
function addCart(pid){all('products').then(ps=>{const p=ps.find(x=>x.id===pid);if(!p)return;if(p.stock<=0)return toast('المنتج غير متوفر');const x=state.cart.find(x=>x.id===pid);if(x)x.qty++;else state.cart.push({id:p.id,name:p.name,price:p.price,cost:p.cost,qty:1});render()})}
function cartHTML(){if(!state.cart.length)return '<div class="empty">السلة فاضية<br>اضغط على المنتج لإضافته</div>';const sub=state.cart.reduce((a,x)=>a+x.price*x.qty,0);const d=state.discount||0;return state.cart.map((x,i)=>`<div class="cart-row"><div><strong>${x.name}</strong><br><small>${money(x.price)}</small></div><div class="qty"><button onclick="changeQty(${i},-1)">−</button>${x.qty}<button onclick="changeQty(${i},1)">+</button></div><strong>${money(x.price*x.qty)}</strong></div>`).join('')+`<div class="total"><span>الإجمالي بعد الخصم</span><span>${money(Math.max(0,sub-d))}</span></div>`}
function changeQty(i,d){state.cart[i].qty+=d;if(state.cart[i].qty<=0)state.cart.splice(i,1);render()}
function clearCart(){state.cart=[];state.discount=0;render()}
function discountModal(){openModal('الخصم',`<div class="actions"><button class="btn" onclick="setDiscount(5)">5%</button><button class="btn" onclick="setDiscount(10)">10%</button><button class="btn" onclick="setDiscount(15)">15%</button><button class="btn" onclick="setDiscount(0)">بدون خصم</button></div><div style="margin-top:12px"><label>مبلغ مخصص<input id="customDiscount" type="number" min="0" placeholder="اختياري"></label><button class="btn primary" style="margin-top:10px" onclick="setCustomDiscount()">تطبيق</button></div>`)}
function setDiscount(p){const sub=state.cart.reduce((a,x)=>a+x.price*x.qty,0);state.discount=Math.round(sub*p/100);closeModal();render()}
function setCustomDiscount(){state.discount=Number(document.getElementById('customDiscount').value)||0;closeModal();render()}
async function checkout(){if(!state.cart.length)return toast('السلة فاضية');const sub=state.cart.reduce((a,x)=>a+x.price*x.qty,0),d=state.discount||0,total=Math.max(0,sub-d), inv={id:id(),date:new Date().toISOString(),items:state.cart,subtotal:sub,discount:d,total};await put('sales',inv);await put('invoices',{id:inv.id,date:inv.date,type:'بيع',total:inv.total,ref:inv.id});await put('cash',{id:id(),date:inv.date,type:'in',amount:total,reason:'بيع',ref:inv.id});for(const x of state.cart){const p=(await all('products')).find(p=>p.id===x.id);if(p&&p.stock<100)p.stock-=x.qty;if(p)await put('products',p)}state.cart=[];state.discount=0;toast('تم حفظ البيع');render()}
async function repairs(c){const rs=await all('repairs');c.innerHTML=`<div class="section-head"><h2>الأجهزة المستلمة</h2><button class="btn green" onclick="repairModal()">＋ استلام جهاز</button></div><div class="card table-wrap"><table class="table"><thead><tr><th>رقم</th><th>العميل</th><th>الجهاز</th><th>العطل</th><th>منذ</th><th>الحالة</th><th></th></tr></thead><tbody>${rs.length?rs.map(r=>`<tr><td>${r.id.slice(0,8)}</td><td>${r.customer}</td><td>${r.device}</td><td>${r.fault}</td><td>${days(r.date)} يوم</td><td><span class="badge ${r.status==='تم التسليم'?'green':r.status==='جاهز'?'yellow':'red'}">${r.status}</span></td><td>${r.status!=='تم التسليم'?`<button class="btn green" onclick="deliverRepair('${r.id}')">تسليم</button>`:''}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">لا توجد أجهزة</td></tr>'}</tbody></table></div>`}
function days(d){return Math.max(0,Math.floor((Date.now()-new Date(d))/86400000))}
function repairModal(){openModal('استلام جهاز صيانة',`<div class="form-grid">
<label>اسم العميل<input id="rc" placeholder="أحمد"></label>
<label>رقم الهاتف<input id="rp" placeholder="اختياري"></label>
<label>نوع الجهاز<select id="rd"><option>PS5</option><option>PS4</option><option>PS4 Pro</option><option>PS3</option><option>Xbox</option><option>أخرى</option></select></label>
<label>العطل<input id="rf" placeholder="اختر/اكتب العطل"></label>
<label>ملاحظة<textarea id="rn" placeholder="حالة الجهاز أو الملحقات..."></textarea></label>
</div><button class="btn primary" style="margin-top:12px" onclick="saveRepair()">حفظ الاستلام</button>`)}
async function saveRepair(){const r={id:id(),date:new Date().toISOString(),customer:val('rc'),phone:val('rp'),device:val('rd'),fault:val('rf'),note:val('rn'),status:'تحت الفحص'};if(!r.customer||!r.fault)return toast('اكتب اسم العميل والعطل');await put('repairs',r);closeModal();toast('تم استلام الجهاز');render()}
async function deliverRepair(rid){const r=(await all('repairs')).find(x=>x.id===rid);openModal('تسليم الجهاز',`<p><strong>${r.customer}</strong> — ${r.device}</p><div class="form-grid"><label>الخدمة<select id="service"><option>صيانة عامة</option><option>سوكت HDMI</option><option>بوردة</option><option>Power</option><option>سوفتوير</option></select></label><label>المبلغ<input id="repairAmount" type="number" value="0"></label><label>ملاحظة<textarea id="repairNote">${r.note||''}</textarea></label></div><button class="btn green" style="margin-top:12px" onclick="finishRepair('${rid}')">✅ تم التسليم والتحصيل</button>`)}
async function finishRepair(rid){const rs=await all('repairs'),r=rs.find(x=>x.id===rid),amount=Number(val('repairAmount'))||0;r.status='تم التسليم';r.deliveredAt=new Date().toISOString();r.service=val('service');r.amount=amount;r.note=val('repairNote');await put('repairs',r);if(amount){await put('cash',{id:id(),date:new Date().toISOString(),type:'in',amount,reason:`صيانة ${r.device} - ${r.customer}`,ref:r.id});await put('invoices',{id:id(),date:new Date().toISOString(),type:'صيانة',total:amount,ref:r.id})}closeModal();toast('تم تسليم الجهاز وتسجيل العملية');render()}
async function inventory(c){const ps=await all('products');c.innerHTML=`<div class="section-head"><h2>المنتجات والمخزون</h2><button class="btn primary" onclick="productModal()">＋ منتج</button></div><div class="card table-wrap"><table class="table"><thead><tr><th>المنتج</th><th>القسم</th><th>شراء</th><th>بيع</th><th>الكمية</th><th>الحد الأدنى</th></tr></thead><tbody>${ps.map(p=>`<tr><td>${p.emoji} ${p.name}</td><td>${p.cat}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><span class="badge ${p.stock<=p.min?'red':'green'}">${p.stock>100?'خدمة':p.stock}</span></td><td>${p.min}</td></tr>`).join('')}</tbody></table></div>`}
function productModal(){openModal('إضافة منتج',`<div class="form-grid"><label>الاسم<input id="pn"></label><label>القسم<input id="pc" placeholder="أجهزة / دراعات / إكسسوارات"></label><label>الإيموجي<input id="pe" value="📦"></label><label>سعر البيع<input id="pp" type="number"></label><label>التكلفة<input id="pk" type="number"></label><label>الكمية<input id="pq" type="number" value="0"></label><label>الحد الأدنى<input id="pm" type="number" value="1"></label></div><button class="btn primary" style="margin-top:12px" onclick="saveProduct()">حفظ</button>`)}
async function saveProduct(){const p={id:id(),name:val('pn'),cat:val('pc')||'أخرى',emoji:val('pe')||'📦',price:Number(val('pp'))||0,cost:Number(val('pk'))||0,stock:Number(val('pq'))||0,min:Number(val('pm'))||0};if(!p.name)return toast('اكتب اسم المنتج');await put('products',p);closeModal();render()}
async function purchases(c){c.innerHTML=`<div class="card"><h2>🛍️ المشتريات</h2><p>أضف شراء بضاعة وسيتم تسجيله كخرج وزيادة المخزون.</p><button class="btn primary" onclick="purchaseModal()">＋ تسجيل مشتريات</button></div>`}
function purchaseModal(){openModal('تسجيل مشتريات',`<div class="form-grid"><label>المنتج<input id="buyName"></label><label>الكمية<input id="buyQty" type="number" value="1"></label><label>إجمالي التكلفة<input id="buyAmount" type="number"></label><label>ملاحظة<textarea id="buyNote"></textarea></label></div><button class="btn primary" style="margin-top:12px" onclick="savePurchase()">حفظ</button>`)}
async function savePurchase(){const amount=Number(val('buyAmount'))||0,q=Number(val('buyQty'))||1;const p={id:id(),date:new Date().toISOString(),name:val('buyName'),qty:q,amount,note:val('buyNote')};await put('purchases',p);await put('cash',{id:id(),date:p.date,type:'out',amount,reason:'شراء بضاعة',ref:p.id});closeModal();toast('تم تسجيل المشتريات');render()}
async function cash(c){const rows=await all('cash');const ins=rows.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount,0),outs=rows.filter(x=>x.type==='out').reduce((a,x)=>a+x.amount,0);c.innerHTML=`<div class="grid stats"><div class="card stat"><div class="label">🟢 إجمالي الدخل</div><div class="value">${money(ins)}</div></div><div class="card stat"><div class="label">🔴 إجمالي الخرج</div><div class="value">${money(outs)}</div></div><div class="card stat"><div class="label">💰 صافي الحركة</div><div class="value">${money(ins-outs)}</div></div><div class="card stat"><div class="label">عدد الحركات</div><div class="value">${rows.length}</div></div></div><div class="section-head"><h2>حركة الخزنة</h2><div class="actions"><button class="btn green" onclick="openCashModal('in')">＋ دخل</button><button class="btn danger" onclick="openCashModal('out')">＋ خرج</button></div></div><div class="card table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>دخل</th><th>خرج</th></tr></thead><tbody>${rows.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<tr><td>${new Date(x.date).toLocaleString('ar-EG')}</td><td>${x.reason}</td><td>${x.type==='in'?money(x.amount):'—'}</td><td>${x.type==='out'?money(x.amount):'—'}</td></tr>`).join('')}</tbody></table></div>`}
function openCashModal(type){openModal(type==='in'?'دخل سريع':'خرج سريع',`<div class="form-grid"><label>المبلغ<input id="cashAmount" type="number"></label><label>البيان<select id="cashReason"><option>${type==='in'?'دخل آخر':'سلفة موظف'}</option><option>${type==='in'?'تحصيل':'مشتريات'}</option><option>${type==='in'?'استرداد':'إيجار'}</option><option>${type==='in'?'أخرى':'كهرباء'}</option><option>${type==='in'?'':'مياه'}</option></select></label><label>ملاحظة<textarea id="cashNote"></textarea></label></div><button class="btn ${type==='in'?'green':'danger'}" style="margin-top:12px" onclick="saveCash('${type}')">حفظ</button>`)}
async function saveCash(type){const amount=Number(val('cashAmount'))||0;if(!amount)return toast('اكتب المبلغ');await put('cash',{id:id(),date:new Date().toISOString(),type,amount,reason:val('cashReason')||'أخرى',note:val('cashNote')});closeModal();toast('تم حفظ الحركة');render()}
async function expenses(c){const xs=await all('expenses');c.innerHTML=`<div class="section-head"><h2>المصروفات</h2><button class="btn danger" onclick="expenseModal()">＋ مصروف</button></div><div class="card table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>${xs.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<tr><td>${new Date(x.date).toLocaleString('ar-EG')}</td><td>${x.type}</td><td>${money(x.amount)}</td><td>${x.note||''}</td></tr>`).join('')}</tbody></table></div>`}
function expenseModal(){openModal('إضافة مصروف',`<div class="form-grid"><label>النوع<select id="et"><option>إيجار</option><option>كهرباء</option><option>مياه</option><option>إنترنت</option><option>أجور</option><option>نقل</option><option>أخرى</option></select></label><label>المبلغ<input id="ea" type="number"></label><label>ملاحظة<textarea id="en"></textarea></label></div><button class="btn danger" style="margin-top:12px" onclick="saveExpense()">حفظ</button>`)}
async function saveExpense(){const x={id:id(),date:new Date().toISOString(),type:val('et'),amount:Number(val('ea'))||0,note:val('en')};await put('expenses',x);await put('cash',{id:id(),date:x.date,type:'out',amount:x.amount,reason:x.type,ref:x.id});closeModal();toast('تم تسجيل المصروف');render()}
async function needs(c){const ps=await all('products'),low=ps.filter(p=>p.stock<=p.min);c.innerHTML=`<div class="section-head"><h2>📋 الاحتياجات</h2></div><div class="card">${low.length?low.map(p=>`<div class="cart-row"><div><strong>${p.emoji} ${p.name}</strong><br><small>الموجود: ${p.stock} — الحد الأدنى: ${p.min}</small></div><button class="btn" onclick="toast('تم تعليم ${p.name} كمطلوب')">مطلوب</button></div>`).join(''):'<div class="empty">مفيش احتياجات عاجلة 🎉</div>'}</div>`}
async function reports(c){const [sales,exp,cash,rep]=await Promise.all([all('sales'),all('expenses'),all('cash'),all('repairs')]);const revenue=sales.reduce((a,s)=>a+s.total,0)+rep.filter(r=>r.status==='تم التسليم').reduce((a,r)=>a+(r.amount||0),0);const cost=sales.reduce((a,s)=>a+s.items.reduce((z,x)=>z+x.cost*x.qty,0),0);const expense=exp.reduce((a,x)=>a+x.amount,0);c.innerHTML=`<div class="grid stats"><div class="card stat"><div class="label">الإيرادات</div><div class="value">${money(revenue)}</div></div><div class="card stat"><div class="label">تكلفة البضاعة المباعة</div><div class="value">${money(cost)}</div></div><div class="card stat"><div class="label">المصروفات</div><div class="value">${money(expense)}</div></div><div class="card stat"><div class="label">صافي الربح التقريبي</div><div class="value">${money(revenue-cost-expense)}</div></div></div><div class="section-head"><h2>ملاحظة</h2></div><div class="card">الربح هنا يعتمد على تكلفة المنتجات المسجلة. الخدمات والصيانة يمكن تطوير تكلفتها وأجرة الفني بشكل أدق في المرحلة التالية.</div>`}
async function simpleList(c,store,title,fields){const rows=await all(store);c.innerHTML=`<div class="section-head"><h2>${title}</h2><button class="btn primary" onclick="simpleModal('${store}','${title}')">＋ إضافة</button></div><div class="card table-wrap"><table class="table"><thead><tr>${fields.map(f=>`<th>${f}</th>`).join('')}<th>ملاحظات</th></tr></thead><tbody>${rows.map(r=>`<tr>${fields.map((f,i)=>`<td>${Object.values(r)[i]||''}</td>`).join('')}<td>${r.note||''}</td></tr>`).join('')}</tbody></table></div>`}
function simpleModal(store,title){openModal(`إضافة ${title}`,`<div class="form-grid"><label>الاسم<input id="sn"></label><label>الهاتف / الدور<input id="sv"></label><label>ملاحظة<textarea id="snote"></textarea></label></div><button class="btn primary" style="margin-top:12px" onclick="saveSimple('${store}')">حفظ</button>`)}
async function saveSimple(store){await put(store,{id:id(),name:val('sn'),value:val('sv'),note:val('snote'),date:new Date().toISOString()});closeModal();render()}
async function invoices(c){const xs=await all('invoices');c.innerHTML=`<div class="section-head"><h2>الفواتير</h2></div><div class="card table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>النوع</th><th>الإجمالي</th><th>رقم العملية</th></tr></thead><tbody>${xs.sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<tr><td>${new Date(x.date).toLocaleString('ar-EG')}</td><td>${x.type}</td><td>${money(x.total)}</td><td>${x.ref?.slice(0,8)||''}</td></tr>`).join('')}</tbody></table></div>`}
async function settings(c){c.innerHTML=`<div class="grid two"><div class="card"><h2>🎨 تخصيص الواجهة</h2><p>النسخة الأولى تركز على السرعة والأزرار والاختيارات. سنضيف ترتيب البطاقات والأقسام وإظهار/إخفاء العناصر في النسخة التالية.</p></div><div class="card"><h2>💾 البيانات</h2><p>البيانات محفوظة محليًا على الجهاز.</p><div class="actions"><button class="btn primary" onclick="backup()">تصدير نسخة احتياطية</button><label class="btn">استيراد نسخة<input type="file" accept=".json" style="display:none" onchange="restore(this.files[0])"></label></div></div><div class="card"><h2>📝 ملاحظات</h2><p>يمكن إضافة ملاحظات للعملاء والصيانة والحركات المالية، وسيتم توسيعها لتظهر في الأماكن المهمة.</p></div><div class="card"><h2>🖨️ الطباعة</h2><p>واجهة الفاتورة موجودة في النظام، ويمكن تجهيز مقاس الطابعة الحرارية عند شراء الطابعة.</p></div></div>`}
async function backup(){const data={};for(const s of ['products','sales','repairs','cash','expenses','purchases','customers','staff','invoices','settings'])data[s]=await all(s);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`MAGHRABY_BACKUP_${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast('تم إنشاء النسخة الاحتياطية')}
async function restore(file){if(!file)return;try{const data=JSON.parse(await file.text());for(const s of Object.keys(data))for(const x of data[s])await put(s,x);toast('تم استيراد النسخة');render()}catch(e){toast('ملف النسخة غير صالح')}}
function val(id){return document.getElementById(id)?.value?.trim()||''}
function openModal(t,b){document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML=b;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function toast(t){const x=document.createElement('div');x.className='toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2200)}
function clock(){const x=document.getElementById('clock');setInterval(()=>x.textContent=new Date().toLocaleString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}),1000)}
init();
