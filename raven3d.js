/* Aldryl — interactive raven companion: sculpted 3D geometry, not a billboard.
   Flight model follows the autonomous evader / pursuit dynamics used by Nash's butterfly.
   Raven appears exclusively in Academic Work and Beyond the Screen. */
import * as THREE from 'three';

const mount = document.getElementById('aldryl-raven');
if (mount) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = ['academics', 'beyond'].map(id => document.getElementById(id)).filter(Boolean);
  const clamp = THREE.MathUtils.clamp;
  const length2 = (x,y) => Math.hypot(x,y);
  const dark = 0x11141b;
  const featherDark = new THREE.MeshStandardMaterial({color:0x171b23,roughness:.76,metalness:.16,side:THREE.DoubleSide});
  const featherMid = new THREE.MeshStandardMaterial({color:0x282d39,roughness:.7,metalness:.21,side:THREE.DoubleSide});
  const featherEdge = new THREE.MeshStandardMaterial({color:0x323746,roughness:.68,metalness:.24,side:THREE.DoubleSide});
  const bodyMaterial = new THREE.MeshStandardMaterial({color:0x161a22,roughness:.82,metalness:.12});
  const headMaterial = new THREE.MeshStandardMaterial({color:0x1b202a,roughness:.66,metalness:.21});
  const beakMaterial = new THREE.MeshStandardMaterial({color:0x090b0f,roughness:.42,metalness:.16});
  const eyeMaterial = new THREE.MeshPhysicalMaterial({color:0x080a0d,roughness:.13,metalness:.25,clearcoat:1});
  const shaftMaterial = new THREE.MeshStandardMaterial({color:0x475060,roughness:.75,metalness:.15});

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3.95,3.95,3.95,-3.95,.1,40);
  camera.position.set(0,0,13);
  camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0x9fa7b5,0x0b080d,3.2));
  const key = new THREE.DirectionalLight(0xe5eeff,3.5);
  key.position.set(-3,4,8);
  scene.add(key);
  const redRim = new THREE.DirectionalLight(0xff3b1d,2.0);
  redRim.position.set(4,1,-3);
  scene.add(redRim);
  const fill = new THREE.DirectionalLight(0x6685ad,1.4);
  fill.position.set(1,-2,5);
  scene.add(fill);

  const bird = new THREE.Group();
  scene.add(bird);
  const wingGroups = [];

  function ellipsoid(parent,material,x,y,z,sx,sy,sz,rotationZ=0) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),material);
    mesh.position.set(x,y,z);
    mesh.scale.set(sx,sy,sz);
    mesh.rotation.z=rotationZ;
    parent.add(mesh);
    return mesh;
  }

  // A tapered, bent ribbon with a real 3D center curve, normal and layered depth.
  // Distinct geometry for each primary creates a moving feather fan, not one flat texture.
  function feather(parent,start,end,width,material,shaft=false) {
    const a=new THREE.Vector3(...start);
    const b=new THREE.Vector3(...end);
    const forward=b.clone().sub(a);
    const lateral=new THREE.Vector3(-forward.y,forward.x,0).normalize();
    const positions=[], indices=[];
    const steps=9;
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const center=a.clone().lerp(b,t);
      center.z+=Math.sin(Math.PI*t)*.085;
      const span=width*Math.pow(Math.sin(Math.PI*t),.76)*(1-.18*t);
      const l=center.clone().addScaledVector(lateral,-span*.5);
      const r=center.clone().addScaledVector(lateral,span*.5);
      l.z-=.028*Math.sin(Math.PI*t);
      r.z+=.035*Math.sin(Math.PI*t);
      positions.push(l.x,l.y,l.z,r.x,r.y,r.z);
      if(i<steps){
        const n=i*2;
        indices.push(n,n+1,n+2,n+1,n+3,n+2);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);
    mesh.frustumCulled=false;
    parent.add(mesh);

    if(shaft){
      const tip=a.clone().lerp(b,.91);
      const mid=a.clone().lerp(tip,.49);
      mid.z+=.09;
      const curve=new THREE.QuadraticBezierCurve3(a,mid,tip);
      const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,9,.006,3,false),shaftMaterial);
      parent.add(rib);
    }
    return mesh;
  }

  // Rear tail fans out behind the lower torso.
  const tail=new THREE.Group();
  tail.position.set(0,-.68,-.27);
  bird.add(tail);
  for(let i=0;i<11;i++){
    const s=(i-5)/5;
    feather(tail,[s*.09,-.04,-.05],[s*1.05,-1.42+Math.abs(s)*.14,-.08+.08*Math.abs(s)],.31,
      i%3===0?featherEdge:featherMid,i%3===0);
  }

  // Sculpted body with dark sculptural plumage.
  ellipsoid(bird,bodyMaterial,0,-.15,.05,.55,1.12,.45,-.04);
  ellipsoid(bird,featherDark,0,-.37,.38,.42,.80,.19);
  ellipsoid(bird,headMaterial,0,.84,.25,.41,.47,.41);
  ellipsoid(bird,bodyMaterial,0,.43,.10,.37,.58,.39);

  // Breast feathers lie on curved depth layers.
  for(let row=0;row<6;row++){
    const y=.26-row*.22;
    const half=.25*(1-row*.075);
    for(let i=-2;i<=2;i++){
      const x=i*half*.56;
      const z=.49+Math.max(0,.06-Math.abs(i)*.025)-row*.025;
      feather(bird,[x,y,z],[x*.9,y-.24,z-.04],.115,
        (i+row)%3===0?featherEdge:featherMid,false);
    }
  }

  // Raven's tapered pointed beak faces forward, with a ridge and flanking eyes.
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.19,.63,4,1),beakMaterial);
  beak.rotation.x=Math.PI/2;
  beak.rotation.z=Math.PI/4;
  beak.position.set(0,.64,.74);
  bird.add(beak);
  const ridge=new THREE.Mesh(new THREE.ConeGeometry(.095,.48,4),headMaterial);
  ridge.rotation.x=Math.PI/2;
  ridge.position.set(0,.70,.78);
  bird.add(ridge);
  for(const s of [-1,1]){
    ellipsoid(bird,eyeMaterial,s*.30,.86,.54,.073,.067,.045);
    ellipsoid(bird,new THREE.MeshBasicMaterial({color:0xa6aec0}),s*.315,.88,.575,.016,.014,.008);
    // Scalloped hackles around the head.
    for(let i=0;i<5;i++){
      const x=s*(.27+i*.029);
      feather(bird,[x,.53-i*.075,.30],[x+s*.13,.42-i*.12,.16],.07,featherDark);
    }
  }

  // Jointed wings: a layered shoulder and individually tapered primary feathers.
  for(const side of [-1,1]){
    const wing=new THREE.Group();
    wing.position.set(side*.40,.48,-.13);
    bird.add(wing);
    wingGroups.push({group:wing,side});
    ellipsoid(wing,bodyMaterial,side*.48,.11,0,.76,.26,.21,side*.30);

    // Upper broad wing web follows a curved leading edge.
    for(let i=0;i<9;i++){
      const t=i/8;
      feather(wing,[side*(.06+t*.65),.08-t*.18,.02],
        [side*(1.10+t*.95),.59-t*.62,-.06+t*.02],.34,
        i%2?featherDark:featherMid,i%3===0);
    }

    // The spread primaries give the bird its recognizable raven silhouette.
    for(let i=0;i<16;i++){
      const t=i/15;
      const angle=1.14-t*1.56;
      const span=2.03+(1-t)*.20;
      const tipX=side*(.77+Math.cos(angle)*span);
      const tipY=.05+Math.sin(angle)*span;
      const originX=side*(.43+t*.57);
      const originY=-.06-t*.31;
      feather(wing,[originX,originY,.04+t*.025],
        [tipX,tipY,-.13+t*.15],.22+(1-t)*.045,
        i%4===0?featherEdge:i%2?featherDark:featherMid,i%3===0);
    }

    // Covert feathers overlap the primaries rather than covering their tips.
    for(let i=0;i<9;i++){
      const t=i/8;
      feather(wing,[side*(.14+.075*i),.20-t*.13,.18],
        [side*(.83+.078*i),.10-t*.49,.24],.20,
        i%3===0?featherEdge:featherMid);
    }
  }

  // Slim legs and curved talons beneath the lower breast.
  const clawMaterial=new THREE.MeshStandardMaterial({color:dark,roughness:.6,metalness:.18});
  function tube(parent,points,radius,material){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,15,radius,5,false),material);
    parent.add(mesh);
    return mesh;
  }
  for(const side of [-1,1]){
    const x=side*.21;
    tube(bird,[[x,-.88,.20],[x*1.08,-1.13,.34],[x*1.1,-1.28,.48]],.045,clawMaterial);
    for(let finger=-1;finger<=1;finger++){
      tube(bird,[[x*1.1,-1.26,.48],[x+finger*.11,-1.39,.56],[x+finger*.16,-1.53,.51],[x+finger*.13,-1.59,.46]],.018,clawMaterial);
    }
  }

  bird.scale.setScalar(.94);
  bird.rotation.set(.05,-.10,.025);

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.35;
    renderer.domElement.setAttribute('aria-hidden','true');
    mount.appendChild(renderer.domElement);
  }catch(error){
    console.warn('3D raven could not start; the portfolio remains usable.',error);
  }

  if(renderer){
    let width=window.innerWidth,height=window.innerHeight,size=230;
    let limits={left:100,right:800,top:100,bottom:700};
    const flight={x:width*.64,y:height*.41,vx:0,vy:0};
    const evader={x:width*.38,y:height*.49,vx:0,vy:0};
    const evaderGoal={x:width*.7,y:height*.58};
    const pointer={x:-10000,y:-10000,seenAt:-10000};
    let lure=null,active=false,previousTime=performance.now(),flightTime=0,goalTime=0;
    let frame=0,disposed=false,lastVisibility=false;
    const now=()=>performance.now();

    function measure(){
      width=window.innerWidth;
      height=window.innerHeight;
      size=clamp(width*(width<660?.33:.22),145,285);
      mount.style.width=size+'px';
      mount.style.height=size+'px';
      renderer.setSize(size,size,false);
      camera.updateProjectionMatrix();
      const navbar=document.querySelector('.site-header');
      const headerHeight=navbar?navbar.getBoundingClientRect().height:75;
      const pad=Math.min(width*.29,size*.55+8);
      limits={
        left:Math.min(width*.47,pad),
        right:Math.max(width*.53,width-pad),
        top:Math.min(height*.55,headerHeight+size*.38),
        bottom:Math.max(height*.55+1,height-size*.40)
      };
      for(const obj of [flight,evader,evaderGoal]){
        obj.x=clamp(obj.x,limits.left,limits.right);
        obj.y=clamp(obj.y,limits.top,limits.bottom);
      }
      updateVisibility();
    }

    function updateVisibility(){
      if(disposed)return;
      const scanY=height*.48;
      active=targets.some(section=>{
        const bounds=section.getBoundingClientRect();
        return bounds.top<scanY && bounds.bottom>scanY;
      });
      const visible=active&&!document.hidden;
      if(visible!==lastVisibility){
        mount.classList.toggle('is-visible',visible);
        lastVisibility=visible;
        previousTime=now();
      }
    }

    function keepInView(obj){
      if(obj.x<=limits.left||obj.x>=limits.right){
        obj.vx*=-.42;obj.x=clamp(obj.x,limits.left,limits.right);
      }
      if(obj.y<=limits.top||obj.y>=limits.bottom){
        obj.vy*=-.42;obj.y=clamp(obj.y,limits.top,limits.bottom);
      }
    }

    function chooseGoal(){
      let x=evader.x,y=evader.y;
      for(let i=0;i<7;i++){
        x=limits.left+Math.random()*(limits.right-limits.left);
        y=limits.top+Math.random()*(limits.bottom-limits.top);
        if(length2(x-evader.x,y-evader.y)>Math.min(width,height)*.2)break;
      }
      evaderGoal.x=x;evaderGoal.y=y;
      goalTime=flightTime+1.5+Math.random()*2.3;
    }

    function steer(obj,goal,speed,acceleration,slowRadius,dt){
      const dx=goal.x-obj.x,dy=goal.y-obj.y;
      const dist=length2(dx,dy)||1;
      const desiredSpeed=speed*Math.min(1,dist/slowRadius);
      let fx=dx/dist*desiredSpeed-obj.vx;
      let fy=dy/dist*desiredSpeed-obj.vy;
      const length=length2(fx,fy);
      if(length>acceleration*dt && length>0){
        fx*=acceleration*dt/length;fy*=acceleration*dt/length;
      }
      obj.vx+=fx;obj.vy+=fy;
      const velocity=length2(obj.vx,obj.vy);
      if(velocity>speed){obj.vx*=speed/velocity;obj.vy*=speed/velocity}
      obj.x+=obj.vx*dt;obj.y+=obj.vy*dt;
      keepInView(obj);
    }

    function moveFlight(dt,t){
      const speed=clamp(width*.24,185,440);
      const evadeSpeed=clamp(width*.14,100,260);
      const accel=clamp(width*.67,390,1050);
      const evadeAccel=clamp(width*.38,190,570);
      if(flightTime>=goalTime||length2(evaderGoal.x-evader.x,evaderGoal.y-evader.y)<42)chooseGoal();
      steer(evader,evaderGoal,evadeSpeed,evadeAccel,Math.min(width,height)*.12,dt);
      const distance=length2(evader.x-flight.x,evader.y-flight.y);
      const ahead=clamp(distance/(speed+length2(evader.vx,evader.vy)+1),.05,.95);
      let gx=clamp(evader.x+evader.vx*ahead,limits.left,limits.right);
      let gy=clamp(evader.y+evader.vy*ahead,limits.top,limits.bottom);
      if(lure&&flightTime<lure.until){
        gx=lure.x;gy=lure.y;
        if(length2(gx-flight.x,gy-flight.y)<36)lure.until=flightTime+.3;
      }else lure=null;
      steer(flight,{x:gx,y:gy},speed,accel,68,dt);
      if(t-pointer.seenAt<1800){
        const dx=flight.x-pointer.x,dy=flight.y-pointer.y;
        const d=length2(dx,dy);
        const radius=Math.max(120,Math.min(size*.65,195));
        if(d<radius){
          const strength=Math.pow(1-d/radius,1.3);
          const angle=d>1?Math.atan2(dy,dx):flightTime*8;
          flight.vx+=Math.cos(angle)*strength*accel*dt*1.5;
          flight.vy+=Math.sin(angle)*strength*accel*dt*1.5;
        }
      }
    }

    function onPointer(event){
      if(event.pointerType==='touch')return;
      pointer.x=event.clientX;
      pointer.y=event.clientY;
      pointer.seenAt=now();
    }
    function onClick(event){
      if(!active||prefersReducedMotion.matches||!event.isTrusted)return;
      if(event.target.closest('a,button,input,textarea,select,summary,[role="button"]'))return;
      lure={
        x:clamp(event.clientX,limits.left,limits.right),
        y:clamp(event.clientY,limits.top,limits.bottom),
        until:flightTime+3.3
      };
    }

    function tick(t){
      if(disposed)return;
      frame=requestAnimationFrame(tick);
      const dt=Math.min(.045,Math.max(0,(t-previousTime)/1000));
      previousTime=t;
      if(!active||document.hidden)return;
      const quiet=prefersReducedMotion.matches;
      if(quiet){
        flight.x=clamp(width*.72,limits.left,limits.right);
        flight.y=clamp(height*.39,limits.top,limits.bottom);
        flight.vx=0;flight.vy=0;
      }else{
        flightTime+=dt;
        moveFlight(dt,t);
      }
      const beat=quiet?0:Math.sin(flightTime*17.5)*.42;
      wingGroups.forEach(({group,side})=>{
        group.rotation.z=side*(.08+beat*.33);
        group.rotation.y=side*(.05+beat*.58);
        group.rotation.x=.04+beat*.12;
      });
      tail.rotation.z=quiet?0:Math.sin(flightTime*2.4)*.08;
      const speed=length2(flight.vx,flight.vy);
      const dx=speed>1?flight.vx/speed:0;
      const dy=speed>1?flight.vy/speed:0;
      const smooth=1-Math.exp(-dt*5);
      const targetZ=quiet?0:-dx*.29;
      const targetY=quiet?0:dx*.28-.08;
      const targetX=quiet?0:-dy*.22;
      bird.rotation.z+=(targetZ-bird.rotation.z)*smooth;
      bird.rotation.y+=(targetY-bird.rotation.y)*smooth;
      bird.rotation.x+=(targetX-bird.rotation.x)*smooth;
      const bob=quiet?0:Math.sin(flightTime*4.1)*3.8;
      mount.style.transform='translate3d('+(flight.x-size/2).toFixed(1)+'px,'+
        (flight.y-size/2+bob).toFixed(1)+'px,0)';
      renderer.render(scene,camera);
    }

    function onMotionChange(){
      previousTime=now();
      if(prefersReducedMotion.matches){
        flightTime=0;
        wingGroups.forEach(({group})=>group.rotation.set(0,0,0));
      }
    }
    measure();
    chooseGoal();
    renderer.render(scene,camera);
    mount.classList.add('is-rendered');
    window.addEventListener('resize',measure,{passive:true});
    window.addEventListener('scroll',updateVisibility,{passive:true});
    document.addEventListener('visibilitychange',updateVisibility);
    document.addEventListener('pointermove',onPointer,{passive:true});
    document.addEventListener('click',onClick,{passive:true});
    prefersReducedMotion.addEventListener('change',onMotionChange);
    frame=requestAnimationFrame(tick);
    window.addEventListener('pagehide',()=>{
      disposed=true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize',measure);
      window.removeEventListener('scroll',updateVisibility);
      document.removeEventListener('visibilitychange',updateVisibility);
      document.removeEventListener('pointermove',onPointer);
      document.removeEventListener('click',onClick);
      prefersReducedMotion.removeEventListener('change',onMotionChange);
      renderer.dispose();
      scene.traverse(object=>{
        if(object.geometry)object.geometry.dispose();
      });
    },{once:true});
  } else {
    // If WebGL is blocked, retain the SVG raven in the same two sections.
    const fallbackPosition=()=>{
      const h=window.innerHeight;
      const active=targets.some(section=>{
        const bounds=section.getBoundingClientRect();
        return bounds.top<h*.48&&bounds.bottom>h*.48;
      });
      mount.classList.toggle('is-visible',active);
      const size=Math.min(220,Math.max(130,window.innerWidth*.3));
      mount.style.width=size+'px';
      mount.style.height=size+'px';
      mount.style.transform='translate3d('+(window.innerWidth*.72-size/2)+'px,'+
        (window.innerHeight*.4-size/2)+'px,0)';
    };
    window.addEventListener('scroll',fallbackPosition,{passive:true});
    window.addEventListener('resize',fallbackPosition,{passive:true});
    fallbackPosition();
  }
}
