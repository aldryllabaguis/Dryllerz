/**
 * Aldryl · Raven v3 — realistic crow geometry, actual independent 3D wings.
 *
 * Replaces the earlier hand-built crow. The GLB uses the approved detailed feather relief and
 * articulated LeftWing / RightWing and Tail joints.
 * Asset: assets/raven_hd_articulated.glb (portfolio-specific model generated from the approved raven preview)
 * Interaction dynamics are adapted from Nash's flying butterfly:
 * autonomous wandering target, anticipation, smooth steering, pointer
 * avoidance, click-to-approach, velocity banking.
 *
 * Global companion: flies in the WHOLE single-page portfolio, not only
 * Academics/Beyond. Never steals pointer input or blocks the header.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRavenSidePose } from './raven-flight-pose.js?v=20261109-v7';

const holder = document.getElementById('aldryl-raven');
if (holder) {
  // Both silhouettes now have real curved 3D volume. The front reference
  // remains texture-detailed; the side has articulated layered feather fans.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = THREE.MathUtils.clamp;
  const norm = (x,y) => Math.hypot(x,y);
  let renderer = null;
  let crow = null;
  const bird = new THREE.Group();
  const scene = new THREE.Scene();
  scene.add(bird);
  const sidePose = createRavenSidePose();
  bird.add(sidePose.root);
  sidePose.setBlend(0);
  const frontMaterials = new Set();
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
  let hoverUntil=0;
  let nextHoverAt=5.4+Math.random()*1.7;
  let profileOpacity=0;
  let horizontalFacing=1;

  // The approved uploaded GIF is 8 frames at 120 ms each (960 ms/loop).
  // These poses follow the actual illustrated sequence: front wings high,
  // turning through 3/4 view, side-profile high/downstroke, back to front.
  // Frames describe motion only; all artwork remains independently rigged 3D.
  const referenceCycleSeconds=0.96;
  const referencePoses=[
    {wing:.98,side:0.00,lean:0.00},
    {wing:.64,side:.24,lean:-.08},
    {wing:.54,side:.87,lean:-.12},
    {wing:.99,side:1.00,lean:0.02},
    {wing:-.94,side:1.00,lean:0.13},
    {wing:-.76,side:.75,lean:0.10},
    {wing:.49,side:.14,lean:-.03},
    {wing:.94,side:0.00,lean:0.00}
  ];
  const smooth01 = value => {
    const v=clamp(value,0,1);
    return v*v*(3-2*v);
  };
  let beatPose={wing:.98,side:0,lean:0};
  function sampleReferencePose(seconds){
    const f=((seconds/referenceCycleSeconds)%1+1)%1*referencePoses.length;
    const i=Math.floor(f);
    const a=referencePoses[i],b=referencePoses[(i+1)%referencePoses.length];
    const t=smooth01(f-i);
    return {
      wing:a.wing+(b.wing-a.wing)*t,
      side:a.side+(b.side-a.side)*t,
      lean:a.lean+(b.lean-a.lean)*t
    };
  }

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
    // Short, true hovering pauses make the front-facing pose visible without
    // abruptly stopping or teleporting the crow. The next glide is independent.
    if(elapsed>=nextHoverAt && (!lure || elapsed>=lure.until)){
      hoverUntil=elapsed+1.35+Math.random()*.35;
      nextHoverAt=elapsed+7.0+Math.random()*2.5;
    }
    if(elapsed<hoverUntil && (!lure || elapsed>=lure.until)){
      const damp=Math.exp(-dt*6.5);
      agent.vx*=damp;
      agent.vy*=damp;
      agent.x+=agent.vx*dt;
      agent.y+=agent.vy*dt;
      stayInside(agent);
      return;
    }
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
    const hovering=motionDisabled || elapsed<hoverUntil ||
      (speed<16 && (!lure || elapsed>=lure.until));
    const pose=sampleReferencePose(elapsed);
    const intensity=hovering ? 0 : smooth01((speed-12)/58);
    // In a still hover the front reference remains open-winged, with barely
    // perceptible living motion; active flight follows the 8 reference frames.
    beatPose={
      wing:(1-intensity)*(.92+.014*Math.sin(elapsed*1.9))+
        intensity*pose.wing,
      side: intensity*pose.side,
      lean: intensity*pose.lean
    };
    const glide=(elapsed%6.4)>5.95? .75:0; // short, natural intermittent glide
    sidePose.flap(elapsed,beatPose.wing,glide);
    for(const side of [-1,1]){
      const name=side<0?'LeftWing':'RightWing';
      const part=joints[name],base=basePose[name];
      if(!part||!base)continue;
      const wing=beatPose.wing*(1-glide*.45);
      // Hinge rotation is mirrored so both wings rise together.
      part.rotation.z=base.z+side*(.075+wing*.30);
      part.rotation.y=base.y+side*(.10+wing*.42);
      part.rotation.x=base.x+wing*.08;
    }
    if(joints.Tail&&basePose.Tail){
      joints.Tail.rotation.z=basePose.Tail.z+
        (hovering?0:Math.sin(elapsed*2.05)*.05);
    }
    // Never distort the head during the wings' strong downstroke.
    const frontWeight=1-profileOpacity;
    const blend=1-Math.exp(-dt*5.4);
    const yaw=motionDisabled?0:dx*(.09+.13*profileOpacity);
    const roll=motionDisabled?0:(-dx*.07+beatPose.lean*.37);
    const pitch=motionDisabled?-.02:(-.02-dy*.09);
    bird.rotation.y+=(yaw-bird.rotation.y)*blend;
    bird.rotation.z+=(roll-bird.rotation.z)*blend;
    bird.rotation.x+=(pitch-bird.rotation.x)*blend;
    if(joints.Head&&basePose.Head){
      joints.Head.rotation.y=basePose.Head.y+
        (motionDisabled?0:Math.sin(elapsed*1.1)*.025*frontWeight);
    }
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
    hoverUntil=0;
    nextHoverAt=Math.max(nextHoverAt,elapsed+5.7);
  }

  // Blend between TWO genuine 3D representations. When hovering or turning
  // vertically, detailed frontal feathers take over; horizontal travel brings
  // out the volumetric side sculpture. No flat SVG is used in flight.
  function updateFacing(dt){
    if(!modelReady)return;
    const speed=norm(agent.vx,agent.vy);
    const lateral=Math.abs(agent.vx)/(speed+1);
    const motion=smooth01((speed-12)/70);
    const horizontal=smooth01((lateral-.30)/.48);
    // Reference side-view keyframes only appear during directional flight.
    // When slowing down, front-facing detailed feather maps win cleanly.
    const target=motion*horizontal*beatPose.side;
    profileOpacity+=(target-profileOpacity)*(1-Math.exp(-dt*10));
    if(Math.abs(agent.vx)>22)horizontalFacing=agent.vx>0?1:-1;
    sidePose.setDirection(horizontalFacing);
    sidePose.setBlend(profileOpacity);
    for(const material of frontMaterials)material.opacity=1-profileOpacity;
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
      // The posed wings and the view blend must share the same reference frame.
      animateBird(dt);
      updateFacing(dt);
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
        // Preserve the approved high-resolution feather maps. Make front
        // surfaces capable of a transparent crossfade into the 3D side rig.
        crow.traverse(obj=>{
          if(!obj.isMesh)return;
          obj.castShadow=false;
          obj.frustumCulled=false;
          const materials=Array.isArray(obj.material)?obj.material:[obj.material];
          materials.forEach(mat=>{
            if(!mat)return;
            if('roughness' in mat)mat.roughness=.68;
            if('metalness' in mat)mat.metalness=Math.min(.22,mat.metalness||0);
            mat.transparent=true;
            mat.depthWrite=false;
            mat.opacity=1;
            frontMaterials.add(mat);
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
    profileOpacity=0;
    sidePose.setBlend(0);
    for(const material of frontMaterials)material.opacity=1;
    if(renderer)renderer.domElement.style.opacity=modelReady?'1':'0';
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
