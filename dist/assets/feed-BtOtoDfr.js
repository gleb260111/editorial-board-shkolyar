import{o as O,g as C,r as b,d as L,c as W,m as p,a as I,x as M,u as R,q as z,k as V,l as F}from"./firebase-init-Cb55eJg2.js";const E=(a,e,o=null)=>{const t=[a],n=new Date().getMonth();if(a==="border-hydro"&&(n===11||n===0||n===1?t.push("hydro-winter"):t.push("hydro-liquid")),a==="border-perimeter"){const c={Новичок:0,Стажёр:1,Корреспондент:2,Журналист:3,Спецкор:4,"Мастер пера":5,Легенда:6};let i=0;if(o&&c.hasOwnProperty(o))i=c[o];else{const r=e||0;r>=100&&(i=1),r>=500&&(i=2),r>=1500&&(i=3),r>=4e3&&(i=4),r>=1e4&&(i=5),r>=25e3&&(i=6)}t.push(`perimeter-tier-${i}`)}return t},m=[{xp:0,title:"Новичок"},{xp:100,title:"Стажёр"},{xp:500,title:"Корреспондент"},{xp:1500,title:"Журналист"},{xp:4e3,title:"Спецкор"},{xp:1e4,title:"Мастер пера"},{xp:25e3,title:"Легенда"}],H=document.getElementById("feed-container"),j=document.getElementById("sort-new"),D=document.getElementById("sort-top"),q=document.getElementById("login-btn"),B=document.getElementById("dashboard-btn");let _=[],P="new",T=null,w=1;O(W,async a=>{if(T=a,a){q&&q.classList.add("hidden"),B&&B.classList.remove("hidden");try{const[e,o]=await Promise.all([C(b(L,`users/${a.uid}`)),C(b(L,`userStats/${a.uid}`))]),t=e.val()?.stats?.xp||0,n=o.val()||{};let c=m[0].title;for(let i=0;i<m.length&&t>=m[i].xp;i++)c=m[i].title;n.rank&&(c=n.rank),["Журналист","Спецкор"].includes(c)?w=2:["Мастер пера","Легенда"].includes(c)?w=3:w=1}catch(e){console.error("Ошибка расчета ранга лайка:",e)}}else q&&q.classList.remove("hidden"),B&&B.classList.add("hidden");A()});const X=async()=>{try{const a=b(L,"articles"),e=await C(a);if(H.innerHTML="",_=[],e.exists()){const o=e.val();Object.entries(o).forEach(([t,n])=>{n.isPublished&&n.publishAt&&_.push({id:t,...n})}),A()}else H.innerHTML=`
                <div style="text-align:center; color: var(--secondary-text-color); margin-top: 50px;">
                    <h2>📭 Лента пуста</h2>
                    <p>Главред еще не опубликовал ни одной статьи.</p>
                </div>
            `}catch(a){console.error("Ошибка загрузки статей:",a),H.innerHTML='<div class="loader-placeholder">Ошибка загрузки ленты...</div>'}};X();j.addEventListener("click",()=>{N("new")});D.addEventListener("click",()=>{N("top")});const N=a=>{P=a,j.classList.toggle("active",a==="new"),D.classList.toggle("active",a==="top"),A()},A=()=>{if(H.innerHTML="",_.length===0)return;[..._].sort((e,o)=>{if(P==="new")return o.publishAt-e.publishAt;{const t=e.likeCount||0;return(o.likeCount||0)-t}}).forEach((e,o)=>{const t=document.createElement("div");t.className="article-card feed-card";const n=new Date(e.publishAt).toLocaleDateString("ru-RU"),c=e.likeCount||0,i=T&&e.likes&&e.likes[T.uid],r=!!i,l=typeof i=="number"?i:1,v=r?"❤️":"🤍",x=r?"liked":"";let g="",f="",k=0,h=[];e.images&&Array.isArray(e.images)?h=e.images:e.image&&(h=[e.image]);const d=s=>/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(s);if(h.length>0||e.videoUrl){if(g='<div class="article-images-list">',h.forEach((s,$)=>{const y=s.replace(/["'<>]/g,"");y.toLowerCase().trim().startsWith("javascript:")||(d(y)?(f+=`<a href="${p(y)}" target="_blank" class="collage-item"><img src="${p(y)}" alt="Фото к статье"></a>`,k++):g+=`
                        <a href="${p(y)}" target="_blank" class="article-image-link">
                            📷 Фото ${$+1}
                        </a>
                    `)}),e.videoUrl){const s=e.videoUrl.replace(/["'<>]/g,"");s.toLowerCase().trim().startsWith("javascript:")||(g+=`
                        <a href="${p(s)}" target="_blank" class="article-image-link">
                            🎥 Видео
                        </a>
                    `)}g+="</div>"}f&&(f=`<div class="${k>4?"article-image-collage many":"article-image-collage"}" data-count="${k}">${f}</div>`),t.innerHTML=`
            <!-- БЛОК АВТОРА (КЛИКАБЕЛЬНЫЙ) -->
            <div class="feed-author-area clickable-author" onclick="window.openDossier('${e.authorId}')">
                <div class="feed-avatar-placeholder">👤</div>
                <div class="feed-author-info">
                    <div class="feed-author-name">${p(e.authorName)}</div>
                    <div class="feed-author-rank">Загрузка...</div>
                </div>
            </div>
            ${g} <!-- Ссылки перед заголовком -->
            <h3 style="margin-top: 10px;">${p(e.title)}</h3>
            <p class="article-text">${J(e.text)}</p>
            ${f} <!-- Картинки напрямую -->
            <div class="article-meta" style="margin-top: 15px; justify-content: space-between;">
                <span>📅 Опубликовано: ${n}</span>
                <div class="feed-actions" style="margin:0; border:none; padding:0;">
                    <button class="btn-like ${x}" data-id="${e.id}" data-author="${e.authorId}" data-weight="${l}">
                        ${v} <span class="like-count">${c}</span>
                    </button>
                </div>
            </div>
        `,G(e.authorId,e.id,t),t.addEventListener("click",s=>{s.target.closest(".btn-like")||s.target.closest(".article-image-link")||s.target.closest(".collage-item")||s.target.closest(".feed-author-area")||(window.location.href=`article.html?id=${e.id}`)}),t.querySelector(".btn-like").addEventListener("click",s=>{s.stopPropagation(),K(e.id,e.authorId,s)}),H.appendChild(t),setTimeout(()=>t.classList.add("fade-in"),o*50)})},G=async(a,e,o)=>{try{const[t,n]=await Promise.all([C(b(L,`users/${a}`)),C(b(L,`userStats/${a}`))]),c=t.val()||{},i=n.exists()?n.val():{},r=c.equipped||{},l=c.stats||{};let v=m[0].title;const x=l.xp||0;for(let s=0;s<m.length&&x>=m[s].xp;s++)v=m[s].title;i.rank&&(v=i.rank);const g=o.querySelector(".feed-author-area");if(!g)return;const f=g.querySelector(".feed-avatar-placeholder"),k=g.querySelector(".feed-author-rank");if(!k)return;if(f){f.className="feed-avatar-placeholder";let s="<span>👤</span>";r.avatar&&(s=`<img src="${p(r.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`),f.innerHTML=`<div class="aura-container">${s}</div>`;const $=f.querySelector(".aura-container");if(r.border){const y=E(r.border,x,v);o.classList.add(...y)}r.aura&&$&&$.classList.add(r.aura),r.aura_reverse&&$&&$.classList.add(r.aura_reverse)}let h="";i.rank?h+=`<span class="rank-tag" style="border-color:var(--accent-color); color:var(--accent-color); margin-right:5px;">${p(v)}</span>`:h+=`<span class="rank-tag" style="margin-right:5px;">${p(v)}</span>`;let d=r.title,S="";if(d&&d.toString().trim().toLowerCase()==="accountant")if(r.title_override)d=r.title_override;else{const s=l.balance||0;s<500?d="📉 Коплю на булочку":s<3e3?d="📈 Средний класс":s<7e3?d="💵 Счетовод":s<15e3?d="💰 Инвестор столовой":d="👑 Олигарх 2121"}else d==="Повелитель Света"?S="special-light":d==="Владыка Тьмы"&&(S="special-dark");d&&(h+=`<span class="rank-tag title-tag ${S}">${p(d)}</span>`),k.innerHTML=h}catch(t){console.error("Ошибка загрузки автора:",t);const n=o.querySelector(".feed-author-rank");n&&(n.textContent="Ошибка профиля")}},K=async(a,e,o)=>{if(!T){I("Войдите, чтобы ставить лайки!","error");return}if(T.uid===e){I("Нельзя лайкать самого себя! Это нескромно.","error");return}const t=o.target.closest(".btn-like");if(!t)return;const n=t.querySelector(".like-count");let c=parseInt(n.textContent);const i=t.classList.contains("liked"),r=parseInt(t.dataset.weight)||1,l={};i?(l[`articles/${a}/likes/${T.uid}`]=null,l[`articles/${a}/likeCount`]=M(-r),l[`users/${e}/stats/totalLikes`]=M(-r),t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${c-r}</span>`):(l[`articles/${a}/likes/${T.uid}`]=w,l[`articles/${a}/likeCount`]=M(w),l[`users/${e}/stats/totalLikes`]=M(w),t.classList.add("liked"),t.dataset.weight=w,t.innerHTML=`❤️ <span class="like-count">${c+w}</span>`);try{await R(b(L),l)}catch(v){console.error("Ошибка лайка:",v),I("Не удалось поставить лайк. Возможно, вы пытаетесь лайкнуть себя?","error"),i?(t.classList.add("liked"),t.dataset.weight=r,t.innerHTML=`❤️ <span class="like-count">${c}</span>`):(t.classList.remove("liked"),t.dataset.weight=0,t.innerHTML=`🤍 <span class="like-count">${c}</span>`)}},J=a=>{if(!a)return"";let e=p(a);return e=e.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>"),e=e.replace(/__(.*?)__/g,"<i>$1</i>"),e=e.replace(/&gt;&gt; (.*)/g,"<blockquote>$1</blockquote>"),e=e.replace(/\[(.*?)\]\((.*?)\)/g,(o,t,n)=>{const c=n.replace(/["'<>]/g,"");return/^https?:\/\//i.test(c)?`<a href="${c}" target="_blank" style="color:var(--accent-color); text-decoration:underline;">${t}</a>`:`<span>${t} (ссылка удалена)</span>`}),e};window.openDossier=async a=>{const e=document.getElementById("dossier-modal"),o=document.getElementById("dossier-content");o.innerHTML='<div style="text-align:center; padding: 20px;">Загрузка досье...</div>',e.classList.remove("hidden");try{const[t,n,c]=await Promise.all([C(b(L,`users/${a}`)),C(z(b(L,"articles"),V("authorId"),F(a))),C(b(L,`userStats/${a}`))]),i=t.val();if(!i){o.innerHTML='<div style="text-align:center;">Автор не найден</div>';return}const r=i.stats||{},l=i.equipped||{},v=c.exists()?c.val():{};let x=m[0].title;const g=r.xp||0;for(let u=0;u<m.length&&g>=m[u].xp;u++)x=m[u].title;v.rank&&(x=v.rank);const f=e.querySelector(".modal-content");f.className="modal-content";let k="dossier-avatar";if(l.border){const u=E(l.border,g,x);k+=" "+u.join(" "),f.classList.add(...u)}l.aura&&(k+=" "+l.aura),l.aura_reverse&&(k+=" "+l.aura_reverse);let h='<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#333; border-radius:50%; font-size:2rem;">👤</div>';l.avatar&&(h=`<img src="${p(l.avatar)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`);const d=`
            <div class="${k}" style="
                width: 100px; 
                height: 100px; 
                margin: 0 auto 15px auto; 
                position: relative; 
                overflow: visible; 
                border-radius: 50%;
                border: ${l.border?"none":"3px solid var(--border-color)"};
            ">
                <div class="aura-container">
                    ${h}
                </div>
            </div>
        `;let S="",s=l.title,$="";if(s){if(s.toString().toLowerCase()==="accountant")if(l.title_override)s=l.title_override;else{const u=r.balance||0;u<500?s="📉 Коплю на булочку":u<3e3?s="📈 Средний класс":u<7e3?s="💵 Счетовод":u<15e3?s="💰 Инвестор столовой":s="👑 Олигарх 2121"}else s==="Повелитель Света"?$="special-light":s==="Владыка Тьмы"&&($="special-dark");S=`<span class="rank-tag title-tag ${$}" style="font-size: 0.9rem; padding: 4px 8px;">${p(s)}</span>`}let y=0;if(n.exists()){const u=n.val();y=Object.values(u).filter(U=>U.isPublished).length}o.innerHTML=`
            <div class="dossier-header">
                ${d}
                <div class="dossier-name">${p(i.firstName)} ${p(i.lastName)}</div>
                <div style="opacity:0.7; font-size: 0.9rem;">${p(i.userClass)}</div>
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
                    <span class="dossier-stat-val">📝 ${y}</span>
                    <span class="dossier-stat-label">Статей</span>
                </div>
            </div>
        `}catch(t){console.error(t),o.innerHTML='<div style="text-align:center; color:red;">Ошибка загрузки данных</div>'}};
