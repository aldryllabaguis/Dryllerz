'use strict';
// Verified student portfolio content. Replace concepts with owner-confirmed work.
const skills={
  'Programming foundations':['Java','Variables & data types','Control flow','Problem solving'],
  'Web exploration':['HTML','CSS','Responsive layouts','Accessible interfaces'],
  'Workflow & tools':['VS Code','Debugging','Documentation','Version control basics']
};
const projects=[
 ['Programming practice','A space for completed Java exercises and problem-solving writeups. Replace with verified activity links as available.','Java,Algorithms,Coursework','CODING STUDY'],
 ['Interface experiments','A concept gallery for web layouts and interactive interface experiments; project imagery is illustrative.','HTML,CSS,Responsive','DESIGN CONCEPT'],
 ['Project documentation','Documentation layout for class projects, design decisions, and screenshots that can be added after submission.','Documentation,Projects,Research','ACADEMIC ARCHIVE']
];
const journey=[
 ['2026 / PRESENT','Programming foundations','Jose Rizal University',['Studying the building blocks of Java programming','Practicing debugging and step-by-step problem solving'],'Java,Learning'],
 ['NEXT / IN PROGRESS','Building & documenting','Personal learning roadmap',['Create a small working application','Add screenshots and reflections after each milestone'],'Projects,Documentation']
];
const reflections=[
 ['Prelim Term','Getting started with programming','Writing prompt: Add your own experience with foundational lessons, exercises and the challenges you faced.'],
 ['Midterm Term','Practicing control flow','Writing prompt: Describe your real midterm activities and how your understanding changed.'],
 ['Final Term','Applying what you learned','Writing prompt: Reflect on your final tasks, improvements and next learning goals.']
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tags=s=>'<div class="tags">'+s.split(',').map(x=>'<span class="tag">'+esc(x.trim())+'</span>').join('')+'</div>';
document.getElementById('skills').innerHTML=Object.entries(skills).map(([k,v])=>'<div class="card pad"><span class="mini">'+esc(k.toUpperCase())+'</span>'+tags(v.join(','))+'</div>').join('');
document.getElementById('projects').innerHTML=projects.map((p,i)=>'<article class="card project"><div class="project-art"><small>'+esc(p[3])+'</small>'+String(i+1).padStart(2,'0')+'</div><div class="project-copy"><h3>'+esc(p[0])+'</h3><p>'+esc(p[1])+'</p>'+tags(p[2])+'<details><summary>View concept details ↓</summary><p>'+esc(p[1])+'</p><p>Illustrative design concept. Add actual results and a verified project link before presenting this as completed work.</p></details></div></article>').join('');
document.getElementById('experience-list').innerHTML=journey.map(j=>'<article class="job"><span class="date">'+esc(j[0])+'</span><div><h3>'+esc(j[1])+'</h3><h4>'+esc(j[2])+'</h4><ul>'+j[3].map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+tags(j[4])+'</div></article>').join('');
document.getElementById('reflection-list').innerHTML=reflections.map((r,i)=>'<article class="card pad"><div class="reflection-label">0'+(i+1)+' / 03 — WRITING GUIDE</div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p><div class="reflection-prompt">'+esc(r[2])+'</div></article>').join('');
const themeButton=document.getElementById('theme');const saved=localStorage.getItem('theme');let dark=saved==='dark';
function setTheme(){document.documentElement.dataset.theme=dark?'dark':'light';themeButton.textContent=dark?'☀':'☾';localStorage.setItem('theme',dark?'dark':'light')}
themeButton.onclick=()=>{dark=!dark;setTheme()};setTheme();
const menu=document.getElementById('menu'),nav=document.getElementById('nav');
menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.textContent=open?'×':'☰'};
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));
const words=['Learning through code','Practicing Java fundamentals','Documenting the journey'];let wi=0;
const output=document.getElementById('typing');
if(output&&!matchMedia('(prefers-reduced-motion: reduce)').matches){setInterval(()=>{wi=(wi+1)%words.length;output.textContent=words[wi]},3400)}
document.querySelectorAll('[data-file]').forEach(async el=>{const path=el.dataset.file;try{const r=await fetch(path,{method:'HEAD'});if(r.ok&&(r.headers.get('content-type')||'').includes('pdf')){el.innerHTML='<iframe title="PDF preview" loading="lazy" src="'+path+'"></iframe><a href="'+path+'" download>Download PDF ↓</a>'}}catch{}});
