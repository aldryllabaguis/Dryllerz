/**
 * Raven side-flight volume — separately articulated 3D feathers and anatomy.
 * Front pose remains the original detailed GLB; this layer is visible as the
 * bird turns sideways, replacing the old 2D silhouette with shaded geometry.
 */
import * as THREE from 'three';

export function createRavenSidePose() {
  const root = new THREE.Group();
  root.name = 'RavenSideSculpt';
  const make = (color,metalness=.14,roughness=.69) => new THREE.MeshPhysicalMaterial({
    color,metalness,roughness,clearcoat:.32,clearcoatRoughness:.59,
    side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false
  });
  const materials = [
    make(0x14171f), make(0x252b38,.19,.59), make(0x343c4b,.22,.52),
    make(0x0b0e13,.1,.78), make(0x444f62,.24,.54)
  ];
  const [black,mid,edge,dark,shaft]=materials;
  // Grayscale plumage map gives even the side-view geometry visible barbs,
  // translucent feather edges and a narrow central rachis instead of
  // featureless charcoal triangles. Drawn locally: no external downloads.
  function buildFeatherMap(){
    const canvas=document.createElement('canvas');
    canvas.width=256;canvas.height=512;
    const ctx=canvas.getContext('2d');
    if(!ctx)return null;
    const grad=ctx.createLinearGradient(0,0,256,0);
    grad.addColorStop(0,'#aab0ba');
    grad.addColorStop(.18,'#d5d9df');
    grad.addColorStop(.50,'#c4cbd8');
    grad.addColorStop(.78,'#e3e6ee');
    grad.addColorStop(1,'#99a2af');
    ctx.fillStyle=grad;ctx.fillRect(0,0,256,512);
    for(let i=0;i<132;i++){
      const y=12+i*3.75;
      const ripple=Math.sin(i*.31)*7;
      ctx.beginPath();
      ctx.moveTo(127,y);
      ctx.quadraticCurveTo(78,y-10+ripple,4,y+8);
      ctx.strokeStyle='rgba(24,30,40,.30)';
      ctx.lineWidth=i%5===0?1.15:.58;ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(128,y);
      ctx.quadraticCurveTo(182,y+9-ripple,252,y+3);
      ctx.strokeStyle='rgba(34,39,51,.25)';
      ctx.lineWidth=i%6===0?1.1:.55;ctx.stroke();
    }
    const shaftGrad=ctx.createLinearGradient(124,0,131,0);
    shaftGrad.addColorStop(0,'rgba(20,25,33,.22)');
    shaftGrad.addColorStop(.45,'rgba(252,253,255,.76)');
    shaftGrad.addColorStop(1,'rgba(17,22,30,.25)');
    ctx.fillStyle=shaftGrad;ctx.fillRect(124,6,7,500);
    const map=new THREE.CanvasTexture(canvas);
    map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=4;
    map.needsUpdate=true;
    return map;
  }
  const featherMap=buildFeatherMap();
  const detailedFeathers=new Map();
  if(featherMap){
    for(const source of [black,mid,edge]){
      const detailed=source.clone();
      detailed.map=featherMap;
      detailed.metalness=Math.min(.22,source.metalness+.04);
      detailed.roughness=.67;
      detailed.needsUpdate=true;
      detailedFeathers.set(source,detailed);
      materials.push(detailed);
    }
  }
  const mesh = (geometry,mat,parent=root) => {
    const item = new THREE.Mesh(geometry,mat);
    item.frustumCulled = false;
    parent.add(item);return item;
  };
  function oval(x,y,z,sx,sy,sz,mat,tilt=0,parent=root) {
    const item=mesh(new THREE.SphereGeometry(1,20,14),mat,parent);
    item.position.set(x,y,z); item.scale.set(sx,sy,sz);
    item.rotation.z=tilt;return item;
  }
  function plume(parent,ax,ay,az,bx,by,bz,width,material,vein=false){
    const points=[],uv=[],faces=[];
    const dx=bx-ax,dy=by-ay;
    const length=Math.hypot(dx,dy)||1;
    const nx=-dy/length,ny=dx/length;
    const n=9;
    for(let i=0;i<=n;i++){
      const t=i/n;
      const span=width*Math.pow(Math.sin(Math.PI*t),.75)*(1-.15*t);
      const bow=Math.sin(Math.PI*t)*.11;
      const cx=ax+dx*t,cy=ay+dy*t,cz=az+(bz-az)*t+bow;
      for(let j=0;j<3;j++){
        const s=j-1;
        points.push(cx+nx*span*s*.5,cy+ny*span*s*.5,cz+(1-Math.abs(s))*.055);
        uv.push((s+1)/2,t);
      }
      if(i<n)for(let j=0;j<2;j++){
        const a=i*3+j,b=a+3;
        faces.push(a,b,a+1,a+1,b,b+1);
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setIndex(faces);geo.computeVertexNormals();
    mesh(geo,detailedFeathers.get(material)||material,parent);
    if(vein){
      const dir=new THREE.Vector3(bx-ax,by-ay,bz-az);
      const p0=new THREE.Vector3(ax,ay,az+.024);
      const p2=p0.clone().addScaledVector(dir,.92);
      const p1=p0.clone().lerp(p2,.5);p1.z+=.09;
      mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0,p1,p2),9,.009,3,false),shaft,parent);
    }
  }
  // Broad body and distinct forward-pointing raven head, not an oval icon.
  oval(-.20,-.17,-.03,.57,.88,.41,black,-.23);
  oval(.22,.02,.22,.40,.67,.34,mid,-.26);
  oval(.56,.43,.09,.34,.32,.29,black,-.20);
  oval(.37,.20,.12,.32,.42,.31,black,-.36);
  // Long tapered, slightly curved black beak with a sharp upper ridge.
  const bill=mesh(new THREE.ConeGeometry(.17,.68,7,1),dark);
  bill.rotation.z=-Math.PI/2;
  bill.position.set(1.03,.36,.10);
  const billRidge=mesh(new THREE.ConeGeometry(.10,.55,7),edge);
  billRidge.rotation.z=-Math.PI/2;
  billRidge.position.set(.99,.40,.17);
  oval(.65,.49,.365,.066,.072,.035,dark);
  oval(.665,.51,.390,.015,.017,.006,edge);
  // Shingled chest / neck hackles with micro-specular variation.
  for(let row=0;row<7;row++){
    for(let c=0;c<6;c++){
      const y=.29-row*.17, x=.20+(c-2.5)*.13-(row*.025);
      const z=.34+.035*Math.cos(c*.8)-row*.006;
      plume(root,x,y,z,x-.10-(c%2)*.02,y-.24,z-.035,
        .09+(c%3)*.009,(row+c)%4===0?edge:(row+c)%3===0?black:mid,false);
    }
  }
  // Tail feathers fan behind the lower torso with rounded, overlapping tips.
  const tail=new THREE.Group();
  tail.position.set(-.65,-.54,-.11);root.add(tail);
  for(let i=0;i<11;i++){
    const f=(i-5)/5;
    plume(tail,0,0,-.06,-1.00+f*.15,-.47+f*.57,-.14+Math.abs(f)*.07,
      .20+(1-Math.abs(f))*.045,i%3===0?edge:mid,i%4===0);
  }
  // Two independently moving wing joints with distinguishable primary feathers.
  const upperWing=new THREE.Group();
  upperWing.position.set(-.35,.40,-.02);root.add(upperWing);
  const lowerWing=new THREE.Group();
  lowerWing.position.set(.03,.17,.21);root.add(lowerWing);
  oval(-.26,.29,.04,.51,.23,.20,black,.80,upperWing);
  oval(.33,-.31,-.04,.35,.52,.18,black,-.40,lowerWing);

  // Shoulder, secondaries, and long separated "finger" feathers of raised wing.
  for(let i=0;i<19;i++){
    const f=i/18;
    const angle=2.32-f*1.14;
    const len=1.45+.38*(1-f);
    plume(upperWing,-.12+f*.20,-.07+f*.17,.05,
      Math.cos(angle)*len-.1,Math.sin(angle)*len+.10,-.06+f*.08,
      .22+(1-f)*.045,i%4===0?edge:i%2===0?black:mid,i%3===0);
  }
  for(let i=0;i<11;i++){
    const t=i/10;
    plume(upperWing,-.26+t*.18,.12+t*.30,.20,
      -.85+t*.32,.47+t*1.05,.22,.17,i%3===0?edge:mid);
  }

  // Nearer wing is on the downstroke: layered secondaries taper into primaries.
  for(let i=0;i<18;i++){
    const f=i/17;
    const angle=-2.22+f*.92;
    const len=1.36+.35*f;
    plume(lowerWing,.02+f*.16,-.10,-.04,
      Math.cos(angle)*len+.34,Math.sin(angle)*len-.06,.06+f*.08,
      .23+(1-f)*.025,i%4===0?edge:i%2===0?black:mid,i%3===0);
  }
  for(let i=0;i<10;i++){
    const f=i/9;
    plume(lowerWing,.03+f*.14,-.07,.24,
      -.40+f*.74,-.43-f*.77,.28,.19,i%3===0?edge:mid);
  }

  // Curled legs and individual talons, visible below the breast.
  function claw(points,r=.028){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(curve,12,r,5,false),dark);
  }
  for(const ox of [-.13,.18]){
    claw([[ox,-.78,.22],[ox+.02,-.96,.30],[ox+.08,-1.08,.36]],.045);
    for(const f of [-1,0,1]){
      claw([[ox+.08,-1.06,.36],[ox+.12+f*.10,-1.17,.44],[ox+.16+f*.11,-1.21,.36]],.017);
    }
  }
  // Normalize the side pose to the exact displayed dimensions of the GLB.
  // Before this, model scale jumped when front and side poses crossfaded.
  const bounds=new THREE.Box3().setFromObject(root);
  const actualSize=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const fit=4.38/Math.max(actualSize.x,actualSize.y,actualSize.z,.001);
  const contents=new THREE.Group();
  for(const child of [...root.children])contents.add(child);
  root.add(contents);
  contents.position.copy(center).multiplyScalar(-1);
  root.scale.setScalar(fit);
  let facing=1;
  function setDirection(sign){
    facing=sign<0?-1:1;
    root.scale.x=facing*fit;
  }
  function setBlend(amount){
    root.visible=amount>.004;
    for(const mat of materials)mat.opacity=amount;
  }
  function flap(t,pose,glide){
    // 'pose' is the measured 8-frame raven reference wing position in [-1,1].
    // This motion is no longer an unrelated sine wave: both 3D wings follow
    // the same upstroke/downstroke beats as the approved 960ms GIF.
    const motion=THREE.MathUtils.clamp(pose,-1,1);
    const range=1-glide*.64;
    // Leading wing stays raised on the upstroke and folds smoothly on descent.
    upperWing.rotation.z=.13+motion*.40*range;
    upperWing.rotation.x=-.09+motion*.23*range;
    upperWing.rotation.y=.04+motion*.19*range;
    // The nearer wing fans downward and twists its feathers on the downstroke.
    lowerWing.rotation.z=-.08-motion*.43*range;
    lowerWing.rotation.y=.05+motion*.34*range;
    lowerWing.rotation.x=.03-motion*.13*range;
    // The tail stabilizes the body, instead of flapping out of phase.
    tail.rotation.z=Math.sin(t*2.1)*.030*(1-glide*.7);
  }
  return {root,setBlend,setDirection,flap};
}
