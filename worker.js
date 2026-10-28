// Momentum: the whole app in one Cloudflare Worker (front end + API + D1).
const HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Momentum</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--sun:#FFD93D;--ink:#1B1464;--coral:#FF4D6D;--blue:#3A4DFF;--white:#fff;--mint:#2EE6A6}\n*{box-sizing:border-box}\nhtml{-webkit-text-size-adjust:100%}\nbody{margin:0;background:var(--sun);color:var(--ink);font:500 17px/1.5 'DM Sans',system-ui,sans-serif}\nh1,h2,h3{font-family:'Archivo Black',Impact,sans-serif;font-weight:400;line-height:1.05;margin:0}\nmain{max-width:640px;margin:0 auto;padding:20px 16px 110px}\nbutton,input,textarea{font:inherit;color:inherit}\n:focus-visible{outline:4px solid var(--coral);outline-offset:2px}\n.card{background:var(--white);border:3px solid var(--ink);border-radius:18px;padding:18px;margin-top:18px;box-shadow:6px 6px 0 var(--ink)}\n.hero{background:var(--blue);color:var(--sun);border:3px solid var(--ink);border-radius:28px 28px 28px 6px;padding:26px 22px;margin-top:18px;box-shadow:8px 8px 0 var(--ink)}\n.hero q{display:block;font:400 clamp(28px,8vw,44px)/1.08 'Archivo Black',Impact,sans-serif;quotes:none}\n.hero p{margin:14px 0 0;color:var(--white);font-weight:700}\n.btn{background:var(--coral);color:var(--white);border:3px solid var(--ink);border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;box-shadow:3px 3px 0 var(--ink)}\n.btn:active{transform:translate(3px,3px);box-shadow:0 0 0 var(--ink)}\n.btn.alt{background:var(--white);color:var(--ink)}\n.btn.sm{padding:4px 10px;font-size:14px}\ninput,textarea{width:100%;background:var(--white);border:3px solid var(--ink);border-radius:12px;padding:10px 12px;margin:6px 0}\ntextarea{min-height:110px;resize:vertical}\n.row{display:flex;gap:10px;align-items:center}\n.row>input{flex:1;margin:0}\n.top{display:flex;justify-content:space-between;align-items:center}\n.top h2{font-size:30px}\n.tabs{position:fixed;left:0;right:0;bottom:0;background:var(--ink);display:flex;justify-content:center;gap:6px;padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px))}\n.tabs button{flex:1;max-width:150px;background:transparent;border:3px solid transparent;border-radius:12px;color:var(--white);font-weight:700;padding:8px 4px;cursor:pointer}\n.tabs button[aria-current=true]{background:var(--sun);color:var(--ink)}\n.item{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:2px dashed var(--ink)}\n.item:first-child{border-top:0}\n.item>span{flex:1;overflow-wrap:anywhere}\n.chk{width:34px;height:34px;flex:none;border:3px solid var(--ink);border-radius:10px;background:var(--white);font-size:20px;line-height:1;cursor:pointer}\n.chk[aria-pressed=true]{background:var(--mint)}\n.flame{font-family:'Archivo Black',sans-serif;background:var(--sun);border:3px solid var(--ink);border-radius:999px;padding:2px 12px;white-space:nowrap}\n.moods{display:flex;gap:8px;margin:8px 0}\n.moods button{flex:1;font-size:26px;padding:6px 0;border:3px solid var(--ink);border-radius:12px;background:var(--white);cursor:pointer}\n.moods button[aria-pressed=true]{background:var(--sun);box-shadow:3px 3px 0 var(--ink)}\n.seg{display:flex;gap:8px}\n.err{background:var(--coral);color:var(--white);border:3px solid var(--ink);border-radius:12px;padding:8px 12px;margin-top:14px;font-weight:700}\n.muted{opacity:.7;font-size:15px}\n.done .t{text-decoration:line-through;opacity:.6}\n.pop{position:fixed;pointer-events:none;font-size:28px;animation:pop 900ms ease-out forwards;z-index:9}\n@keyframes pop{to{transform:translate(var(--x),var(--y)) rotate(240deg);opacity:0}}\n@media (prefers-reduced-motion:reduce){.pop{display:none}.btn:active{transform:none}}\n</style>\n</head>\n<body>\n<main id=\"app\"></main>\n<script>\nconst Q=[[\"It always seems impossible until it's done.\",\"Nelson Mandela\"],[\"Well done is better than well said.\",\"Benjamin Franklin\"],[\"The best way out is always through.\",\"Robert Frost\"],[\"Fall seven times, stand up eight.\",\"Japanese proverb\"],[\"What you do today can improve all your tomorrows.\",\"Ralph Marston\"],[\"You miss 100% of the shots you don't take.\",\"Wayne Gretzky\"],[\"Do what you can, with what you have, where you are.\",\"Theodore Roosevelt\"],[\"Small deeds done are better than great deeds planned.\",\"Peter Marshall\"]];\nconst AFF=[\"I show up even when it's hard.\",\"Progress beats perfection.\",\"I am building something that lasts.\",\"Today I choose one brave action.\",\"My effort adds up.\",\"I can do hard things, one step at a time.\",\"I am allowed to start again.\"];\nconst MOODS=[\"\ud83d\ude16\",\"\ud83d\ude15\",\"\ud83d\ude10\",\"\ud83d\ude42\",\"\ud83e\udd29\"];\nconst S={user:null,tab:'today',mode:'login',habits:[],goals:[],entries:[],kind:'journal',mood:3,draft:'',err:'',ready:false};\nconst $=s=>document.querySelector(s);\nconst esc=t=>String(t).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\nconst day=(o=0)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toLocaleDateString('en-CA')};\nconst doy=()=>Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/864e5);\nconst api=async(p,m='GET',b)=>{const r=await fetch('/api/'+p,{method:m,headers:{'content-type':'application/json'},body:b?JSON.stringify(b):undefined});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||'Something went wrong');e.status=r.status;throw e}return d};\nconst streak=days=>{const s=new Set(days);let o=s.has(day())?0:-1,n=0;while(s.has(day(o))){n++;o--}return n};\nfunction burst(el){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const r=el.getBoundingClientRect();for(let i=0;i<12;i++){const p=document.createElement('div');p.className='pop';p.textContent=['\ud83d\udd25','\u2b50','\u26a1','\ud83c\udf89'][i%4];p.style.left=r.left+r.width/2+'px';p.style.top=r.top+'px';p.style.setProperty('--x',(Math.random()*240-120)+'px');p.style.setProperty('--y',(-60-Math.random()*140)+'px');document.body.appendChild(p);setTimeout(()=>p.remove(),950)}}\n\nasync function load(){const[h,g,j]=await Promise.all([api('habits'),api('goals'),api('journal')]);S.habits=h;S.goals=g;S.entries=j}\nasync function boot(){try{S.user=await api('me');await load()}catch{S.user=null}S.ready=true;render()}\n\nfunction habitRow(h){const on=h.days.includes(day()),n=streak(h.days);return `<div class=\"item\"><button class=\"chk\" data-a=\"tog\" data-id=\"${h.id}\" aria-pressed=\"${on}\" aria-label=\"Mark ${esc(h.name)} done today\">${on?'\u2713':''}</button><span>${esc(h.name)}</span><span class=\"flame\">\ud83d\udd25 ${n}</span>${S.tab==='habits'?`<button class=\"btn alt sm\" data-a=\"delh\" data-id=\"${h.id}\" aria-label=\"Delete ${esc(h.name)}\">Delete</button>`:''}</div>`}\n\nfunction auth(){const su=S.mode==='signup';return `<h1 style=\"font-size:clamp(48px,15vw,84px);margin-top:30px\">Show up.<br>Again.</h1><p style=\"font-weight:700\">Your daily push: quotes, journal, habits, goals.</p><div class=\"card\">${su?'<label>Name<input id=\"n\" autocomplete=\"name\"></label>':''}<label>Email<input id=\"e\" type=\"email\" autocomplete=\"email\"></label><label>Password<input id=\"p\" type=\"password\" autocomplete=\"${su?'new-password':'current-password'}\" placeholder=\"8+ characters\"></label>${S.err?`<div class=\"err\" role=\"alert\">${esc(S.err)}</div>`:''}<div class=\"row\" style=\"margin-top:14px\"><button class=\"btn\" data-a=\"auth\">${su?'Create account':'Log in'}</button><button class=\"btn alt\" data-a=\"mode\">${su?'I have an account':'New here? Sign up'}</button></div></div>`}\n\nfunction today(){const [q,a]=Q[doy()%Q.length],name=S.user.name?', '+esc(S.user.name):'';const done=S.habits.filter(h=>h.days.includes(day())).length;\nreturn `<div class=\"top\"><h2>Let's go${name}</h2><button class=\"btn alt sm\" data-a=\"out\">Log out</button></div>\n<section class=\"hero\" aria-label=\"Quote of the day\"><q>${esc(q)}</q><p>${esc(a)}</p><div class=\"row\" style=\"margin-top:16px\"><button class=\"btn alt sm\" data-a=\"share\">Share</button></div></section>\n<div class=\"card\"><h3>Today's affirmation</h3><p style=\"font-size:20px;font-weight:700;margin:10px 0 0\">${AFF[doy()%AFF.length]}</p></div>\n<div class=\"card\"><h3>Habits \u00b7 ${done}/${S.habits.length}</h3>${S.habits.length?S.habits.map(habitRow).join(''):'<p>No habits yet. Add your first one in the Habits tab.</p>'}</div>`}\n\nfunction journal(){const list=S.entries.filter(e=>e.kind===S.kind);\nreturn `<h2>Write it out</h2><div class=\"card\"><div class=\"seg\"><button class=\"btn ${S.kind==='journal'?'':'alt'}\" data-a=\"kind\" data-id=\"journal\">Journal</button><button class=\"btn ${S.kind==='gratitude'?'':'alt'}\" data-a=\"kind\" data-id=\"gratitude\">Gratitude</button></div>\n<p style=\"margin:14px 0 0;font-weight:700\">How are you feeling?</p><div class=\"moods\">${MOODS.map((m,i)=>`<button data-a=\"mood\" data-id=\"${i+1}\" aria-pressed=\"${S.mood===i+1}\" aria-label=\"Mood ${i+1} of 5\">${m}</button>`).join('')}</div>\n<textarea id=\"d\" placeholder=\"${S.kind==='gratitude'?'Three things I am grateful for today\u2026':'What is on your mind today?'}\">${esc(S.draft)}</textarea>${S.err?`<div class=\"err\" role=\"alert\">${esc(S.err)}</div>`:''}<button class=\"btn\" style=\"margin-top:10px\" data-a=\"save\">Save entry</button></div>\n<div class=\"card\"><h3>Past entries</h3>${list.length?list.map(e=>`<div class=\"item\"><span><b>${MOODS[(e.mood||3)-1]} ${esc(e.day)}</b><br>${esc(e.body)}</span><button class=\"btn alt sm\" data-a=\"dele\" data-id=\"${e.id}\" aria-label=\"Delete entry from ${esc(e.day)}\">Delete</button></div>`).join(''):'<p>Nothing here yet. Your first entry takes one minute.</p>'}</div>`}\n\nfunction habits(){return `<h2>Habits</h2><div class=\"card\"><div class=\"row\"><input id=\"hn\" placeholder=\"e.g. Read 10 pages\" aria-label=\"New habit\"><button class=\"btn\" data-a=\"addh\">Add</button></div>${S.err?`<div class=\"err\" role=\"alert\">${esc(S.err)}</div>`:''}</div><div class=\"card\">${S.habits.length?S.habits.map(habitRow).join(''):'<p>Add a habit above, then check it off daily to build a streak.</p>'}</div>`}\n\nfunction goals(){return `<h2>Goals</h2><div class=\"card\"><div class=\"row\"><input id=\"gn\" placeholder=\"e.g. Land 3 new clients\" aria-label=\"New goal\"><button class=\"btn\" data-a=\"addg\">Add</button></div>${S.err?`<div class=\"err\" role=\"alert\">${esc(S.err)}</div>`:''}</div><div class=\"card\">${S.goals.length?S.goals.map(g=>`<div class=\"item ${g.done?'done':''}\"><button class=\"chk\" data-a=\"tg\" data-id=\"${g.id}\" aria-pressed=\"${!!g.done}\" aria-label=\"Mark goal complete\">${g.done?'\u2713':''}</button><span class=\"t\">${esc(g.title)}</span><button class=\"btn alt sm\" data-a=\"delg\" data-id=\"${g.id}\" aria-label=\"Delete goal\">Delete</button></div>`).join(''):'<p>Set one goal you want to hit this month.</p>'}</div>`}\n\nfunction render(){const a=$('#app');if(!S.ready){a.innerHTML='';return}\nif(!S.user){a.innerHTML=auth();return}\nconst v={today,journal,habits,goals}[S.tab]();\na.innerHTML=v+`<nav class=\"tabs\" aria-label=\"Sections\">${[['today','Today'],['journal','Journal'],['habits','Habits'],['goals','Goals']].map(([k,l])=>`<button data-a=\"tab\" data-id=\"${k}\" ${S.tab===k?'aria-current=\"true\"':''}>${l}</button>`).join('')}</nav>`}\n\ndocument.addEventListener('input',e=>{if(e.target.id==='d')S.draft=e.target.value});\ndocument.addEventListener('click',async e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,id=t.dataset.id;S.err='';\ntry{\nif(a==='mode'){S.mode=S.mode==='login'?'signup':'login'}\nelse if(a==='auth'){await api(S.mode,'POST',{name:$('#n')?.value,email:$('#e').value,password:$('#p').value});S.user=await api('me');await load()}\nelse if(a==='out'){await api('logout','POST');S.user=null}\nelse if(a==='tab'){S.tab=id}\nelse if(a==='kind'){S.kind=id}\nelse if(a==='mood'){S.mood=+id}\nelse if(a==='save'){await api('journal','POST',{kind:S.kind,mood:S.mood,day:day(),body:S.draft});S.draft='';await load()}\nelse if(a==='dele'){await api('journal/'+id,'DELETE');await load()}\nelse if(a==='tog'){const was=t.getAttribute('aria-pressed')==='true';await api(`habits/${id}/toggle`,'POST',{day:day()});await load();render();if(!was)burst(document.querySelector(`[data-a=tog][data-id=\"${id}\"]`)||t);return}\nelse if(a==='addh'){await api('habits','POST',{name:$('#hn').value});await load()}\nelse if(a==='delh'){await api('habits/'+id,'DELETE');await load()}\nelse if(a==='addg'){await api('goals','POST',{title:$('#gn').value});await load()}\nelse if(a==='tg'){await api(`goals/${id}/toggle`,'POST',{});await load()}\nelse if(a==='delg'){await api('goals/'+id,'DELETE');await load()}\nelse if(a==='share'){const[q,w]=Q[doy()%Q.length],txt=`\"${q}\" \u2014 ${w}`;if(navigator.share)await navigator.share({text:txt}).catch(()=>{});else{await navigator.clipboard.writeText(txt);t.textContent='Copied'}return}\n}catch(x){S.err=x.message;if(x.status===401&&S.user){S.user=null}}\nrender()});\nboot();\n</script>\n</body>\n</html>\n";
const SCHEMA = [
 "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,name TEXT,pw TEXT NOT NULL,salt TEXT NOT NULL,created INTEGER);",
 "CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);",
 "CREATE TABLE IF NOT EXISTS journal(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,kind TEXT NOT NULL DEFAULT 'journal',day TEXT NOT NULL,mood INTEGER,body TEXT NOT NULL,created INTEGER);",
 "CREATE TABLE IF NOT EXISTS habits(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,created INTEGER);",
 "CREATE TABLE IF NOT EXISTS habit_logs(habit_id INTEGER NOT NULL,day TEXT NOT NULL,PRIMARY KEY(habit_id,day));",
 "CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,done INTEGER NOT NULL DEFAULT 0,created INTEGER);",
 "CREATE INDEX IF NOT EXISTS j_user ON journal(user_id);",
 "CREATE INDEX IF NOT EXISTS h_user ON habits(user_id);",
 "CREATE INDEX IF NOT EXISTS g_user ON goals(user_id);"
];
let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch(SCHEMA.map(s => db.prepare(s)));
  ready = true;
}

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', ...h } });
const fail = (m, s = 400) => json({ error: m }, s);

async function hash(pw, salt) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256));
}

async function start(db, userId) {
  const t = rnd(24);
  await db.prepare('INSERT INTO sessions VALUES(?1,?2,?3)').bind(t, userId, Date.now() + 2592e6).run();
  return json({ ok: true }, 200, { 'set-cookie': `s=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` });
}

async function api(request, env, path) {
  const db = env.DB, m = request.method;
  await init(db);
  const [res, rid, act] = path;
  const id = +rid;
  const b = m === 'GET' || m === 'DELETE' ? {} : await request.json().catch(() => ({}));

  if (res === 'signup' && m === 'POST') {
    const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email');
    if (pw.length < 8) return fail('Password needs at least 8 characters');
    const salt = rnd(16);
    try {
      const r = await db.prepare('INSERT INTO users(email,name,pw,salt,created) VALUES(?1,?2,?3,?4,?5)')
        .bind(email, String(b.name || '').trim().slice(0, 40), await hash(pw, salt), salt, Date.now()).run();
      return start(db, r.meta.last_row_id);
    } catch { return fail('That email already has an account', 409); }
  }
  if (res === 'login' && m === 'POST') {
    const u = await db.prepare('SELECT id,pw,salt FROM users WHERE email=?1').bind(String(b.email || '').trim().toLowerCase()).first();
    if (!u || await hash(String(b.password || ''), u.salt) !== u.pw) return fail('Wrong email or password', 401);
    return start(db, u.id);
  }

  const c = (request.headers.get('cookie') || '').match(/(?:^|; )s=([a-f0-9]+)/);
  const s = c && await db.prepare('SELECT user_id FROM sessions WHERE token=?1 AND expires>?2').bind(c[1], Date.now()).first();
  if (!s) return fail('Not signed in', 401);
  const uid = s.user_id;
  const own = t => db.prepare(`SELECT id FROM ${t} WHERE id=?1 AND user_id=?2`).bind(id, uid).first();

  if (res === 'logout') {
    await db.prepare('DELETE FROM sessions WHERE token=?1').bind(c[1]).run();
    return json({ ok: true }, 200, { 'set-cookie': 's=; Path=/; Max-Age=0' });
  }
  if (res === 'me') return json(await db.prepare('SELECT name,email FROM users WHERE id=?1').bind(uid).first());

  if (res === 'journal') {
    if (m === 'GET') return json((await db.prepare('SELECT id,kind,day,mood,body FROM journal WHERE user_id=?1 ORDER BY id DESC LIMIT 60').bind(uid).all()).results);
    if (m === 'POST') {
      const body = String(b.body || '').trim().slice(0, 5000);
      if (!body) return fail('Write something first');
      await db.prepare('INSERT INTO journal(user_id,kind,day,mood,body,created) VALUES(?1,?2,?3,?4,?5,?6)')
        .bind(uid, b.kind === 'gratitude' ? 'gratitude' : 'journal', String(b.day).slice(0, 10), Math.min(5, Math.max(1, +b.mood || 3)), body, Date.now()).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') { await db.prepare('DELETE FROM journal WHERE id=?1 AND user_id=?2').bind(id, uid).run(); return json({ ok: true }); }
  }

  if (res === 'habits') {
    if (m === 'GET') {
      const rows = (await db.prepare("SELECT h.id,h.name,COALESCE(group_concat(l.day),'') days FROM habits h LEFT JOIN habit_logs l ON l.habit_id=h.id WHERE h.user_id=?1 GROUP BY h.id ORDER BY h.id").bind(uid).all()).results;
      return json(rows.map(h => ({ ...h, days: h.days ? h.days.split(',') : [] })));
    }
    if (m === 'POST' && !rid) {
      const n = String(b.name || '').trim().slice(0, 60);
      if (!n) return fail('Name your habit');
      await db.prepare('INSERT INTO habits(user_id,name,created) VALUES(?1,?2,?3)').bind(uid, n, Date.now()).run();
      return json({ ok: true });
    }
    if (m === 'POST' && act === 'toggle') {
      if (!await own('habits')) return fail('Not found', 404);
      const d = String(b.day).slice(0, 10);
      const r = await db.prepare('DELETE FROM habit_logs WHERE habit_id=?1 AND day=?2').bind(id, d).run();
      if (!r.meta.changes) await db.prepare('INSERT INTO habit_logs VALUES(?1,?2)').bind(id, d).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      if (!await own('habits')) return fail('Not found', 404);
      await db.batch([db.prepare('DELETE FROM habit_logs WHERE habit_id=?1').bind(id), db.prepare('DELETE FROM habits WHERE id=?1').bind(id)]);
      return json({ ok: true });
    }
  }

  if (res === 'goals') {
    if (m === 'GET') return json((await db.prepare('SELECT id,title,done FROM goals WHERE user_id=?1 ORDER BY done,id').bind(uid).all()).results);
    if (m === 'POST' && !rid) {
      const t = String(b.title || '').trim().slice(0, 120);
      if (!t) return fail('Name your goal');
      await db.prepare('INSERT INTO goals(user_id,title,created) VALUES(?1,?2,?3)').bind(uid, t, Date.now()).run();
      return json({ ok: true });
    }
    if (m === 'POST' && act === 'toggle') { await db.prepare('UPDATE goals SET done=1-done WHERE id=?1 AND user_id=?2').bind(id, uid).run(); return json({ ok: true }); }
    if (m === 'DELETE') { await db.prepare('DELETE FROM goals WHERE id=?1 AND user_id=?2').bind(id, uid).run(); return json({ ok: true }); }
  }

  return fail('Not found', 404);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      return api(request, env, pathname.slice(5).split('/').filter(Boolean));
    }
    return new Response(HTML, { headers: { 'content-type': 'text/html;charset=utf-8' } });
  }
};
