import {initializeApp,getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut,updatePassword,sendPasswordResetEmail,initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,setDoc,getDoc,deleteDoc,onSnapshot,query,where} from './firebase.js';
import {firebaseConfig} from './config.js';
const VERSAO='1.1.0';
const $=s=>document.querySelector(s);
const eur=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'});
const E=v=>eur.format(v||0);
const E0=v=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const pad=n=>String(n).padStart(2,'0');
const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const mesDe=d=>String(d||'').slice(0,7);
const addMes=(m,k)=>{let[y,mm]=m.split('-').map(Number);mm+=k;while(mm>12){mm-=12;y++}while(mm<1){mm+=12;y--}return y+'-'+pad(mm)};
const difMes=(a,b)=>{const[y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return(y2-y1)*12+(m2-m1)};
const nomeMes=m=>MESES[+m.slice(5)-1]+' '+m.slice(0,4);
const diasNoMes=m=>new Date(+m.slice(0,4),+m.slice(5),0).getDate();
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const num=v=>{const n=parseFloat(String(v??'').replace(/\s|€/g,'').replace(',','.'));return isFinite(n)?Math.round(n*100)/100:NaN};
const sum=a=>a.reduce((s,x)=>s+(+x.valor||0),0);
const fmtDia=d=>{const[y,m,dd]=d.split('-').map(Number);return new Intl.DateTimeFormat('pt-PT',{weekday:'long',day:'numeric',month:'long'}).format(new Date(y,m-1,dd))};

const CATS=[
 {k:'casa',n:'Casa',c:'#2a6f97',s:['Renda','Condomínio','IMI','Manutenção e obras','Mobiliário e decoração','Limpeza e drogaria','Eletrodomésticos']},
 {k:'alim',n:'Alimentação',c:'#e76f51',s:['Supermercado','Talho e peixaria','Fruta e mercado','Padaria','Restaurantes','Take-away e entregas','Café e snacks']},
 {k:'contas',n:'Contas da casa',c:'#d98a1c',s:['Eletricidade','Gás','Água','Internet, TV e telemóvel']},
 {k:'emp',n:'Empréstimos',c:'#6d597a',s:['Crédito habitação','Crédito automóvel','Crédito pessoal','Cartão de crédito','Leasing']},
 {k:'cri',n:'Crianças',c:'#ff2e7e',s:['Creche e escola','ATL e amas','Fraldas e higiene','Alimentação bebé','Roupa e calçado','Saúde e pediatra','Brinquedos e livros','Atividades e desporto','Material escolar','Festas e prendas']},
 {k:'trans',n:'Transportes',c:'#118ab2',s:['Combustível','Carregamento elétrico','Portagens e Via Verde','Estacionamento','Manutenção e pneus','Seguro automóvel','IUC e inspeção','Transportes públicos','TVDE e táxi']},
 {k:'saude',n:'Saúde',c:'#c0392b',s:['Farmácia','Consultas e exames','Dentista','Óculos e lentes','Ginásio']},
 {k:'seg',n:'Seguros',c:'#34495e',s:['Vida','Multirriscos casa','Saúde','Outros seguros']},
 {k:'subs',n:'Subscrições',c:'#8e44ad',s:['Streaming de vídeo','Música','Cloud e apps','Jornais e revistas']},
 {k:'lazer',n:'Lazer',c:'#16a085',s:['Saídas e cinema','Hobbies','Livros e jogos','Eventos']},
 {k:'ferias',n:'Férias e viagens',c:'#0b7285',s:['Alojamento','Viagens','Atividades','Refeições fora']},
 {k:'vest',n:'Vestuário',c:'#a0522d',s:['Roupa','Calçado','Acessórios']},
 {k:'pess',n:'Cuidados pessoais',c:'#b5651d',s:['Cabeleireiro e estética','Higiene e cosmética']},
 {k:'anim',n:'Animais',c:'#7f8c3a',s:['Comida','Veterinário','Acessórios']},
 {k:'edu',n:'Educação e formação',c:'#3d5a80',s:['Cursos','Livros técnicos']},
 {k:'pres',n:'Presentes e ofertas',c:'#e05780',s:['Aniversários','Natal','Casamentos e batizados','Donativos']},
 {k:'imp',n:'Impostos e taxas',c:'#5c4d3c',s:['IRS a pagar','Comissões bancárias','Taxas e coimas']},
 {k:'poup',n:'Poupança e investimento',c:'#0a7d8c',s:['Fundo de emergência','PPR','Certificados de Aforro','Investimentos']},
 {k:'out',n:'Outros',c:'#7a8a92',s:['Diversos','Levantamentos']}
];
const RCATS=[
 {k:'sal',n:'Salário',c:'#0a7d8c',s:['Salário','Subsídio de férias','Subsídio de Natal','Prémios']},
 {k:'abono',n:'Abonos e apoios',c:'#118ab2',s:['Abono de família','Outros apoios']},
 {k:'reemb',n:'Reembolsos',c:'#2a6f97',s:['Reembolso IRS','Seguros e comparticipações','Outros']},
 {k:'extra',n:'Extras',c:'#16a085',s:['Trabalhos extra','Vendas','Rendas recebidas','Juros e dividendos']},
 {k:'rout',n:'Outras receitas',c:'#7a8a92',s:['Diversos']}
];
const ALL=[...CATS,...RCATS];
const catO=k=>ALL.find(c=>c.k===k)||CATS[CATS.length-1];
const PER={1:'mensal',2:'bimestral',3:'trimestral',6:'semestral',12:'anual'};
const TABS=[['resumo','Resumo','M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z'],['movimentos','Movimentos','M4 6h16M4 12h16M4 18h10'],['fixos','Fixos','M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],['orcamento','Orçamento','M12 3a9 9 0 1 0 9 9h-9z M14 2.5V10h7.5A8 8 0 0 0 14 2.5z'],['mais','Mais','M5 12h.01M12 12h.01M19 12h.01']];

const st={pend:false,email:'',mov:{},fixos:{},metas:{},cfg:{membros:{},divisao:50},orc:{cats:{}},me:null,mes:mesDe(hoje()),tab:'resumo',ro:false,mode:'wait',filtro:'todos',q:''};
const DESDE=addMes(mesDe(hoje()),-24);
const names={};
let db=null,user=null,F=null,undoFn=null,toastT=0,dirty=false;

/* ---------- armazenamento (Firebase) ---------- */
let fs=null,auth=null;
function onErr(e){const c=e&&e.code||'';
 if(c.includes('permission-denied')){toast('Sem permissão: esta conta não está autorizada na app.')}
 else if(c.includes('resource-exhausted'))toast('Limite diário gratuito do Firebase atingido. Volta a funcionar amanhã.');
 else toast('Não foi possível guardar ('+(c||'erro')+').')}
function saveDoc(col,id,data){setDoc(doc(fs,col,id),data).catch(onErr);return Promise.resolve()}
function delDoc(col,id){deleteDoc(doc(fs,col,id)).catch(onErr);return Promise.resolve()}
const clone=o=>JSON.parse(JSON.stringify(o||{}));

/* ---------- pessoas ---------- */
function memb(){return Object.entries(st.cfg.membros||{}).sort((a,b)=>String(a[1].desde||'').localeCompare(String(b[1].desde||''))||a[0].localeCompare(b[0])).map(x=>x[0])}
function nome(id){if(id==='conj')return'Conta conjunta';const m=(st.cfg.membros||{})[id]||{};if(m.alcunha)return m.alcunha;const e=String(m.email||'').split('@')[0].replace(/[._\d]+/g,' ').trim().split(' ')[0];return e?e[0].toUpperCase()+e.slice(1):(id===st.me?'Eu':'Outra pessoa')}
let joined=false;
function join(){
 if(joined||!st.me)return;joined=true;
 const cur=(st.cfg.membros||{})[st.me];if(cur&&cur.email)return;
 const c=clone(st.cfg);c.membros=c.membros||{};c.membros[st.me]={...(cur||{}),email:st.email,desde:(cur&&cur.desde)||new Date().toISOString()};if(c.divisao==null)c.divisao=50;
 saveDoc('cfg','casa',c);
}

/* ---------- cálculos ---------- */
const movsMes=m=>Object.entries(st.mov).filter(([,x])=>x.mes===m).map(([id,x])=>({id,...x}));
function totais(m){const L=movsMes(m),R=sum(L.filter(x=>x.tipo==='r')),dd=L.filter(x=>x.tipo!=='r'),P=sum(dd.filter(x=>x.cat==='poup')),D=sum(dd.filter(x=>x.cat!=='poup'));return{L,R,D,P,fix:sum(dd.filter(x=>x.fixo&&x.cat!=='poup'))}}
function porCat(L){const o={};L.filter(x=>x.tipo!=='r'&&x.cat!=='poup').forEach(x=>{o[x.cat]=(o[x.cat]||0)+(+x.valor||0)});return Object.entries(o).sort((a,b)=>b[1]-a[1])}
function devidos(m){return Object.entries(st.fixos).filter(([,f])=>f.ativo!==false&&f.mesIni&&difMes(f.mesIni,m)>=0&&(!f.fim||difMes(m,f.fim)>=0)&&difMes(f.mesIni,m)%(+f.per||1)===0)}
const fxId=(id,m)=>'fx_'+id+'_'+m;
const pendentes=m=>devidos(m).filter(([id])=>!st.mov[fxId(id,m)]);
function acerto(L){
 const ms=memb();if(ms.length<2)return null;const[a,b]=ms;const pct=(+st.cfg.divisao>=0?+st.cfg.divisao:50)/100;
 const sh=L.filter(x=>x.tipo!=='r'&&x.part!==false&&x.cat!=='poup'&&(x.pag===a||x.pag===b));
 const T=sum(sh),pa=sum(sh.filter(x=>x.pag===a)),pb=T-pa,diff=pa-T*pct;
 return{a,b,T,pa,pb,pct,diff};
}

/* ---------- vistas ---------- */
const bdg=c=>`<span class="bdg" style="background:${c.c}">${esc(c.n.replace(/[^A-Za-zÀ-ú ]/g,'').split(' ').filter(w=>w.length>2).map(w=>w[0]).join('').slice(0,2).toUpperCase()||c.n[0])}</span>`;
function itemH(x){const c=catO(x.cat);return`<button class="it" data-act="edit" data-id="${esc(x.id)}">${bdg(c)}<span class="mid"><b>${esc(x.nota||x.sub||c.n)}</b><small>${esc(c.n)}${x.sub&&x.nota?' · '+esc(x.sub):''} · ${esc(nome(x.pag))}${x.fixo?' · fixo':''}${x.talao?' · talão':''}</small></span><span class="v ${x.tipo==='r'?'r':''}">${x.tipo==='r'?'+':'−'}${E(x.valor)}</span></button>`}

function vResumo(){
 const m=st.mes,t=totais(m),prev=totais(addMes(m,-1)),sobra=t.R-t.D-t.P,pend=pendentes(m),cats=porCat(t.L),orc=(st.orc&&st.orc.cats)||{};
 const tot=Math.max(t.R,t.D+t.P,1);
 const vazio=!Object.keys(st.mov).length&&!Object.keys(st.fixos).length;
 let h='';
 if(st.mode==='off')h+=`<div class="alert w">Sem rede: podes continuar a registar. Tudo é enviado quando a ligação voltar.</div>`;
 h+=`<section class="hero"><div class="lab">${sobra>=0?'Sobra este mês':'Falta este mês'}</div><div class="big num">${E(sobra)}</div>
 <div class="sub">${t.R?`Gastaram ${Math.round(t.D/t.R*100)}% do que entrou · taxa de poupança ${Math.round((t.R-t.D)/t.R*100)}%`:'Ainda sem receitas registadas neste mês'}</div>
 <div class="ruler"><span style="width:${t.D/tot*100}%;background:var(--acc)"></span><span style="width:${t.P/tot*100}%;background:#4fd1dd"></span><span style="flex:1"></span></div>
 <div class="kp"><div><span class="dot" style="background:var(--bg)"></span>Receitas<b>${E(t.R)}</b></div><div><span class="dot" style="background:var(--acc)"></span>Despesas<b>${E(t.D)}</b></div><div><span class="dot" style="background:#4fd1dd"></span>Poupado<b>${E(t.P)}</b></div></div></section>`;
 if(vazio)h+=`<div class="card"><h2>Para começar</h2><ol class="steps"><li>Em <b>Fixos</b>, adiciona a prestação da casa, empréstimos, creche, seguros, internet, salários…</li><li>Carrega em <b>Lançar fixos</b> no início de cada mês.</li><li>No dia a dia, toca no <b>+</b> e regista cada gasto (supermercado, combustível, farmácia…).</li><li>Em <b>Orçamento</b>, define um limite por categoria para receber alertas.</li></ol></div>`;
 if(pend.length&&!st.ro)h+=`<div class="alert i"><b>${pend.length} ${pend.length>1?'custos fixos por lançar':'custo fixo por lançar'}</b> em ${nomeMes(m)} (${E(pend.reduce((s,[,f])=>s+(f.tipo==='r'?0:+f.valor||0),0))}).<div style="margin-top:8px"><button class="btn acc" data-act="lancar">Lançar fixos do mês</button></div></div>`;
 cats.forEach(([k,v])=>{const lim=+orc[k]||0;if(lim&&v>lim)h+=`<div class="alert">${esc(catO(k).n)}: passaram o orçamento em ${E(v-lim)} (${Math.round(v/lim*100)}%).</div>`;else if(lim&&v>=lim*.8)h+=`<div class="alert w">${esc(catO(k).n)}: já usaram ${Math.round(v/lim*100)}% do orçamento.</div>`});
 // mosaico
 const isCur=m===mesDe(hoje()),dia=isCur?+hoje().slice(8):diasNoMes(m),dm=diasNoMes(m);
 const vari=t.D-t.fix,pfx=pend.reduce((s,[,f])=>s+(f.tipo!=='r'&&f.cat!=='poup'?+f.valor||0:0),0),prfx=pend.reduce((s,[,f])=>s+(f.tipo==='r'?+f.valor||0:0),0);
 const proj=isCur?t.D+vari/Math.max(dia,1)*(dm-dia)+pfx:t.D;
 const dD=prev.D?(t.D-prev.D)/prev.D*100:null;
 const cri=sum(t.L.filter(x=>x.cat==='cri'));
 h+=`<div class="grid2">
 <div class="tile"><small>vs. ${MESES[+addMes(m,-1).slice(5)-1]}</small><b class="${dD>0?'up':'down'}">${dD==null?'—':(dD>0?'+':'')+Math.round(dD)+'%'}</b><em>${prev.D?E(prev.D)+' no mês anterior':'sem dados anteriores'}</em></div>
 <div class="tile"><small>${isCur?'Previsão de fecho':'Despesa total'}</small><b>${E0(proj)}</b><em>${isCur?'saldo previsto '+E0(t.R+prfx-proj-t.P):'mês fechado'}</em></div>
 <div class="tile"><small>Fixos / variáveis</small><b>${t.D?Math.round(t.fix/t.D*100):0}% / ${t.D?Math.round(vari/t.D*100):0}%</b><em>${E0(t.fix)} · ${E0(vari)}</em></div>
 <div class="tile"><small>Média por dia</small><b>${E(vari/Math.max(dia,1))}</b><em>só gastos variáveis</em></div>
 <div class="tile"><small>Com as crianças</small><b>${E0(cri)}</b><em>${t.D?Math.round(cri/t.D*100):0}% das despesas</em></div>
 <div class="tile"><small>Movimentos</small><b>${t.L.length}</b><em>${t.L.filter(x=>x.tipo!=='r').length} despesas</em></div></div>`;
 // categorias
 const mx=cats.length?cats[0][1]:1;
 h+=`<div class="card"><h2>Para onde vai o dinheiro</h2>${cats.length?`<div class="bars">${cats.map(([k,v])=>{const lim=+orc[k]||0,ref=Math.max(mx,lim);return`<div class="br ${lim&&v>lim?'over':lim&&v>=lim*.8?'near':''}"><div class="t"><span>${esc(catO(k).n)}</span><span>${E(v)} <span class="muted sm">${Math.round(v/t.D*100)}%</span></span></div><div class="tr"><i style="width:${v/ref*100}%"></i>${lim?`<span class="bud" style="left:calc(${Math.min(lim/ref*100,99.5)}% - 1px)"></span>`:''}</div>${lim?`<small>orçamento ${E0(lim)}</small>`:''}</div>`}).join('')}</div>`:'<p class="muted">Sem despesas neste mês.</p>'}</div>`;
 // subcategorias top
 const sb={};t.L.filter(x=>x.tipo!=='r'&&x.cat!=='poup').forEach(x=>{const key=catO(x.cat).n+' · '+(x.sub||'—');sb[key]=(sb[key]||0)+(+x.valor||0)});
 const tops=Object.entries(sb).sort((a,b)=>b[1]-a[1]).slice(0,6);
 if(tops.length)h+=`<div class="card"><h2>Maiores rubricas</h2><div class="bars">${tops.map(([k,v])=>`<div class="br"><div class="t"><span>${esc(k)}</span><span>${E(v)}</span></div><div class="tr"><i style="width:${v/tops[0][1]*100}%;background:var(--rec)"></i></div></div>`).join('')}</div></div>`;
 // tendência
 h+=`<div class="card"><h2>Últimos 6 meses</h2><div class="leg"><span><span class="dot" style="background:var(--rec)"></span>Receitas</span><span><span class="dot" style="background:var(--ink)"></span>Despesas</span></div><div class="fig"><svg id="trend" role="img" aria-label="Receitas e despesas nos últimos seis meses"></svg></div></div>`;
 // acerto
 const a=acerto(t.L);
 h+=`<div class="card"><h2>Acerto de contas</h2>${!a?'<p class="muted">Quando a segunda pessoa abrir a app, aparece aqui quem deve a quem.</p>':a.T===0?'<p class="muted">Sem despesas partilhadas pagas por um de vocês neste mês.</p>':`
 <p class="sm muted">Despesas da casa pagas por cada um (excluindo conta conjunta). Divisão combinada: ${nome(a.a)} ${Math.round(a.pct*100)}% · ${nome(a.b)} ${100-Math.round(a.pct*100)}%.</p>
 <div class="grid2" style="margin:8px 0"><div class="tile" style="background:var(--soft)"><small>${esc(nome(a.a))} pagou</small><b>${E(a.pa)}</b></div><div class="tile" style="background:var(--soft)"><small>${esc(nome(a.b))} pagou</small><b>${E(a.pb)}</b></div></div>
 <p style="margin:6px 0 0;font-size:17px">${Math.abs(a.diff)<0.5?'<b>Estão acertados.</b>':`<b>${esc(nome(a.diff>0?a.b:a.a))}</b> deve <b>${E(Math.abs(a.diff))}</b> a <b>${esc(nome(a.diff>0?a.a:a.b))}</b>.`}</p>`}</div>`;
 // maiores despesas
 const big=t.L.filter(x=>x.tipo!=='r').sort((a,b)=>b.valor-a.valor).slice(0,4);
 if(big.length)h+=`<h3 style="margin:16px 4px 6px">Maiores despesas do mês</h3><div class="list">${big.map(itemH).join('')}</div>`;
 window.__trend=Array.from({length:6},(_,i)=>{const mm=addMes(m,i-5),x=totais(mm);return{m:mm,R:x.R,D:x.D}});
 return h;
}

function vMov(){
 const fs=[['todos','Todos'],['d','Despesas'],['r','Receitas'],['cri','Crianças'],['fixos','Fixos'],['meu','Pagos por mim']];
 return`<div id="mov-shell"><input class="search" id="q" type="search" placeholder="Procurar em todos os meses…" value="${esc(st.q)}" autocomplete="off"><div class="chips" id="fch">${fs.map(([k,n])=>`<button class="chip sm ${st.filtro===k?'on':''}" data-act="filtro" data-v="${k}">${n}</button>`).join('')}</div><div id="mov-list"></div></div>`;
}
function listMov(){
 const q=st.q.trim().toLowerCase();
 let L=Object.entries(st.mov).map(([id,x])=>({id,...x}));
 L=q?L.filter(x=>[x.nota,x.sub,catO(x.cat).n,nome(x.pag),String(x.valor).replace('.',',')].join(' ').toLowerCase().includes(q)):L.filter(x=>x.mes===st.mes);
 const f=st.filtro;
 if(f==='d')L=L.filter(x=>x.tipo!=='r');else if(f==='r')L=L.filter(x=>x.tipo==='r');else if(f==='cri')L=L.filter(x=>x.cat==='cri');else if(f==='fixos')L=L.filter(x=>x.fixo);else if(f==='meu')L=L.filter(x=>x.pag===st.me);
 L.sort((a,b)=>String(b.data).localeCompare(String(a.data))||String(b.em||'').localeCompare(String(a.em||'')));
 if(!L.length)return`<div class="empty">${q?'Nada encontrado.':'Sem movimentos em '+nomeMes(st.mes)+'.'}<br><br>${st.ro?'':'<button class="btn acc" data-act="novo">Registar movimento</button>'}</div>`;
 const g={};L.forEach(x=>(g[x.data]=g[x.data]||[]).push(x));
 const tD=sum(L.filter(x=>x.tipo!=='r')),tR=sum(L.filter(x=>x.tipo==='r'));
 return`<p class="sm muted" style="margin:2px 4px">${L.length} movimentos · despesas ${E(tD)} · receitas ${E(tR)}</p>`+Object.entries(g).map(([d,xs])=>`<div class="day">${esc(fmtDia(d))}${q?' '+d.slice(0,4):''}</div><div class="list">${xs.map(itemH).join('')}</div>`).join('');
}

function vFixos(){
 const m=st.mes,cur=mesDe(hoje());
 const list=Object.entries(st.fixos).sort((a,b)=>(a[1].ativo===false)-(b[1].ativo===false)||(+a[1].dia||0)-(+b[1].dia||0));
 const at=list.filter(([,f])=>f.ativo!==false&&(!f.fim||difMes(cur,f.fim)>=0));
 const mD=at.filter(([,f])=>f.tipo!=='r').reduce((s,[,f])=>s+(+f.valor||0)/(+f.per||1),0),mR=at.filter(([,f])=>f.tipo==='r').reduce((s,[,f])=>s+(+f.valor||0)/(+f.per||1),0);
 const due=devidos(m),pend=pendentes(m);
 const emp=at.filter(([,f])=>f.cat==='emp'&&f.tipo!=='r');
 let h=`<section class="hero"><div class="lab">Custos fixos por mês</div><div class="big num">${E(mD)}</div><div class="sub">Pagamentos anuais e trimestrais já divididos ao mês${mR?` · ${E(mR)} de receitas fixas · ${Math.round(mD/mR*100)}% comprometido`:''}</div></section>`;
 if(!st.ro)h+=`<div class="row2" style="margin-bottom:6px"><button class="btn ghost" data-act="fixo-novo">Novo fixo</button><button class="btn acc" data-act="lancar" ${pend.length?'':'disabled style="opacity:.45"'}>Lançar ${pend.length||''} em ${MESES[+m.slice(5)-1]}</button></div>`;
 if(emp.length){h+=`<div class="card"><h2>Empréstimos</h2>`;let totFalta=0;
  emp.forEach(([id,f])=>{const per=+f.per||1;const tot=f.fim?Math.floor(difMes(f.mesIni,f.fim)/per)+1:null;const pagas=Math.max(0,Math.min(tot||1e9,Math.floor(difMes(f.mesIni,cur)/per)+(st.mov[fxId(id,cur)]?1:0)));const rest=tot!=null?tot-pagas:null;const falta=rest!=null?rest*(+f.valor||0):null;if(falta)totFalta+=falta;
   h+=`<div style="padding:10px 0;border-top:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(f.nome)}</b><b class="num" style="white-space:nowrap">${E(f.valor)}</b></div>
   ${tot?`<div class="prog"><i style="width:${pagas/tot*100}%"></i></div><div class="sm muted">${pagas} de ${tot} prestações · faltam ${rest} (até ${esc(nomeMes(f.fim))}) · ${E0(falta)} por pagar</div>`:'<div class="sm muted">Sem data de fim definida</div>'}
   ${f.divida?`<div class="sm muted">Capital em dívida (último extrato): ${E(f.divida)}${f.taxa?` · taxa ${esc(String(f.taxa).replace('.',','))}%`:''}</div>`:''}</div>`});
  if(totFalta)h+=`<p style="margin:10px 0 0"><b>Total ainda por pagar em prestações: ${E0(totFalta)}</b></p>`;h+='</div>'}
 h+=`<h3 style="margin:16px 4px 6px">Todos os fixos</h3>`;
 h+=list.length?`<div class="list">${list.map(([id,f])=>{const c=catO(f.cat),d=due.some(x=>x[0]===id),l=!!st.mov[fxId(id,m)],off=f.ativo===false||(f.fim&&difMes(m,f.fim)<0);
  return`<button class="it" data-act="fixo-edit" data-id="${esc(id)}" ${off?'style="opacity:.55"':''}>${bdg(c)}<span class="mid"><b>${esc(f.nome)}</b><small>${esc(c.n)} · dia ${esc(f.dia||1)} · ${PER[f.per]||'mensal'} · ${esc(nome(f.pag))}</small></span><span style="text-align:right"><span class="v ${f.tipo==='r'?'r':''}">${E(f.valor)}</span><br>${off?'<span class="tag">inativo</span>':d?(l?'<span class="tag ok">lançado</span>':'<span class="tag p">por lançar</span>'):'<span class="tag">noutro mês</span>'}</span></button>`}).join('')}</div>`:`<div class="empty">Ainda não há custos fixos. Adiciona a prestação da casa, créditos, creche, seguros, telecomunicações, ginásio, salários…</div>`;
 return h;
}

function vOrc(){
 const t=totais(st.mes),by=Object.fromEntries(porCat(t.L)),o=(st.orc&&st.orc.cats)||{};
 const tot=CATS.reduce((s,c)=>s+(+o[c.k]||0),0),usado=CATS.reduce((s,c)=>s+(o[c.k]?(by[c.k]||0):0),0);
 const r6=Array.from({length:3},(_,i)=>totais(addMes(st.mes,-1-i)).R).filter(Boolean),medR=r6.length?r6.reduce((a,b)=>a+b,0)/r6.length:0;
 let h=`<section class="hero"><div class="lab">Orçamento mensal</div><div class="big num">${E0(tot)}</div><div class="sub">${tot?`Usado ${E0(usado)} (${Math.round(usado/tot*100)}%) em ${nomeMes(st.mes)}`:'Define limites para receber alertas no Resumo'}${medR?` · receita média ${E0(medR)}`:''}</div>${tot?`<div class="ruler"><span style="width:${Math.min(usado/tot,1)*100}%;background:${usado>tot?'var(--acc)':'#4fd1dd'}"></span></div>`:''}</section>`;
 h+=`<div class="card">${CATS.map(c=>{const v=by[c.k]||0,lim=+o[c.k]||0;return`<div class="orow"><div><div style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:${c.c}"></span><b style="font-weight:600">${esc(c.n)}</b></div><div class="sm muted">gasto ${E(v)}${lim?` · ${v>lim?'<span class="up">excedeu '+E(v-lim)+'</span>':'restam '+E(lim-v)}`:''}</div>${lim?`<div class="prog" style="margin:6px 0 0"><i style="width:${Math.min(v/lim,1)*100}%;background:${v>lim?'var(--acc)':v>=lim*.8?'var(--warn)':'var(--rec)'}"></i></div>`:''}</div><input inputmode="decimal" data-orc="${c.k}" value="${lim?String(lim).replace('.',','):''}" placeholder="€ / mês" aria-label="Orçamento ${esc(c.n)}" ${st.ro?'disabled':''}></div>`}).join('')}</div>`;
 return h;
}

function vMais(){
 const ms=memb(),pct=+st.cfg.divisao>=0?+st.cfg.divisao:50;
 const metas=Object.entries(st.metas).sort((a,b)=>String(a[1].prazo||'9').localeCompare(String(b[1].prazo||'9')));
 let h=`<div class="card"><h2>Metas de poupança</h2>`;
 h+=metas.length?metas.map(([id,g])=>{const p=g.alvo?Math.min(g.atual/g.alvo,1):0;let ritmo='';if(g.prazo&&g.alvo>g.atual){const n=difMes(mesDe(hoje()),g.prazo);if(n>0)ritmo=` · ${E0((g.alvo-g.atual)/n)}/mês até ${nomeMes(g.prazo)}`}
  return`<button class="it" data-act="meta-edit" data-id="${esc(id)}" style="display:block;padding:12px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(g.nome)}</b><span class="num">${E0(g.atual)} / ${E0(g.alvo)}</span></div><div class="prog"><i style="width:${p*100}%;background:var(--rec)"></i></div><div class="sm muted">${Math.round(p*100)}%${ritmo}</div></button>`}).join(''):'<p class="muted">Ex.: fundo de emergência (6 meses de despesas), férias, carro novo, educação dos filhos…</p>';
 h+=`<button class="btn ghost full" data-act="meta-novo" style="margin-top:8px">Nova meta</button>`;
 h+=`</div><div class="card"><h2>Pessoas da casa</h2>`;
 h+=ms.length?ms.map(id=>`<label><span>${id===st.me?'Tu':'Outra pessoa'} · ${esc((st.cfg.membros[id]||{}).email||'')}</span><input data-alc="${esc(id)}" value="${esc((st.cfg.membros[id]||{}).alcunha||'')}" placeholder="Nome a mostrar (ex.: ${esc(nome(id))})"></label>`).join(''):'<p class="muted">A carregar…</p>';
 if(ms.length<2)h+=`<p class="sm muted">A segunda pessoa aparece aqui depois de entrar na app pela primeira vez.</p>`;
 if(ms.length>=2)h+=`<div class="lbl" style="margin-top:14px">Divisão das despesas da casa</div><input type="range" min="0" max="100" step="5" id="div" value="${pct}"><div style="display:flex;justify-content:space-between" class="sm"><span id="dva">${esc(nome(ms[0]))} ${pct}%</span><span id="dvb">${esc(nome(ms[1]))} ${100-pct}%</span></div><p class="sm muted">Útil se dividem pelos rendimentos (ex.: 60/40). Usado no acerto de contas.</p>`;
 h+=`</div>`;
 const inst=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 if(!inst){const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);h+=`<div class="card"><h2>Instalar no telemóvel</h2>${deferredPrompt?'<button class="btn acc full" data-act="instalar">Instalar app</button>':ios?'<p class="sm">No Safari: botão <b>Partilhar</b> (quadrado com seta) → <b>Adicionar ao ecrã principal</b>.</p>':'<p class="sm">No Chrome: menu <b>⋮</b> → <b>Instalar aplicação</b> (ou "Adicionar ao ecrã principal").</p>'}</div>`}
 h+=`<div class="card"><h2>Exportar</h2><p class="sm muted">Todos os movimentos em CSV (separado por ponto e vírgula), pronto para abrir no Excel.</p><div class="row2"><button class="btn ghost" data-act="csv-dl">Descarregar</button><button class="btn ghost" data-act="csv">Copiar</button></div><div id="csvbox"></div></div>`;
 h+=`<div class="card"><h2>Conta</h2><p class="sm">Entraste como <b>${esc(st.email||'')}</b></p>
 <label><span>Nova palavra-passe (mín. 6 caracteres)</span><input type="password" id="np" autocomplete="new-password"></label>
 <div class="row2"><button class="btn ghost" data-act="pass">Alterar palavra-passe</button><button class="btn ghost" data-act="sair">Sair</button></div>
 <p class="sm muted" style="margin-top:12px">Dados sincronizados no Firebase (Europa). Histórico visível desde ${nomeMes(DESDE)}. Versão ${VERSAO}.</p></div>`;
 return h;
}

/* ---------- talões (foto + leitura automática) ---------- */
const LOJAS=[
 [/continente|modelo\s*bonjour/i,'Continente','alim','Supermercado'],[/pingo\s*doce/i,'Pingo Doce','alim','Supermercado'],[/\blidl\b/i,'Lidl','alim','Supermercado'],
 [/\baldi\b/i,'Aldi','alim','Supermercado'],[/intermarch/i,'Intermarché','alim','Supermercado'],[/minipre[cç]o|\bdia\s*%/i,'Minipreço','alim','Supermercado'],
 [/auchan|jumbo/i,'Auchan','alim','Supermercado'],[/mercadona/i,'Mercadona','alim','Supermercado'],[/meu\s*super/i,'Meu Super','alim','Supermercado'],
 [/coviran|spar\b|amanhecer/i,'Mercearia','alim','Supermercado'],[/el\s*corte\s*ingl/i,'El Corte Inglés','alim','Supermercado'],
 [/\bgalp\b/i,'Galp','trans','Combustível'],[/\bbp\b|bp\s*portugal/i,'BP','trans','Combustível'],[/repsol/i,'Repsol','trans','Combustível'],
 [/cepsa|moeve/i,'Cepsa','trans','Combustível'],[/\bprio\b/i,'Prio','trans','Combustível'],[/\bshell\b/i,'Shell','trans','Combustível'],
 [/farm[aá]cia|wells/i,'Farmácia','saude','Farmácia'],
 [/mc\s*donald|burger\s*king|telepizza|pizza\s*hut|\bkfc\b|\bh3\b|starbucks|vitaminas|domino/i,'Restaurante','alim','Restaurantes'],
 [/pastelaria|padaria|confeitaria/i,'Pastelaria','alim','Café e snacks'],
 [/\bikea\b/i,'IKEA','casa','Mobiliário e decoração'],[/leroy\s*merlin|\baki\b|bricomarch|maxmat|bricodepot/i,'Bricolage','casa','Manutenção e obras'],
 [/worten|fnac|radio\s*popular/i,'Eletrónica','casa','Eletrodomésticos'],
 [/zippy|toys\s*r|imaginarium|prenatal|chicco/i,'Loja de criança','cri','Roupa e calçado'],
 [/primark|\bzara\b|h\s*&\s*m|pull\s*&|bershka|mango|c\s*&\s*a|kiabi/i,'Roupa','vest','Roupa'],[/decathlon/i,'Decathlon','lazer','Hobbies'],
 [/via\s*verde|brisa|ascendi/i,'Portagens','trans','Portagens e Via Verde'],[/\bcp\b|comboios|metro|stcp|carris/i,'Transportes','trans','Transportes públicos']
];
function valoresDe(s){return[...s.replace(/(\d)\s+([,.]\d{2}\b)/g,'$1$2').matchAll(/(\d{1,4}(?:[ .]\d{3})*)[,.](\d{2})(?!\d)/g)].map(x=>parseFloat(x[1].replace(/[ .]/g,'')+'.'+x[2])).filter(v=>v>0&&v<20000)}
function lerTexto(text){
 const L=text.split('\n').map(s=>s.trim()).filter(Boolean);
 const mau=/sub\s*-?total|iva|base|taxa|desc|poup|troco|entregue|recebid|saldo|cart[aã]o\s*(de\s*)?cliente|pontos|acumul|artigos|itens|qtd/i;
 let total=null,certeza=true;
 for(const re of[/total\s*a\s*pagar|a\s*pagar|total\s*eur|total\s*\(?€|\btotal\b/i,/valor\s*pago|montante|multibanco|\bmb\b|visa|mastercard|numer[aá]rio|dinheiro|pagamento/i]){
  for(let i=0;i<L.length&&total==null;i++){const l=L[i];if(re.test(l)&&!mau.test(l)){let v=valoresDe(l);if(!v.length&&L[i+1])v=valoresDe(L[i+1]);if(v.length)total=v[v.length-1]}}
  if(total!=null)break;
 }
 if(total==null){const todos=L.flatMap(l=>mau.test(l)?[]:valoresDe(l));if(todos.length){total=Math.max(...todos);certeza=false}}
 let data=null;const hojeD=new Date();
 for(const l of L){let m=l.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/),y,mo,d;
  if(m){y=+m[1];mo=+m[2];d=+m[3]}else{m=l.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/);if(m){d=+m[1];mo=+m[2];y=+m[3];if(y<100)y+=2000}}
  if(m&&mo>=1&&mo<=12&&d>=1&&d<=31){const dt=new Date(y,mo-1,d);const dias=(hojeD-dt)/864e5;if(dias>-1&&dias<400){data=y+'-'+pad(mo)+'-'+pad(d);break}}}
 let loja=null;const topo=L.slice(0,12).join(' ')+' '+L.join(' ');
 for(const[re,n,c,s]of LOJAS)if(re.test(topo)){loja={n,c,s};break}
 return{total,certeza,data,loja};
}
let ocrP=null;
function setOcr(msg){if(!F)return;F.ocrMsg=msg;const e=$('#ocr-st');if(e)e.textContent=msg}
function carregarScript(src){return new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>ko(new Error('script'));document.head.appendChild(s)})}
function leitor(){
 if(!ocrP)ocrP=(async()=>{await carregarScript('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');
  return window.Tesseract.createWorker('por',1,{logger:m=>{if(m.status==='recognizing text')setOcr('A ler o talão… '+Math.round((m.progress||0)*100)+'%');else if(/load|init/i.test(m.status))setOcr('A preparar o leitor (só a 1.ª vez demora)…')}})})().catch(e=>{ocrP=null;throw e});
 return ocrP;
}
async function abrirImagem(file){
 if(window.createImageBitmap){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch(_){}}
 return await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=URL.createObjectURL(file)});
}
function desenhar(img,maxW,maxH){const w=img.width,h=img.height,k=Math.min(1,maxW/w,maxH/h);const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c}
function comprimir(img){let maxW=1000,maxH=2600,url='';for(let t=0;t<4;t++){const c=desenhar(img,maxW,maxH);for(const q of[.72,.6,.5,.4]){url=c.toDataURL('image/jpeg',q);if(url.length<480000)return url}maxW*=.8;maxH*=.8}return url}
function paraLeitura(img){const c=desenhar(img,1600,4000),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height),p=d.data;
 for(let i=0;i<p.length;i+=4){let g=.299*p[i]+.587*p[i+1]+.114*p[i+2];g=(g-128)*1.5+140;g=g<0?0:g>255?255:g;p[i]=p[i+1]=p[i+2]=g}x.putImageData(d,0,0);return c}
async function tratarFoto(file){
 if(!file||!F)return;const meu=F;
 setOcr('A preparar a foto…');
 let img;try{img=await abrirImagem(file)}catch(_){toast('Não consegui abrir essa imagem.');return}
 if(F!==meu)return;
 meu.talao=comprimir(img);meu.talaoMudou=true;meu.ocrMsg='A ler o talão…';redesenharFolha();
 try{
  const w=await leitor();const r=await w.recognize(paraLeitura(img));
  if(F!==meu)return;
  const t=lerTexto((r&&r.data&&r.data.text)||'');grab();
  const partes=[];
  if(t.total!=null){if(!String(meu.valor||'').trim()){meu.valor=String(t.total.toFixed(2)).replace('.',',');}partes.push('total '+E(t.total)+(t.certeza?'':' (provável)'))}
  if(t.data){meu.data=t.data;partes.push(t.data.slice(8)+'/'+t.data.slice(5,7))}
  if(t.loja){if(!String(meu.nota||'').trim())meu.nota=t.loja.n;if(!meu.catToque&&meu.tipo!=='r'){meu.cat=t.loja.c;meu.sub=t.loja.s}partes.push(t.loja.n)}
  meu.ocrMsg=partes.length?'Li: '+partes.join(' · ')+'. Confirma antes de guardar.':'Não encontrei o total. Preenche o valor à mão.';
 }catch(e){if(F!==meu)return;meu.ocrMsg='Leitura automática indisponível (precisa de rede na 1.ª vez). Foto guardada.'}
 redesenharFolha(true);
}
function redesenharFolha(semLer){if(!F||!$('#sheet').classList.contains('open'))return;if(!semLer)grab();const s=$('#sheet'),y=s.scrollTop;s.innerHTML=F.kind==='fixo'?sheetFixo():F.kind==='meta'?sheetMeta():sheetMov();s.scrollTop=y}
function talaoH(){
 if(F.talao)return`<div class="tal"><img src="${F.talao}" alt="Talão" data-act="tal-ver"><div class="tal-t"><b>Talão anexado</b><small id="ocr-st">${esc(F.ocrMsg||'Toca na imagem para ver em grande.')}</small><button type="button" class="link" data-act="tal-rm">Remover talão</button></div></div>`;
 if(F.temTalao)return`<div class="tal"><div class="tal-t"><small id="ocr-st">A carregar o talão…</small></div></div>`;
 return F.ocrMsg?`<p class="sm muted" id="ocr-st">${esc(F.ocrMsg)}</p>`:'';
}
function verTalao(src){const v=$('#viewer');v.innerHTML=`<img src="${src}" alt="Talão"><button class="x" data-act="ver-fechar" aria-label="Fechar">×</button>`;v.classList.add('on')}

/* ---------- folhas (formulários) ---------- */
function openSheet(html){$('#sheet').innerHTML=html;$('#sheet').classList.add('open');$('#scrim').classList.add('open')}
function closeSheet(){$('#sheet').classList.remove('open');$('#scrim').classList.remove('open');F=null;if(dirty)render()}
function grab(){if(!F)return;$('#sheet').querySelectorAll('[data-f]').forEach(e=>{F[e.dataset.f]=e.type==='checkbox'?e.checked:e.value})}
function sheetMov(){
 const cats=F.tipo==='r'?RCATS:CATS;if(!cats.some(c=>c.k===F.cat)){F.cat=cats[0].k;F.sub=cats[0].s[0]}
 const cat=catO(F.cat),pes=[...memb(),'conj'];
 return`<div class="sh-h"><h2>${F.id?'Editar':'Novo'} movimento</h2><button class="x" data-act="close" aria-label="Fechar">×</button></div>
 <div class="seg"><button data-act="f-tipo" data-v="d" class="${F.tipo!=='r'?'on':''}">Despesa</button><button data-act="f-tipo" data-v="r" class="${F.tipo==='r'?'on':''}">Receita</button></div>
 <div class="cam"><label class="btn acc"><input type="file" accept="image/*" capture="environment" id="f-cam">📷 Fotografar talão</label><label class="btn ghost"><input type="file" accept="image/*" id="f-gal">Galeria</label></div>
 <div id="f-tal">${talaoH()}</div>
 <label class="big"><span>Valor (€)</span><input id="f-valor" data-f="valor" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${esc(F.valor??'')}"></label>
 <div class="lbl">Categoria</div><div class="chips">${cats.map(c=>`<button data-act="f-cat" data-v="${c.k}" class="chip ${c.k===F.cat?'on':''}"><i style="background:${c.c}"></i>${esc(c.n)}</button>`).join('')}</div>
 <div class="lbl">Subcategoria</div><div class="chips">${cat.s.map(s=>`<button data-act="f-sub" data-v="${esc(s)}" class="chip sm ${s===F.sub?'on':''}">${esc(s)}</button>`).join('')}</div>
 <label><span>Data</span><input type="date" data-f="data" value="${esc(F.data)}"></label>
 <div class="lbl">${F.tipo==='r'?'Recebido por':'Pago por'}</div><div class="chips">${pes.map(p=>`<button data-act="f-pag" data-v="${esc(p)}" class="chip ${p===F.pag?'on':''}">${esc(nome(p))}</button>`).join('')}</div>
 ${F.tipo!=='r'?`<label class="chk"><input type="checkbox" data-f="part" ${F.part!==false?'checked':''}> Despesa da casa (conta para o acerto)</label>`:''}
 <label><span>Nota</span><input data-f="nota" maxlength="120" value="${esc(F.nota||'')}" placeholder="Ex.: Continente, pediatra, prenda de anos…"></label>
 <div class="acts">${F.id?'<button class="btn ghost" data-act="f-del">Apagar</button>':''}<button class="btn" data-act="f-save">Guardar</button></div>`;
}
function openMov(id){
 const x=id&&st.mov[id];const def=st.mes===mesDe(hoje())?hoje():st.mes+'-01';
 F=x?{...x,id,valor:String(x.valor).replace('.',','),temTalao:!!x.talao,catToque:true}:{tipo:'d',cat:'alim',sub:'Supermercado',data:def,pag:st.me||'conj',part:true,nota:'',valor:''};
 F.kind='mov';openSheet(sheetMov());
 if(x&&x.talao){const meu=F;getDoc(doc(fs,'talao',id)).then(d=>{if(F===meu){meu.talao=d.exists()?d.data().img:null;meu.temTalao=false;if(!meu.talao)meu.ocrMsg='Talão não disponível sem rede.';redesenharFolha()}}).catch(()=>{if(F===meu){meu.temTalao=false;meu.ocrMsg='Talão não disponível sem rede.';redesenharFolha()}})}
}
async function saveMov(){
 grab();const v=num(F.valor);if(!(v>0)){toast('Indica um valor maior que zero.');return}
 if(!/^\d{4}-\d{2}-\d{2}$/.test(F.data||'')){toast('Indica a data.');return}
 const ed=!!F.id,id=F.id||uid();
 const o={tipo:F.tipo==='r'?'r':'d',valor:v,cat:F.cat,sub:F.sub||'',data:F.data,mes:F.data.slice(0,7),pag:F.pag||'conj',part:F.tipo==='r'?false:F.part!==false,nota:String(F.nota||'').trim().slice(0,120),fixo:F.fixo||null,por:F.por||st.me||'',em:new Date().toISOString(),talao:F.talaoMudou?!!F.talao:!!(st.mov[id]&&st.mov[id].talao)};
 const tm=F.talaoMudou,ti=F.talao;
 closeSheet();if(o.mes!==st.mes&&!ed){st.mes=o.mes}await saveDoc('mov',id,o);
 if(tm){if(ti)saveDoc('talao',id,{img:ti,mov:id,em:o.em});else delDoc('talao',id)}toast(ed?'Movimento alterado':'Guardado: '+E(v));
}
function delMov(){const id=F.id,old=st.mov[id];closeSheet();if(!old)return;delDoc('mov',id);const tt=old.talao?setTimeout(()=>delDoc('talao',id),8000):0;toast('Movimento apagado','Anular',()=>{clearTimeout(tt);saveDoc('mov',id,{...old})})}

function sheetFixo(){
 const cats=F.tipo==='r'?RCATS:CATS;if(!cats.some(c=>c.k===F.cat)){F.cat=cats[0].k;F.sub=cats[0].s[0]}
 const cat=catO(F.cat),opt=(arr,sel)=>arr.map(([v,n])=>`<option value="${esc(v)}" ${String(v)===String(sel)?'selected':''}>${esc(n)}</option>`).join('');
 return`<div class="sh-h"><h2>${F.id?'Editar':'Novo'} fixo</h2><button class="x" data-act="close" aria-label="Fechar">×</button></div>
 <div class="seg"><button data-act="x-tipo" data-v="d" class="${F.tipo!=='r'?'on':''}">Despesa fixa</button><button data-act="x-tipo" data-v="r" class="${F.tipo==='r'?'on':''}">Receita fixa</button></div>
 <label><span>Nome</span><input data-f="nome" maxlength="60" value="${esc(F.nome||'')}" placeholder="Ex.: Prestação da casa, Creche, Salário"></label>
 <div class="row2"><label><span>Valor (€)</span><input data-f="valor" inputmode="decimal" value="${esc(F.valor??'')}" placeholder="0,00"></label><label><span>Dia do mês</span><input data-f="dia" type="number" min="1" max="31" value="${esc(F.dia||1)}"></label></div>
 <div class="row2"><label><span>Categoria</span><select data-f="cat" id="x-cat">${opt(cats.map(c=>[c.k,c.n]),F.cat)}</select></label><label><span>Subcategoria</span><select data-f="sub">${opt(cat.s.map(s=>[s,s]),F.sub)}</select></label></div>
 <div class="row2"><label><span>Periodicidade</span><select data-f="per">${opt(Object.entries(PER),F.per||1)}</select></label><label><span>${F.tipo==='r'?'Recebido por':'Pago por'}</span><select data-f="pag">${opt([...memb(),'conj'].map(p=>[p,nome(p)]),F.pag)}</select></label></div>
 <div class="row2"><label><span>Primeiro mês</span><input type="month" data-f="mesIni" value="${esc(F.mesIni||'')}" placeholder="AAAA-MM"></label><label><span>Último mês (opcional)</span><input type="month" data-f="fim" value="${esc(F.fim||'')}" placeholder="AAAA-MM"></label></div>
 ${F.cat==='emp'?`<div class="row2"><label><span>Capital em dívida (€)</span><input data-f="divida" inputmode="decimal" value="${esc(F.divida??'')}"></label><label><span>Taxa (%)</span><input data-f="taxa" inputmode="decimal" value="${esc(F.taxa??'')}"></label></div>`:''}
 ${F.tipo!=='r'?`<label class="chk"><input type="checkbox" data-f="part" ${F.part!==false?'checked':''}> Despesa da casa (conta para o acerto)</label>`:''}
 <label class="chk"><input type="checkbox" data-f="ativo" ${F.ativo!==false?'checked':''}> Ativo</label>
 <div class="acts">${F.id?'<button class="btn ghost" data-act="x-del">Apagar</button>':''}<button class="btn" data-act="x-save">Guardar</button></div>`;
}
function openFixo(id){const x=id&&st.fixos[id];F=x?{...x,id,valor:String(x.valor).replace('.',','),divida:x.divida?String(x.divida).replace('.',','):''}:{tipo:'d',cat:'casa',sub:'Renda',dia:1,per:1,pag:'conj',mesIni:st.mes,fim:'',ativo:true,part:true,nome:'',valor:''};F.kind='fixo';openSheet(sheetFixo())}
async function saveFixo(){
 grab();const v=num(F.valor);if(!String(F.nome||'').trim()){toast('Dá um nome ao fixo.');return}if(!(v>0)){toast('Indica o valor.');return}
 if(!/^\d{4}-\d{2}$/.test(F.mesIni||'')){toast('Indica o primeiro mês (AAAA-MM).');return}
 if(F.fim&&!/^\d{4}-\d{2}$/.test(F.fim)){toast('Último mês inválido (AAAA-MM).');return}
 const o={nome:String(F.nome).trim().slice(0,60),tipo:F.tipo==='r'?'r':'d',valor:v,cat:F.cat,sub:F.sub||'',dia:Math.min(31,Math.max(1,parseInt(F.dia)||1)),per:+F.per||1,pag:F.pag||'conj',mesIni:F.mesIni,fim:F.fim||'',part:F.tipo==='r'?false:F.part!==false,ativo:F.ativo!==false};
 if(F.cat==='emp'){const d=num(F.divida),tx=num(F.taxa);if(d>0)o.divida=d;if(tx>=0)o.taxa=tx}
 const id=F.id||uid();closeSheet();await saveDoc('fixos',id,o);toast('Fixo guardado');
}
function delFixo(){const id=F.id,old=st.fixos[id];closeSheet();if(!old)return;delDoc('fixos',id);toast('Fixo apagado (os movimentos já lançados ficam)','Anular',()=>saveDoc('fixos',id,{...old}))}
async function lancar(){
 const m=st.mes,p=pendentes(m);if(!p.length){toast('Nada por lançar.');return}
 for(const[id,f]of p){const dia=Math.min(+f.dia||1,diasNoMes(m));await saveDoc('mov',fxId(id,m),{tipo:f.tipo||'d',valor:+f.valor,cat:f.cat,sub:f.sub||'',data:m+'-'+pad(dia),mes:m,pag:f.pag||'conj',part:f.part!==false&&f.tipo!=='r',nota:f.nome,fixo:id,por:st.me||'',em:new Date().toISOString()})}
 toast(p.length+' fixos lançados em '+nomeMes(m));
}
function sheetMeta(){return`<div class="sh-h"><h2>${F.id?'Editar':'Nova'} meta</h2><button class="x" data-act="close" aria-label="Fechar">×</button></div>
 <label><span>Nome</span><input data-f="nome" maxlength="60" value="${esc(F.nome||'')}" placeholder="Ex.: Fundo de emergência"></label>
 <div class="row2"><label><span>Objetivo (€)</span><input data-f="alvo" inputmode="decimal" value="${esc(F.alvo??'')}"></label><label><span>Já poupado (€)</span><input data-f="atual" inputmode="decimal" value="${esc(F.atual??'')}"></label></div>
 <label><span>Somar agora (€)</span><input data-f="soma" inputmode="decimal" value="" placeholder="Ex.: 100"></label>
 <label><span>Prazo (opcional)</span><input type="month" data-f="prazo" value="${esc(F.prazo||'')}" placeholder="AAAA-MM"></label>
 <div class="acts">${F.id?'<button class="btn ghost" data-act="m-del">Apagar</button>':''}<button class="btn" data-act="m-save">Guardar</button></div>`}
function openMeta(id){const x=id&&st.metas[id];F=x?{...x,id,alvo:String(x.alvo).replace('.',','),atual:String(x.atual).replace('.',',')}:{nome:'',alvo:'',atual:'0',prazo:''};F.kind='meta';openSheet(sheetMeta())}
async function saveMeta(){grab();const a=num(F.alvo),c=(num(F.atual)||0)+(num(F.soma)||0);if(!String(F.nome||'').trim()||!(a>0)){toast('Indica nome e objetivo.');return}
 const o={nome:String(F.nome).trim().slice(0,60),alvo:a,atual:Math.round(c*100)/100,prazo:/^\d{4}-\d{2}$/.test(F.prazo||'')?F.prazo:''};const id=F.id||uid();closeSheet();await saveDoc('metas',id,o);toast('Meta guardada')}
function delMeta(){const id=F.id,old=st.metas[id];closeSheet();if(!old)return;delDoc('metas',id);toast('Meta apagada','Anular',()=>saveDoc('metas',id,{...old}))}

/* ---------- render ---------- */
function drawTrend(){
 const s=$('#trend'),T=window.__trend||[];if(!s||!T.length)return;const W=s.clientWidth,H=s.clientHeight;if(!W||!H)return;
 const pb=24,pt=20,mx=Math.max(1,...T.flatMap(t=>[t.R,t.D])),gw=W/T.length,bw=Math.min(20,gw/3.2);let h=`<line x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>`;
 T.forEach((t,i)=>{const x=gw*i+gw/2,hr=(H-pb-pt)*t.R/mx,hd=(H-pb-pt)*t.D/mx,on=t.m===st.mes;
  h+=`<rect x="${x-bw-1}" y="${H-pb-hr}" width="${bw}" height="${hr}" rx="3" fill="var(--rec)"/><rect x="${x+1}" y="${H-pb-hd}" width="${bw}" height="${hd}" rx="3" fill="${on?'var(--acc)':'var(--ink)'}"/><text x="${x}" y="${H-6}" text-anchor="middle" font-size="12" fill="var(--mut)" font-weight="${on?700:400}">${MESES[+t.m.slice(5)-1].slice(0,3)}</text>`;
  if(on&&W>340&&t.D)h+=`<text x="${x+1+bw/2}" y="${Math.max(12,H-pb-hd-6)}" text-anchor="middle" font-size="12" fill="var(--ink)" font-weight="700">${Math.round(t.D)}€</text>`});
 s.innerHTML=h;
}
const roTrend=new ResizeObserver(()=>drawTrend());
function header(){
 $('#mesl').textContent=nomeMes(st.mes);
 const b=document.querySelectorAll('.mes .ib');b[0].disabled=difMes(DESDE,st.mes)<=0;b[1].disabled=difMes(mesDe(hoje()),st.mes)>=2;
 const M=st.pend&&st.mode!=='off'?['','A enviar…']:({wait:['','A ligar…'],sync:['ok','Sincronizado'],off:['bad',st.pend?'Offline · por enviar':'Offline'],bad:['bad','Sem acesso']}[st.mode]||['','…']);
 const e=$('#st');e.className='st '+M[0];e.lastElementChild.textContent=M[1];
 $('#tabs').innerHTML=TABS.map(([k,n,d])=>`<button data-act="tab" data-v="${k}" class="${st.tab===k?'on':''}" aria-label="${n}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>${n}</button>`).join('');
 $('#fab').style.display=st.me?'':'none';
}
function render(){
 header();
 const a=document.activeElement,v=$('#view');
 if(a&&v.contains(a)&&a.tagName==='INPUT'){dirty=true;if(st.tab==='movimentos'&&$('#mov-list'))$('#mov-list').innerHTML=listMov();return}
 if($('#sheet').classList.contains('open'))dirty=true;
 const fn={resumo:vResumo,movimentos:vMov,fixos:vFixos,orcamento:vOrc,mais:vMais}[st.tab]||vResumo;
 v.innerHTML=fn();if(st.tab==='movimentos')$('#mov-list').innerHTML=listMov();
 roTrend.disconnect();const s=$('#trend');if(s)roTrend.observe(s);
 dirty=false;
}
let raf=0;const sched=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render()})};
function toast(msg,lbl,fn){$('#tmsg').textContent=msg;const b=$('#tbtn');b.textContent=lbl||'';b.style.display=lbl?'':'none';undoFn=fn||null;$('#toast').classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>{$('#toast').classList.remove('on');undoFn=null},lbl?6000:3200)}
function csv(){
 const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
 const rows=[['Data','Tipo','Categoria','Subcategoria','Valor','Pago por','Partilhada','Fixo','Nota']];
 Object.values(st.mov).sort((a,b)=>String(a.data).localeCompare(String(b.data))).forEach(x=>rows.push([x.data,x.tipo==='r'?'Receita':'Despesa',catO(x.cat).n,x.sub,String(x.valor).replace('.',','),nome(x.pag),x.part!==false?'Sim':'Não',x.fixo?'Sim':'Não',x.nota]));
 return rows.map(r=>r.map(q).join(';')).join('\n');
}

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');if(!t)return;const act=t.dataset.act,v=t.dataset.v;
 if(act==='tab'){st.tab=v;try{history.replaceState(null,'','#'+v)}catch(_){location.hash=v}render();window.scrollTo(0,0)}
 else if(act==='mes'){st.mes=addMes(st.mes,+v);render()}
 else if(act==='novo'){if(!st.ro)openMov()}
 else if(act==='edit'){if(!st.ro)openMov(t.dataset.id)}
 else if(act==='close')closeSheet();
 else if(act==='f-tipo'){grab();F.catToque=true;F.tipo=v;F.cat=v==='r'?'sal':'alim';F.sub=catO(F.cat).s[0];$('#sheet').innerHTML=sheetMov()}
 else if(act==='f-cat'){grab();F.catToque=true;F.cat=v;F.sub=catO(v).s[0];$('#sheet').innerHTML=sheetMov()}
 else if(act==='f-sub'){grab();F.sub=v;$('#sheet').innerHTML=sheetMov()}
 else if(act==='f-pag'){grab();F.pag=v;$('#sheet').innerHTML=sheetMov()}
 else if(act==='f-save')saveMov();
 else if(act==='f-del')delMov();
 else if(act==='fixo-novo')openFixo();
 else if(act==='fixo-edit'){if(!st.ro)openFixo(t.dataset.id)}
 else if(act==='x-tipo'){grab();F.tipo=v;F.cat=v==='r'?'sal':'casa';F.sub=catO(F.cat).s[0];$('#sheet').innerHTML=sheetFixo()}
 else if(act==='x-save')saveFixo();
 else if(act==='x-del')delFixo();
 else if(act==='lancar')lancar();
 else if(act==='meta-novo')openMeta();
 else if(act==='meta-edit'){if(!st.ro)openMeta(t.dataset.id)}
 else if(act==='m-save')saveMeta();
 else if(act==='m-del')delMeta();
 else if(act==='filtro'){st.filtro=v;document.querySelectorAll('#fch .chip').forEach(c=>c.classList.toggle('on',c.dataset.v===v));$('#mov-list').innerHTML=listMov()}
 else if(act==='undo'){const f=undoFn;undoFn=null;$('#toast').classList.remove('on');if(f)f()}
 else if(act==='sair'){signOut(auth)}
 else if(act==='tal-ver'){if(F&&F.talao)verTalao(F.talao)}
 else if(act==='ver-fechar'||t.id==='viewer'){$('#viewer').classList.remove('on');$('#viewer').innerHTML=''}
 else if(act==='tal-rm'){grab();F.talao=null;F.talaoMudou=true;F.ocrMsg='';redesenharFolha()}
 else if(act==='instalar'){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}}
 else if(act==='reload'){location.reload()}
 else if(act==='pass'){const p=$('#np').value;if(p.length<6){toast('Mínimo 6 caracteres.');return}updatePassword(auth.currentUser,p).then(()=>{$('#np').value='';toast('Palavra-passe alterada')},e=>toast(String(e.code).includes('recent-login')?'Por segurança, sai e volta a entrar antes de alterar a palavra-passe.':'Não foi possível alterar ('+e.code+').'))}
 else if(act==='csv-dl'){const b=new Blob(['\ufeff'+csv()],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='contas-casa-'+hoje()+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
 else if(act==='csv'){const c=csv();const done=()=>toast('CSV copiado ('+Object.keys(st.mov).length+' movimentos)');
  const fb=()=>{$('#csvbox').innerHTML='<p class="sm muted">Não deu para copiar automaticamente. Seleciona o texto:</p><textarea readonly></textarea>';const ta=$('#csvbox textarea');ta.value=c;ta.focus();ta.select()};
  try{navigator.clipboard.writeText(c).then(done,fb)}catch(_){fb()}}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='f-cam'||t.id==='f-gal'){const f=t.files&&t.files[0];t.value='';tratarFoto(f);return}
 if(t.id==='x-cat'&&F){grab();F.sub=catO(F.cat).s[0];$('#sheet').innerHTML=sheetFixo();return}
 if(t.dataset.orc){const o=clone(st.orc);o.cats=o.cats||{};const n=num(t.value);const old=+o.cats[t.dataset.orc]||0;if(n>0)o.cats[t.dataset.orc]=n;else delete o.cats[t.dataset.orc];if((+o.cats[t.dataset.orc]||0)!==old)saveDoc('cfg','orc',o);return}
 if(t.dataset.alc){const c=clone(st.cfg);c.membros=c.membros||{};c.membros[t.dataset.alc]={...(c.membros[t.dataset.alc]||{}),alcunha:t.value.trim().slice(0,30)};saveDoc('cfg','casa',c);return}
 if(t.id==='div'){const c=clone(st.cfg);c.divisao=+t.value;saveDoc('cfg','casa',c)}
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='q'){st.q=t.value;$('#mov-list').innerHTML=listMov()}
 if(t.id==='div'){const ms=memb();$('#dva').textContent=nome(ms[0])+' '+t.value+'%';$('#dvb').textContent=nome(ms[1])+' '+(100-t.value)+'%'}
});
document.addEventListener('focusout',()=>{setTimeout(()=>{const a=document.activeElement;if(dirty&&!(a&&$('#view').contains(a)&&a.tagName==='INPUT')&&!$('#sheet').classList.contains('open'))render()},150)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#sheet').classList.contains('open'))closeSheet()});
const h0=(location.hash||'').slice(1);if(TABS.some(t=>t[0]===h0))st.tab=h0;
window.addEventListener('hashchange',()=>{const h=(location.hash||'').slice(1);if(TABS.some(t=>t[0]===h)&&h!==st.tab){st.tab=h;render()}});

/* ---------- arranque ---------- */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(st.tab==='mais')render()});
function showLogin(on){document.body.classList.toggle('auth',on);$('#login').hidden=!on}
let unsubs=[];
function startData(){
 const ok=(s)=>{if(!s.metadata.fromCache&&navigator.onLine){st.mode='sync'}};
 const err=e=>{st.mode=String(e&&e.code).includes('permission')?'bad':'off';if(st.mode==='bad')toast('Esta conta não está autorizada a ver os dados da casa.');render()};
 const toObj=s=>{const o={};s.docs.forEach(d=>{o[d.id]=d.data()});return o};
 const opt={includeMetadataChanges:true};
 unsubs.push(onSnapshot(query(collection(fs,'mov'),where('mes','>=',DESDE)),opt,s=>{st.mov=toObj(s);st.pend=s.metadata.hasPendingWrites;ok(s);sched()},err));
 unsubs.push(onSnapshot(collection(fs,'fixos'),opt,s=>{st.fixos=toObj(s);ok(s);sched()},err));
 unsubs.push(onSnapshot(collection(fs,'metas'),opt,s=>{st.metas=toObj(s);ok(s);sched()},err));
 unsubs.push(onSnapshot(doc(fs,'cfg','orc'),d=>{st.orc=d.exists()?d.data():{cats:{}};sched()},err));
 unsubs.push(onSnapshot(doc(fs,'cfg','casa'),opt,d=>{st.cfg=d.exists()?d.data():{membros:{},divisao:50};if(!d.metadata.fromCache&&!joined)setTimeout(join,0);sched()},err));
}
function init(){
 if(!firebaseConfig||!firebaseConfig.apiKey){document.body.innerHTML='<p style="padding:24px">Falta a configuração do Firebase em config.js.</p>';return}
 const app=initializeApp(firebaseConfig);
 fs=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
 auth=getAuth(app);
 const net=()=>{if(!navigator.onLine)st.mode='off';else if(st.mode==='off')st.mode='wait';render()};
 window.addEventListener('online',net);window.addEventListener('offline',net);
 onAuthStateChanged(auth,u=>{
  unsubs.forEach(f=>f());unsubs=[];joined=false;
  if(!u){st.me=null;st.email='';st.mov={};st.fixos={};st.metas={};st.cfg={membros:{},divisao:50};st.orc={cats:{}};showLogin(true);return}
  st.me=u.uid;st.email=(u.email||'').toLowerCase();st.mode=navigator.onLine?'wait':'off';
  showLogin(false);render();startData();
 });
 $('#lf').addEventListener('submit',async e=>{e.preventDefault();const b=$('#lb'),m=$('#lm');b.disabled=true;m.textContent='A entrar…';
  try{await signInWithEmailAndPassword(auth,$('#le').value.trim(),$('#lp').value);m.textContent=''}
  catch(err){const c=String(err.code);m.textContent=c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found')?'E-mail ou palavra-passe errados.':c.includes('too-many')?'Demasiadas tentativas. Espera uns minutos.':c.includes('network')?'Sem ligação à internet.':'Erro: '+c}
  b.disabled=false});
 $('#lr').addEventListener('click',async()=>{const em=$('#le').value.trim();if(!em){$('#lm').textContent='Escreve primeiro o teu e-mail.';return}
  try{await sendPasswordResetEmail(auth,em);$('#lm').textContent='Enviámos um e-mail para redefinires a palavra-passe (vê também o spam).'}catch(err){$('#lm').textContent='Não foi possível enviar ('+err.code+').'}});
 if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Há uma nova versão da app.','Atualizar',()=>{navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());w.postMessage('skip')})})})}).catch(()=>{});
 }
}
init();
