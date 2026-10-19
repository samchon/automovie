// Project-owned material/UV decisions. No loader or renderer state is authored here.
import { realizeAutoMovieGeometry } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { families } from "./families";

type ManorGeometry = IAutoMovieModel["parts"][number]["geometry"];

interface GrainFrame { grainAxis: number[]; origin: number[]; count: number; }

interface MetricMapping {
  grainAxis?: number[];
  origin?: number[];
  faceFrames?: GrainFrame[];
  developed?: boolean;
  projected?: boolean;
  cylindrical?: boolean;
}

const dot: (a: number[], b: number[]) => number=(a: number[],b: number[]): number =>a.reduce((s: number,v: number,i: number): number =>s+v*b[i],0);

const unit: (a: number[]) => number[]=(a: number[]): number[] =>{const l: number=Math.hypot(...a);return a.map((v: number): number =>v/l);};

const cross: (a: number[], b: number[]) => number[]=(a: number[],b: number[]): number[] =>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

const longest: (positions: number[]) => (0 | 1)[]=(positions: number[]): (0 | 1)[] =>{
 const lo: number[]=[Infinity,Infinity,Infinity],hi: number[]=[-Infinity,-Infinity,-Infinity];
 for(let i: number=0;i<positions.length;i++) {const k: number=i%3;lo[k]=Math.min(lo[k],positions[i]);hi[k]=Math.max(hi[k],positions[i]);}
 const sizes: number[]=hi.map((v: number,k: number): number =>v-lo[k]),axis: number=sizes.indexOf(Math.max(...sizes));return [0,1,2].map((k: number): 0 | 1 =>k===axis?1:0);
};

/** Realizes geometry through the public engine and derives surface-meter UVs from supplied normals and mapping options; missing mesh normals are refused, while authored developed UVs are retained on the applicable branch. */
export function metricGeometry(geometry: ManorGeometry, material: string, {grainAxis,origin,faceFrames,developed=false,projected=false,cylindrical=false}: MetricMapping = {}): ManorGeometry{
 const family: "wood" | "stone" | "plaster" | "tile" | "cloth" | "bark" | "soil"=families[material];if(!family)return geometry;
 const woodLike: boolean=family==='wood'||family==='bark';
 const data: import("@automovie/interface").IAutoMovieMesh=realizeAutoMovieGeometry(geometry).mesh;
 if (data.normals === null) throw new Error("Manor metric UVs require the authored mesh normals.");
 const authoredNormals: number[] = data.normals;
 if(developed||!projected&&!woodLike&&data.uvs!==null&&data.uvs!==undefined)return {type:'mesh',mesh:data};
 if(projected||cylindrical){
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const ii: number[]=data.indices??Array.from({length:data.positions.length/3},(_: unknown,i: number): number =>i);
  for(let t: number=0;t<ii.length;t+=3){
   const ps: number[][]=ii.slice(t,t+3).map((i: number): number[] =>data.positions.slice(i*3,i*3+3)),ns: number[][]=ii.slice(t,t+3).map((i: number): number[] =>authoredNormals.slice(i*3,i*3+3));
   const n: number[]=unit(cross(ps[1].map((v: number,k: number): number =>v-ps[0][k]),ps[2].map((v: number,k: number): number =>v-ps[0][k]))),axis: number=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
   const angles: number[]=ps.map((p: number[]): number =>Math.atan2(p[2],p[0]));if(Math.max(...angles)-Math.min(...angles)>Math.PI)for(let j: number=0;j<3;j++)if(angles[j]<0)angles[j]+=Math.PI*2;
   for(let j: number=0;j<3;j++){const p: number[]=ps[j];positions.push(...p);normals.push(...ns[j]);indices.push(indices.length);
    if(cylindrical&&Math.abs(n[1])<.94)uvs.push(angles[j]*Math.hypot(p[0],p[2]),p[1]);
    else{const axes: number[]=axis===0?[2,1]:axis===1?[0,2]:[0,1];uvs.push(p[axes[0]],p[axes[1]]);}
   }
  }
  return {type:'mesh',mesh:{...data,positions,normals,uvs,indices}};
 }
 const positions: number[]=data.positions,normals: number[]=data.normals,uvs: number[] = [],axis: number[]=unit(grainAxis??longest(positions));
 const lo: number[]=[Infinity,Infinity,Infinity],hi: number[]=lo.map((v: number): number =>-v);
 for(let i: number=0;i<positions.length;i++){lo[i%3]=Math.min(lo[i%3],positions[i]);hi[i%3]=Math.max(hi[i%3],positions[i]);}
 const center: number[]=origin??lo.map((v: number,k: number): number =>(v+hi[k])/2);
 let faceIndex: number=0,faceEnd: number=faceFrames?.[0]?.count??Infinity;
 for(let i: number=0;i<positions.length;i+=3){
  while(i/3>=faceEnd){faceIndex++;faceEnd+=faceFrames![faceIndex].count;}
  const frame: GrainFrame | undefined=faceFrames?.[faceIndex],base: number[]=frame?.origin??center,p: number[]=positions.slice(i,i+3).map((v: number,k: number): number =>v-base[k]),n: number[]=unit(normals.slice(i,i+3));
  const preferred: number[]=family==='wood'?unit(frame?.grainAxis??axis):[0,1,0];
  // Planar end cuts avoid the atan2 seam interpolating across cap triangles.
  if(family==='wood'&&Math.abs(dot(preferred,n))>.94){
   const tangent: number[]=unit(cross(preferred,Math.abs(preferred[2])<.9?[0,0,1]:[1,0,0])),other: number[]=cross(preferred,tangent),x: number=dot(p,tangent),y: number=dot(p,other);
   uvs.push(x,y);continue;
  }
  let v: number[]=preferred.map((q: number,k: number): number =>q-n[k]*dot(preferred,n));
  if(Math.hypot(...v)<1e-8){const other: number[]=Math.abs(n[2])<.9?[0,0,1]:[1,0,0];v=other.map((q: number,k: number): number =>q-n[k]*dot(other,n));}
  v=unit(v);const u: number[]=unit(cross(v,n));uvs.push(dot(p,u),dot(p,v));
 }
 return {type:'mesh',mesh:{...data,uvs}};
}
