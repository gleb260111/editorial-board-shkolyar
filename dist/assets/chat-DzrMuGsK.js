import{o as A,g as y,r as p,d as h,c as O,q as _,k as U,l as K,m,p as X,b as F,a as q,n as G,y as V,z as W,A as J,u as Q,v as Y}from"./firebase-init-CROYP5xz.js";let k=null,j=!1,b=null;const E=document.getElementById("chat-messages"),$=document.getElementById("chat-input"),Z=document.getElementById("btn-send-msg"),T=document.getElementById("edit-msg-modal"),z=document.getElementById("edit-msg-input"),ee=document.getElementById("save-edit-btn"),te=document.getElementById("cancel-edit-btn"),C={},f=[{xp:0,title:"Новичок"},{xp:100,title:"Стажёр"},{xp:500,title:"Корреспондент"},{xp:1500,title:"Журналист"},{xp:4e3,title:"Спецкор"},{xp:1e4,title:"Мастер пера"},{xp:25e3,title:"Легенда"}],D=(e,t,s=null)=>{const a=[e],r=new Date().getMonth();if(e==="border-hydro"&&(r===11||r===0||r===1?a.push("hydro-winter"):a.push("hydro-liquid")),e==="border-perimeter"){const n={Новичок:0,Стажёр:1,Корреспондент:2,Журналист:3,Спецкор:4,"Мастер пера":5,Легенда:6};let i=0;if(s&&n.hasOwnProperty(s))i=n[s];else{const o=t||0;o>=100&&(i=1),o>=500&&(i=2),o>=1500&&(i=3),o>=4e3&&(i=4),o>=1e4&&(i=5),o>=25e3&&(i=6)}a.push(`perimeter-tier-${i}`)}return a};async function se(e){if(C[e])return C[e];try{const[t,s]=await Promise.all([y(p(h,`users/${e}`)),y(p(h,`userStats/${e}`))]),a=t.val()||{},r=s.exists()?s.val():{},n=a.equipped||{},i=a.stats||{};let o=f[0].title;const l=i.xp||0;for(let u=0;u<f.length&&l>=f[u].xp;u++)o=f[u].title;r.rank&&(o=r.rank);let d=n.title,g="";if(d&&d.toString().trim().toLowerCase()==="accountant")if(n.title_override)d=n.title_override;else{const u=i.balance||0;u<500?d="📉 Коплю на булочку":u<3e3?d="📈 Средний класс":u<7e3?d="💵 Счетовод":u<15e3?d="💰 Инвестор столовой":d="👑 Олигарх 2121"}else d==="Повелитель Света"?g="special-light":d==="Владыка Тьмы"&&(g="special-dark");const x={name:`${a.firstName||"Аноним"} ${a.lastName||""}`.trim(),avatar:n.avatar||null,border:n.border||null,aura:n.aura||null,aura_reverse:n.aura_reverse||null,title:d,titleClass:g,xp:l,displayRankTitle:o};return C[e]=x,x}catch(t){return console.error(t),{name:"Неизвестный",avatar:null,border:null,aura:null,title:null,titleClass:"",xp:0,displayRankTitle:"Новичок"}}}const I=async(e,t)=>{const s=await se(t.uid);let a="";s.border&&(a=D(s.border,s.xp,s.displayRankTitle).join(" "));let r='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>';s.avatar&&(r=`<img src="${m(s.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);let n="";s.title&&(n=`<span class="rank-tag title-tag ${s.titleClass}">${m(s.title)}</span>`);const i=new Date(t.timestamp||Date.now()).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}),o=t.isEdited?'<span style="font-size:0.75rem; color:var(--secondary-text-color); margin-left:5px;">(изменено)</span>':"";let l="";k&&(t.uid===k.uid||j)&&(l=`
            <div class="chat-msg-actions">
                <button class="btn-link edit-msg-btn" data-id="${e}" data-text="${m(t.text)}" title="Редактировать">✏️</button>
                <button class="btn-link del-msg-btn" data-id="${e}" title="Удалить" style="color:var(--danger-color);">🗑</button>
            </div>
        `);let d=m(t.text).replace(/\n/g,"<br>");return`
        <div class="chat-msg-card ${a}" id="msg-${e}" data-uid="${t.uid}">
            <div class="chat-msg-header" onclick="window.openDossier('${t.uid}')">
                <div class="chat-user-info">
                    <div class="feed-avatar-placeholder" style="width:40px; height:40px; border:none; background:transparent;">
                        <div class="aura-container ${s.aura||""} ${s.aura_reverse||""}">
                            ${r}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; justify-content:center;">
                        <span class="chat-name" style="font-weight:bold; color:var(--primary-text-color); line-height:1.2;">${m(s.name)}</span>
                        <span style="font-size:0.75rem; color:var(--secondary-text-color);">${i}</span>
                    </div>
                </div>
                <div>${n}</div>
            </div>
            <div class="chat-text-wrapper">
                <div class="chat-text">
                    ${d} ${o}
                </div>
                ${l}
            </div>
        </div>
    `},ae=()=>{E.scrollTop=E.scrollHeight},ie=()=>{E.innerHTML="";const e=_(p(h,"chat_messages"),G(100));V(e,async t=>{const s=t.val(),a=await I(t.key,s),r=document.createElement("div");r.innerHTML=a;const n=r.firstElementChild;E.appendChild(n),H(n),ae()}),W(e,async t=>{const s=document.getElementById(`msg-${t.key}`);if(s){const a=t.val(),r=await I(t.key,a),n=document.createElement("div");n.innerHTML=r;const i=n.firstElementChild;s.replaceWith(i),H(i)}}),J(e,t=>{const s=document.getElementById(`msg-${t.key}`);s&&s.remove()})},H=e=>{const t=e.querySelector(".edit-msg-btn"),s=e.querySelector(".del-msg-btn");t&&t.addEventListener("click",()=>{b=t.dataset.id;const a=document.createElement("textarea");a.innerHTML=t.dataset.text,z.value=a.value,T.classList.remove("hidden")}),s&&s.addEventListener("click",async()=>{confirm("Удалить сообщение?")&&await Y(p(h,`chat_messages/${s.dataset.id}`))})},P=async()=>{const e=$.value.trim();if(e){$.value="",$.style.height="45px";try{await X(p(h,"chat_messages"),{uid:k.uid,text:e,timestamp:F(),isEdited:!1})}catch(t){console.error(t),q("Ошибка отправки","error")}}};Z.addEventListener("click",P);$.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),P())});$.addEventListener("input",function(){this.style.height="45px",this.style.height=Math.min(this.scrollHeight,120)+"px"});ee.addEventListener("click",async()=>{const e=z.value.trim();if(!(!e||!b))try{await Q(p(h,`chat_messages/${b}`),{text:e,isEdited:!0}),T.classList.add("hidden"),b=null}catch(t){console.error(t),q("Ошибка при сохранении","error")}});te.addEventListener("click",()=>{T.classList.add("hidden"),b=null});A(O,async e=>{if(e){k=e;const t=await y(p(h,`roles/${e.uid}`));j=t.exists()&&t.val()==="admin",ie()}else window.location.href="index.html"});window.openDossier=async e=>{const t=document.getElementById("dossier-modal"),s=document.getElementById("dossier-content");s.innerHTML='<div style="text-align:center; padding: 20px;">Загрузка досье...</div>',t.classList.remove("hidden");try{const[a,r,n]=await Promise.all([y(p(h,`users/${e}`)),y(_(p(h,"articles"),U("authorId"),K(e))),y(p(h,`userStats/${e}`))]),i=a.val();if(!i){s.innerHTML='<div style="text-align:center;">Автор не найден</div>';return}const o=i.stats||{},l=i.equipped||{},d=n.exists()?n.val():{};let g=f[0].title;const x=o.xp||0;for(let c=0;c<f.length&&x>=f[c].xp;c++)g=f[c].title;d.rank&&(g=d.rank);const u=t.querySelector(".modal-content");u.className="modal-content";let w="dossier-avatar";if(l.border){const c=D(l.border,x,g);w+=" "+c.join(" "),u.classList.add(...c)}l.aura&&(w+=" "+l.aura),l.aura_reverse&&(w+=" "+l.aura_reverse);let M='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>';l.avatar&&(M=`<img src="${m(l.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);const R=`
            <div class="${w}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${l.border?"none":"3px solid var(--border-color)"};
            ">
                <div class="aura-container">
                    ${M}
                </div>
            </div>
        `;let S="",v=l.title,L="";if(v){if(v.toString().toLowerCase()==="accountant")if(l.title_override)v=l.title_override;else{const c=o.balance||0;c<500?v="📉 Коплю на булочку":c<3e3?v="📈 Средний класс":c<7e3?v="💵 Счетовод":c<15e3?v="💰 Инвестор столовой":v="👑 Олигарх 2121"}else v==="Повелитель Света"?L="special-light":v==="Владыка Тьмы"&&(L="special-dark");S=`<span class="rank-tag title-tag ${L}" style="font-size: 0.9rem; padding: 4px 8px;">${m(v)}</span>`}let B=0;if(r.exists()){const c=r.val();B=Object.values(c).filter(N=>N.isPublished).length}s.innerHTML=`
            <div class="dossier-header">
                ${R}
                <div class="dossier-name">${m(i.firstName)} ${m(i.lastName)}</div>
                <div style="opacity:0.7; font-size: 0.9rem;">${m(i.userClass)}</div>
                <div style="margin-top: 10px;">
                    ${S}
                </div>
            </div>
            <div class="dossier-stats">
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">${o.xp||0}</span>
                    <span class="dossier-stat-label">XP</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">❤️ ${o.totalLikes||0}</span>
                    <span class="dossier-stat-label">Репутация</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">📝 ${B}</span>
                    <span class="dossier-stat-label">Статей</span>
                </div>
            </div>
        `}catch(a){console.error(a),s.innerHTML='<div style="text-align:center; color:red;">Ошибка загрузки данных</div>'}};
