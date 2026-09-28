/** Inspection-only X=0 caps derived from the source triangle intersection. */
import {ShapeUtils,Vector2} from "three";
import type {IViewerSceneItem} from "./scenePayload";
type Point=readonly [number,number];
const key=(p:Point):string=>p.map(n=>n.toFixed(9)).join(",");
const contains=(ring:readonly Point[],p:Point):boolean=>{
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i]!,b=ring[j]!;
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
};
/** Preserve holes and source face identity; refuse a non-closed intersection. */
export const sectionCap=(item:IViewerSceneItem):IViewerSceneItem|undefined=>{
  const xs=item.positions.filter((_,i)=>i%3===0);
  if(Math.min(...xs)>=0||Math.max(...xs)<=0)return undefined;
  const points=new Map<string,Point>(),edges=new Map<string,[string,string]>();
  for(let i=0;i<item.indices.length;i+=3){
    const vertices=item.indices.slice(i,i+3).map(n=>item.positions.slice(n*3,n*3+3));
    if(vertices.every(p=>Math.abs(p[0]!)<1e-10))continue;
    const hit=new Map<string,Point>();
    for(let j=0;j<3;j++){
      const a=vertices[j]!,b=vertices[(j+1)%3]!;
      if(Math.abs(a[0]!)<1e-10){const p:Point=[a[1]!,a[2]!];hit.set(key(p),p);}
      if(a[0]!*b[0]!<0){const t=-a[0]!/(b[0]!-a[0]!),p:Point=[a[1]!+(b[1]!-a[1]!)*t,a[2]!+(b[2]!-a[2]!)*t];hit.set(key(p),p);}
    }
    if(hit.size!==2)continue;
    const [a,b]=[...hit.keys()] as [string,string];
    for(const [k,p] of hit)points.set(k,p);
    edges.set(a<b?`${a}/${b}`:`${b}/${a}`,[a,b]);
  }
  const neighbors=new Map<string,string[]>();
  for(const [a,b] of edges.values()){
    neighbors.set(a,[...(neighbors.get(a)??[]),b]);neighbors.set(b,[...(neighbors.get(b)??[]),a]);
  }
  for(const [p,links] of neighbors)if(links.length!==2)throw Error(`open section ${item.id}/${p}: degree ${links.length}`);
  const visited=new Set<string>(),rings:Point[][]=[];
  for(const start of neighbors.keys()){
    if(visited.has(start))continue;
    const ring:Point[]=[];let current=start,previous="";
    do{visited.add(current);ring.push(points.get(current)!);const next=neighbors.get(current)!.find(n=>n!==previous)!;previous=current;current=next;}while(current!==start);
    rings.push(ring);
  }
  const depths=rings.map((r,i)=>rings.filter((outer,j)=>i!==j&&contains(outer,r[0]!)).length);
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const [i,ring] of rings.entries()){
    if(depths[i]!%2!==0)continue;
    const holes=rings.filter((r,j)=>depths[j]===depths[i]!+1&&contains(ring,r[0]!));
    const points2=[ring,...holes].flat(),offset=positions.length/3;
    for(const p of points2){positions.push(0,...p);normals.push(1,0,0);uvs.push(p[1],p[0]);}
    const triangles=ShapeUtils.triangulateShape(ring.map(p=>new Vector2(...p)),holes.map(h=>h.map(p=>new Vector2(...p))));
    for(const triangle of triangles){
      const [a,b,c]=triangle as [number,number,number],p=points2[a]!,q=points2[b]!,r=points2[c]!;
      const winding=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
      indices.push(...(winding>0?[a,b,c]:[a,c,b]).map(n=>n+offset));
    }
  }
  if(indices.length===0)return undefined;
  return {...item,id:`${item.id}/inspection-section`,positions,normals,uvs,indices,inspectionSection:true};
};
