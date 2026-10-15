// Local rigid prototypes and explicit placements; no renderer objects here.
import { Matrix4, Vector3, Quaternion, Color } from "three";
import type { IAutoMovieTransform } from "@automovie/interface";
import type { IMedievalManorScene } from "../models/IMedievalManorScene";
import type { manorSpatialState } from "../manorSpatialState";

type SpatialInventory = Parameters<typeof manorSpatialState>[1];

interface ManorPlacement extends IAutoMovieTransform { id: string; }

interface PartBinding {
  entry: string;
  part: string;
  partIndex: number;
  prototype: string;
  transform: ManorPlacement;
}

const identity: () => { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; }=(): { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } =>({translation:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1},scale:{x:1,y:1,z:1}});

const xyz: (v: Vector3) => { x: number; y: number; z: number; }=(v: Vector3): { x: number; y: number; z: number; } =>({x:v.x,y:v.y,z:v.z});

/** Derives rigid local prototypes and explicit placements from authored entry parts, retaining repeated geometry in shared sets and unique geometry as singleton parts. */
export function manorInstanceDefinitions(entries: IMedievalManorScene["entries"]): { prototypes: { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; }[]; sets: { entry: string; definition: import("@automovie/interface").IAutoMovieInstanceSetDesign; }[]; singletons: { entry: string; part: string; partIndex: number; }[]; partBindings: PartBinding[]; } {
 const prototypes: SpatialInventory["prototypes"] = [], sets: SpatialInventory["sets"] = [], singletons: SpatialInventory["singletons"] = [];
 const pool: Map<string, { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; }> = new Map<string, SpatialInventory["prototypes"][number]>(), partBindings: PartBinding[] = [];
 for(const entry of entries){
  const groups: Map<string, ManorPlacement[]>=new Map<string, ManorPlacement[]>();
  for(const [partIndex,part] of entry.model.parts.entries()){
   const data: import("@automovie/interface").IAutoMovieMesh | null=part.geometry.type==='mesh'?part.geometry.mesh:null;
   if(!data||data.skin||part.attachedBone!==null){singletons.push({entry:entry.id,part:part.id,partIndex});continue;}
   const lo: number[]=[Infinity,Infinity,Infinity],hi: number[]=[-Infinity,-Infinity,-Infinity];
   for(let i: number=0;i<data.positions.length;i++){lo[i%3]=Math.min(lo[i%3],data.positions[i]);hi[i%3]=Math.max(hi[i%3],data.positions[i]);}
   const center: number[]=lo.map((v: number,k: number): number =>(v+hi[k])/2),local: { positions: number[]; physicalVertices?: import("@automovie/interface").IAutoMovieMeshPhysicalVertices; normals: number[] | null; uvs: number[] | null; colors?: number[]; reliefWeights?: number[]; indices: number[] | null; skin: import("@automovie/interface").IAutoMovieMeshSkin | null; }={...data,positions:data.positions.map((v: number,k: number): number =>v-center[k%3])};
   const material: import("@automovie/interface").IAutoMovieMaterial | undefined=entry.model.materials.find((m: import("@automovie/interface").IAutoMovieMaterial): boolean =>m.id===part.material);
   if (material === undefined) throw new Error("Missing authored manor material: " + part.material);
   // Exact authored shape/material bytes, not rounded dimensions or class names.
   const key: string=JSON.stringify([local,material]);let prototype: { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; } | undefined=pool.get(key);
   if(!prototype){const id: string='manor-prototype-'+String(prototypes.length).padStart(5,'0');prototype={id,bounds:{min:xyz(new Vector3().fromArray(lo.map((v: number,k: number): number =>v-center[k]))),max:xyz(new Vector3().fromArray(hi.map((v: number,k: number): number =>v-center[k])))},model:{id,name:id,origin:'generated',skeleton:null,materials:[material],parts:[{...part,id:'member',name:'member',geometry:{type:'mesh',mesh:local},transform:identity()}],asset:null,body:null}};pool.set(key,prototype);prototypes.push(prototype);}
   const t: IAutoMovieTransform=part.transform??identity(),m: Matrix4=new Matrix4().compose(new Vector3(t.translation.x,t.translation.y,t.translation.z),new Quaternion(t.rotation.x,t.rotation.y,t.rotation.z,t.rotation.w),new Vector3(t.scale.x,t.scale.y,t.scale.z)).multiply(new Matrix4().makeTranslation(center[0], center[1], center[2])),p: Vector3=new Vector3(),q: Quaternion=new Quaternion(),s: Vector3=new Vector3();m.decompose(p,q,s);
   const placement: { id: string; translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; }={id:part.id+'@'+partIndex,translation:xyz(p),rotation:{x:q.x,y:q.y,z:q.z,w:q.w},scale:xyz(s)};
   if(!groups.has(prototype.id))groups.set(prototype.id,[]);groups.get(prototype.id)!.push(placement);
   partBindings.push({entry:entry.id,part:part.id,partIndex,prototype:prototype.id,transform:placement});
  }
  for(const [prototype,transforms]of groups){
   const mat: import("@automovie/interface").IAutoMovieMaterial=prototypes.find((p: { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; }): boolean =>p.id===prototype)!.model.materials[0],c: import("@automovie/interface").IAutoMovieColor=mat.baseColor;
   sets.push({entry:entry.id,definition:{id:entry.id+'--'+prototype,model:prototype,count:transforms.length,layout:{kind:'explicit',transforms},anchor:{x:0,y:0,z:0},facingDeg:0,seed:1902,variation:{scale:{min:1,max:1},palette:['#'+new Color(c.r,c.g,c.b).getHexString()],traits:[]}}});
  }
 }
 const counts: Map<string, number>=new Map<string, number>();for(const b of partBindings)counts.set(b.prototype,(counts.get(b.prototype)??0)+1);
 const repeated: Set<string>=new Set([...counts].filter(([,n]: [string, number]): boolean =>n>1).map(([id]: [string, number]): string =>id));
 for(const b of partBindings)if(!repeated.has(b.prototype))singletons.push({entry:b.entry,part:b.part,partIndex:b.partIndex});
 return {prototypes:prototypes.filter((p: { id: string; model: import("@automovie/interface").IAutoMovieModel; bounds: { min: { x: number; y: number; z: number; }; max: { x: number; y: number; z: number; }; }; }): boolean =>repeated.has(p.id)),sets:sets.filter((s: { entry: string; definition: import("@automovie/interface").IAutoMovieInstanceSetDesign; }): boolean =>repeated.has(s.definition.model)),singletons,partBindings:partBindings.filter((b: PartBinding): boolean =>repeated.has(b.prototype))};
}
