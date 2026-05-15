import{s as g,c as l,o as h,e as r,g as p,r as d,d as c,h as m,u as w,a as f}from"./firebase-init-Cb55eJg2.js";window.innerWidth>900&&window.location.replace("dashboard.html");const v=document.getElementById("mobile-admin-panel"),y=document.getElementById("menu-logout-btn"),b=document.getElementById("close-menu-btn");b.addEventListener("click",()=>{window.history.back()});y.addEventListener("click",()=>{g(l).then(()=>window.location.href="index.html")});h(l,async t=>{if(t){r();try{const o=await p(d(c,"roles/"+t.uid));o.exists()&&o.val()==="admin"&&E(t.uid)}catch(o){console.error(o)}finally{m()}}else window.location.href="index.html"});async function E(t){v.classList.remove("hidden"),((e,a)=>{const i=document.getElementById(e);i.checked=localStorage.getItem(a)!=="false",i.addEventListener("change",u=>localStorage.setItem(a,u.target.checked))})("mob-singularity","pref_show_singularity");const n=document.getElementById("mob-raw-cosmetics");n&&(n.checked=localStorage.getItem("pref_raw_cosmetics")==="true",n.addEventListener("change",e=>localStorage.setItem("pref_raw_cosmetics",e.target.checked)));const s=(await p(d(c,`users/${t}/equipped`))).val()||{};if(s.title==="accountant"){const e=s.title_override||"",a=document.getElementById("mob-accountant-wrapper");a.innerHTML=`
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
        `,document.getElementById("mob-acc-select").addEventListener("change",async i=>{r(),await w(d(c,`users/${t}/equipped`),{title_override:i.target.value||null}),m(),f("Статус обновлен!")})}}
