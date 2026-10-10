import * as THREE from "three";
import { buildModel, type IAutoMovieTextureResolver } from "@automovie/viewer";
import type { IMedievalManorScene } from "./IMedievalManorScene";
import type { createManorInstanceConsumer } from "../instances/manor-viewer";
import { configureManorRenderer } from "./configureManorRenderer";
interface PresentationInput {
  shadows: boolean;
  resolveTexture?: IAutoMovieTextureResolver;
  instanceConsumer?: ReturnType<typeof createManorInstanceConsumer>;
  entries: IMedievalManorScene["entries"];
  rooms: IMedievalManorScene["manifest"]["rooms"];
  boundaries: IMedievalManorScene["manifest"]["boundaries"];
  portals: IMedievalManorScene["manifest"]["portals"];
  holes: number[][];
  chimneyCut: number[];
  levels: number[];
}
/** Preserve the actual scene, authored views, articulation and rendering controls over the same constructed entries. */
export function buildManorPresentation({ shadows, resolveTexture, instanceConsumer, entries,
  rooms, boundaries, portals, holes, chimneyCut, levels }: PresentationInput): IMedievalManorScene {
const scene=new THREE.Scene();scene.background=new THREE.Color('#ded9cf');
const camera=new THREE.PerspectiveCamera(46.83,1.5,.025,120);
scene.add(new THREE.HemisphereLight('#edf2f5','#827764',1.10));const sun=new THREE.DirectionalLight('#fff1df',2.6);sun.position.set(-12,18,10);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:.1,far:55});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);scene.add(sun.target);
const inspection=new THREE.DirectionalLight('#fff8ed',.50);scene.add(inspection);scene.add(inspection.target);
const objects=new Map<string, THREE.Object3D>();for(const e of entries){const {object}=instanceConsumer?instanceConsumer.build(e):buildModel(e.model,resolveTexture);object.name=e.id;if(e.pose){object.position.fromArray(e.pose.pivot);object.rotation.y=e.pose.angle;}object.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(e.model.parts.find(p=>p.name===o.name)?.material==='glass'){if(Array.isArray(o.material))throw new Error('Authored glass part requires one material.');o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.35;o.material.depthWrite=false;o.castShadow=false;}}});scene.add(object);objects.set(e.id,object);}
const objectFor=(id: string)=>{const object=objects.get(id);if(object===undefined)throw new Error('Missing authored scene object: '+id);return object;};
const roomFor=(id: string | null | undefined)=>{const room=rooms.find(r=>r.id===id);if(room===undefined)throw new Error('Missing authored scene room: '+id);return room;};
function setArticulation(entry: IMedievalManorScene["entries"][number],fraction: number){
 const a=entry.articulation,o=objectFor(entry.id);if(a===undefined)throw new Error('Entry has no authored articulation: '+entry.id);const t=a.rest,axis=new THREE.Vector3(a.motion.axis.x,a.motion.axis.y,a.motion.axis.z).normalize();
 const value=a.closed+(a.open-a.closed)*fraction,position=new THREE.Vector3(t.translation.x,t.translation.y,t.translation.z),rotation=new THREE.Quaternion(t.rotation.x,t.rotation.y,t.rotation.z,t.rotation.w),scale=new THREE.Vector3(t.scale.x,t.scale.y,t.scale.z);
 if(a.motion.kind==='revolute')rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axis,value));else position.addScaledVector(axis.applyQuaternion(rotation),value);
 const matrix=new THREE.Matrix4().compose(position,rotation,scale);
 if(a.relativeToParent){if(entry.parent===undefined)throw new Error('Relative articulation has no parent.');const parent=objectFor(entry.parent);parent.updateMatrixWorld(true);matrix.premultiply(parent.matrixWorld);}
 matrix.decompose(o.position,o.quaternion,o.scale);
}
const belongs=(id: string,parent: string): boolean =>{if(id===parent)return true;const e=entries.find(e=>e.id===id);return Boolean(e?.parent&&belongs(e.parent,parent));};
const objectBounds=(id: string)=>{const box=new THREE.Box3();for(const e of entries)if(belongs(e.id,id))box.union(new THREE.Box3().setFromObject(objectFor(e.id)));return box;};
for(const e of entries)if(e.articulation)setArticulation(e,e.articulation.default);
const views: IMedievalManorScene["views"] = [
 {id:'01-whole-south-east',eye:[20,13,23],at:[0,3,0]}, {id:'02-whole-south-west',eye:[-20,13,23],at:[0,3,0]},
 {id:'03-whole-north-east',eye:[20,12,-23],at:[0,3,0]}, {id:'04-whole-north-west',eye:[-20,12,-23],at:[0,3,0]},
 {id:'exterior-south',eye:[0,6,27],at:[0,3,0]}, {id:'exterior-north',eye:[0,6,-27],at:[0,3,0]}, {id:'exterior-west',eye:[-27,6,0],at:[0,3,0]}, {id:'exterior-east',eye:[27,6,0],at:[0,3,0]},
 {id:'roof-overhead',eye:[0,27,3],at:[0,0,0]}, {id:'ground-plan',eye:[0,26,0],at:[0,0,0],cut:'ground',plan:true}, {id:'upper-plan',eye:[0,27,0],at:[0,3.33,0],cut:'upper',plan:true},
 {id:'stair-section-west',eye:[-7.5,3.5,-3.7],at:[.4,1.9,-3.7],cut:'stair'}, {id:'stair-section-south',eye:[.3,3.5,4],at:[.3,1.9,-3.7],cut:'stair'},
 {id:'frame-axonometric',eye:[19,19,21],at:[0,2,0],cut:'frame'},
 {id:'reference-exterior',eye:[16,7.5,20],at:[0,4.0,0]},
 {id:'reference-courtyard',eye:[.20,1.75,7.70],at:[0,2.5,-.60]},
 {id:'garden-south',eye:[0,1.6,6.6],at:[0,1.5,.1]}, {id:'garden-reverse',eye:[0,2,-.8],at:[0,1.3,5.5]},
 {id:'stair-start',eye:[-.7,2.05,-1.60],at:[-.7,2.0,-4.8]}, {id:'stair-turn',eye:[-.70,3.49,-4.7],at:[2.5,3.6,-4.7]}, {id:'stair-top-return',eye:[2.35,4.93,-4.7],at:[-.7,2.4,-4.7]},
 {id:'landing-to-corridor',eye:[2.35,4.93,-3.4],at:[-1,4.6,-.9]},
 {id:'gallery-turn-west',eye:[-3.9,2.05,-.65],at:[-3.85,1.6,5.4]}, {id:'gallery-turn-east',eye:[3.9,2.05,-.65],at:[3.85,1.6,5.4]},
 {id:'corridor-west-to-east',eye:[-5.1,4.93,-.9],at:[5.9,4.7,-.9]}, {id:'corridor-east-to-west',eye:[6.0,4.93,-.9],at:[-5.1,4.7,-.9]},
];
for(const r of rooms){const [x0,x1,z0,z1]=r.bounds,y=levels[r.level]+1.6,c=[(x0+x1)/2,y,(z0+z1)/2];for(const [id,dx,dz]of [['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]] satisfies [string, number, number][])views.push({id:r.id+'--'+id,eye:c,at:[c[0]+dx,y,c[2]+dz],room:r.id});for(const [id,x,z]of [['corner-a',x0+.25,z0+.25],['corner-b',x1-.25,z1-.25],['corner-c',x0+.25,z1-.25],['corner-d',x1-.25,z0+.25]] satisfies [string, number, number][])views.push({id:r.id+'--'+id,eye:[x,y,z],at:[c[0],y-.3,c[2]],room:r.id});views.push({id:r.id+'--threshold',eye:[r.door[0],y,r.door[1]],at:[c[0],y-.25,c[2]],room:r.id});}
for(const r of rooms.filter(r=>r.polygon.length>4)){
 const contains=(p: number[])=>{let inside=false;for(let i=0,j=r.polygon.length-1;i<r.polygon.length;j=i++){const a=r.polygon[i],b=r.polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 for(let i=0;i<r.polygon.length;i++){const p=r.polygon[i],a=r.polygon[(i+r.polygon.length-1)%r.polygon.length],b=r.polygon[(i+1)%r.polygon.length];let dx=(a[0]-p[0])/Math.hypot(a[0]-p[0],a[1]-p[1])+(b[0]-p[0])/Math.hypot(b[0]-p[0],b[1]-p[1]),dz=(a[1]-p[1])/Math.hypot(a[0]-p[0],a[1]-p[1])+(b[1]-p[1])/Math.hypot(b[0]-p[0],b[1]-p[1]);if(!contains([p[0]+dx*.22,p[1]+dz*.22])){dx=-dx;dz=-dz;}const eye=[p[0]+dx*.22,levels[r.level]+1.6,p[1]+dz*.22];views.push({id:r.id+'--polygon-corner-'+i,room:r.id,eye,at:[eye[0]+dx,eye[1]-.2,eye[2]+dz]});}
}
// Additional views retain the original required room views and resolve observed occlusions.
for(const r of rooms){const [x0,x1,z0,z1]=r.bounds,y=levels[r.level]+1.6,c=[(x0+x1)/2,y,(z0+z1)/2];if(!r.id.startsWith('gallery')&&r.id!=='landing'&&r.id!=='corridor'){const dx=c[0]-r.door[0],dz=c[2]-r.door[1],d=Math.hypot(dx,dz);views.push({id:r.id+'--inside-entry',eye:[r.door[0]+dx/d*.65,y,r.door[1]+dz/d*.65],at:[c[0],y-.4,c[2]],room:r.id});}}
views.push(
 {id:'storage--nook-in',eye:[6.92,4.93,-1.15],at:[6.92,4.55,2.5],room:'storage'},
 {id:'storage--nook-return',eye:[6.92,4.93,1.4],at:[6.92,4.5,-1.5],room:'storage'},
 {id:'master--shaft-clear',eye:[-6.98,4.93,-1.1],at:[-6.6,4.45,.7],room:'master'},
 {id:'pantry--aisle-high',eye:[-2.2,2.85,-4.8],at:[-2.7,1.15,-2.0],room:'pantry'},
 {id:'hall--hearth-clear',eye:[-5.1,2.35,1.0],at:[-6.3,1.2,-.5],room:'hall'},
 {id:'kitchen--working-clear',eye:[-4.1,2.35,-2.7],at:[-6.2,1.2,-3.7],room:'kitchen'},
 {id:'washroom--screen-front',eye:[4.55,5.2,.5],at:[3.8,4.0,1.5],room:'washroom'},
 {id:'washroom--screen-back',eye:[4.55,5.2,4.8],at:[3.85,4.0,2.1],room:'washroom'},
 {id:'storage--aisle-high',eye:[5.5,5.65,1],at:[6.5,4.2,4.5],room:'storage'},
 {id:'gallery--entry-approach',eye:[.8,2.05,-.1],at:[.8,1.9,-2.5],room:'gallery-rear'},
 {id:'stair--lower-inner',eye:[1.6,2.2,-2],at:[-.7,1.5,-3.7],room:'entrance'},
 {id:'stair--landing-high',eye:[-.7,4.3,-4.7],at:[2.1,3.2,-4.7],room:'entrance'}
);
// Move a camera past an open leaf instead of treating an occluded entry as reviewed.
for(const v of views){if(v.id==='kitchen--inside-entry'){v.eye=[-4.0,2.05,-2.6];v.at=[-5.8,1.6,-3.8];}if(v.id==='master--inside-entry'){v.eye=[-4.45,4.93,1.3];v.at=[-5.4,4.4,3.8];}}
// v17 recorded invalid occlusions. Reposition only the observer, never hide the
// obstructing authored part or count a wall-only frame as a room observation.
const revisedEyes: Partial<Record<string, number[]>> = {
 'ledger--corner-a':[4.80,2.05,-4.85],
 'service--threshold':[4.95,2.05,4.00],
 'gallery-rear--threshold':[.35,2.05,-.35],
 'hall--corner-a':[-6.98,2.05,.15],'hall--corner-d':[-4.94,2.05,.20],
 'pantry--corner-a':[-2.48,2.05,-4.95],'pantry--corner-c':[-2.47,2.05,-1.70],
 'entrance--corner-a':[-1.08,2.05,-1.85],
 'master--corner-d':[-4.08,4.93,.60],'master--threshold':[-4.46,4.93,.85],
 'master--polygon-corner-0':[-6.97,4.93,-.42],'master--polygon-corner-5':[-4.0,4.93,.7],
 'storage--corner-a':[5.90,4.93,.48],'storage--corner-c':[5.90,4.93,5.40],
 'storage--polygon-corner-0':[6.78,4.93,-1.25],'storage--polygon-corner-1':[7.16,4.93,-1.25],
 'storage--polygon-corner-3':[5.90,4.93,5.35],'storage--polygon-corner-4':[5.75,4.93,.65],
 'storage--aisle-high':[6.1,5.65,.65],
 'landing--corner-b':[2.36,4.93,-2.10],'landing--polygon-corner-2':[2.42,4.93,-2.08]
};
for(const v of views){
 const revisedEye=revisedEyes[v.id];if(revisedEye){v.eye=revisedEye;const r=roomFor(v.room),[x0,x1,z0,z1]=r.bounds;v.at=[(x0+x1)/2,levels[r.level]+.95,(z0+z1)/2];}
 if(v.room?.startsWith('gallery')&&/--(north|east|south|west)$/.test(v.id)){
  const r=roomFor(v.room),[x0,x1]=r.bounds,dir=v.id.split('--')[1];
  if(v.room==='gallery-rear'){v.eye=[.32,2.05,-.55];v.at=dir==='east'?[4.0,1.65,-.55]:dir==='west'?[-4.0,1.65,-.55]:dir==='north'?[.80,1.75,-1.3]:[.32,1.4,1.3];}
  else{const x=(x0+x1)/2;v.eye=[x,2.05,2.25];v.at=dir==='north'?[x,1.7,-.5]:dir==='south'?[x,1.7,5.8]:[dir==='east'?x1:x0,1.40,3.90];}
 }
 if(v.room==='washroom'&&/--(north|east|south|west)$/.test(v.id)){
  const d=v.id.split('--')[1];v.eye=[4.48,4.93,d==='north'?1.7:3.85];v.at=d==='north'?[3.8,4.08,.8]:d==='south'?[3.8,3.95,4.8]:d==='east'?[4.85,4.02,3.1]:[3.8,3.85,3.1];
 }
 if(v.id==='corridor--south'){v.eye=[.35,4.93,-1.1];v.at=[2.5,4.05,-.08];}
 if(v.id==='landing--east'){v.eye=[2.30,4.93,-3.30];v.at=[2.8,3.95,-2.02];}
}
// Keep oblique detail evidence separate from the required eye-level cardinal rays.
for(const v of [...views])if(v.room&&/--(north|east|south|west)$/.test(v.id)){
 const r=roomFor(v.room),[x0,x1,z0,z1]=r.bounds,y=levels[r.level]+1.6,d=v.id.split('--')[1];
 const expected=[(x0+x1)/2,y,(z0+z1)/2],directions: Partial<Record<string, number[]>>={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]},dir=directions[d];
 if(dir===undefined||v.eye===undefined||v.at===undefined)throw new Error('Missing authored cardinal view: '+v.id);
 if(v.eye.some((q,i)=>q!==expected[i])||Math.abs(v.at[1]-y)>.0001)views.push({...v,id:v.id+'-working-detail'});
 v.eye=expected;v.at=[expected[0]+dir[0],y,expected[2]+dir[1]];
}
for(const [roomId,doorId]of [['hall','hall-door'],['kitchen','kitchen-door'],['pantry','pantry-door'],['ledger','ledger-door'],['service','service-door'],['entrance','entrance-door'],['master','master-door'],['child-west','child-west-door'],['child-east','child-east-door'],['washroom','wash-door'],['storage','storage-door']]){
 const r=roomFor(roomId),p=portals.find(p=>p.id===doorId),v=views.find(v=>v.id===roomId+'--inside-entry'),y=levels[r.level]+1.6;
 if(p===undefined)throw new Error('Missing authored portal: '+doorId);
 const eye=roomId==='washroom'?[4.53,y,2.1]:roomId==='entrance'?[2.24,y,-2.12]:v?.eye||[(r.bounds[0]+r.bounds[1])/2,y,(r.bounds[2]+r.bounds[3])/2];
 const delta=[eye[0]-p.eye[0],eye[2]-p.eye[2]],distance=Math.hypot(...delta),station=distance<3.15?[p.eye[0]+delta[0]*3.15/distance,y,p.eye[2]+delta[1]*3.15/distance]:eye;
 for(const fraction of [0,.5,1])views.push({id:roomId+'--door-sweep-'+fraction,room:roomId,eye:station,at:[p.eye[0],levels[r.level]+1.05,p.eye[2]],doorOpen:fraction});
}
for(const [id,roomId,eye,at]of [
 ['hall--aisle-length','hall',[-5.302,2.05,3.68],[-5.302,1.25,.85]],
 ['hall--west-seat-end','hall',[-7.0,2.05,3.85],[-7.0,1.10,2.35]],
 ['ledger--bookcase-front','ledger',[4.25,2.05,-3.90],[3.85,1.35,-5.0]],
 ['entrance--understair-storage','entrance',[1.72,2.05,-2.90],[.8,1.05,-4.30]],
 ['gallery-west--clear-lane','gallery-west',[-3.91,2.05,5.52],[-3.91,1.20,.10]],
 ['gallery-east--clear-lane','gallery-east',[3.91,2.05,5.52],[3.91,1.20,.10]],
 ['gallery-rear--clear-lane','gallery-rear',[-3.9,2.05,-.69],[3.9,1.30,-.69]],
 ['washroom--basin-workspace','washroom',[4.47,4.93,.65],[3.90,4.10,1.7]],
 ['garden--seating-return',null,[-.1,1.6,9.3],[-2.1,.8,6.55]]] satisfies [string, string | null, number[], number[]][])views.push({id,room:roomId,eye,at});
for(const e of entries){
 const basis=(e.pose?.closedAngle??e.review?.frontAngle??0)*180/Math.PI;
 for(const [face,az,el]of [['front',0,0],['right',90,0],['rear',180,0],['left',270,0],['top',0,85],['bottom',0,-85],['oblique-a',40,30],['oblique-b',220,30]] satisfies [string, number, number][])views.push({id:e.id+'--'+face,object:e.id,az:az+basis,el,neutral:true});
 if(e.articulation)for(const fraction of [0,.5,1])for(const [side,az]of [['a',40],['b',220]] satisfies [string, number][]){
  views.push({id:e.id+'--operation-'+fraction+'-'+side,object:e.parent,focus:e.id,operation:{element:e.id,fraction},az:(side==='a'?40:140)+basis,el:20,connectionOnly:e.role==='window'});
  // The hall chest stands against the south wall. Its two installed-state
  // observations share reachable indoor stations across every lid state;
  // fitting an orbit to the lid alone can put the observer behind that wall.
  views.push(e.id==='hall-chest-lid'
   ? {id:e.id+'--operation-'+fraction+'-'+side+'-context',room:'hall',eye:side==='a'?[-6.10,2.05,4.30]:[-6.95,2.05,4.30],at:[-6.72,1.05,5.30],operation:{element:e.id,fraction}}
   : e.id==='ww-c-0-casement--1'&&side==='a'
    ? {id:e.id+'--operation-'+fraction+'-'+side+'-context',room:'kitchen',eye:[-5.9,2.05,-3.75],at:[-7.35,1.96,-2.96],operation:{element:e.id,fraction}}
    : {id:e.id+'--operation-'+fraction+'-'+side+'-context',object:e.id,context:true,operation:{element:e.id,fraction},az,el:20});
 }
}
const manifest={purpose:'whole manor scratch frame; not formal compiler topology',rooms,boundaries,portals,entries:entries.map(({model,...e})=>({...e,parts:model.parts.map(p=>p.id)})),area:{footprint:135.8,upperOpening:holes.reduce((s,h)=>s+(h[1]-h[0])*(h[3]-h[2]),0),servicePenetration:(chimneyCut[1]-chimneyCut[0])*(chimneyCut[3]-chimneyCut[2])},holes,chimneyCut};
// Temporary observation switch distinguishes shadow artifacts from authored geometry.
if(shadows===false)sun.castShadow=false;
function applyView(index: number){
 const v=views[index];if(v===undefined)throw new Error('Unknown authored manor view: '+index);for(const e of entries){
  const o=objectFor(e.id);if(e.pose)o.rotation.y=v.neutral||v.room&&v.id.includes('corner')||v.operation&&belongs(v.operation.element,e.id)?e.pose.closedAngle:e.pose.angle;
  if(e.articulation)setArticulation(e,v.operation?.element===e.id?v.operation.fraction:v.neutral?0:e.articulation.default);
  o.visible=v.context||!v.object||belongs(e.id,v.object);
  if(v.connectionOnly&&e.id===v.object)o.visible=false;
  if(v.cut==='ground')o.visible=e.level<=0&&e.id!=='floor-joists';if(v.cut==='upper')o.visible=(e.level===1&&e.id!=='upper-ceiling')||e.id==='central-stair'||e.id==='chimney';if(v.cut==='frame')o.visible=e.id!=='roof-envelope'&&e.id!=='upper-ceiling';if(v.cut==='stair')o.visible=['central-stair','upper-floor','ground-floor','foundation','floor-joists'].includes(e.id);
  o.traverse(n=>{if(n instanceof THREE.Mesh){const ms=Array.isArray(n.material)?n.material:[n.material];for(const m of ms){m.clippingPlanes=v.cut==='stair'&&(e.role==='slab'||e.id==='floor-joists')?[v.id.endsWith('west')?new THREE.Plane(new THREE.Vector3(1,0,0),1.4):new THREE.Plane(new THREE.Vector3(0,0,-1),-2.2)]:[];if(e.id==='chimney'&&v.cut!==undefined&&['ground','upper'].includes(v.cut))m.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),v.cut==='ground'?3.11:6.12),...(v.cut==='upper'?[new THREE.Plane(new THREE.Vector3(0,1,0),-3.33)]:[])];}}});
 }
 if(v.doorOpen!==undefined)for(const e of entries)if(e.pose)objectFor(e.id).rotation.y=e.pose.closedAngle+(e.pose.angle-e.pose.closedAngle)*v.doorOpen;
 if(v.doorOpen!==undefined)for(const e of entries)if(e.articulation?.relativeToParent)setArticulation(e,e.articulation.default);
 camera.up.set(0,1,0);camera.fov=2*Math.atan(Math.tan(Math.PI/6)/camera.aspect)*180/Math.PI;if(v.plan)camera.up.set(0,0,-1);
 let inspectionTarget: THREE.Vector3;
 if(v.object){
  if(v.az===undefined||v.el===undefined)throw new Error('Object view has no authored orbit: '+v.id);
  const b=objectBounds(v.focus??v.object);if(v.focus)b.expandByScalar(.07);
  const c=b.getCenter(new THREE.Vector3()),a=v.az*Math.PI/180,e=v.el*Math.PI/180;
  const n=new THREE.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),n).normalize(),up=new THREE.Vector3().crossVectors(n,right).normalize(),tv=Math.tan(camera.fov*Math.PI/360),th=tv*camera.aspect;
  let distance=.1;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const d=new THREE.Vector3(x,y,z).sub(c);distance=Math.max(distance,d.dot(n)+1.12*Math.max(Math.abs(d.dot(right))/th,Math.abs(d.dot(up))/tv));}
  camera.position.copy(c).addScaledVector(n,distance);camera.lookAt(c);inspectionTarget=objectBounds(v.focus??v.object).getCenter(new THREE.Vector3());
 }else{if(v.eye===undefined||v.at===undefined)throw new Error('Station view has no authored camera: '+v.id);camera.position.fromArray(v.eye);camera.lookAt(new THREE.Vector3().fromArray(v.at));inspectionTarget=new THREE.Vector3().fromArray(v.at);}
 inspection.visible=Boolean(v.object||v.room||v.id.includes('stair')||v.id.includes('corridor')||v.id.includes('landing'));inspection.position.copy(camera.position);inspection.target.position.copy(inspectionTarget);camera.updateProjectionMatrix();
 if(instanceConsumer){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);instanceConsumer.update(camera);}
 return v;
}

const target=new THREE.Vector3(0,3,0);applyView(0);
return {scene,camera,views,objects,entries,inspection,applyView,manifest,target,setArticulation,configureRenderer:configureManorRenderer,update(){inspection.position.copy(camera.position);inspection.target.position.copy(target);}};
}
