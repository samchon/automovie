/** Camera realizations of every compiled observation question on the same house. */
import { builtEnvironmentBuildingCensus } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import type { IHouse } from "../spaces/house";
import { deriveHouseObservations } from "../spaces/observations";
type Point=[number,number,number];
type View={id:string;position:Point;target:Point;fovDeg:number;near:number};

export function buildObservationViews(environment:IAutoMovieBuiltEnvironment,house:IHouse):View[]{
  const derived=deriveHouseObservations(environment,house);
  if(derived.failures.length)throw new Error(`observation derivation refused ${derived.failures.length} stations`);
  const censuses=builtEnvironmentBuildingCensus(environment),faces=new Map(censuses.flatMap(c=>c.facades.map(f=>[f.boundary,f] as const))),corners=new Map(censuses.flatMap(c=>c.corners.map(p=>[p.id,p] as const)));
  return derived.observations.map(o=>{
    if(o.pose)return {id:o.id,position:[o.pose.position.x,o.pose.position.y,o.pose.position.z],target:[o.pose.target.x,o.pose.target.y,o.pose.target.z],fovDeg:60,near:.05};
    if(o.subject===null)throw new Error(`observation has neither pose nor subject: ${o.id}`);
    const face=faces.get(o.subject),corner=corners.get(o.subject);
    if(face){const p=face.centroid,n=face.normal;return {id:o.id,position:[p.x+n.x*4,p.y+n.y*4,p.z+n.z*4],target:[p.x,p.y,p.z],fovDeg:45,near:.05};}
    if(corner){const p=corner.position,n=corner.normal;return {id:o.id,position:[p.x+n.x*4,p.y+1.6,p.z+n.z*4],target:[p.x,p.y+1.3,p.z],fovDeg:45,near:.05};}
    const opening=environment.openings.find(p=>p.id===o.subject),boundary=opening&&environment.boundaries.find(b=>b.id===opening.boundary);
    if(opening?.profile&&boundary?.face){
      const face=boundary.face,q=face.rotation,yaw=2*Math.atan2(q.y,q.w),u=opening.profile.outline.reduce((s,p)=>s+p.x,0)/opening.profile.outline.length,y=opening.profile.outline.reduce((s,p)=>s+p.y,0)/opening.profile.outline.length;
      const x=face.origin.x+Math.cos(yaw)*u,z=face.origin.z-Math.sin(yaw)*u;
      const exterior=faces.get(boundary.id),n=exterior?.normal??{x:Math.sin(yaw),y:0,z:Math.cos(yaw)};
      return {id:o.id,position:[x+n.x*3,y,z+n.z*3],target:[x,y,z],fovDeg:45,near:.05};
    }
    const part=house.parts.find(p=>p.id===o.subject);
    if(part?.role==="roof"){
      const p=part.mesh.positions,n=part.mesh.normals!;let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;
      for(let i=0;i<p.length;i+=3){x0=Math.min(x0,p[i]!);x1=Math.max(x1,p[i]!);y0=Math.min(y0,p[i+1]!);y1=Math.max(y1,p[i+1]!);z0=Math.min(z0,p[i+2]!);z1=Math.max(z1,p[i+2]!);}
      const at:Point=[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],index=n.findIndex((_,i)=>i%3===1&&n[i]!>.1)-1;
      if(index<0)throw new Error(`roof has no weather normal: ${part.id}`);
      const sign=o.role==="underside"?-1:1,distance=Math.max(x1-x0,z1-z0)*.85+2;
      return {id:o.id,position:[at[0]+n[index]!*distance*sign,at[1]+n[index+1]!*distance*sign,at[2]+n[index+2]!*distance*sign],target:at,fovDeg:45,near:.05};
    }
    throw new Error(`unrealized observation camera ${o.id}`);
  });
}
