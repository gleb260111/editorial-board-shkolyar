import{c as P,S as q,d as $,e as k,h as B,a as h}from"./firebase-init-C9h7tdO5.js";import{get as S,ref as y,update as L}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";import{onAuthStateChanged as j}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";let w={...q},m={},u=null,v=!1,x=[],b={},p=0,O=0;j(P,async t=>{t?(u=t,await D(),await I(),H()):window.location.href="index.html"});const D=async()=>{Object.values(q).forEach(s=>{s.forEach(n=>{m[n.id]=n})});const a=(await S(y($,"seasons"))).val();a&&Object.values(a).forEach(s=>{const n=s.id,e=s.rewards,o=`s${n}_ttl_fin`,g={id:o,name:`(СЕЗОН ${n}) ${e.final_title}`,value:e.final_title,price:0,isSeasonal:!0,isHidden:!0};w.titles.push(g),m[o]=g,e.lootbox&&e.lootbox.titles&&e.lootbox.titles.forEach((r,i)=>{const l=`s${n}_ttl_loot${i+1}`,d={id:l,name:`(СЕЗОН ${n}) Титул: ${r}`,value:r,price:0,isSeasonal:!0,isHidden:!0};w.titles.push(d),m[l]=d}),e.lootbox&&e.lootbox.avatars&&e.lootbox.avatars.forEach((r,i)=>{const l=`s${n}_av_loot${i+1}`,d={id:l,name:`(СЕЗОН ${n}) Аватар ${i+1}`,src:r,price:0,isSeasonal:!0,isHidden:!0};w.avatars.push(d),m[l]=d})})},I=async()=>{k();try{const t=await S(y($,`roles/${u.uid}`));v=t.exists()&&t.val()==="admin";const s=(await S(y($,`users/${u.uid}`))).val()||{},n=s.stats||{};p=n.balance||0,O=n.xp||0,x=s.inventory||[],b=s.equipped||{};const e=v?"∞":p;document.getElementById("user-balance").textContent=`🪙 ${e}`}catch(t){console.error(t)}finally{B()}},H=()=>{E("shop-avatars",w.avatars,"avatar"),E("shop-titles",w.titles,"title"),E("shop-borders",w.borders,"border"),X(),N()},N=async()=>{let t=document.getElementById("shop-consumables");if(!t){const e=document.getElementById("shop-borders").parentElement,o=document.createElement("section");o.innerHTML='<h2>🕵️ Теневой Рынок (Расходники)</h2><div class="shop-grid" id="shop-consumables"></div>',e.after(o),t=document.getElementById("shop-consumables")}if(t.innerHTML="",(((await S(y($,`users/${u.uid}/stats`))).val()||{}).xp||0)<100&&!v){t.innerHTML='<p style="color:gray; width:100%;">🚫 Доступ закрыт. Требуется ранг "Стажёр" (100 XP).</p>';return}q.consumables.forEach(e=>{const o=document.createElement("div");o.className="shop-card";const g=x.includes(e.id);let r="";g?r='<button class="btn btn-secondary" disabled>Уже в сумке</button>':r=`<button class="btn buy-btn" ${p>=e.price?"":"disabled"} data-price="${e.price}" data-id="${e.id}">Купить ${e.price}🪙</button>`,o.innerHTML=`
            <div style="font-size: 2.5rem; margin-bottom: 10px;">${e.name.split(" ")[0]}</div> <!-- Иконка -->
            <h3>${e.name.substring(2)}</h3> <!-- Убираем иконку из названия -->
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 10px;">${e.desc}</p>
            ${r}
        `;const i=o.querySelector(".buy-btn");i&&i.addEventListener("click",()=>C(e)),t.appendChild(o)})},E=(t,a,s)=>{const n=document.getElementById(t);n.innerHTML="",a.forEach(e=>{let o=x.includes(e.id);if(v&&(o=!0),e.isHidden&&!o&&!v)return;const g=!e.isHidden;if(e.isBlackMarket){const f=new Date().getHours(),c=f>=22||f<6;if(!v&&!c)return}const r=document.createElement("div");r.className="shop-card",e.isBlackMarket&&r.classList.add("black-market-card");let i="";if(s==="avatar"&&(i=`<img src="${e.src}" class="shop-visual-img">`),s==="title"){let f="",c=e.value;e.value==="accountant"?b.title==="Счетовод"&&b.title_override?c=b.title_override:p<500?c="📉 Коплю на булочку":p<3e3?c="📈 Средний класс":p<7e3?c="💵 Счетовод":p<15e3?c="💰 Инвестор столовой":c="👑 Олигарх 2121":e.value==="Повелитель Света"?f="special-light":e.value==="Владыка Тьмы"&&(f="special-dark"),i=`<div class="shop-visual-text ${f}">${c}</div>`,e.value==="Счетовод"&&(i+='<div style="font-size:0.65rem; color:var(--accent-color); margin-top:5px; font-weight:bold;">Динамический</div>')}if(s==="border")if(["border-hydro","border-perimeter"].includes(e.class)){let c=e.class;e.class==="border-hydro"&&(c+=" hydro-liquid"),e.class==="border-perimeter"&&(c+=" perimeter-tier-6"),i=`<div class="shop-visual-box ${c}" style="
                    border-radius: 50%; 
                    width: 60px; 
                    height: 60px; 
                    overflow: hidden; 
                    position: relative;
                    background: #222;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; color: #fff; z-index: 1; font-weight: bold;
                ">Текст</div>`}else i=`<div class="shop-visual-box ${e.class}">Текст</div>`;s==="aura"&&(i=`
            <div style="
                width: 70px; height: 70px; 
                position: relative; 
                display: flex; justify-content: center; align-items: center;
                background: #222; 
                border-radius: 50%;
                margin: 0 auto 10px auto;
                overflow: visible; 
            ">
                <!-- Фейковая аватарка внутри -->
                <div style="width: 40px; height: 40px; background: #555; border-radius: 50%;"></div>
                <!-- Сама аура (ДИНАМИЧЕСКАЯ) -->
                <div style="
                    position: absolute;
                    width: 230%; height: 230%;
                    background-image: url('${e.id}.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    animation: spin 20s linear infinite;
                "></div>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            `);let l=!1;s==="avatar"&&b.avatar===e.src&&(l=!0),s==="title"&&b.title===e.value&&(l=!0),s==="border"&&b.border===e.class&&(l=!0),s==="aura"&&b.aura===e.class&&(l=!0);let d="";if(l)d=`<button class="btn btn-secondary unequip-btn" data-type="${s}">Снять</button>`;else if(o)d=`<button class="btn equip-btn" data-type="${s}" data-id="${e.id}">Надеть</button>`;else if(g){const z=e.price===0||p>=e.price?"":"disabled";let A=`${e.price}🪙`;e.price===0&&(A="Награда"),d=`<button class="btn buy-btn" ${z} data-price="${e.price}" data-id="${e.id}">Купить ${A}</button>`}else d='<button class="btn btn-secondary" disabled>Эксклюзив</button>';r.innerHTML=`
            ${i}
            <h3>${e.name}</h3>
            ${d}
        `;const _=r.querySelector(".buy-btn");_&&_.addEventListener("click",()=>C(e));const T=r.querySelector(".equip-btn");T&&T.addEventListener("click",()=>F(e,s));const M=r.querySelector(".unequip-btn");M&&M.addEventListener("click",()=>U(s)),n.appendChild(r)})},C=async t=>{if(t.price>0&&p<t.price){h("Недостаточно монет!","error");return}if(confirm(`Купить "${t.name}" за ${t.price} монет?`)){k();try{const a=[...x,t.id],s={};if(s[`users/${u.uid}/inventory`]=a,t.price>0){const n=p-t.price;s[`users/${u.uid}/stats/balance`]=n,s[`users/${u.uid}/stats/signature`]=O*7+n*3+2121}await L(y($),s),h(`Вы купили ${t.name}!`),await I(),H()}catch(a){console.error(a),h("Ошибка покупки. Возможно, не хватает прав или монет.","error")}finally{B()}}},F=async(t,a)=>{k();try{const s={};a==="avatar"&&(s[`users/${u.uid}/equipped/avatar`]=t.src),a==="title"&&(s[`users/${u.uid}/equipped/title`]=t.value),a==="border"&&(s[`users/${u.uid}/equipped/border`]=t.class),a==="aura"&&(s[`users/${u.uid}/equipped/aura`]=t.class),await L(y($),s),h("Успешно надето!"),await I(),H()}catch(s){console.error(s),h("Ошибка","error")}finally{B()}},U=async t=>{k();try{const a={};a[`users/${u.uid}/equipped/${t}`]=null,await L(y($),a),h("Успешно снято!"),await I(),H()}catch(a){console.error(a),h("Ошибка при снятии предмета","error")}finally{B()}},X=()=>{document.getElementById("shop-auras");const t=document.getElementById("auras-section"),a=q.auras.filter(s=>{const n=x.includes(s.id);return!!(!s.isHidden||n||v)});if(a.length===0){t.classList.add("hidden");return}t.classList.remove("hidden"),E("shop-auras",a,"aura")};
