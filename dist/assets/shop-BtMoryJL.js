import{c as N,S,d as f,e as I,h as q,a as y}from"./firebase-init-C9h7tdO5.js";import{get as m,ref as b,update as L}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";import{onAuthStateChanged as P}from"https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";let w={...S},x={},u=null,g=!1,k=[],$={},p=0,O=0;P(N,async t=>{t?(u=t,await j(),await B(),H()):window.location.href="index.html"});const j=async()=>{Object.values(S).forEach(s=>{s.forEach(n=>{x[n.id]=n})});const a=(await m(b(f,"seasons"))).val();a&&Object.values(a).forEach(s=>{const n=s.id,e=s.rewards,r=`s${n}_ttl_fin`,v={id:r,name:`(СЕЗОН ${n}) ${e.final_title}`,value:e.final_title,price:0,isSeasonal:!0,isHidden:!0};w.titles.push(v),x[r]=v,e.lootbox&&e.lootbox.titles&&e.lootbox.titles.forEach((o,i)=>{const l=`s${n}_ttl_loot${i+1}`,c={id:l,name:`(СЕЗОН ${n}) Титул: ${o}`,value:o,price:0,isSeasonal:!0,isHidden:!0};w.titles.push(c),x[l]=c}),e.lootbox&&e.lootbox.avatars&&e.lootbox.avatars.forEach((o,i)=>{const l=`s${n}_av_loot${i+1}`,c={id:l,name:`(СЕЗОН ${n}) Аватар ${i+1}`,src:o,price:0,isSeasonal:!0,isHidden:!0};w.avatars.push(c),x[l]=c})})},B=async()=>{I();try{const t=await m(b(f,`roles/${u.uid}`));g=t.exists()&&t.val()==="admin";const a=await m(b(f,`users/${u.uid}`)),s=await m(b(f,`userStats/${u.uid}`)),n=a.val()||{},e=s.val()||{},r=n.stats||{};p=r.balance||0,O=r.xp||0;const v=n.inventory||[],o=e.inventory||[],i=new Set(v);o.forEach(c=>i.has(c)?i.delete(c):i.add(c)),k=Array.from(i),$=n.equipped||{};const l=g?"∞":p;document.getElementById("user-balance").textContent=`🪙 ${l}`}catch(t){console.error(t)}finally{q()}},H=()=>{E("shop-avatars",w.avatars,"avatar"),E("shop-titles",w.titles,"title"),E("shop-borders",w.borders,"border"),X(),D()},D=async()=>{let t=document.getElementById("shop-consumables");if(!t){const e=document.getElementById("shop-borders").parentElement,r=document.createElement("section");r.innerHTML='<h2>🕵️ Теневой Рынок</h2><div class="shop-grid" id="shop-consumables"></div>',e.after(r),t=document.getElementById("shop-consumables")}if(t.innerHTML="",(((await m(b(f,`users/${u.uid}/stats`))).val()||{}).xp||0)<100&&!g){t.innerHTML='<p style="color:gray; width:100%;">🚫 Доступ закрыт. Требуется ранг "Стажёр" (100 XP).</p>';return}S.consumables.forEach(e=>{const r=document.createElement("div");r.className="shop-card";const v=k.includes(e.id);let o="";v?o='<button class="btn btn-secondary" disabled>Уже в сумке</button>':o=`<button class="btn buy-btn" ${p>=e.price?"":"disabled"} data-price="${e.price}" data-id="${e.id}">Купить ${e.price}🪙</button>`,r.innerHTML=`
            <div style="font-size: 2.5rem; margin-bottom: 10px;">${e.name.split(" ")[0]}</div> <!-- Иконка -->
            <h3>${e.name.substring(2)}</h3> <!-- Убираем иконку из названия -->
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 10px;">${e.desc}</p>
            ${o}
        `;const i=r.querySelector(".buy-btn");i&&i.addEventListener("click",()=>C(e)),t.appendChild(r)})},E=(t,a,s)=>{const n=document.getElementById(t);n.innerHTML="",a.forEach(e=>{let r=k.includes(e.id);if(g&&(r=!0),e.isHidden&&!r&&!g)return;const v=!e.isHidden;if(e.isBlackMarket){const h=new Date().getHours(),d=h>=22||h<6;if(!g&&!d)return}const o=document.createElement("div");o.className="shop-card",e.isBlackMarket&&o.classList.add("black-market-card");let i="";if(s==="avatar"&&(i=`<img src="${e.src}" class="shop-visual-img">`),s==="title"){let h="",d=e.value;e.value==="accountant"?$.title==="Счетовод"&&$.title_override?d=$.title_override:p<500?d="📉 Коплю на булочку":p<3e3?d="📈 Средний класс":p<7e3?d="💵 Счетовод":p<15e3?d="💰 Инвестор столовой":d="👑 Олигарх 2121":e.value==="Повелитель Света"?h="special-light":e.value==="Владыка Тьмы"&&(h="special-dark"),i=`<div class="shop-visual-text ${h}">${d}</div>`,e.value==="Счетовод"&&(i+='<div style="font-size:0.65rem; color:var(--accent-color); margin-top:5px; font-weight:bold;">Динамический</div>')}if(s==="border")if(["border-hydro","border-perimeter"].includes(e.class)){let d=e.class;e.class==="border-hydro"&&(d+=" hydro-liquid"),e.class==="border-perimeter"&&(d+=" perimeter-tier-6"),i=`<div class="shop-visual-box ${d}" style="
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
            `);let l=!1;s==="avatar"&&$.avatar===e.src&&(l=!0),s==="title"&&$.title===e.value&&(l=!0),s==="border"&&$.border===e.class&&(l=!0),s==="aura"&&$.aura===e.class&&(l=!0);let c="";if(l)c=`<button class="btn btn-secondary unequip-btn" data-type="${s}">Снять</button>`;else if(r)c=`<button class="btn equip-btn" data-type="${s}" data-id="${e.id}">Надеть</button>`;else if(v){const z=e.price===0||p>=e.price?"":"disabled";let A=`${e.price}🪙`;e.price===0&&(A="Награда"),c=`<button class="btn buy-btn" ${z} data-price="${e.price}" data-id="${e.id}">Купить ${A}</button>`}else c='<button class="btn btn-secondary" disabled>Эксклюзив</button>';o.innerHTML=`
            ${i}
            <h3>${e.name}</h3>
            ${c}
        `;const _=o.querySelector(".buy-btn");_&&_.addEventListener("click",()=>C(e));const T=o.querySelector(".equip-btn");T&&T.addEventListener("click",()=>F(e,s));const M=o.querySelector(".unequip-btn");M&&M.addEventListener("click",()=>U(s)),n.appendChild(o)})},C=async t=>{if(t.price>0&&p<t.price){y("Недостаточно монет!","error");return}if(confirm(`Купить "${t.name}" за ${t.price} монет?`)){I();try{const n=[...(await m(b(f,`users/${u.uid}/inventory`))).val()||[],t.id],e={};if(e[`users/${u.uid}/inventory`]=n,t.price>0){const r=p-t.price;e[`users/${u.uid}/stats/balance`]=r,e[`users/${u.uid}/stats/signature`]=O*7+r*3+2121}await L(b(f),e),y(`Вы купили ${t.name}!`),await B(),H()}catch(a){console.error(a),y("Ошибка покупки. Возможно, не хватает прав или монет.","error")}finally{q()}}},F=async(t,a)=>{I();try{const s={};a==="avatar"&&(s[`users/${u.uid}/equipped/avatar`]=t.src),a==="title"&&(s[`users/${u.uid}/equipped/title`]=t.value),a==="border"&&(s[`users/${u.uid}/equipped/border`]=t.class),a==="aura"&&(s[`users/${u.uid}/equipped/aura`]=t.class),await L(b(f),s),y("Успешно надето!"),await B(),H()}catch(s){console.error(s),y("Ошибка","error")}finally{q()}},U=async t=>{I();try{const a={};a[`users/${u.uid}/equipped/${t}`]=null,await L(b(f),a),y("Успешно снято!"),await B(),H()}catch(a){console.error(a),y("Ошибка при снятии предмета","error")}finally{q()}},X=()=>{document.getElementById("shop-auras");const t=document.getElementById("auras-section"),a=S.auras.filter(s=>{const n=k.includes(s.id);return!!(!s.isHidden||n||g)});if(a.length===0){t.classList.add("hidden");return}t.classList.remove("hidden"),E("shop-auras",a,"aura")};
