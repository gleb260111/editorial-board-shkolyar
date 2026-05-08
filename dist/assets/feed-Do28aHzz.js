import{o as U,g as C,r as y,d as $,c as R,m as f,a as A,x as H,u as W,q as z,k as F,l as V}from"./firebase-init-CROYP5xz.js";const I=(s,e,l=null)=>{const t=[s],r=new Date().getMonth();if(s==="border-hydro"&&(r===11||r===0||r===1?t.push("hydro-winter"):t.push("hydro-liquid")),s==="border-perimeter"){const c={Новичок:0,Стажёр:1,Корреспондент:2,Журналист:3,Спецкор:4,"Мастер пера":5,Легенда:6};let a=0;if(l&&c.hasOwnProperty(l))a=c[l];else{const i=e||0;i>=100&&(a=1),i>=500&&(a=2),i>=1500&&(a=3),i>=4e3&&(a=4),i>=1e4&&(a=5),i>=25e3&&(a=6)}t.push(`perimeter-tier-${a}`)}return t},g=[{xp:0,title:"Новичок"},{xp:100,title:"Стажёр"},{xp:500,title:"Корреспондент"},{xp:1500,title:"Журналист"},{xp:4e3,title:"Спецкор"},{xp:1e4,title:"Мастер пера"},{xp:25e3,title:"Легенда"}],T=document.getElementById("feed-container"),P=document.getElementById("sort-new"),D=document.getElementById("sort-top"),q=document.getElementById("login-btn"),B=document.getElementById("dashboard-btn");let _=[],j="new",S=null,w=1;U(R,async s=>{if(S=s,s){q&&q.classList.add("hidden"),B&&B.classList.remove("hidden");try{const[e,l]=await Promise.all([C(y($,`users/${s.uid}`)),C(y($,`userStats/${s.uid}`))]),t=e.val()?.stats?.xp||0,r=l.val()||{};let c=g[0].title;for(let a=0;a<g.length&&t>=g[a].xp;a++)c=g[a].title;r.rank&&(c=r.rank),["Журналист","Спецкор"].includes(c)?w=2:["Мастер пера","Легенда"].includes(c)?w=3:w=1}catch(e){console.error("Ошибка расчета ранга лайка:",e)}}else q&&q.classList.remove("hidden"),B&&B.classList.add("hidden");E()});const X=async()=>{try{const s=y($,"articles"),e=await C(s);if(T.innerHTML="",_=[],e.exists()){const l=e.val();Object.entries(l).forEach(([t,r])=>{r.isPublished&&r.publishAt&&_.push({id:t,...r})}),E()}else T.innerHTML=`
                <div style="text-align:center; color: var(--secondary-text-color); margin-top: 50px;">
                    <h2>📭 Лента пуста</h2>
                    <p>Главред еще не опубликовал ни одной статьи.</p>
                </div>
            `}catch(s){console.error("Ошибка загрузки статей:",s),T.innerHTML='<div class="loader-placeholder">Ошибка загрузки ленты...</div>'}};X();P.addEventListener("click",()=>{N("new")});D.addEventListener("click",()=>{N("top")});const N=s=>{j=s,P.classList.toggle("active",s==="new"),D.classList.toggle("active",s==="top"),E()},E=()=>{if(T.innerHTML="",_.length===0)return;[..._].sort((e,l)=>{if(j==="new")return l.publishAt-e.publishAt;{const t=e.likeCount||0;return(l.likeCount||0)-t}}).forEach((e,l)=>{const t=document.createElement("div");t.className="article-card feed-card";const r=new Date(e.publishAt).toLocaleDateString("ru-RU"),c=e.likeCount||0,a=S&&e.likes&&e.likes[S.uid],i=!!a,n=typeof a=="number"?a:1,v=i?"❤️":"🤍",b=i?"liked":"";let k="",h=[];e.images&&Array.isArray(e.images)?h=e.images:e.image&&(h=[e.image]),h.length>0&&(k='<div class="article-images-list">',h.forEach((d,p)=>{const m=d.replace(/["'<>]/g,"");m.toLowerCase().trim().startsWith("javascript:")||(k+=`
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
                    <button class="btn-like ${b}" data-id="${e.id}" data-author="${e.authorId}" data-weight="${n}">
                        ${v} <span class="like-count">${c}</span>
                    </button>
                </div>
            </div>
        `,G(e.authorId,e.id,t),t.addEventListener("click",d=>{d.target.closest(".btn-like")||d.target.closest(".article-image-link")||d.target.closest(".feed-author-area")||t.classList.toggle("expanded")}),t.querySelector(".btn-like").addEventListener("click",d=>{d.stopPropagation(),K(e.id,e.authorId,d)}),T.appendChild(t),setTimeout(()=>t.classList.add("fade-in"),l*50)})},G=async(s,e,l)=>{try{const[t,r]=await Promise.all([C(y($,`users/${s}`)),C(y($,`userStats/${s}`))]),c=t.val()||{},a=r.exists()?r.val():{},i=c.equipped||{},n=c.stats||{};let v=g[0].title;const b=n.xp||0;for(let o=0;o<g.length&&b>=g[o].xp;o++)v=g[o].title;a.rank&&(v=a.rank);const k=l.querySelector(".feed-author-area");if(!k)return;const h=k.querySelector(".feed-avatar-placeholder"),L=k.querySelector(".feed-author-rank");if(!L)return;if(h){h.className="feed-avatar-placeholder";let o="<span>👤</span>";i.avatar&&(o=`<img src="${f(i.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`),h.innerHTML=`<div class="aura-container">${o}</div>`;const x=h.querySelector(".aura-container");if(i.border){const M=I(i.border,b,v);l.classList.add(...M)}i.aura&&x&&x.classList.add(i.aura),i.aura_reverse&&x&&x.classList.add(i.aura_reverse)}let d="";a.rank?d+=`<span class="rank-tag" style="border-color:var(--accent-color); color:var(--accent-color); margin-right:5px;">${f(v)}</span>`:d+=`<span class="rank-tag" style="margin-right:5px;">${f(v)}</span>`;let p=i.title,m="";if(p&&p.toString().trim().toLowerCase()==="accountant")if(i.title_override)p=i.title_override;else{const o=n.balance||0;o<500?p="📉 Коплю на булочку":o<3e3?p="📈 Средний класс":o<7e3?p="💵 Счетовод":o<15e3?p="💰 Инвестор столовой":p="👑 Олигарх 2121"}else p==="Повелитель Света"?m="special-light":p==="Владыка Тьмы"&&(m="special-dark");p&&(d+=`<span class="rank-tag title-tag ${m}">${f(p)}</span>`),L.innerHTML=d}catch(t){console.error("Ошибка загрузки автора:",t);const r=l.querySelector(".feed-author-rank");r&&(r.textContent="Ошибка профиля")}},K=async(s,e,l)=>{if(!S){A("Войдите, чтобы ставить лайки!","error");return}if(S.uid===e){A("Нельзя лайкать самого себя! Это нескромно.","error");return}const t=l.target.closest(".btn-like");if(!t)return;const r=t.querySelector(".like-count");let c=parseInt(r.textContent);const a=t.classList.contains("liked"),i=parseInt(t.dataset.weight)||1,n={};a?(n[`articles/${s}/likes/${S.uid}`]=null,n[`articles/${s}/likeCount`]=H(-i),n[`users/${e}/stats/totalLikes`]=H(-i),t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${c-i}</span>`):(n[`articles/${s}/likes/${S.uid}`]=w,n[`articles/${s}/likeCount`]=H(w),n[`users/${e}/stats/totalLikes`]=H(w),t.classList.add("liked"),t.dataset.weight=w,t.innerHTML=`❤️ <span class="like-count">${c+w}</span>`);try{await W(y($),n)}catch(v){console.error("Ошибка лайка:",v),A("Не удалось поставить лайк. Возможно, вы пытаетесь лайкнуть себя?","error"),a?(t.classList.add("liked"),t.dataset.weight=i,t.innerHTML=`❤️ <span class="like-count">${c}</span>`):(t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${c}</span>`)}},J=s=>{if(!s)return"";let e=f(s);return e=e.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>"),e=e.replace(/__(.*?)__/g,"<i>$1</i>"),e=e.replace(/&gt;&gt; (.*)/g,"<blockquote>$1</blockquote>"),e=e.replace(/\[(.*?)\]\((.*?)\)/g,(l,t,r)=>{const c=r.replace(/["'<>]/g,"");return/^https?:\/\//i.test(c)?`<a href="${c}" target="_blank" style="color:var(--accent-color); text-decoration:underline;">${t}</a>`:`<span>${t} (ссылка удалена)</span>`}),e};window.openDossier=async s=>{const e=document.getElementById("dossier-modal"),l=document.getElementById("dossier-content");l.innerHTML='<div style="text-align:center; padding: 20px;">Загрузка досье...</div>',e.classList.remove("hidden");try{const[t,r,c]=await Promise.all([C(y($,`users/${s}`)),C(z(y($,"articles"),F("authorId"),V(s))),C(y($,`userStats/${s}`))]),a=t.val();if(!a){l.innerHTML='<div style="text-align:center;">Автор не найден</div>';return}const i=a.stats||{},n=a.equipped||{},v=c.exists()?c.val():{};let b=g[0].title;const k=i.xp||0;for(let u=0;u<g.length&&k>=g[u].xp;u++)b=g[u].title;v.rank&&(b=v.rank);const h=e.querySelector(".modal-content");h.className="modal-content";let L="dossier-avatar";if(n.border){const u=I(n.border,k,b);L+=" "+u.join(" "),h.classList.add(...u)}n.aura&&(L+=" "+n.aura),n.aura_reverse&&(L+=" "+n.aura_reverse);let d='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>';n.avatar&&(d=`<img src="${f(n.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);const p=`
            <div class="${L}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${n.border?"none":"3px solid var(--border-color)"};
            ">
                <div class="aura-container">
                    ${d}
                </div>
            </div>
        `;let m="",o=n.title,x="";if(o){if(o.toString().toLowerCase()==="accountant")if(n.title_override)o=n.title_override;else{const u=i.balance||0;u<500?o="📉 Коплю на булочку":u<3e3?o="📈 Средний класс":u<7e3?o="💵 Счетовод":u<15e3?o="💰 Инвестор столовой":o="👑 Олигарх 2121"}else o==="Повелитель Света"?x="special-light":o==="Владыка Тьмы"&&(x="special-dark");m=`<span class="rank-tag title-tag ${x}" style="font-size: 0.9rem; padding: 4px 8px;">${f(o)}</span>`}let M=0;if(r.exists()){const u=r.val();M=Object.values(u).filter(O=>O.isPublished).length}l.innerHTML=`
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
        `}catch(t){console.error(t),l.innerHTML='<div style="text-align:center; color:red;">Ошибка загрузки данных</div>'}};
