/**
 * Aldryl · Raven v3 — realistic crow geometry, actual independent 3D wings.
 *
 * Replaces the earlier hand-built crow. The GLB is a real corvid model with
 * articulated LeftWing / RightWing, Head, Tail, and Leg joints.
 * Asset: https://polyfork.dev/asset/crow-base  (free commercial-use GLB)
 * Interaction dynamics are adapted from Nash's flying butterfly:
 * autonomous wandering target, anticipation, smooth steering, pointer
 * avoidance, click-to-approach, velocity banking.
 *
 * Global companion: flies in the WHOLE single-page portfolio, not only
 * Academics/Beyond. Never steals pointer input or blocks the header.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const holder = document.getElementById('aldryl-raven');
if (holder) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = THREE.MathUtils.clamp;
  const norm = (x,y) => Math.hypot(x,y);
  let renderer = null;
  let crow = null;
  const bird = new THREE.Group();
  const scene = new THREE.Scene();
  scene.add(bird);
  const camera = new THREE.OrthographicCamera(-3.6,3.6,3.6,-3.6,.1,50);
  camera.position.set(0,0,12);
  camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xc7d3e0,0x121018,3.1));
  const key = new THREE.DirectionalLight(0xe5e8f3,3.5);key.position.set(-3,5,8);scene.add(key);
  const fill = new THREE.DirectionalLight(0x7186ac,1.7);fill.position.set(4,-3,6);scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff3b1d,1.15);rim.position.set(3,2,-4);scene.add(rim);

  let size=224,width=window.innerWidth,height=window.innerHeight;
  let bounds={left:90,right:800,top:90,bottom:700};
  const agent={x:width*.72,y:height*.38,vx:0,vy:0};
  const wander={x:width*.31,y:height*.51,vx:0,vy:0};
  const goal={x:width*.69,y:height*.63};
  const pointer={x:-10000,y:-10000,seenAt:-10000};
  const joints = {};
  let lure=null, nextTargetAt=0,elapsed=0,last=performance.now();
  let frame=0,disposed=false,modelReady=false;
  const basePose={};
  let motionDisabled=reduceMotion.matches;
  let quietRendered=false;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha:true,antialias:true,powerPreference:'high-performance'
    });
    renderer.setClearColor(0x000000,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.24;
    renderer.domElement.setAttribute('aria-hidden','true');
    holder.appendChild(renderer.domElement);
  } catch(err) {
    console.info('3D crow unavailable; reference silhouette will remain visible.',err);
  }

  function stayInside(obj){
    if(obj.x<=bounds.left||obj.x>=bounds.right){
      obj.x=clamp(obj.x,bounds.left,bounds.right);
      obj.vx*=-.42;
    }
    if(obj.y<=bounds.top||obj.y>=bounds.bottom){
      obj.y=clamp(obj.y,bounds.top,bounds.bottom);
      obj.vy*=-.42;
    }
  }

  function measure(){
    width=window.innerWidth;height=window.innerHeight;
    size=clamp(width*(width<640?.38:.19),145,265);
    const header=document.querySelector('.site-header');
    const headerHeight=header?.getBoundingClientRect().height||70;
    const xPad=Math.min(width*.46,size*.48+12);
    const yPad=Math.min(height*.35,size*.36+16);
    bounds={
      left:xPad,
      right:Math.max(xPad+1,width-xPad),
      top:Math.min(height*.56,headerHeight+yPad),
      bottom:Math.max(height*.56+1,height-yPad)
    };
    for(const obj of [agent,wander,goal]){
      obj.x=clamp(obj.x,bounds.left,bounds.right);
      obj.y=clamp(obj.y,bounds.top,bounds.bottom);
    }
    holder.style.width=size+'px';
    holder.style.height=size+'px';
    if(renderer)renderer.setSize(size,size,false);
    quietRendered=false;
    setPosition();
  }

  function setPosition(){
    const bob=motionDisabled?0:Math.sin(elapsed*3.2)*3.1;
    holder.style.transform='translate3d('+
      (agent.x-size/2).toFixed(1)+'px,'+
      (agent.y-size/2+bob).toFixed(1)+'px,0)';
  }

  function chooseGoal(){
    let x=wander.x,y=wander.y;
    const minTravel=Math.min(width,height)*.23;
    for(let n=0;n<8;n++){
      x=bounds.left+Math.random()*(bounds.right-bounds.left);
      y=bounds.top+Math.random()*(bounds.bottom-bounds.top);
      if(norm(x-wander.x,y-wander.y)>minTravel)break;
    }
    goal.x=x;goal.y=y;
    nextTargetAt=elapsed+2.1+Math.random()*2.9;
  }

  function steer(obj,destination,maxSpeed,maxForce,slowRadius,dt){
    const dx=destination.x-obj.x,dy=destination.y-obj.y;
    const distance=norm(dx,dy)||1;
    const speed=maxSpeed*Math.min(1,distance/slowRadius);
    let forceX=dx/distance*speed-obj.vx;
    let forceY=dy/distance*speed-obj.vy;
    const forceLength=norm(forceX,forceY);
    if(forceLength>maxForce*dt&&forceLength>0){
      forceX*=maxForce*dt/forceLength;
      forceY*=maxForce*dt/forceLength;
    }
    obj.vx+=forceX;obj.vy+=forceY;
    const v=norm(obj.vx,obj.vy);
    if(v>maxSpeed){obj.vx*=maxSpeed/v;obj.vy*=maxSpeed/v}
    obj.x+=obj.vx*dt;obj.y+=obj.vy*dt;
    stayInside(obj);
  }

  function updateMovement(dt,now){
    const speed=clamp(width*.19,125,315);
    const wanderSpeed=clamp(width*.105,83,185);
    const accel=clamp(width*.5,270,760);
    const wanderAccel=clamp(width*.27,165,410);
    if(elapsed>=nextTargetAt||norm(goal.x-wander.x,goal.y-wander.y)<38)chooseGoal();
    steer(wander,goal,wanderSpeed,wanderAccel,Math.min(width,height)*.18,dt);

    const dist=norm(wander.x-agent.x,wander.y-agent.y);
    const prediction=clamp(dist/(speed+norm(wander.vx,wander.vy)+1),.06,.85);
    let tx=clamp(wander.x+wander.vx*prediction,bounds.left,bounds.right);
    let ty=clamp(wander.y+wander.vy*prediction,bounds.top,bounds.bottom);
    if(lure&&elapsed<lure.until){
      tx=lure.x;ty=lure.y;
      if(norm(agent.x-tx,agent.y-ty)<34)lure.until=elapsed+.28;
    }else{lure=null}
    steer(agent,{x:tx,y:ty},speed,accel,82,dt);

    // Reactive but not permanently attached to the pointer.
    if(now-pointer.seenAt<1600){
      const dx=agent.x-pointer.x,dy=agent.y-pointer.y;
      const d=norm(dx,dy);
      const radius=Math.max(125,Math.min(size*.78,205));
      if(d<radius){
        const push=Math.pow(1-d/radius,1.35)*accel*dt*1.28;
        const angle=d>1?Math.atan2(dy,dx):elapsed*5;
        agent.vx+=Math.cos(angle)*push;
        agent.vy+=Math.sin(angle)*push;
        const v=norm(agent.vx,agent.vy);
        if(v>speed){agent.vx=agent.vx/v*speed;agent.vy=agent.vy/v*speed}
      }
    }
  }

  function animateBird(dt){
    if(!crow)return;
    const speed=norm(agent.vx,agent.vy);
    const dx=speed>1?agent.vx/speed:0;
    const dy=speed>1?agent.vy/speed:0;
    const smooth=1-Math.exp(-dt*4.6);
    // Ornithology-inspired: deliberate, asymmetric wingbeats with short gliding
    // intervals. Slightly faster than the earlier 3D preview (about 1.5 Hz).
    const cycle=(elapsed*1.52)%1;
    const wave=Math.sin(cycle*Math.PI*2-.25);
    const asymmetric=wave>=0
      ? Math.pow(wave,.72)
      : -.84*Math.pow(-wave,1.22);
    const glideWindow=(elapsed%5.7)>4.6;
    const amplitude=motionDisabled?0:(glideWindow?.14:.88);
    const beat=asymmetric*amplitude;
    for(const side of [-1,1]){
      const part=joints[side===-1?'LeftWing':'RightWing'];
      const base=basePose[side===-1?'LeftWing':'RightWing'];
      if(!part||!base)continue;
      part.rotation.z=base.z+side*(.08+beat*.28);
      part.rotation.y=base.y+side*(.12+beat*.50);
      part.rotation.x=base.x+beat*.065;
    }
    if(joints.Tail&&basePose.Tail){
      joints.Tail.rotation.z=basePose.Tail.z+Math.sin(elapsed*2.2)*.09;
    }
    if(joints.Head&&basePose.Head){
      joints.Head.rotation.y=basePose.Head.y+(motionDisabled?0:Math.sin(elapsed*1.4)*.06);
    }
    // The approved artwork is a front-reference 3D relief: keep its finely
    // textured frontal pose readable when banking instead of turning edge-on.
    const yaw=motionDisabled?-.10:(-.10+dx*.15);
    const roll=motionDisabled?0:(-dx*.11);
    const pitch=motionDisabled?-.06:(-.06-dy*.08);
    bird.rotation.y+=(yaw-bird.rotation.y)*smooth;
    bird.rotation.z+=(roll-bird.rotation.z)*smooth;
    bird.rotation.x+=(pitch-bird.rotation.x)*smooth;
  }

  function pointerMove(event){
    if(event.pointerType==='touch')return;
    pointer.x=event.clientX;pointer.y=event.clientY;
    pointer.seenAt=performance.now();
  }

  function attractOnClick(event){
    if(motionDisabled||!event.isTrusted)return;
    if(event.target instanceof Element &&
       event.target.closest('a,button,input,textarea,select,summary,[role="button"]'))return;
    lure={
      x:clamp(event.clientX,bounds.left,bounds.right),
      y:clamp(event.clientY,bounds.top,bounds.bottom),
      until:elapsed+3.5
    };
  }

  // All parts remain in the viewport as a smooth moving overlay, while the
  // whole page below it remains scrollable and interactive.
  function tick(now){
    if(disposed)return;
    frame=requestAnimationFrame(tick);
    const dt=Math.min(.042,Math.max(0,(now-last)/1000));
    last=now;
    if(document.hidden)return;
    if(motionDisabled){
      if(!quietRendered){
        agent.x=clamp(width*.73,bounds.left,bounds.right);
        agent.y=clamp(height*.34,bounds.top,bounds.bottom);
        agent.vx=agent.vy=0;
        setPosition();
        if(renderer&&modelReady)renderer.render(scene,camera);
        quietRendered=true;
      }
      return;
    }
    elapsed+=dt;
    updateMovement(dt,now);
    setPosition();
    if(renderer&&modelReady){
      animateBird(dt);
      renderer.render(scene,camera);
    }
  }

  function loadCrow(){
    if(!renderer)return;
    new GLTFLoader().load(
      'assets/raven_hd_articulated.glb?v=20261109-v5',
      (gltf)=>{
        if(disposed)return;
        crow=gltf.scene;
        const bounds3d=new THREE.Box3().setFromObject(crow);
        const sz=bounds3d.getSize(new THREE.Vector3());
        const center=bounds3d.getCenter(new THREE.Vector3());
        if(!sz.length()||!Number.isFinite(sz.length()))return;
        // A true GLB rather than a flat billboard. Scale to the canvas.
        const unit=4.55/Math.max(sz.x,sz.y,sz.z,.001);
        crow.scale.setScalar(unit);
        crow.position.copy(center).multiplyScalar(-unit);
        bird.add(crow);
        for(const name of ['LeftWing','RightWing','Head','Tail']){
          const joint=crow.getObjectByName(name);
          if(joint){
            joints[name]=joint;
            basePose[name]={x:joint.rotation.x,y:joint.rotation.y,z:joint.rotation.z};
          }
        }
        // Preserve PBR texturing; catch direct material glitches gracefully.
        crow.traverse(obj=>{
          if(!obj.isMesh)return;
          obj.castShadow=false;
          obj.frustumCulled=false;
          const materials=Array.isArray(obj.material)?obj.material:[obj.material];
          materials.forEach(mat=>{
            if(!mat)return;
            if('roughness' in mat)mat.roughness=.68;
            if('metalness' in mat)mat.metalness=Math.min(.22,mat.metalness||0);
            mat.needsUpdate=true;
          });
        });
        modelReady=true;
        quietRendered=false;
        holder.classList.add('model-loaded');
        animateBird(.016);
        renderer.render(scene,camera);
      },
      undefined,
      (error)=>{
        console.warn('Crow GLB unavailable; using the exact-reference silhouette fallback.',error);
        holder.classList.add('model-fallback');
      }
    );
  }

  measure();
  chooseGoal();
  holder.classList.add('is-visible');
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('pointermove',pointerMove,{passive:true});
  document.addEventListener('click',attractOnClick,{passive:true});
  const onMotionChange=()=>{
    motionDisabled=reduceMotion.matches;
    quietRendered=false;
    last=performance.now();
    if(!motionDisabled)chooseGoal();
  };
  reduceMotion.addEventListener('change',onMotionChange);
  loadCrow();
  frame=requestAnimationFrame(tick);

  window.addEventListener('pagehide',()=>{
    disposed=true;cancelAnimationFrame(frame);
    window.removeEventListener('resize',measure);
    document.removeEventListener('pointermove',pointerMove);
    document.removeEventListener('click',attractOnClick);
    reduceMotion.removeEventListener('change',onMotionChange);
    renderer?.dispose();
  },{once:true});
}
