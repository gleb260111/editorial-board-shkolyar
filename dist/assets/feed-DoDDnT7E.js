import{o as U,g as x,r as y,d as $,c as R,m as f,a as E,x as H,u as W,q as z,k as F,l as V}from"./firebase-init-2dAZWdLH.js";const _=(s,e,n=null)=>{const t=[s],r=new Date().getMonth();if(s==="border-hydro"&&(r===11||r===0||r===1?t.push("hydro-winter"):t.push("hydro-liquid")),s==="border-perimeter"){const o={Новичок:0,Стажёр:1,Корреспондент:2,Журналист:3,Спецкор:4,"Мастер пера":5,Легенда:6};let a=0;if(n&&o.hasOwnProperty(n))a=o[n];else{const i=e||0;i>=100&&(a=1),i>=500&&(a=2),i>=1500&&(a=3),i>=4e3&&(a=4),i>=1e4&&(a=5),i>=25e3&&(a=6)}t.push(`perimeter-tier-${a}`)}return t},g=[{xp:0,title:"Новичок"},{xp:100,title:"Стажёр"},{xp:500,title:"Корреспондент"},{xp:1500,title:"Журналист"},{xp:4e3,title:"Спецкор"},{xp:1e4,title:"Мастер пера"},{xp:25e3,title:"Легенда"}],T=document.getElementById("feed-container"),P=document.getElementById("sort-new"),D=document.getElementById("sort-top"),q=document.getElementById("login-btn"),B=document.getElementById("dashboard-btn");let A=[],j="new",C=null,L=1;U(R,async s=>{if(C=s,s){q&&q.classList.add("hidden"),B&&B.classList.remove("hidden");try{const[e,n]=await Promise.all([x(y($,`users/${s.uid}`)),x(y($,`userStats/${s.uid}`))]),t=e.val()?.stats?.xp||0,r=n.val()||{};let o=g[0].title;for(let a=0;a<g.length&&t>=g[a].xp;a++)o=g[a].title;r.rank&&(o=r.rank),["Журналист","Спецкор"].includes(o)?L=2:["Мастер пера","Легенда"].includes(o)?L=3:L=1}catch(e){console.error("Ошибка расчета ранга лайка:",e)}}else q&&q.classList.remove("hidden"),B&&B.classList.add("hidden");I()});const X=async()=>{try{const s=y($,"articles"),e=await x(s);if(T.innerHTML="",A=[],e.exists()){const n=e.val();Object.entries(n).forEach(([t,r])=>{r.isPublished&&r.publishAt&&A.push({id:t,...r})}),I()}else T.innerHTML=`
                <div style="text-align:center; color: var(--secondary-text-color); margin-top: 50px;">
                    <h2>📭 Лента пуста</h2>
                    <p>Главред еще не опубликовал ни одной статьи.</p>
                </div>
            `}catch(s){console.error("Ошибка загрузки статей:",s),T.innerHTML='<div class="loader-placeholder">Ошибка загрузки ленты...</div>'}};X();P.addEventListener("click",()=>{N("new")});D.addEventListener("click",()=>{N("top")});const N=s=>{j=s,P.classList.toggle("active",s==="new"),D.classList.toggle("active",s==="top"),I()},I=()=>{if(T.innerHTML="",A.length===0)return;[...A].sort((e,n)=>{if(j==="new")return n.publishAt-e.publishAt;{const t=e.likeCount||0;return(n.likeCount||0)-t}}).forEach((e,n)=>{const t=document.createElement("div");t.className="article-card feed-card";const r=new Date(e.publishAt).toLocaleDateString("ru-RU"),o=e.likeCount||0,a=C&&e.likes&&e.likes[C.uid],i=!!a,c=typeof a=="number"?a:1,v=i?"❤️":"🤍",b=i?"liked":"";let k="",h=[];e.images&&Array.isArray(e.images)?h=e.images:e.image&&(h=[e.image]),h.length>0&&(k='<div class="article-images-list">',h.forEach((d,p)=>{const m=d.replace(/["'<>]/g,"");m.toLowerCase().trim().startsWith("javascript:")||(k+=`
                    <a href="${f(m)}" target="_blank" class="article-image-link">
                        📷 Фото ${p+1}
                    </a>
                `)}),k+="</div>"),t.innerHTML=`
            <!-- БЛОК АВТОРА (КЛИКАБЕЛЬНЫЙ) -->
            <div class="feed-author-area clickable-author" onclick="window.openDossier('${e.authorId}')">
                <div class="feed-avatar-placeholder">👤</div>
                <div class="feed-author-info">
                    <div class="feed-author-name">${f(e.authorName)}</div>
                    <div class="feed-author-rank">Загрузка...</div>
                </div>
            </div>
            ${k} <!-- Ссылки перед заголовком -->
            <h3 style="margin-top: 10px;">${f(e.title)}</h3>
            <p class="article-text">${J(e.text)}</p>
            <div class="article-meta" style="margin-top: 15px; justify-content: space-between;">
                <span>📅 Опубликовано: ${r}</span>
                <div class="feed-actions" style="margin:0; border:none; padding:0;">
                    <button class="btn-like ${b}" data-id="${e.id}" data-author="${e.authorId}" data-weight="${c}">
                        ${v} <span class="like-count">${o}</span>
                    </button>
                </div>
            </div>
        `,G(e.authorId,e.id,t),t.addEventListener("click",d=>{d.target.closest(".btn-like")||d.target.closest(".article-image-link")||d.target.closest(".feed-author-area")||t.classList.toggle("expanded")}),t.querySelector(".btn-like").addEventListener("click",d=>{d.stopPropagation(),K(e.id,e.authorId,d)}),T.appendChild(t),setTimeout(()=>t.classList.add("fade-in"),n*50)})},G=async(s,e,n)=>{try{const[t,r]=await Promise.all([x(y($,`users/${s}`)),x(y($,`userStats/${s}`))]),o=t.val()||{},a=r.exists()?r.val():{},i=o.equipped||{},c=o.stats||{};let v=g[0].title;const b=c.xp||0;for(let l=0;l<g.length&&b>=g[l].xp;l++)v=g[l].title;a.rank&&(v=a.rank);const k=n.querySelector(".feed-author-area");if(!k)return;const h=k.querySelector(".feed-avatar-placeholder"),w=k.querySelector(".feed-author-rank");if(!w)return;if(h){h.className="feed-avatar-placeholder";let l="<span>👤</span>";i.avatar&&(l=`<img src="${f(i.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`),h.innerHTML=`<div class="aura-container">${l}</div>`;const S=h.querySelector(".aura-container");if(i.border){const M=_(i.border,b,v);n.classList.add(...M)}i.aura&&S&&S.classList.add(i.aura)}let d="";a.rank?d+=`<span class="rank-tag" style="border-color:var(--accent-color); color:var(--accent-color); margin-right:5px;">${f(v)}</span>`:d+=`<span class="rank-tag" style="margin-right:5px;">${f(v)}</span>`;let p=i.title,m="";if(p&&p.toString().trim().toLowerCase()==="accountant")if(i.title_override)p=i.title_override;else{const l=c.balance||0;l<500?p="📉 Коплю на булочку":l<3e3?p="📈 Средний класс":l<7e3?p="💵 Счетовод":l<15e3?p="💰 Инвестор столовой":p="👑 Олигарх 2121"}else p==="Повелитель Света"?m="special-light":p==="Владыка Тьмы"&&(m="special-dark");p&&(d+=`<span class="rank-tag title-tag ${m}">${f(p)}</span>`),w.innerHTML=d}catch(t){console.error("Ошибка загрузки автора:",t);const r=n.querySelector(".feed-author-rank");r&&(r.textContent="Ошибка профиля")}},K=async(s,e,n)=>{if(!C){E("Войдите, чтобы ставить лайки!","error");return}if(C.uid===e){E("Нельзя лайкать самого себя! Это нескромно.","error");return}const t=n.target.closest(".btn-like");if(!t)return;const r=t.querySelector(".like-count");let o=parseInt(r.textContent);const a=t.classList.contains("liked"),i=parseInt(t.dataset.weight)||1,c={};a?(c[`articles/${s}/likes/${C.uid}`]=null,c[`articles/${s}/likeCount`]=H(-i),c[`users/${e}/stats/totalLikes`]=H(-i),t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${o-i}</span>`):(c[`articles/${s}/likes/${C.uid}`]=L,c[`articles/${s}/likeCount`]=H(L),c[`users/${e}/stats/totalLikes`]=H(L),t.classList.add("liked"),t.dataset.weight=L,t.innerHTML=`❤️ <span class="like-count">${o+L}</span>`);try{await W(y($),c)}catch(v){console.error("Ошибка лайка:",v),E("Не удалось поставить лайк. Возможно, вы пытаетесь лайкнуть себя?","error"),a?(t.classList.add("liked"),t.dataset.weight=i,t.innerHTML=`❤️ <span class="like-count">${o}</span>`):(t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${o}</span>`)}},J=s=>{if(!s)return"";let e=f(s);return e=e.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>"),e=e.replace(/__(.*?)__/g,"<i>$1</i>"),e=e.replace(/&gt;&gt; (.*)/g,"<blockquote>$1</blockquote>"),e=e.replace(/\[(.*?)\]\((.*?)\)/g,(n,t,r)=>{const o=r.replace(/["'<>]/g,"");return/^https?:\/\//i.test(o)?`<a href="${o}" target="_blank" style="color:var(--accent-color); text-decoration:underline;">${t}</a>`:`<span>${t} (ссылка удалена)</span>`}),e};window.openDossier=async s=>{const e=document.getElementById("dossier-modal"),n=document.getElementById("dossier-content");n.innerHTML='<div style="text-align:center; padding: 20px;">Загрузка досье...</div>',e.classList.remove("hidden");try{const[t,r,o]=await Promise.all([x(y($,`users/${s}`)),x(z(y($,"articles"),F("authorId"),V(s))),x(y($,`userStats/${s}`))]),a=t.val();if(!a){n.innerHTML='<div style="text-align:center;">Автор не найден</div>';return}const i=a.stats||{},c=a.equipped||{},v=o.exists()?o.val():{};let b=g[0].title;const k=i.xp||0;for(let u=0;u<g.length&&k>=g[u].xp;u++)b=g[u].title;v.rank&&(b=v.rank);const h=e.querySelector(".modal-content");h.className="modal-content";let w="dossier-avatar";if(c.border){const u=_(c.border,k,b);w+=" "+u.join(" "),h.classList.add(...u)}c.aura&&(w+=" "+c.aura);let d='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>';c.avatar&&(d=`<img src="${f(c.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);const p=`
            <div class="${w}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${c.border?"none":"3px solid var(--border-color)"};
            ">
                <div class="aura-container">
                    ${d}
                </div>
            </div>
        `;let m="",l=c.title,S="";if(l){if(l.toString().toLowerCase()==="accountant")if(c.title_override)l=c.title_override;else{const u=i.balance||0;u<500?l="📉 Коплю на булочку":u<3e3?l="📈 Средний класс":u<7e3?l="💵 Счетовод":u<15e3?l="💰 Инвестор столовой":l="👑 Олигарх 2121"}else l==="Повелитель Света"?S="special-light":l==="Владыка Тьмы"&&(S="special-dark");m=`<span class="rank-tag title-tag ${S}" style="font-size: 0.9rem; padding: 4px 8px;">${f(l)}</span>`}let M=0;if(r.exists()){const u=r.val();M=Object.values(u).filter(O=>O.isPublished).length}n.innerHTML=`
            <div class="dossier-header">
                ${p}
                <div class="dossier-name">${f(a.firstName)} ${f(a.lastName)}</div>
                <div style="opacity:0.7; font-size: 0.9rem;">${f(a.userClass)}</div>
                <div style="margin-top: 10px;">
                    ${m}
                </div>
            </div>
            <div class="dossier-stats">
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">${i.xp||0}</span>
                    <span class="dossier-stat-label">XP</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">❤️ ${i.totalLikes||0}</span>
                    <span class="dossier-stat-label">Репутация</span>
                </div>
                <div class="dossier-stat-item">
                    <span class="dossier-stat-val">📝 ${M}</span>
                    <span class="dossier-stat-label">Статей</span>
                </div>
            </div>
        `}catch(t){console.error(t),n.innerHTML='<div style="text-align:center; color:red;">Ошибка загрузки данных</div>'}};
