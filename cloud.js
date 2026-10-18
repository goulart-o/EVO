/* EVO — conexão com o Firebase (login Google + Firestore). Só age se firebase-config.js estiver preenchido. */
(function(){
  const cfg = window.EVO_FIREBASE;
  if(!cfg || !cfg.apiKey){ window.EVO_CLOUD = {configured:false}; return; }
  const V='10.12.5', base=`https://www.gstatic.com/firebasejs/${V}/`;
  const load=src=>new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=ko; document.head.appendChild(s); });
  const SKIP='evo:semconta';
  let resolveReady; window.EVO_READY = new Promise(r=>resolveReady=r);
  window.EVO_CLOUD = {configured:true};

  /* converte erros do Firebase para os códigos que o app entende */
  const mapErr=e=>{ const c=(e&&e.code)||''; const n=new Error(e&&e.message||'erro'); n.code = c.includes('permission')||c.includes('unauthenticated')?'invalid_argument': c.includes('unavailable')||c.includes('deadline')?'unavailable': c; return n; };
  /* Firestore não aceita listas dentro de listas nem undefined: objetos e listas vão em JSON no campo __j */
  const enc=d=>{ const out={}, j={}; Object.keys(d||{}).forEach(k=>{ const v=d[k]; if(v===undefined) return; if(v!==null && typeof v==='object') j[k]=v; else out[k]=v; }); if(Object.keys(j).length) out.__j=JSON.stringify(j); return out; };
  const dec=d=>{ if(!d) return d; const o=Object.assign({},d); if(typeof o.__j==='string'){ try{ Object.assign(o,JSON.parse(o.__j)); }catch(e){} } delete o.__j; return o; };
  const snap=s=>({id:s.id, exists:s.exists, data:()=>dec(s.data())});

  function shim(fs,user){
    const doc=path=>{ const r=fs.doc(path); return {
      path, id:r.id,
      get:async()=>{ try{ return snap(await r.get()); }catch(e){ throw mapErr(e); } },
      set:async d=>{ try{ await r.set(enc(d)); }catch(e){ throw mapErr(e); } },
      update:async d=>{ try{ const cur=await r.get(); await r.set(enc(Object.assign(dec(cur.data())||{},d))); }catch(e){ throw mapErr(e); } },
      delete:async()=>{ try{ await r.delete(); }catch(e){ throw mapErr(e); } },
      collection:c=>coll(path+'/'+c)
    }; };
    const coll=(path,q)=>{ const base=fs.collection(path); const cur=q||base; return {
      path, doc:id=>doc(path+'/'+(id||base.doc().id)),
      where:(f,op,v)=>coll(path,cur.where(f,op,v)), orderBy:(f,d)=>coll(path,cur.orderBy(f,d)), limit:n=>coll(path,cur.limit(n)),
      get:async()=>{ try{ const s=await cur.get(); return {docs:s.docs.map(snap), size:s.size}; }catch(e){ throw mapErr(e); } },
      add:async d=>{ const r=doc(path+'/'+base.doc().id); await r.set(d); return r; }
    }; };
    const db={doc,collection:c=>coll(c)};
    const u={ id:async()=>user.uid, me:async()=>({name:user.displayName||'',email:user.email||''}) };
    window.claude={ use:async n=> n==='db'?db : n==='user'?u : null };
  }

  /* tela de entrada */
  function gate(auth,provider){
    const el=document.createElement('div'); el.id='evoGate';
    el.innerHTML=`<style>#evoGate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#0F1720;color:#F4EFE6;font-family:Manrope,system-ui,sans-serif;padding:24px}
      #evoGate .b{max-width:360px;width:100%;text-align:center;display:grid;gap:14px}
      #evoGate h1{font-family:Outfit,system-ui;font-weight:300;letter-spacing:.5em;margin:8px 0 0;font-size:2.2rem;padding-left:.5em}
      #evoGate p{opacity:.75;margin:0 0 10px;line-height:1.5}
      #evoGate button{font:inherit;font-weight:600;border-radius:14px;padding:14px;cursor:pointer;border:1px solid #C8A96A}
      #evoGate .g{background:#C8A96A;color:#0F1720} #evoGate .s{background:none;color:#F4EFE6;border-color:#3a4552}
      #evoGate .e{color:#ffb4a8;font-size:.85rem;min-height:1em}</style>
      <div class="b"><img src="icons/icon-192.png" alt="" width="84" height="84" style="margin:auto;border-radius:22px"><h1>EVO</h1>
      <p>Entre com sua conta Google para salvar seus dados na nuvem, usar em vários aparelhos e se conectar ao seu professor ou aos seus alunos.</p>
      <button class="g" id="gIn">Entrar com Google</button><button class="s" id="gSkip">Usar sem conta (só neste aparelho)</button><div class="e" id="gErr"></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#gIn').onclick=async()=>{ try{ await auth.signInWithPopup(provider); }catch(e){ if(String(e.code).includes('popup')) { try{ await auth.signInWithRedirect(provider); }catch(_){} } else el.querySelector('#gErr').textContent='Não foi possível entrar: '+(e.message||e.code); } };
    el.querySelector('#gSkip').onclick=()=>{ try{localStorage.setItem(SKIP,'1')}catch(e){} el.remove(); resolveReady(); };
  }

  (async()=>{
    try{
      await load(base+'firebase-app-compat.js'); await Promise.all([load(base+'firebase-auth-compat.js'),load(base+'firebase-firestore-compat.js')]);
      firebase.initializeApp(cfg);
      const auth=firebase.auth(), fs=firebase.firestore(), provider=new firebase.auth.GoogleAuthProvider();
      try{ fs.enablePersistence({synchronizeTabs:true}).catch(()=>{}); }catch(e){}
      window.EVO_AUTH={ login:()=>{ try{localStorage.removeItem(SKIP)}catch(e){} location.reload(); }, logout:async()=>{ await auth.signOut(); location.reload(); }, user:null };
      let first=true;
      auth.onAuthStateChanged(user=>{
        if(!first) return; first=false;
        if(user){ window.EVO_AUTH.user={nome:user.displayName,email:user.email}; shim(fs,user); resolveReady(); return; }
        let skip=false; try{ skip=localStorage.getItem(SKIP)==='1'; }catch(e){}
        if(skip){ resolveReady(); return; }
        const wait=()=>{ if(document.body) gate(auth,provider); else setTimeout(wait,30); }; wait();
        auth.onAuthStateChanged(u=>{ if(u) location.reload(); });
      });
    }catch(e){ console.error('Firebase indisponível',e); resolveReady(); }
  })();
})();
