'use strict';
document.documentElement.classList.add('has-js');

/* Portfolio content is deliberately honest: unfinished work stays labeled as in progress. */
const skillGroups = [
  {number:'01', title:'Programming foundations', items:['Java','Variables & data types','Control flow','Problem solving']},
  {number:'02', title:'Web exploration', items:['HTML','CSS','Responsive layouts','Accessible interfaces']},
  {number:'03', title:'Workflow & tools', items:['VS Code','Debugging','Documentation','Version control basics']}
];

const projects = [
  {
    number:'01',glyph:'{ }',label:'CODING STUDY',
    name:'Programming practice',
    summary:'A growing space for Java exercises and problem-solving write-ups from coursework.',
    tech:['Java','Algorithms','Coursework'],
    detail:'Individual activity links and verified outputs will be added as they are completed. This is a learning collection, not a claim of a finished app.'
  },
  {
    number:'02',glyph:'</>',label:'DESIGN EXPLORATION',
    name:'Interface experiments',
    summary:'Explorations in web layouts, interaction patterns and responsive interfaces.',
    tech:['HTML','CSS','Responsive'],
    detail:'This is an illustrative design exploration. Finished demos and source links can be added after they have been reviewed.'
  },
  {
    number:'03',glyph:'//',label:'ACADEMIC ARCHIVE',
    name:'Project documentation',
    summary:'A home for project reports, screenshots, decisions and lessons learned.',
    tech:['Documentation','Projects','Research'],
    detail:'The archive structure is ready. Supporting documents and actual project artifacts have not yet been provided.'
  }
];

const journey = [
  {
    year:'2026 / PRESENT', name:'Learning the foundations', where:'Jose Rizal University',
    bullets:['Studying the building blocks of Java programming','Practicing debugging and step-by-step problem solving'],
    tags:['Java','Learning']
  },
  {
    year:'NEXT / IN PROGRESS', name:'Building & documenting',where:'Personal learning roadmap',
    bullets:['Create small working applications','Add screenshots and written reflections as milestones are completed'],
    tags:['Projects','Documentation']
  }
];

const reflections = [
  {number:'01',term:'Prelim',title:'The beginning',text:'Programming foundations and first steps in problem solving.',prompt:'Reflection space: the lessons, exercises and challenges experienced during the prelim term.'},
  {number:'02',term:'Midterm',title:'Finding the flow',text:'Practicing conditions, repetition and logical thinking.',prompt:'Reflection space: actual midterm activities and how understanding of control flow developed.'},
  {number:'03',term:'Final',title:'Looking forward',text:'Connecting concepts, improving habits and planning what to build next.',prompt:'Reflection space: completed final tasks, improvements and next learning goals.'}
];

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char]);

const chipList = items => '<div class="chips">'+items.map(item=>'<span class="chip">'+escapeHTML(item)+'</span>').join('')+'</div>';

const $ = id => document.getElementById(id);

if ($('skills')) {
  $('skills').innerHTML=skillGroups.map(group=>
    '<article class="skill-card reveal"><span class="skill-number">'+escapeHTML(group.number)+' / SKILL SET</span>'+
    '<h3>'+escapeHTML(group.title)+'</h3>'+chipList(group.items)+'</article>'
  ).join('');
}

if ($('projects')) {
  $('projects').innerHTML=projects.map(project=>
    '<article class="project-card reveal">'+
      '<div class="project-art" aria-hidden="true"><span class="art-index">'+escapeHTML(project.number)+' / 03</span>'+
      '<span class="project-glyph">'+escapeHTML(project.glyph)+'</span>'+
      '<span class="art-label">'+escapeHTML(project.label)+'</span></div>'+
      '<div class="project-info"><span class="card-kicker">EXPLORATION / '+escapeHTML(project.number)+'</span>'+
      '<h3>'+escapeHTML(project.name)+'</h3><p>'+escapeHTML(project.summary)+'</p>'+
      chipList(project.tech)+
      '<details><summary>Explore this concept</summary><p>'+escapeHTML(project.detail)+'</p></details>'+
      '</div></article>'
  ).join('');
}

if ($('experience-list')) {
  $('experience-list').innerHTML=journey.map(item=>
    '<article class="timeline-item reveal"><span class="timeline-year">'+escapeHTML(item.year)+'</span><div>'+
    '<h3>'+escapeHTML(item.name)+'</h3><h4>'+escapeHTML(item.where)+'</h4>'+
    '<ul>'+item.bullets.map(bullet=>'<li>'+escapeHTML(bullet)+'</li>').join('')+'</ul>'+
    chipList(item.tags)+'</div></article>'
  ).join('');
}

if ($('reflection-list')) {
  $('reflection-list').innerHTML=reflections.map(item=>
    '<article class="reflection-card reveal" data-number="'+escapeHTML(item.number)+'">'+
    '<span class="card-kicker">'+escapeHTML(item.number)+' / 03 — '+escapeHTML(item.term.toUpperCase())+'</span>'+
    '<h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.text)+'</p>'+
    '<div class="reflection-prompt">'+escapeHTML(item.prompt)+'<br><strong>Personal reflection pending.</strong></div>'+
    '</article>'
  ).join('');
}

/* Theme preferences survive reloads; default is the deliberately designed dark theme. */
const themeButton=$('theme-toggle');
let theme='dark';
try{theme=localStorage.getItem('al-theme')==='light'?'light':'dark'}catch(error){}
function applyTheme(){
  document.documentElement.dataset.theme=theme;
  if(themeButton){
    themeButton.textContent=theme==='dark'?'☼':'☾';
    themeButton.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');
    themeButton.setAttribute('title',theme==='dark'?'Light mode':'Dark mode');
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',theme==='dark'?'#08080a':'#f3f1ea');
}
applyTheme();
if(themeButton)themeButton.addEventListener('click',()=>{
  theme=theme==='dark'?'light':'dark';applyTheme();
  try{localStorage.setItem('al-theme',theme)}catch(error){}
});

/* Small-screen navigation with keyboard escape, click-away and correct ARIA state. */
const mobileNav=$('mobile-nav'),menuButton=$('menu-toggle');
function closeMenu(){
  if(!mobileNav||!menuButton)return;
  mobileNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Open navigation');
  menuButton.textContent='☰';
}
if(menuButton&&mobileNav){
  menuButton.addEventListener('click',()=>{
    const opening=!mobileNav.classList.contains('open');
    mobileNav.classList.toggle('open',opening);
    menuButton.setAttribute('aria-expanded',String(opening));
    menuButton.setAttribute('aria-label',opening?'Close navigation':'Open navigation');
    menuButton.textContent=opening?'×':'☰';
  });
  mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  document.addEventListener('click',event=>{
    if(!mobileNav.contains(event.target)&&!menuButton.contains(event.target))closeMenu();
  });
  window.addEventListener('resize',()=>{if(window.innerWidth>880)closeMenu()});
}

/* Scroll-aware reading progress and section highlighting. */
const progress=$('scroll-progress');
let scrollScheduled=false;
function onScroll(){
  if(scrollScheduled)return;
  scrollScheduled=true;
  requestAnimationFrame(()=>{
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    if(progress)progress.style.width=Math.min(100,Math.max(0,window.scrollY/max*100))+'%';
    scrollScheduled=false;
  });
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

const navLinks=[...document.querySelectorAll('.desktop-nav a,.mobile-nav a')];
const navSections=[...document.querySelectorAll('main section[id]')];
if('IntersectionObserver' in window){
  const visibleSections=new Map();
  const navObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting)visibleSections.set(entry.target.id,entry.boundingClientRect.top);
      else visibleSections.delete(entry.target.id);
    });
    const nearest=[...visibleSections].sort((a,b)=>Math.abs(a[1]-130)-Math.abs(b[1]-130))[0];
    if(nearest)navLinks.forEach(link=>{
      const current=link.getAttribute('href')==='#'+nearest[0];
      link.classList.toggle('active',current);
      if(current)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  },{rootMargin:'-100px 0px -60% 0px',threshold:0});
  navSections.forEach(section=>navObserver.observe(section));
}

/* Scroll reveal honors system reduced-motion preferences and never hides content without JS. */
const motionOK=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(motionOK&&'IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver((entries,observer)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}
    });
  },{threshold:.08,rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
}

/* Interactive code-editor tilt, only with mouse and without reduced-motion preference. */
const visual=$('hero-visual'),editor=$('code-editor');
if(visual&&editor&&motionOK&&window.matchMedia('(pointer:fine)').matches){
  visual.addEventListener('pointermove',event=>{
    const r=visual.getBoundingClientRect();
    const x=(event.clientX-r.left)/r.width-.5;
    const y=(event.clientY-r.top)/r.height-.5;
    editor.style.transform='rotate(-3deg) rotateY('+(x*7).toFixed(2)+'deg) rotateX('+(-y*7).toFixed(2)+'deg)';
  });
  visual.addEventListener('pointerleave',()=>{editor.style.transform='rotate(-3deg)'});
}

/* Render a verified PDF link only when that file actually exists on the host. */
document.querySelectorAll('[data-doc]').forEach(async el=>{
  const path=el.getAttribute('data-doc');
  if(!path)return;
  try{
    const response=await fetch(path,{method:'HEAD',cache:'no-store'});
    const type=response.headers.get('content-type')||'';
    if(response.ok&&(type.includes('pdf')||path.toLowerCase().endsWith('.pdf')&&!type.includes('text/html'))){
      el.innerHTML='<a href="'+encodeURI(path)+'" target="_blank" rel="noopener noreferrer">View available PDF ↗</a>';
    }
  }catch(error){/* Placeholder remains informative when docs aren't uploaded. */}
});

