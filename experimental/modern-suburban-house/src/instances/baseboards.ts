/** Closed trim runs derived from painted wall triangles, never from room boxes. */
import { transformAutoMovieMesh, type IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { Baseboard } from "../models/interior/baseboard";
import { WallTilePartitions } from "../materials/wall-tile-partitions";
import type { IHouse } from "../spaces/house";
import { PALETTE } from "../spaces/palette";
import { roomLevels, type IRoomSpace } from "../spaces/rooms/shared";

type Built={model:IAutoMovieModel;faceByPart:Readonly<Record<string,string>>};
type Placement={id:string;modelId:string;transform:IAutoMovieMeshTransform};
type Run={room:string;floor:number;nx:number;nz:number;plane:number;lo:number;hi:number};
const EPS=1e-7;
const spans=(room:IRoomSpace,nx:number,nz:number,plane:number):readonly [number,number][]=>{
  const hits:number[]=[],fixed=plane+(Math.abs(nx)+Math.abs(nz))*0.001;
  for(let i=0,j=room.outline.length-1;i<room.outline.length;j=i++){
    const a=room.outline[i]!,b=room.outline[j]!;
    const av=nx*a.x+nz*a.z,bv=nx*b.x+nz*b.z;
    if((av>fixed)!==(bv>fixed)){
      const t=(fixed-av)/(bv-av),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
      hits.push(nz*x-nx*z);
    }
  }
  hits.sort((a,b)=>a-b);
  return hits.flatMap((lo,i)=>i%2===0?[[lo,hits[i+1]!] as const]:[]);
};
const key=(r:Run):string=>[r.room,r.floor,r.nx,r.nz,r.plane].map(v=>typeof v==="number"?v.toFixed(7):v).join("/");
const point=(r:Run,u:number):{x:number;z:number}=>({x:r.nx*r.plane+r.nz*u,z:r.nz*r.plane-r.nx*u});

/** A single derived population of low painted-wall trims for both storeys. */
export class Baseboards {
  /** Slice real wall faces, merge coplanar intervals and cut them at actual casings. */
  public build(house:IHouse,prototypes:readonly Built[],placements:readonly Placement[]):{prototypes:Built[];instances:Placement[]} {
    const groups=new Map<string,Run[]>();
    const rooms=house.spaces.filter(room=>room.id!=="garage");
    for(const part of house.parts){
      if(!["wall","partition"].includes(part.role))continue;
      if(![PALETTE.interiorWall,PALETTE.siding,PALETTE.brick].includes(part.color as typeof PALETTE.interiorWall))continue;
      const {positions:p,normals:n,indices}=new WallTilePartitions().build(part,part.mesh).paint;
      if(n===null||indices===null)throw new Error(`trim host lacks triangles: ${part.id}`);
      for(const room of rooms){
        const floor=roomLevels(room)[0],height=floor+0.05;
        for(let i=0;i<indices.length;i+=3){
          const vertices=[indices[i]!,indices[i+1]!,indices[i+2]!];
          const ni=vertices[0]!*3,nx=Math.round(n[ni]!),nz=Math.round(n[ni+2]!);
          if(Math.abs(n[ni+1]!)>EPS||Math.abs(nx)+Math.abs(nz)!==1)continue;
          const points:number[][]=[];
          for(let j=0;j<3;j++){
            const a=vertices[j]!*3,b=vertices[(j+1)%3]!*3,ay=p[a+1]!,by=p[b+1]!;
            if((ay<=height&&by>height)||(by<=height&&ay>height)){
              const t=(height-ay)/(by-ay);
              points.push([p[a]!+(p[b]!-p[a]!)*t,p[a+2]!+(p[b+2]!-p[a+2]!)*t]);
            }
          }
          if(points.length!==2)continue;
          const a=points[0]!,b=points[1]!;
          const plane=nx*a[0]!+nz*a[1]!,u=[nz*a[0]!-nx*a[1]!,nz*b[0]!-nx*b[1]!];
          for(const [lo,hi] of spans(room,nx,nz,plane)){
            const run={room:room.id,floor,nx,nz,plane,lo:Math.max(lo,Math.min(...u)),hi:Math.min(hi,Math.max(...u))};
            if(run.hi-run.lo<EPS)continue;
            const id=key(run),list=groups.get(id)??[];
            list.push(run);groups.set(id,list);
          }
        }
      }
    }
    const runs:Run[]=[];
    for(const values of groups.values()){
      values.sort((a,b)=>a.lo-b.lo);
      for(const value of values){
        const previous=runs.at(-1);
        if(previous&&key(previous)===key(value)&&value.lo<=previous.hi+EPS)previous.hi=Math.max(previous.hi,value.hi);
        else runs.push({...value});
      }
    }
    const models=new Map(prototypes.map(p=>[p.model.id,p]));
    const casings=placements.flatMap(placement=>{
      const built=models.get(placement.modelId);
      if(!built)throw new Error(`trim casing model absent: ${placement.modelId}`);
      return built.model.parts.filter(part=>["casing","casing-a","casing-b"].includes(built.faceByPart[part.id]??"")).map(part=>{
        if(part.geometry.type!=="mesh")throw new Error(`trim casing is not a mesh: ${part.id}`);
        const local=part.transform===null?part.geometry.mesh:transformAutoMovieMesh(part.geometry.mesh,part.transform);
        const mesh=transformAutoMovieMesh(local,placement.transform);
        const bounds=[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity];
        for(let i=0;i<mesh.positions.length;i+=3)for(let axis=0;axis<3;axis++){
          bounds[axis*2]=Math.min(bounds[axis*2]!,mesh.positions[i+axis]!);
          bounds[axis*2+1]=Math.max(bounds[axis*2+1]!,mesh.positions[i+axis]!);
        }
        return bounds;
      });
    });
    const cut:Run[]=[];
    for(const run of runs){
      let intervals:readonly (readonly [number,number])[]=[[run.lo,run.hi]];
      for(const b of casings){
        if(b[2]!>run.floor+0.10-EPS||b[3]!<run.floor+EPS)continue;
        const fixed=run.nx!==0?[b[0]!,b[1]!]:[b[4]!,b[5]!],plane=run.nx!==0?run.plane/run.nx:run.plane/run.nz;
        if(plane<fixed[0]!-EPS||plane>fixed[1]!+EPS)continue;
        const varying=run.nx!==0?[b[4]!,b[5]!]:[b[0]!,b[1]!],sign=run.nx!==0?-run.nx:run.nz;
        const lo=Math.min(...varying.map(v=>v*sign)),hi=Math.max(...varying.map(v=>v*sign));
        intervals=intervals.flatMap(([a,z])=>hi<=a+EPS||lo>=z-EPS?[[a,z] as const]:[
          ...(lo>a+EPS?[[a,lo] as const]:[]),...(hi<z-EPS?[[hi,z] as const]:[]),
        ]);
      }
      cut.push(...intervals.map(([lo,hi])=>({...run,lo,hi})));
    }
    const output:Built[]=[],instances:Placement[]=[],builder=new Baseboard();
    for(const [index,run] of cut.entries()){
      const a=point(run,run.lo),b=point(run,run.hi);
      const miter=(endpoint:{x:number;z:number}):-1|0|1=>{
        const neighbor=cut.find(other=>other!==run&&other.room===run.room&&Math.abs(other.nx*run.nx+other.nz*run.nz)<EPS&&
          [point(other,other.lo),point(other,other.hi)].some(p=>Math.hypot(p.x-endpoint.x,p.z-endpoint.z)<EPS));
        return neighbor?Math.sign(neighbor.nx*run.nz-neighbor.nz*run.nx) as -1|1:0;
      };
      const id=`${run.room}/${index+1}`,built=builder.build({id,length:run.hi-run.lo,startMiter:miter(a),endMiter:miter(b)}),yaw=Math.atan2(run.nx,run.nz);
      output.push(built);
      instances.push({id:`trim:${id}`,modelId:built.model.id,transform:{translation:{x:a.x,y:run.floor,z:a.z},rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}}});
    }
    return {prototypes:output,instances};
  }
}
