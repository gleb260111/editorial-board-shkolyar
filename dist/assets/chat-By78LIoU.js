import{o as A,g as y,r as u,d as h,c as O,q,k as U,l as K,m as v,p as X,b as F,a as _,n as G,y as V,z as W,A as J,u as Q,v as Y}from"./firebase-init-C9h7tdO5.js";let w=null,j=!1,b=null;const k=document.getElementById("chat-messages"),$=document.getElementById("chat-input"),Z=document.getElementById("btn-send-msg"),T=document.getElementById("edit-msg-modal"),z=document.getElementById("edit-msg-input"),ee=document.getElementById("save-edit-btn"),te=document.getElementById("cancel-edit-btn"),C={},f=[{xp:0,title:"Новичок"},{xp:100,title:"Стажёр"},{xp:500,title:"Корреспондент"},{xp:1500,title:"Журналист"},{xp:4e3,title:"Спецкор"},{xp:1e4,title:"Мастер пера"},{xp:25e3,title:"Легенда"}],D=(e,t,s=null)=>{const i=[e],l=new Date().getMonth();if(e==="border-hydro"&&(l===11||l===0||l===1?i.push("hydro-winter"):i.push("hydro-liquid")),e==="border-perimeter"){const n={Новичок:0,Стажёр:1,Корреспондент:2,Журналист:3,Спецкор:4,"Мастер пера":5,Легенда:6};let a=0;if(s&&n.hasOwnProperty(s))a=n[s];else{const r=t||0;r>=100&&(a=1),r>=500&&(a=2),r>=1500&&(a=3),r>=4e3&&(a=4),r>=1e4&&(a=5),r>=25e3&&(a=6)}i.push(`perimeter-tier-${a}`)}return i};async function se(e){if(C[e])return C[e];try{const[t,s]=await Promise.all([y(u(h,`users/${e}`)),y(u(h,`userStats/${e}`))]),i=t.val()||{},l=s.exists()?s.val():{},n=i.equipped||{},a=i.stats||{};let r=f[0].title;const o=a.xp||0;for(let m=0;m<f.length&&o>=f[m].xp;m++)r=f[m].title;l.rank&&(r=l.rank);let d=n.title,g="";if(d&&d.toString().trim().toLowerCase()==="accountant")if(n.title_override)d=n.title_override;else{const m=a.balance||0;m<500?d="📉 Коплю на булочку":m<3e3?d="📈 Средний класс":m<7e3?d="💵 Счетовод":m<15e3?d="💰 Инвестор столовой":d="👑 Олигарх 2121"}else d==="Повелитель Света"?g="special-light":d==="Владыка Тьмы"&&(g="special-dark");const x={name:`${i.firstName||"Аноним"} ${i.lastName||""}`.trim(),avatar:n.avatar||null,border:n.border||null,aura:n.aura||null,title:d,titleClass:g,xp:o,displayRankTitle:r};return C[e]=x,x}catch(t){return console.error(t),{name:"Неизвестный",avatar:null,border:null,aura:null,title:null,titleClass:"",xp:0,displayRankTitle:"Новичок"}}}const I=async(e,t)=>{const s=await se(t.uid);let i="";s.border&&(i=D(s.border,s.xp,s.displayRankTitle).join(" "));let l='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>';s.avatar&&(l=`<img src="${v(s.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);let n="";s.title&&(n=`<span class="rank-tag title-tag ${s.titleClass}">${v(s.title)}</span>`);const a=new Date(t.timestamp||Date.now()).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}),r=t.isEdited?'<span style="font-size:0.75rem; color:var(--secondary-text-color); margin-left:5px;">(изменено)</span>':"";let o="";w&&(t.uid===w.uid||j)&&(o=`
            <div class="chat-msg-actions">
                <button class="btn-link edit-msg-btn" data-id="${e}" data-text="${v(t.text)}" title="Редактировать">✏️</button>
                <button class="btn-link del-msg-btn" data-id="${e}" title="Удалить" style="color:var(--danger-color);">🗑</button>
            </div>
        `);let d=v(t.text).replace(/\n/g,"<br>");return`
        <div class="chat-msg-card ${i}" id="msg-${e}" data-uid="${t.uid}">
            <div class="chat-msg-header" onclick="window.openDossier('${t.uid}')">
                <div class="chat-user-info">
                    <div class="feed-avatar-placeholder" style="width:40px; height:40px; border:none; background:transparent;">
                        <div class="aura-container ${s.aura||""}">
                            ${l}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; justify-content:center;">
                        <span class="chat-name" style="font-weight:bold; color:var(--primary-text-color); line-height:1.2;">${v(s.name)}</span>
                        <span style="font-size:0.75rem; color:var(--secondary-text-color);">${a}</span>
                    </div>
                </div>
                <div>${n}</div>
            </div>
            <div class="chat-text-wrapper">
                <div class="chat-text">
                    ${d} ${r}
                </div>
                ${o}
            </div>
        </div>
    `},ie=()=>{k.scrollTop=k.scrollHeight},ae=()=>{k.innerHTML="";const e=q(u(h,"chat_messages"),G(100));V(e,async t=>{const s=t.val(),i=await I(t.key,s),l=document.createElement("div");l.innerHTML=i;const n=l.firstElementChild;k.appendChild(n),H(n),ie()}),W(e,async t=>{const s=document.getElementById(`msg-${t.key}`);if(s){const i=t.val(),l=await I(t.key,i),n=document.createElement("div");n.innerHTML=l;const a=n.firstElementChild;s.replaceWith(a),H(a)}}),J(e,t=>{const s=document.getElementById(`msg-${t.key}`);s&&s.remove()})},H=e=>{const t=e.querySelector(".edit-msg-btn"),s=e.querySelector(".del-msg-btn");t&&t.addEventListener("click",()=>{b=t.dataset.id;const i=document.createElement("textarea");i.innerHTML=t.dataset.text,z.value=i.value,T.classList.remove("hidden")}),s&&s.addEventListener("click",async()=>{confirm("Удалить сообщение?")&&await Y(u(h,`chat_messages/${s.dataset.id}`))})},P=async()=>{const e=$.value.trim();if(e){$.value="",$.style.height="45px";try{await X(u(h,"chat_messages"),{uid:w.uid,text:e,timestamp:F(),isEdited:!1})}catch(t){console.error(t),_("Ошибка отправки","error")}}};Z.addEventListener("click",P);$.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),P())});$.addEventListener("input",function(){this.style.height="45px",this.style.height=Math.min(this.scrollHeight,120)+"px"});ee.addEventListener("click",async()=>{const e=z.value.trim();if(!(!e||!b))try{await Q(u(h,`chat_messages/${b}`),{text:e,isEdited:!0}),T.classList.add("hidden"),b=null}catch(t){console.error(t),_("Ошибка при сохранении","error")}});te.addEventListener("click",()=>{T.classList.add("hidden"),b=null});A(O,async e=>{if(e){w=e;const t=await y(u(h,`roles/${e.uid}`));j=t.exists()&&t.val()==="admin",ae()}else window.location.href="index.html"});window.openDossier=async e=>{const t=document.getElementById("dossier-modal"),s=document.getElementById("dossier-content");s.innerHTML='<div style="text-align:center; padding: 20px;">Загрузка досье...</div>',t.classList.remove("hidden");try{const[i,l,n]=await Promise.all([y(u(h,`users/${e}`)),y(q(u(h,"articles"),U("authorId"),K(e))),y(u(h,`userStats/${e}`))]),a=i.val();if(!a){s.innerHTML='<div style="text-align:center;">Автор не найден</div>';return}const r=a.stats||{},o=a.equipped||{},d=n.exists()?n.val():{};let g=f[0].title;const x=r.xp||0;for(let c=0;c<f.length&&x>=f[c].xp;c++)g=f[c].title;d.rank&&(g=d.rank);const m=t.querySelector(".modal-content");m.className="modal-content";let E="dossier-avatar";if(o.border){const c=D(o.border,x,g);E+=" "+c.join(" "),m.classList.add(...c)}o.aura&&(E+=" "+o.aura);let M='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>';o.avatar&&(M=`<img src="${v(o.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);const R=`
            <div class="${E}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${o.border?"none":"3px solid var(--border-color)"};
            ">
                <div class="aura-container">
                    ${M}
                </div>
            </div>
        `;let S="",p=o.title,L="";if(p){if(p.toString().toLowerCase()==="accountant")if(o.title_override)p=o.title_override;else{const c=r.balance||0;c<500?p="📉 Коплю на булочку":c<3e3?p="📈 Средний класс":c<7e3?p="💵 Счетовод":c<15e3?p="💰 Инвестор столовой":p="👑 Олигарх 2121"}else p==="Повелитель Света"?L="special-light":p==="Владыка Тьмы"&&(L="special-dark");S=`<span class="rank-tag title-tag ${L}" style="font-size: 0.9rem; padding: 4px 8px;">${v(p)}</span>`}let B=0;if(l.exists()){const c=l.val();B=Object.values(c).filter(N=>N.isPublished).length}s.innerHTML=`
            <div class="dossier-header">
                ${R}
                <div class="dossier-name">${v(a.firstName)} ${v(a.lastName)}</div>
                <div style="opacity:0.7; font-size: 0.9rem;">${v(a.userClass)}</div>
                <div style="margin-top: 10px;">
                    ${S}
                </div>
            </div>
            <div class="dossier-stats">
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">${r.xp||0}</span>
                    <span class="dossier-stat-label">XP</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">❤️ ${r.totalLikes||0}</span>
                    <span class="dossier-stat-label">Репутация</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">📝 ${B}</span>
                    <span class="dossier-stat-label">Статей</span>
                </div>
            </div>
        `}catch(i){console.error(i),s.innerHTML='<div style="text-align:center; color:red;">Ошибка загрузки данных</div>'}};
