import{s as g,c as l,o as h,e as c,g as r,r as a,d,h as p,u as f,a as w}from"./firebase-init-BZ8_e8Ao.js";window.innerWidth>900&&window.location.replace("dashboard.html");const v=document.getElementById("mobile-admin-panel"),y=document.getElementById("menu-logout-btn"),b=document.getElementById("close-menu-btn");b.addEventListener("click",()=>{window.history.back()});y.addEventListener("click",()=>{g(l).then(()=>window.location.href="index.html")});h(l,async t=>{if(t){c();try{const o=await r(a(d,"roles/"+t.uid));o.exists()&&o.val()==="admin"&&x(t.uid)}catch(o){console.error(o)}finally{p()}}else window.location.href="index.html"});async function x(t){v.classList.remove("hidden"),((e,n)=>{const i=document.getElementById(e);i.checked=localStorage.getItem(n)!=="false",i.addEventListener("change",m=>localStorage.setItem(n,m.target.checked))})("mob-singularity","pref_show_singularity");const s=(await r(a(d,`users/${t}/equipped`))).val()||{};if(s.title==="accountant"){const e=s.title_override||"",n=document.getElementById("mob-accountant-wrapper");n.innerHTML=`
            <div style="margin-top: 15px; border-top: 1px dashed #555; padding-top: 10px;">
                <p style="color:#00d5ff; font-size:0.9rem; margin-bottom:5px;">Статус Счетовода</p>
                <select id="mob-acc-select" style="width:100%; padding:10px; background:#222; color:#fff; border:1px solid #444; border-radius:8px;">
                    <option value="" ${e===""?"selected":""}>-- Авто --</option>
                    <option value="📉 Коплю на булочку" ${e==="📉 Коплю на булочку"?"selected":""}>📉 Коплю на булочку</option>
                    <option value="📈 Средний класс" ${e==="📈 Средний класс"?"selected":""}>📈 Средний класс</option>
                    <option value="💰 Счетовод" ${e==="💰 Счетовод"?"selected":""}>💰 Счетовод</option>
                    <option value="💰 Инвестор столовой" ${e==="💰 Инвестор столовой"?"selected":""}>💰 Инвестор столовой</option>
                    <option value="👑 Олигарх 2121" ${e==="👑 Олигарх 2121"?"selected":""}>👑 Олигарх 2121</option>
                </select>
            </div>
        `,document.getElementById("mob-acc-select").addEventListener("change",async i=>{c(),await f(a(d,`users/${t}/equipped`),{title_override:i.target.value||null}),p(),w("Статус обновлен!")})}}
