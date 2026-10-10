import type { IAutoMovieTextureResolver } from "@automovie/viewer";
// #1902 whole-house frame scratch. No reviewed stage or formal receipt.
import * as THREE from 'three';
import type { IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieQuaternion, IAutoMovieTransform, IAutoMovieTravelMotion, IAutoMovieVector3 } from "@automovie/interface";
import type { IMedievalManorScene } from "./IMedievalManorScene";
import type { createManorInstanceConsumer } from "../instances/manor-viewer";
import { buildManorRoof } from "./buildManorRoof";
import { buildManorPresentation } from "./buildManorPresentation";
interface SceneOptions {
  shadows?: boolean;
  resolveTexture?: IAutoMovieTextureResolver;
  geometryOnly?: boolean;
  instanceConsumer?: ReturnType<typeof createManorInstanceConsumer>;
}
interface GeometryOptions extends SceneOptions { geometryOnly: true; }
interface VisualOptions extends SceneOptions { geometryOnly?: false; }
interface ManorGeometry {
  entries: IMedievalManorScene["entries"];
  rooms: IMedievalManorScene["manifest"]["rooms"];
  boundaries: IMedievalManorScene["manifest"]["boundaries"];
  portals: IMedievalManorScene["manifest"]["portals"];
  holes: number[][];
  chimneyCut: number[];
}
interface Mechanism {
  id: string; parent: string; level: number; prefix: string; pivot: number[];
  restAngle: number; axis: number[]; travel: number; kind?: string; default?: number;
}
import {createManorCraft} from './manor-craft';
import {createManorGarden} from './manor-garden';
import {mapManorMaterials,metricGeometry} from '../materials/manor';

import {buildAutoMoviePolyhedron,triangulateAutoMovieRegion,extrudeAutoMovieRegion,revolveAutoMovieProfile} from '@automovie/engine';

export function createManorScene(options: GeometryOptions): ManorGeometry;
export function createManorScene(options?: VisualOptions): IMedievalManorScene;
export function createManorScene({shadows=true,resolveTexture,geometryOnly=false,instanceConsumer}: SceneOptions = {}): IMedievalManorScene | ManorGeometry {
const C=(h: THREE.ColorRepresentation)=>{const c=new THREE.Color(h);return{r:c.r,g:c.g,b:c.b,a:1,hex:null};};
const materials: IAutoMovieMaterial[] = Object.entries({oak:'#574331',oakLight:'#6b523d',oakPale:'#755d46',oakGrain:'#4b3d2e',plaster:'#d3c2a3',stone:'#929085',stoneLight:'#aaa496',stoneDark:'#68645c',roof:'#74503a',roofLight:'#80563c',roofMuted:'#79543e',floor:'#a4957a',upper:'#896f51',iron:'#363532',ironWarm:'#6b5541',glass:'#a2b3ac',water:'#476f73',soil:'#655e42',herbs:'#657d48',leaves:'#7d854c',leafLight:'#7e874b',leafDark:'#4a6137',flower:'#a96f63',gravel:'#b4a58b',bed:'#8e8876',linen:'#bda986',linenDark:'#87775f',quiltRust:'#795447',quiltSage:'#69765c',appleRed:'#8d4535',clay:'#8d654d',clayLight:'#b89874',charcoal:'#302b25',leather:'#65483b',paper:'#cfbd92',wax:'#d8bc83',flame:'#ffbd46',ember:'#d86b22',proxy:'#a88b61'}).map(([id,h])=>({id,name:id,baseColor:C(h),roughness:['iron','ironWarm'].includes(id)?.46:id==='glass'?.18:id==='water'?.21:.88,metallic:['iron','ironWarm'].includes(id)?.65:0,opacity:id==='glass'?.35:id==='water'?.76:1,emissive:['flame','ember'].includes(id)?C(h):null,baseColorTexture:null,doubleSided:['herbs','leaves','leafLight','leafDark'].includes(id)}));
const V=(a: number[]): IAutoMovieVector3 =>({x:a[0],y:a[1],z:a[2]});
const Q=(a: number[],t: number): IAutoMovieQuaternion =>{const s=Math.sin(t/2);return{x:a[0]*s,y:a[1]*s,z:a[2]*s,w:Math.cos(t/2)};};
const T=(p: number[],r: IAutoMovieQuaternion = {x:0,y:0,z:0,w:1}): IAutoMovieTransform =>({translation:V(p),rotation:r,scale:{x:1,y:1,z:1}});
let parts: IMedievalManorScene["entries"][number]["model"]["parts"] = [];
const entries: IMedievalManorScene["entries"] = [], boundaries: ManorGeometry["boundaries"] = [], portals: ManorGeometry["portals"] = [], rooms: ManorGeometry["rooms"] = [], mechanisms: Mechanism[] = [];
const box=(id: string,size: number[],p: number[],material='oak',rotation?: IAutoMovieQuaternion,mapping?: Parameters<typeof metricGeometry>[2])=>parts.push({id,name:id,geometry:metricGeometry({type:'primitive',shape:{type:'box',width:size[0],height:size[1],depth:size[2]}},material,mapping),material,attachedBone:null,transform:T(p,rotation)});
const mesh=(id: string,data: IAutoMovieMesh,p: number[],material='plaster',rotation?: IAutoMovieQuaternion,mapping?: Parameters<typeof metricGeometry>[2])=>parts.push({id,name:id,geometry:metricGeometry({type:'mesh',mesh:data},material,mapping),material,attachedBone:null,transform:T(p,rotation)});
 const localBeam=(id: string,a: number[],b: number[],w=.06,material='oak')=>{const aa=new THREE.Vector3().fromArray(a),bb=new THREE.Vector3().fromArray(b),d=bb.clone().sub(aa),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());box(id,[w,d.length(),w],aa.add(bb).multiplyScalar(.5).toArray(),material,{x:q.x,y:q.y,z:q.z,w:q.w});};
const beam=(id: string,a: number[],b: number[],w=.14,material='oak',cutShaft=true): void =>{
 if(cutShaft&&/^(rear-rafter|rear-tie|wing-rafter|wing-tie|valley)/.test(id)){
  let enter=0,leave=1,hit=true;for(const [axis,lo,hi]of [[0,chimneyCut[0]-.15,chimneyCut[1]+.15],[2,chimneyCut[2]-.15,chimneyCut[3]+.15]]){const d=b[axis]-a[axis];if(Math.abs(d)<1e-9){if(a[axis]<lo||a[axis]>hi)hit=false;}else{const ts=[(lo-a[axis])/d,(hi-a[axis])/d].sort((a,b)=>a-b);enter=Math.max(enter,ts[0]);leave=Math.min(leave,ts[1]);}}
  if(hit&&enter<leave){const at=(t: number)=>a.map((v,i)=>v+(b[i]-v)*t);if(enter>.0001)beam(id+'-before',a,at(enter),w,material,false);if(leave<.9999)beam(id+'-after',at(leave),b,w,material,false);return;}
 }
 if(/rail|guard-top|inner-turn-join|arrival-guard-join/.test(id)){
  const len=Math.hypot(b[0]-a[0],b[2]-a[2]);if(len>1e-6){const nx=-(b[2]-a[2])/len*w/2,nz=(b[0]-a[0])/len*w/2,ring=(p: number[])=>[[p[0]+nx,p[1]-w/2,p[2]+nz],[p[0]-nx,p[1]-w/2,p[2]-nz],[p[0]-nx,p[1]+w/2,p[2]-nz],[p[0]+nx,p[1]+w/2,p[2]+nz]],aa=ring(a),bb=ring(b),f=[aa.toReversed(),bb];for(let i=0;i<4;i++)f.push([aa[i],aa[(i+1)%4],bb[(i+1)%4],bb[i]]);mesh(id,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],material);return;}
 }
 const aa=new THREE.Vector3().fromArray(a),bb=new THREE.Vector3().fromArray(b),d=bb.clone().sub(aa),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());box(id,[w,d.length(),w],aa.add(bb).multiplyScalar(.5).toArray(),material,{x:q.x,y:q.y,z:q.z,w:q.w});};
 const oak=materials.find(m=>m.id==='oak');if(oak===undefined)throw new Error('Missing authored oak material.');materials.push({...oak,id:'bark',name:'bark'});
 const texturedMaterials=mapManorMaterials(materials);
function finish(id: string,level: number,role='frame',review: IMedievalManorScene['entries'][number]['review'] = {}){entries.push({id,level,role,review,model:{id,name:id,origin:'generated',skeleton:null,materials:texturedMaterials,parts,asset:null,body:null}});parts=[];}
function travellingParts(id: string,parent: string,level: number,selected: (part: IMedievalManorScene["entries"][number]["model"]["parts"][number]) => boolean,pivot: number[],restAngle: number,axis: number[],travel: number,kind='window'){
 const chosen=parts.filter(selected);if(!chosen.length)throw new Error('Empty moving assembly: '+id);
 parts=parts.filter(p=>!selected(p));
 const rest=T(pivot,Q([0,1,0],restAngle)),matrix=(t: IAutoMovieTransform)=>new THREE.Matrix4().compose(new THREE.Vector3(t.translation.x,t.translation.y,t.translation.z),new THREE.Quaternion(t.rotation.x,t.rotation.y,t.rotation.z,t.rotation.w),new THREE.Vector3(t.scale.x,t.scale.y,t.scale.z)),inverse=matrix(rest).invert();
 const local=chosen.map(p=>{if(p.transform===null)throw new Error('Moving part has no authored rest frame.');const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();inverse.clone().multiply(matrix(p.transform)).decompose(position,rotation,scale);return {...p,transform:{translation:V(position.toArray()),rotation:{x:rotation.x,y:rotation.y,z:rotation.z,w:rotation.w},scale:V(scale.toArray())}};});
 const motion: IAutoMovieTravelMotion = {kind:'revolute',axis:V(axis),pivot:V([0,0,0]),min:Math.min(0,travel),max:Math.max(0,travel)};
 entries.push({id,level,role:kind,parent,review:{frontAngle:restAngle},articulation:{rest,motion,closed:0,open:travel,default:0},model:{id,name:id,origin:'generated',skeleton:null,materials:texturedMaterials,parts:local,asset:null,body:null}});
 return {id,element:id,motion};
}
const {bevel,at:craftAt,table,bench,hearth,counter,shelf,bed,chest,washBasin,rug,cabinet,wallLamp,latrineUnit,nightStand,serviceTools}=createManorCraft({box,mesh,beam:localBeam,finish,polyhedron:buildAutoMoviePolyhedron,revolve:revolveAutoMovieProfile,extrude:extrudeAutoMovieRegion,V,Q,registerMechanism:(m: Mechanism)=>mechanisms.push(m)});
const room=(id: string,label: string,level: number,bounds: number[],door: number[])=>rooms.push({id,label,level,bounds,door,polygon:[]});
const chimneyCut=[-6.50,-5.60,-1.90,-.70];
const roomFor=(id: string)=>{const room=rooms.find(r=>r.id===id);if(room===undefined)throw new Error('Missing authored room: '+id);return room;};
room('hall','생활 홀',0,[-7.38,-4.72,-1.2,5.75],[-4.60,3.85]);
room('kitchen','주방',0,[-7.35,-3.4,-5.25,-1.48],[-3.95,-1.36]);
room('pantry','식료실',0,[-3.2,-1.6,-5.25,-1.48],[-2.4,-1.36]);
room('ledger','서재·장부실',0,[3.2,7.35,-5.25,-1.48],[3.95,-1.36]);
room('service','저장·세척실',0,[4.72,7.35,-1.2,5.75],[4.60,3.85]);
room('entrance','현관·계단 하부',0,[-1.4,3,-5.25,-1.48],[.8,-1.36]);
room('gallery-west','서쪽 회랑',0,[-4.48,-3.25,0,5.75],[-3.85,5.75]);
room('gallery-rear','뒤쪽 회랑',0,[-4.48,4.48,-1.24,0],[0,0]);
room('gallery-east','동쪽 회랑',0,[3.25,4.48,0,5.75],[3.85,5.75]);
room('master','주침실',1,[-7.35,-3.35,.15,5.75],[-4.45,.05]);
room('child-west','작은 침실 서쪽',1,[-7.35,-1.45,-5.25,-1.85],[-4.45,-1.75]);
room('child-east','작은 침실 동쪽',1,[3.1,7.35,-5.25,-1.85],[4.45,-1.75]);
room('washroom','공동 세척·측간실',1,[3.35,4.9,.15,5.75],[4.1,.05]);
room('storage','공용 수납',1,[5.1,7.35,.15,5.75],[5.75,.05]);
room('corridor','2층 일자 복도',1,[-5.6,6.4,-1.65,-.15],[2.4,-1.65]);
room('landing','2층 계단참',1,[1.8,3,-5.25,-1.65],[2.4,-1.65]);
for(const r of rooms){const [a,b,c,d]=r.bounds;r.polygon=[[a,c],[b,c],[b,d],[a,d]];}
roomFor('master').polygon=[[-7.35,-1.65],[-6.62,-1.65],[-6.62,-.58],[-5.8,-.58],[-5.8,.15],[-3.35,.15],[-3.35,5.75],[-7.35,5.75]];
roomFor('storage').polygon=[[6.6,-1.65],[7.35,-1.65],[7.35,5.75],[5.1,5.75],[5.1,.15],[6.6,.15]];
roomFor('landing').polygon=[[1.8,-5.25],[3,-5.25],[3,-1.75],[-1.3,-1.75],[-1.3,-2.60],[0,-2.60],[0,-3.94],[1.8,-3.94]];
const levels=[.45,3.33],H=2.66;
// Each wall is one thick boundary with actual holes, not two competing facades.
function wall(id: string,a: number[],b: number[],level: number,openings: ManorGeometry["boundaries"][number]["openings"] = [],exterior=false){
 const y=levels[level],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),r=Q([0,1,0],angle);
 const pt=(s: number,yy: number,dep=0)=>[a[0]+dx*s/length+Math.sin(angle)*dep,yy,a[1]+dz*s/length+Math.cos(angle)*dep];
 // Full-height opening posts, lintels and continuous wall plates own the load path.
 const gaps=openings.map(o=>[o.at-o.w/2,o.at+o.w/2,o.sill||0,(o.sill||0)+o.h]);
 const studs=[[0,.16],[length-.16,length]];const count=Math.ceil(length/1.5);
 for(let i=1;i<count;i++){const p=length*i/count;if(!openings.some(o=>Math.abs(p-o.at)<o.w/2+.32))studs.push([p-.08,p+.08]);}
 for(const o of openings)studs.push([o.at-o.w/2-.16,o.at-o.w/2],[o.at+o.w/2,o.at+o.w/2+.16]);
 const shaftAlong=Math.abs(dx)>Math.abs(dz)?[chimneyCut[0]-a[0],chimneyCut[1]-a[0]].map(v=>v*Math.sign(dx)).sort((a,b)=>a-b):[chimneyCut[2]-a[1],chimneyCut[3]-a[1]].map(v=>v*Math.sign(dz)).sort((a,b)=>a-b);
 const crossesShaft=Math.abs(dx)>Math.abs(dz)?a[1]>=chimneyCut[2]&&a[1]<=chimneyCut[3]:a[0]>=chimneyCut[0]&&a[0]<=chimneyCut[1];
 const shaftStart=level===0?1.95-y:0;
 const xs=[...new Set([0,length,...gaps.flatMap(g=>g.slice(0,2)),...studs.flat(),...(crossesShaft?[shaftAlong[0]-.12,...shaftAlong,shaftAlong[1]+.12]:[])].filter(v=>v>=0&&v<=length))].sort((a,b)=>a-b);
 const ys=[...new Set([0,.20,H-.28,H,...gaps.flatMap(g=>[g[2],g[3],g[3]+.18,...(g[2]>0?[g[2]-.12]:[])]),...(crossesShaft?[shaftStart]:[])].filter(v=>v>=0&&v<=H))].sort((a,b)=>a-b);
 const cells=xs.slice(0,-1).map((lo,i)=>ys.slice(0,-1).map((low,j)=>{
  const p=(lo+xs[i+1])/2,v=(low+ys[j+1])/2;
  if(gaps.some(g=>p>g[0]&&p<g[1]&&v>g[2]&&v<g[3])||crossesShaft&&p>shaftAlong[0]&&p<shaftAlong[1]&&v>=shaftStart)return null;
  if(crossesShaft&&p>shaftAlong[0]-.12&&p<shaftAlong[1]+.12)return 'stone';
  const narrowInfill=xs[i+1]-lo<.065&&studs.some(t=>Math.abs(t[1]-lo)<1e-7||Math.abs(t[0]-xs[i+1])<1e-7);
  return narrowInfill||v<.20||v>H-.28||studs.some(t=>p>t[0]&&p<t[1])||gaps.some(g=>p>=g[0]&&p<=g[1]&&(v>=g[3]&&v<g[3]+.18||g[2]>0&&v>g[2]-.12&&v<g[2]))?'oak':'plaster';
 }));
 const faces: Record<string, number[][][]> = {oak:[],plaster:[],stone:[]},wallFrames: NonNullable<NonNullable<Parameters<typeof metricGeometry>[2]>["faceFrames"]> = [],depth=(m: string)=>m==='plaster'?.10:.12;
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  const m=cells[i][j];if(!m)continue;const u0=xs[i],u1=xs[i+1],v0=ys[j],v1=ys[j+1],d=depth(m),p=(u: number,v: number,z: number)=>pt(u,y+v,id==='outer-west-0'&&u>=2.93-1e-8&&u<=4.195+1e-8&&Math.abs(z-.10)<1e-8?z-.045:z);
  const along=(u0+u1)/2,vertical=studs.some(t=>along>=t[0]&&along<=t[1])&&v0>=.20&&v1<=H-.28;
  const timberFrame={grainAxis:vertical?[0,1,0]:[dx/length,0,dz/length],origin:pt(vertical?(u0+u1)/2:0,y,0)};
  const push=(face: number[][])=>{faces[m].push(face);if(m==='oak')wallFrames.push({...timberFrame,count:face.length});};
  push([p(u0,v0,d),p(u1,v0,d),p(u1,v1,d),p(u0,v1,d)]);push([p(u1,v0,-d),p(u0,v0,-d),p(u0,v1,-d),p(u1,v1,-d)]);
  for(const [ni,nj,a0,b0]of [[i-1,j,[u0,v0],[u0,v1]],[i+1,j,[u1,v1],[u1,v0]],[i,j-1,[u1,v0],[u0,v0]],[i,j+1,[u0,v1],[u1,v1]]] satisfies [number, number, [number, number], [number, number]][]){
   const n=cells[ni]?.[nj];if(n&&depth(n)>=d)continue;const intervals=n?[[-d,-depth(n)],[depth(n),d]]:[[-d,d]];
   for(const [za,zb]of intervals)push([p(...a0,za),p(...b0,za),p(...b0,zb),p(...a0,zb)].reverse());
  }
 }
 for(const [m,f]of Object.entries(faces))if(f.length)mesh(id+'-'+m,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],m,undefined,{faceFrames:m==='oak'?wallFrames:undefined});
 // Braces live outside the recessed infill, on both exposed faces of broad solid bays.
 const spans=studs.map(t=>[Math.max(0,t[0]),Math.min(length,t[1])]).sort((a,b)=>a[0]-b[0]);
 if(exterior)for(let i=0;i<spans.length-1;i++){const lo=spans[i][1],hi=spans[i+1][0];if(hi-lo<.65||gaps.some(g=>hi>g[0]&&lo<g[1])||crossesShaft&&hi>shaftAlong[0]-.12&&lo<shaftAlong[1]+.12)continue;
  for(const side of [-1,1]){
   // Ends are horizontal seats in the sill/header, with a recessed infill behind.
   const h0=.19,h1=H-.27,slope=(hi-lo)/(h1-h0),half=.035*Math.sqrt(1+slope*slope),corners=[[lo-half,h0],[lo+half,h0],[hi+half,h1],[hi-half,h1]],f=[];
   const inset=id==='outer-west-0'&&i===3&&side===1?.045:0; if(inset&&Math.abs(lo-2.93)+Math.abs(hi-4.195)>1e-7)throw new Error('Hall flush brace bay changed'); const fa=corners.map(([u,v])=>pt(u,y+v,side*.165-inset)),fb=corners.map(([u,v])=>pt(u,y+v,side*.11-inset));f.push(fa,fb.toReversed());for(let j=0;j<4;j++)f.push([fa[j],fb[j],fb[(j+1)%4],fa[(j+1)%4]]);
   mesh(id+'-brace-'+i+'-'+side,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],'oak',undefined,{grainAxis:[dx/length*(hi-lo),h1-h0,dz/length*(hi-lo)],origin:pt(lo,y+h0,side*.1375-inset)});
   for(const [u,v]of [[lo,.23],[hi,H-.31]])box(id+'-brace-peg-'+i+'-'+side+'-'+v,[.02,.02,.014],pt(u,y+v,side*.167-inset),'oakLight',r);
  }
 }
 for(const o of openings){
  const bottom=y+(o.sill||0),top=bottom+o.h;
  if(o.sill){
   const flushSill=o.id==='ww-a-0'||o.id==='ww-b-0'; box(o.id+'-sill-lip',[o.w+.28,.06,flushSill?.27:.30],pt(o.at,bottom-.07,flushSill?-.015:0),'oak',r);
   box(o.id+'-jamb-left',[.07,o.h+.18,.08],pt(o.at-o.w/2-.035,(bottom+top)/2),'oak',r);
   box(o.id+'-jamb-right',[.07,o.h+.18,.08],pt(o.at+o.w/2+.035,(bottom+top)/2),'oak',r);
   box(o.id+'-lintel',[o.w+.14,.08,.08],pt(o.at,top+.04),'oak',r);
   box(o.id+'-mullion',[.042,o.h,.045],pt(o.at,(bottom+top)/2),'oak',r);
   const panels=[];
   for(const side of [-1,1]){
    const leaf=o.id+'-casement-'+side,w=o.w/2-.034,hinge=o.at+side*(o.w/2-.006),inner=hinge-side*w,center=(hinge+inner)/2;
    box(leaf+'-glass',[w-.028,o.h-.028,.016],pt(center,(bottom+top)/2),'glass',r);
    for(const pos of [hinge-side*.014,inner+side*.014])box(leaf+'-stile-'+pos,[.028,o.h,.044],pt(pos,(bottom+top)/2,.010),'oak',r);
    for(const yy of [bottom+.015,top-.015])box(leaf+'-rail-'+yy,[w,.030,.044],pt(center,yy,.010),'oak',r);
    box(leaf+'-transom',[w-.028,.025,.03],pt(center,bottom+o.h*.58,.010),'oak',r);
    const low=Math.min(hinge,inner)+.014,high=Math.max(hinge,inner)-.014;
    for(const slope of [-1.6,1.6])for(let k=Math.floor(Math.min(0,-slope*o.w)/.225);k<=Math.ceil(Math.max(o.h,o.h-slope*o.w)/.225);k++){
     const intercept=k*.225,hits=[],left=low-o.at+o.w/2,right=high-o.at+o.w/2;
     for(const xx of [left,right]){const yy=slope*xx+intercept;if(yy>=.014&&yy<=o.h-.014)hits.push([xx,yy]);}
     for(const yy of [.014,o.h-.014]){const xx=(yy-intercept)/slope;if(xx>left&&xx<right)hits.push([xx,yy]);}
     if(hits.length===2){
      const ends=hits.sort((a,b)=>a[1]-b[1]);
      for(const [segment,lo,hi]of [[0,.014,o.h*.58-.0125],[1,o.h*.58+.0125,o.h-.014]]){
       const a=Math.max(lo,ends[0][1]),b=Math.min(hi,ends[1][1]);
       if(b>a)localBeam(leaf+'-lead-'+slope+'-'+k+'-'+segment,pt(o.at-o.w/2+(a-intercept)/slope,bottom+a,.010),pt(o.at-o.w/2+(b-intercept)/slope,bottom+b,.010),.0055,'iron');
      }
     }
    }
    for(const yy of [bottom+.18,top-.18]){
     box(leaf+'-hinge-strap-'+yy,[.028,.027,.009],pt(hinge-side*.011,yy,.0365),'iron',r);
     mesh(leaf+'-hinge-knuckle-'+yy,revolveAutoMovieProfile({profile:[{x:.006,y:0},{x:.011,y:0},{x:.011,y:.042},{x:.006,y:.042},{x:.006,y:0}],segments:20}),pt(hinge,yy-.021,.040),'iron');
     mesh(o.id+'-fixed-hinge-pin-'+side+'-'+yy,revolveAutoMovieProfile({profile:[{x:0,y:0},{x:.011,y:0},{x:.011,y:.006},{x:.0055,y:.006},{x:.0055,y:.057},{x:0,y:.057}],segments:20}),pt(hinge,yy-.027,.040),'iron');
     // The fixed arm is outside the leaf's vertical range. A narrow pintle
     // stem follows the empty hinge axis, never the rotating stile envelope.
     const seat=yy<bottom+o.h/2?bottom-.045:top+.045;
     box(o.id+'-fixed-hinge-strap-'+side+'-'+yy,[.092,.018,.014],pt(hinge+side*.038,seat,.040),'iron',r);
     mesh(o.id+'-fixed-hinge-stem-'+side+'-'+yy,revolveAutoMovieProfile({profile:[{x:0,y:0},{x:.0055,y:0},{x:.0055,y:Math.abs(yy-seat)},{x:0,y:Math.abs(yy-seat)}],segments:20}),pt(hinge,Math.min(yy,seat),.040),'iron');
     for(const xx of [hinge-side*.007,hinge-side*.019])box(leaf+'-hinge-rivet-'+yy+'-'+xx,[.006,.008,.013],pt(xx,yy,.037),'ironWarm',r);
    }
    box(leaf+'-catch-plate',[.022,.070,.010],pt(inner+side*.014,bottom+.46,.037),'iron',r);
    localBeam(leaf+'-catch-handle',pt(inner+side*.014,bottom+.46,.039),pt(inner+side*.014,bottom+.50,.061),.010,'iron');
    const moving=travellingParts(leaf,id,level,p=>p.id.startsWith(leaf+'-'),pt(hinge,bottom,.040),angle+(side===1?Math.PI:0),[0,1,0],side*Math.PI*.42);
    panels.push({...moving,width:w,height:o.h});
   }
   o.operation={panels,states:[{id:'closed',panels:panels.map(p=>({panel:p.id,value:0}))},{id:'vent',panels:panels.map(p=>({panel:p.id,value:(p.motion.min+p.motion.max)/3}))},{id:'open',panels:panels.map(p=>({panel:p.id,value:p.motion.min+p.motion.max}))}],state:'closed',hardware:[{id:o.id+'-fixed-frame',kind:'frame-and-pintles',element:id}]};
  }else{
   // Open leaf, pivot at the opening's left jamb. Observation can also close it.
   const pivot=pt(o.at-o.w/2+.004,bottom+.02,-.031),groupId=o.id+'-leaf';
   const saved=parts;parts=[];
   const leafW=o.w-.035,leafH=o.h-.055;
   for(let k=0;k<6;k++)bevel(groupId+'-plank-'+k,[leafW/6-.0015,leafH,.048],[(k+.5)*leafW/6,leafH/2,0],k%3?'oak':'oakLight',undefined,.003);
   box(groupId+'-tongue-rebates',[leafW-.008,leafH-.008,.014],[leafW/2,leafH/2,0],'oak');
   for(const yy of [.22,leafH-.22])bevel(groupId+'-rail-'+yy,[leafW-.05,.12,.038],[leafW/2,yy,.043],'oakLight',undefined,.006);
   localBeam(groupId+'-rising-brace',[.09,.282,.043],[leafW-.09,leafH-.282,.043],.046,'oakLight');
   const fittings=craftAt(0,0,0);
   for(const yy of [.22,leafH-.22]){
    box(groupId+'-strap-'+yy,[leafW*.70,.055,.010],[leafW*.35,yy,-.030],'iron');
    mesh(groupId+'-hinge-knuckle-'+yy,revolveAutoMovieProfile({profile:[{x:.008,y:0},{x:.022,y:0},{x:.022,y:.13},{x:.008,y:.13},{x:.008,y:0}],segments:24}),[.004,yy-.065,-.031],'iron');
    for(let j=0;j<5;j++)box(groupId+'-strap-rivet-'+yy+'-'+j,[.018,.018,.024],[.09+j*leafW*.12,yy,-.032],'iron');
   }
   const latchY=leafH*.52;
   box(groupId+'-latch-plate',[.07,.16,.012],[leafW-.14,latchY,-.031],'iron');
   box(groupId+'-latch-bar',[.24,.028,.018],[leafW-.095,latchY,-.049],'iron');
   box(groupId+'-latch-pivot',[.018,.018,.020],[leafW-.19,latchY,-.061],'ironWarm');
   fittings.hoop(groupId+'-ring-handle',[leafW-.14,latchY-.064,-.068],.045,.010,'iron');
   fittings.tube(groupId+'-ring-eye',[[leafW-.14,latchY-.019,-.030],[leafW-.14,latchY-.019,-.072]],.012,'iron');
   box(groupId+'-reverse-handle-plate',[.06,.16,.011],[leafW-.14,latchY,.031],'iron');
   localBeam(groupId+'-through-spindle',[leafW-.14,latchY,-.055],[leafW-.14,latchY,.057],.012,'iron');
   fittings.hoop(groupId+'-reverse-ring',[leafW-.14,latchY-.064,.062],.045,.010,'iron');
   fittings.tube(groupId+'-reverse-eye',[[leafW-.14,latchY-.019,.030],[leafW-.14,latchY-.019,.066]],.012,'iron');
   box(groupId+'-thumb-lift',[.065,.016,.047],[leafW-.115,latchY+.037,.049],'iron');
   if(o.id==='wash-door'){
    box(groupId+'-privacy-bolt',[.22,.023,.021],[leafW-.06,latchY+.18,.045],'iron');
    for(const xx of [leafW-.13,leafW-.015]){
     box(groupId+'-bolt-guide-back-'+xx,[.027,.052,.0095],[xx,latchY+.18,.02875],'iron');
     box(groupId+'-bolt-guide-bottom-'+xx,[.027,.012,.044],[xx,latchY+.18-.0175,.046],'iron');
     box(groupId+'-bolt-guide-top-'+xx,[.027,.012,.044],[xx,latchY+.18+.0195,.046],'iron');
     box(groupId+'-bolt-guide-front-'+xx,[.027,.052,.012],[xx,latchY+.18,.068],'iron');
    }
    localBeam(groupId+'-bolt-knob',[leafW-.09,latchY+.18,.06],[leafW-.09,latchY+.21,.084],.012,'iron');
   }
   for(const yy of [latchY-.055,latchY+.055])box(groupId+'-latch-rivet-'+yy,[.013,.013,.024],[leafW-.14,yy,-.033],'iron');
   // The rotating frame's origin is the actual pintle axis, not the plank corner.
   for(const p of parts){if(p.transform===null)throw new Error('Authored door part has no frame.');p.transform.translation.x-=.004;p.transform.translation.z+=.031;}
   finish(groupId,level,'door');parts=saved;
   // Fixed pintles and keeper belong to the jamb, not to the rotating leaf.
   for(const yy of [.22,leafH-.22]){
    box(o.id+'-jamb-strap-'+yy,[.13,.055,.012],pt(o.at-o.w/2-.085,bottom+.02+yy,-.030),'iron',r);
    localBeam(o.id+'-pintle-drop-'+yy,pt(o.at-o.w/2-.026,bottom+.02+yy,-.031),pt(o.at-o.w/2-.026,bottom+.02+yy-.070,-.031),.012,'iron');
    localBeam(o.id+'-pintle-arm-'+yy,pt(o.at-o.w/2-.026,bottom+.02+yy-.070,-.031),pt(o.at-o.w/2+.004,bottom+.02+yy-.070,-.031),.010,'iron');
    mesh(o.id+'-pintle-'+yy,revolveAutoMovieProfile({profile:[{x:0,y:0},{x:.022,y:0},{x:.022,y:.01},{x:.0075,y:.01},{x:.0075,y:.15},{x:0,y:.15}],segments:24}),pt(o.at-o.w/2+.004,bottom+.02+yy-.075,-.031),'iron');
   }
   box(o.id+'-keeper',[.06,.08,.018],pt(o.at+o.w/2+.02,bottom+.02+latchY,-.040),'iron',r);
   if(o.id==='wash-door')box(o.id+'-privacy-keeper',[.055,.05,.024],pt(o.at+o.w/2+.013,bottom+.02+latchY+.18,.044),'iron',r);
   const leaf=entries[entries.length-1];if(leaf===undefined)throw new Error('Missing authored door leaf.');leaf.pose={pivot,closedAngle:angle,angle:angle+(['master-door','wash-door','storage-door'].includes(o.id)?-1:1)*Math.PI/2};
   const travel=leaf.pose.angle-angle;
   o.operation={panels:[{id:groupId,element:groupId,width:leafW,height:leafH,motion:{kind:'revolute',axis:V([0,1,0]),pivot:V([0,0,0]),min:Math.min(0,travel),max:Math.max(0,travel)}}],states:[{id:'closed',panels:[{panel:groupId,value:0}]},{id:'open',panels:[{panel:groupId,value:travel}]}],state:'open',hardware:[{id:o.id+'-fixed-jamb',kind:'pintles-and-keeper',element:id}]};
   portals.push({id:o.id,level,eye:pt(o.at,y+1.6),a,b,width:o.w,height:o.h});
  }
 }
 boundaries.push({id,a,b,level,openings,exterior,owner:id,faces:['inside','outside','top','bottom','ends','opening-reveals']});finish(id,level,'wall',{frontAngle:angle});
}
const win=(id: string,at: number,w=.78)=>({id,at,w,h:1.12,sill:.95});const door=(id: string,at: number,w=.95)=>({id,at,w,h:2.12});
for(let l=0;l<2;l++){
 wall('outer-north-'+l,[-7.6,-5.4],[7.6,-5.4],l,[win('nw-'+l,2.2),win('nc-'+l,5.1),win('ne-'+l,12.6)],true);
 wall('outer-west-'+l,[-7.5,6],[-7.5,-5.4],l,[win('ww-a-'+l,2.1),win('ww-b-'+l,5.1),win('ww-c-'+l,9.2)],true);
 wall('outer-east-'+l,[7.5,-5.4],[7.5,6],l,[win('ew-a-'+l,2.0),win('ew-b-'+l,6.4),win('ew-c-'+l,9.3)],true);
 wall('gable-west-'+l,[-7.6,5.9],[-3.25,5.9],l,[win('sw-'+l,2.0)],true);
 wall('gable-east-'+l,[3.25,5.9],[7.6,5.9],l,[win('se-'+l,2.1)],true);
 if(l===1){
  wall('court-west-upper',[-3.35,5.9],[-3.35,0],l,[win('cw-a',1.8),win('cw-b',4.5)],true);
  wall('court-east-upper',[3.35,0],[3.35,5.9],l,[win('ce-a',1.5),win('ce-b',4.5)],true);
  wall('court-rear-upper',[-3.25,-.1],[3.25,-.1],l,[win('cr-a',1.25),win('cr-b',5.25)],true);
 }
}
wall('hall-gallery',[-4.60,5.8],[-4.60,-1.36],0,[door('hall-door',1.95,1.05),win('hall-court-window',4.8)]);
wall('service-gallery',[4.60,-1.36],[4.60,5.8],0,[door('service-door',5.21),win('service-court-window',2.16)]);
wall('kitchen-front',[-7.4,-1.36],[-3.3,-1.36],0,[door('kitchen-door',3.45)]);
wall('pantry-front',[-3.3,-1.36],[-1.5,-1.36],0,[door('pantry-door',.9,.90)]);
wall('ledger-front',[3.1,-1.36],[7.4,-1.36],0,[door('ledger-door',.85)]);
wall('kitchen-pantry',[-3.3,-5.3],[-3.3,-1.36],0);
wall('pantry-entrance',[-1.5,-5.3],[-1.5,-1.36],0);
wall('entrance-ledger',[3.1,-5.3],[3.1,-1.36],0);
wall('entrance-front',[-1.5,-1.36],[3.1,-1.36],0,[door('entrance-door',2.3,1.2)]);
wall('child-west-front',[-7.4,-1.75],[-1.4,-1.75],1,[door('child-west-door',2.95)]);
wall('child-west-stair',[-1.4,-5.3],[-1.4,-1.75],1);
wall('child-east-front',[3.1,-1.75],[7.4,-1.75],1,[door('child-east-door',1.35)]);
wall('child-east-stair',[3.1,-5.3],[3.1,-1.75],1);
wall('master-front',[-5.7,.05],[-3.35,.05],1,[door('master-door',1.25)]);
wall('corridor-west-end',[-5.7,-1.65],[-5.7,.05],1);
wall('wash-front',[3.35,.05],[5,.05],1,[door('wash-door',.75,.90)]);
wall('storage-front',[5,.05],[6.5,.05],1,[door('storage-door',.75,.90)]);
wall('corridor-east-end',[6.5,.05],[6.5,-1.65],1);
wall('wash-storage',[5,.05],[5,5.8],1);
// A privacy screen inside the washroom does not create a second circulation room.
wall('wash-screen',[3.45,2.6],[4.1,2.6],1);
const footprint=(x: number,z: number)=>x>=-7.6&&x<=7.6&&z>=-5.5&&z<=6&&!(Math.abs(x)<3.25&&z>0);
const holes=[[-1.4,0,-5.35,-2.60],[0,1.8,-5.35,-3.94]];
function slab(id: string,y: number,thick: number,hole=false,mat='upper'){
 const outline=[[-7.6,-5.5],[7.6,-5.5],[7.6,6],[3.25,6],[3.25,0],[-3.25,0],[-3.25,6],[-7.6,6]];
 const voids=[];
 if(hole)voids.push([[-1.4,-5.35],[1.8,-5.35],[1.8,-3.94],[0,-3.94],[0,-2.60],[-1.4,-2.60]]);
 if(y>3){const [a,b,c,d]=chimneyCut;voids.push([[a,c],[b,c],[b,d],[a,d]]);}
 const finishDepth=id==='ground-floor'||id==='upper-floor'?.006:0;
 mesh(id+'-solid',extrudeAutoMovieRegion({outer:outline.map(([x,y])=>({x,y})),holes:voids.map(poly=>poly.map(([x,y])=>({x,y}))),depth:thick-finishDepth}),[0,y-(thick+finishDepth)/2,0],mat,Q([1,0,0],Math.PI/2));
 if(id==='ground-floor'||id==='upper-floor'){
  // A 6 mm finish occupies the slab top; no boards cross court/shaft/stair voids.
  const stoneFloor=id==='ground-floor';
  for(let iz=0,z=-5.49;z<5.999;z+=stoneFloor?.52:.24,iz++){
   const dz=Math.min(stoneFloor?.52:.24,6-z),rowOffset=(iz%3)*.43;
   for(let ix=0,x=-7.6-rowOffset;x<7.6;x+=stoneFloor?.74:1.72,ix++){
    const end=Math.min(7.6,x+(stoneFloor?.74:1.72)),start=Math.max(-7.6,x),cutsX=[start,end],cutsZ=[z,z+dz];
    for(const xx of [-3.25,3.25,...voids.flat().map(p=>p[0])])if(xx>start&&xx<end)cutsX.push(xx);
    for(const zz of [0,...voids.flat().map(p=>p[1])])if(zz>z&&zz<z+dz)cutsZ.push(zz);
    cutsX.sort((a,b)=>a-b);cutsZ.sort((a,b)=>a-b);
    for(let i=0;i<cutsX.length-1;i++)for(let j=0;j<cutsZ.length-1;j++){
     const x0=cutsX[i],x1=cutsX[i+1],z0=cutsZ[j],z1=cutsZ[j+1],cx=(x0+x1)/2,cz=(z0+z1)/2;
     if(!footprint(cx,cz)||voids.some(p=>cx>Math.min(...p.map(q=>q[0]))&&cx<Math.max(...p.map(q=>q[0]))&&cz>Math.min(...p.map(q=>q[1]))&&cz<Math.max(...p.map(q=>q[1]))&&(()=>{let inPoly=false;for(let a=0,b=p.length-1;a<p.length;b=a++)if((p[a][1]>cz)!==(p[b][1]>cz)&&cx<(p[b][0]-p[a][0])*(cz-p[a][1])/(p[b][1]-p[a][1])+p[a][0])inPoly=!inPoly;return inPoly;})()))continue;
     if(x1-x0<.012||z1-z0<.012)continue;
     box(id+'-finish-'+iz+'-'+ix+'-'+i+'-'+j,[x1-x0-.004,.006,z1-z0-.003],[cx,y-.003,cz],stoneFloor?(ix+iz)%3?'floor':'stoneLight':(ix+iz)%4?'upper':'oakPale');
    }
   }
  }
 }
 finish(id,y<1?0:1,'slab');
}
slab('foundation',.38,.38,false,'stone');
// Bonded courses follow all eight edges of the actual U, including the court.
const baseOutline=[[-7.6,-5.5],[7.6,-5.5],[7.6,6],[3.25,6],[3.25,0],[-3.25,0],[-3.25,6],[-7.6,6]];
for(let side=0;side<baseOutline.length;side++){
 const a=baseOutline[side],b=baseOutline[(side+1)%baseOutline.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
 for(let row=0;row<2;row++)for(let k=0,u=-.31*(row%2);u<len;u+=.63,k++){
  const lo=Math.max(.015,u),hi=Math.min(len-.015,u+.618);if(hi-lo<.02)continue;const c=(lo+hi)/2,x=a[0]+(b[0]-a[0])*c/len,z=a[1]+(b[1]-a[1])*c/len;
  bevel('foundation-block-'+side+'-'+row+'-'+k,[hi-lo,.178,.13],[x,row*.19+.094,z],(row+k)%3?'stone':'stoneLight',Q([0,1,0],angle),.016);
 }
}finish('foundation-masonry',0,'masonry');
slab('ground-floor',.45,.07,false,'floor');slab('upper-floor',3.33,.22,true);slab('upper-ceiling',6.12,.13,false,'plaster');
// Continuous gallery supports. The upper storey covers the gallery, not an added building.
for(const x of [-3.29,3.29])for(let i=0;i<5;i++){
 const z=i*1.45;box('pier-'+x+'-'+i,[.18,.60,.18],[x,.30,z],'stone');box('gallery-post-'+x+'-'+i,[.14,2.51,.14],[x,1.855,z]);
 if(i<4)beam('brace-'+x+'-'+i,[x,2.68,z],[x,3.05,z+.38],.10);
}for(const x of [-2.1,-.9,2.1]){
 // Each stone pier reaches ground; a gallery edge must not leave the post unsupported.
 box('rear-pier-'+x,[.18,.60,.18],[x,.30,-.05],'stone');
 box('rear-post-'+x,[.14,2.51,.14],[x,1.855,-.05]);
 beam('rear-brace-'+x,[x,2.65,-.05],[x-.38,3.02,-.05],.10);
}
for(const x of [-3.35,3.35])box('gallery-long-beam-'+x,[.22,.22,5.89],[x,3.11,3.055]);box('gallery-rear-beam',[6.92,.22,.22],[0,3.11,0]);finish('gallery-frame',0);
// Joists avoid the real stair opening. Their undersides are explicit frame surfaces.
for(let l=0;l<2;l++)for(let z=-4.98;z<5.9;z+=.60){
 const segs=z<0?[[-7.4,7.4]]:[[-7.4,-3.35],[3.35,7.4]];
 for(const [a,b]of segs){
  const bearerXs=l?[-4.5,0,5.5]:[-5.3,5.5];const voids=[...(l===0?holes:[]),chimneyCut,...bearerXs.map(x=>[x-.01,x+.01,-5.4,l?-.1:-1.3])];let cuts=[a,b];for(const h of voids)if(z>h[2]-.1&&z<h[3]+.1)cuts.push(Math.max(a,h[0]-.1),Math.min(b,h[1]+.1));cuts=cuts.filter(v=>v>=a&&v<=b).sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){const x=(cuts[i]+cuts[i+1])/2;if(voids.some(h=>x>h[0]-.1&&x<h[1]+.1&&z>h[2]-.1&&z<h[3]+.1))continue;if(cuts[i+1]-cuts[i]>.01)box('joist-'+l+'-'+z+'-'+i,[cuts[i+1]-cuts[i],.19,.14],[x,l?5.895:3.015,z]);}
 }
}
for(const x of [-5.3,5.5])box('rear-floor-bearer-'+x,[.22,.28,4.10],[x,2.97,-3.35]);
for(const x of [-4.5,0,5.5])box('ceiling-bearer-'+x,[.22,.28,5.30],[x,5.85,-2.75]);
for(const y of [3.015,5.895]){for(const x of [chimneyCut[0]-.10,chimneyCut[1]+.10])box('shaft-trimmer-'+y+'-'+x,[.20,.19,1.60],[x,y,-1.3]);for(const z of [chimneyCut[2]-.10,chimneyCut[3]+.10])box('shaft-header-'+y+'-'+z,[.90,.19,.20],[-6.05,y,z]);}
for(const [id,a,b]of [['void-south',[-1.4,3,-2.51],[.09,3,-2.51]],['void-inner',[.09,3,-2.6],[.09,3,-3.85]],['void-upper',[0,3,-3.85],[1.89,3,-3.85]],['void-arrival',[1.89,3,-3.94],[1.89,3,-5.3]]] satisfies [string, number[], number[]][]){const dx=Math.abs(b[0]-a[0]),dz=Math.abs(b[2]-a[2]);box(id,[dx||.18,.22,dz||.18],[(a[0]+b[0])/2,3,(a[2]+b[2])/2]);}
finish('floor-joists',-1);
// One L stair: 8 rises to the turn, then 8 to the upper landing.
for(let i=0;i<7;i++)box('lower-tread-'+i,[1.24,.07,.26],[-.66,.45+.18*(i+1)-.035,-2.17-.26*(i+.5)]);
box('turn-landing',[1.24,.12,1.24],[-.66,1.83,-4.61]);
for(let i=0;i<7;i++){const x=-.04+.26*(i+.5);box('upper-tread-'+i,[i===6?.28:.26,.07,1.24],[x+(i===6?.01:0),.45+.18*(9+i)-.035,-4.61]);}
// The supports bear against the complete tread undersides. Their horizontal
// seats stay below each walking surface; an unnotched inclined top intrudes
// above the back of a tread and removes usable width at foot height.
function stairStringerProfile(upper: boolean){
 const outer=[];
 for(let i=0;i<7;i++){const y=(upper?2:.56)+.18*i;outer.push({x:.26*i,y},{x:upper&&i===6?1.84:.26*(i+1),y});}
 if(upper)outer.push({x:1.84,y:2.86},{x:0,y:1.77});
 else outer.push({x:1.82,y:1.77},{x:1.95,y:1.77},{x:1.95,y:1.51},{x:.26,y:.45},{x:0,y:.45});
 return extrudeAutoMovieRegion({outer,holes:[],depth:.14});
}
for(const x of [-1.20,-.12])mesh('lower-stringer-'+x,stairStringerProfile(false),[x,0,-2.17],'oak',Q([0,1,0],Math.PI/2));
for(const z of [-5.15,-4.07])mesh('upper-stringer-'+z,stairStringerProfile(true),[-.04,0,z],'oak');
for(const x of [-1.20,-.12])for(const z of [-5.15,-4.07])box('turn-support-'+x+'-'+z,[.14,1.32,.14],[x,1.11,z]);
// Baluster feet sit on tread centres; their tops meet the actual rail line.
function railPost(id: string,x: number,z: number,bottom: number,top: number){box(id,[.045,top-bottom,.045],[x,(bottom+top)/2,z]);}
for(const [side,x]of [['outer',-1.25],['inner',-.07]] satisfies [string, number][]){
 for(let i=0;i<7;i++){const z=-2.30-i*.26,bottom=.63+i*.18;railPost('lower-'+side+'-'+i,x,z,bottom,bottom+.92);}
 railPost('lower-'+side+'-turn',x,-4.12,1.89,2.81);
 beam('lower-'+side+'-rail',[x,1.55,-2.30],[x,2.81,-4.12],.065);
}
for(const [side,z]of [['outer',-5.20],['inner',-4.02]] satisfies [string, number][]){
 for(let i=0;i<7;i++){const x=-.04+.26*(i+.5)+(i===6?.01:0),bottom=2.07+i*.18,top=2.81+(x+.04)*1.44/1.84;railPost('upper-'+side+'-'+i,x,z,bottom,top);}
 railPost('upper-'+side+'-turn',-.04,z,1.89,2.81);
 railPost('upper-'+side+'-arrival',1.84,z,3.33,4.28);
 beam('upper-'+side+'-rail',[-.04,2.81,z],[1.80,4.25,z],.065);
 beam('upper-'+side+'-arrival-rail',[1.80,4.25,z],[1.84,4.28,z],.065);
}
beam('turn-handrail',[-1.25,2.81,-4.12],[-1.25,2.81,-5.20],.065);beam('turn-back-handrail',[-1.25,2.81,-5.20],[-.04,2.81,-5.20],.065);
for(let i=1;i<=8;i++){railPost('turn-side-infill-'+i,-1.25,-4.12-i*1.08/8,1.89,2.81);railPost('turn-back-infill-'+i,-1.25+i*1.21/8,-5.20,1.89,2.81);}
// Upper opening guards, with an open arrival at the top tread.
for(const [a,b]of [[[-1.35,3.33,-2.56],[.04,3.33,-2.56]],[[.04,3.33,-2.56],[.04,3.33,-3.90]],[[.04,3.33,-3.90],[1.84,3.33,-3.90]]]){beam('guard-foot-'+a,a.map((v,i)=>i===1?v+.04:v),b.map((v,i)=>i===1?v+.04:v),.08);beam('guard-top-'+a,a.map((v,i)=>i===1?v+.95:v),b.map((v,i)=>i===1?v+.95:v),.065);const n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.13);for(let i=0;i<=n;i++)box('guard-'+a+'-'+i,[.035,.95,.035],[a[0]+(b[0]-a[0])*i/n,3.805,a[2]+(b[2]-a[2])*i/n]);}
// Exposed inner edge guards; arrival remains open.
// Square the inside elbow within the rail envelope, instead of cutting
// diagonally across the first upper tread's clear inside corner.
box('inner-turn-join',[.065,.065,.1325],[-.07,2.81,-4.05375]);
beam('arrival-guard-join',[1.84,4.28,-4.02],[1.84,4.28,-3.90],.065);
finish('central-stair',-1,'stair');
buildManorRoof({ chimneyCut, V, mesh, beam, finish });
// Two open flues connect the back-to-back hearth zone through both levels.
for(const [id,x,z,w,d]of [['west',-6.44,-1.30,.12,1.20],['east',-5.66,-1.30,.12,1.20],['north',-6.05,-1.84,.66,.12],['south',-6.05,-.76,.66,.12],['divider',-6.05,-1.30,.66,.12]] satisfies [string, number, number, number, number][])box('flue-'+id,[w,7.75,d],[x,5.825,z],'stone');
for(const [id,x,z,w,d]of [['west',-6.44,-1.30,.20,1.36],['east',-5.66,-1.30,.20,1.36],['north',-6.05,-1.88,.58,.20],['south',-6.05,-.72,.58,.20],['divider',-6.05,-1.30,.58,.16]] satisfies [string, number, number, number, number][])bevel('flue-cap-'+id,[w,.16,d],[x,9.70,z],'stone',undefined,.012);
for(let row=0,y=1.96;y<9.60;y+=.24,row++)for(const [side,a,b]of [['west',[-6.507,-1.9],[-6.507,-.7]],['east',[-5.593,-.7],[-5.593,-1.9]],['north',[-5.6,-1.907],[-6.5,-1.907]],['south',[-6.5,-.693],[-5.6,-.693]]] satisfies [string, number[], number[]][]){
 const len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
 for(let k=0,u=-.19*(row%2);u<len;u+=.39,k++){const lo=Math.max(.007,u),hi=Math.min(len-.007,u+.382);if(hi-lo<.02)continue;const c=(lo+hi)/2;bevel('chimney-ashlar-'+side+'-'+row+'-'+k,[hi-lo,Math.min(.23,9.62-y),.020],[a[0]+(b[0]-a[0])*c/len,y+Math.min(.23,9.62-y)/2,a[1]+(b[1]-a[1])*c/len],(k+row)%3?'stone':'stoneLight',Q([0,1,0],angle),.004);}
}
finish('chimney',-1,'service-shaft');
// v19: shared-function corrections and room-specific working furniture.
// Keep the six-place furniture intact while leaving a turn past the open
// hall door to both bench ends. The chest faces that southern working area.
table('hall-table',-6.57,.45,2.35,2.25,.80,0,Math.PI/2);bench('hall-bench-west',-7.22,.45,2.35,2.12,.31,0,Math.PI/2);bench('hall-bench-east',-6.01,.45,2.35,2.12,.31,0,Math.PI/2);
chest('hall-chest',-6.72,.45,5.30,1.0,.45,0,Math.PI);rug('hall-rug',-6.55,.45,2.35,1.66,2.55,0);
hearth('hall-hearth',-6.05,.45,-.78,1.45,1.55,.85);
counter('kitchen-counter',-5.8,.44,-4.65,2.5,.65);
// The kitchen hearth backs onto the hall masonry zone, clear of the west window.
hearth('kitchen-hearth',-6.05,.45,-1.98,1.20,1.35,.85);
shelf('pantry-shelves',-2.93,1.30,-3.6,.42,1.70,2.50);
table('ledger-desk',5.6,.42,-3.6,1.5,.75);bench('ledger-seat',5.6,.40,-2.7,.50,.50,0,Math.PI,true);
cabinet('ledger-bookcase',3.85,.45,-5.00,1.15,1.50,.35,0,0,'books');chest('ledger-lockbox',6.60,.45,-1.90,.85,.45,0);
washBasin('service-washbench',6.85,.45,2.5,0);
bed('master-bed',-5.4,3.33,3.8,2.05,1.60);chest('master-chest',-6.65,3.38,1.5,1.10,.50);
bed('child-west-bed',-5.8,3.33,-4.5,2.05,.95);bed('child-east-bed',5.25,3.33,-4.5,2.05,.95);
chest('child-west-chest',-6.40,3.33,-2.38,.90,.44,1);chest('child-east-chest',3.67,3.33,-3.10,.75,.44,1);
table('child-west-desk',-3.15,3.33,-2.55,1.35,.55,1);bench('child-west-stool',-3.15,3.33,-3.15,.42,.42,1);
table('child-east-desk',6.45,3.33,-2.55,1.35,.55,1);bench('child-east-stool',6.45,3.33,-3.15,.42,.42,1);
cabinet('master-cabinet',-3.73,3.33,2.80,.72,1.45,.38,1,-Math.PI/2,'clothes');
nightStand('master-nightstand',-6.84,4.68,1);bench('master-seat',-3.90,3.33,5.25,.52,.43,1,Math.PI/2,true);
washBasin('wash-basin',3.74,3.33,1.75);latrineUnit('latrine',3.88,3.33,3.1);
shelf('storage-shelves',5.35,3.33,3.25,.40,1.60,3.60,1);
chest('storage-chest',6.65,3.36,4.9,.85,.60);
// Circulation rooms carry modest, usable joinery instead of remaining empty camera voids.
bench('gallery-west-bench',-3.85,0,6.55,1.12,.27,-1);bench('gallery-east-bench',3.85,0,6.55,1.12,.27,-1);
bench('gallery-rear-bench',-2.0,0,6.55,1.05,.25,-1);cabinet('gallery-rear-cabinet',.80,.45,-3.40,.62,1.05,.27,0);
rug('upper-corridor-runner',.38,3.33,-.90,10.35,.64,1);rug('landing-runner',2.40,3.33,-3.48,.64,2.20,1);chest('landing-chest',.80,.45,-4.65,.62,.42,0);
bench('entrance-bench',2.72,.42,-2.55,1.10,.28,0,Math.PI/2);cabinet('entrance-cabinet',2.48,.76,-4.55,.52,.95,.34,0,0,'shoes');cabinet('service-cabinet',6.22,.80,5.32,.70,1.25,.36,0,Math.PI,'linen');
serviceTools('service-drying-rack',5.50,4.80);
// Plate backs touch the actual timber face; centres are posts, not glazing/infill.
for(const [id,x,y,z,l,a]of [['hall-lamp',-7.3725,2.27,1.725,0,Math.PI/2],['kitchen-lamp',-4.93,1.92,-5.2725,0,0],['ledger-lamp',-7.6+15.2*10/11,1.92,-5.2725,0,0],['master-lamp',-3.4775,5.08,2.95,1,-Math.PI/2],['corridor-lamp',-.65,5.08,-.2275,1,Math.PI],['landing-lamp',2.9725,5.08,-5.3+3.55*2/3,1,-Math.PI/2]] satisfies [string, number, number, number, number, number][])wallLamp(id,x,y,z,l,a);
createManorGarden({box,mesh,beam:localBeam,finish,polyhedron:buildAutoMoviePolyhedron,revolve:revolveAutoMovieProfile,extrude:extrudeAutoMovieRegion,V,Q,bevel,registerMechanism:(m: Mechanism)=>mechanisms.push(m)});
// Outside steps reach the raised gallery at its central entrance.
const stepSide=[[0,0],[1.02,0],[1.02,.15],[.68,.15],[.68,.30],[.34,.30],[.34,.45],[0,.45]];
const stepTri=triangulateAutoMovieRegion({outer:stepSide.map(([x,y])=>({x,y}))}),stepFaces=[];
for(let i=0;i<stepTri.triangles.length;i+=3){const f=stepTri.triangles.slice(i,i+3).map(k=>stepTri.points[k]);stepFaces.push(f.map(p=>[-.6,p.y,p.x]),f.toReversed().map(p=>[.6,p.y,p.x]));}
for(let i=0;i<stepSide.length;i++){const a=stepSide[i],b=stepSide[(i+1)%stepSide.length];stepFaces.push([[-.6,a[1],a[0]],[.6,a[1],a[0]],[.6,b[1],b[0]],[-.6,b[1],b[0]]]);}
for(let row=0;row<3;row++)for(let col=0;col<3;col++){
 const h=.45-row*.15;bevel('entry-step-stone-'+row+'-'+col,[.397,h,.338],[-.4+col*.4,h/2,.17+row*.34],(row+col)%3?'stone':'stoneLight',undefined,.006);
}finish('entry-steps',0,'stair');
for(const m of mechanisms){
 const owner=entries.find(e=>e.id===m.parent);if(!owner)throw new Error('Missing mechanism owner: '+m.parent);
 const saved=parts;parts=owner.model.parts;travellingParts(m.id,m.parent,m.level,p=>p.id.startsWith(m.prefix),m.pivot,m.restAngle,m.axis,m.travel,m.kind);owner.model.parts=parts;parts=saved;
 if(m.default!==undefined){const articulation=entries[entries.length-1]?.articulation;if(articulation===undefined)throw new Error('Missing authored moving assembly.');articulation.default=m.default;}
}
{
 const owner=entries.find(e=>e.id==='wash-door-leaf');if(owner===undefined)throw new Error('Missing wash door leaf.');const saved=parts;parts=owner.model.parts;
 travellingParts('wash-door-privacy-bolt',owner.id,1,p=>p.id===owner.id+'-privacy-bolt'||p.id===owner.id+'-bolt-knob',[.865-.17-.004,2.065*.52+.18-.0115,.076],0,[1,0,0],-.105,'sliding-bolt');
 owner.model.parts=parts;parts=saved;
 const a=entries[entries.length-1]?.articulation;if(a===undefined)throw new Error('Missing privacy bolt articulation.');a.motion={kind:'prismatic',axis:V([1,0,0]),min:-.105,max:0};a.relativeToParent=true;a.default=1;
 const operation=boundaries.flatMap(b=>b.openings).find(o=>o.id==='wash-door')?.operation;if(operation===undefined)throw new Error('Missing wash door opening operation.');
 operation.hardware.push({id:'wash-door-privacy-bolt',kind:'sliding-privacy-bolt',element:'wash-door-privacy-bolt'});
}
if(geometryOnly)return {entries,rooms,boundaries,portals,holes,chimneyCut};
return buildManorPresentation({ shadows, resolveTexture, instanceConsumer, entries, rooms, boundaries, portals, holes, chimneyCut, levels });
}
