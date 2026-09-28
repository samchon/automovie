/**
 * Resolve a room station to a place for the authored 0.60 x 0.45 x 1.90 m person.
 * Inputs are validated compiled cells and world-metre room reservations. No
 * reservation, room, question, or model is changed. The observation producer
 * supplies cell bounds and records a null result as that question's failure.
 */
import { builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import type { IRoomReservation } from "./rooms/reservations";
import type { IHouseObservation, IObservationPose } from "./observation-records";

/**
 * @evidence spaces/04-observations.md A station retains its question and own space while standing clear of planned bodies and swings.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Tests the oriented person footprint, body height, cell containment, reservation separation, and nearest finite 0.10 m candidate; an unavailable pose returns null.
 * @evidence principles/core/source-units.md#source-scope-preservation Consumes existing cell bounds, room reservations and prior poses without constructing a wall, moving furniture, or discarding a question.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the original clear station, a nearest clear station with its displacement reason, or null; centre directions remain parallel and other targets remain fixed.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work Physical renders exposed door leaves and shelf bodies in accepted logical stations; the observation design now requires the full person footprint outside body and swing reservations before acceptance.
 */
export const standingObservation = (input:{
  space:IAutoMovieBuiltSpace;
  pose:IObservationPose;
  floor:number;
  eye:number;
  preserveDirection:boolean;
  occupied:readonly IRoomReservation[];
  previous:readonly IHouseObservation[];
  ranges:readonly {x:readonly [number,number];z:readonly [number,number]}[];
}):IObservationPose|null=>{
  const {space,pose,floor,eye,preserveDirection,occupied,previous,ranges}=input;
  const origin=pose.position,samePlace=.05;
  const distance=(a:IAutoMovieVector3,b:IAutoMovieVector3):number=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  const target=(x:number,z:number):IAutoMovieVector3=>preserveDirection
    ?{x:pose.target.x+x-origin.x,y:floor+eye,z:pose.target.z+z-origin.z}
    :{...pose.target,y:floor+eye};
  const clear=(x:number,z:number):boolean=>{
    const at=target(x,z),dx=at.x-x,dz=at.z-z,length=Math.hypot(dx,dz);
    if(length<samePlace)return false;
    if(previous.some(p=>p.space===space.id&&p.pose!==null&&distance(p.pose.position,{x,y:floor+eye,z})<samePlace&&distance(p.pose.target,at)<samePlace))return false;
    const forward={x:dx/length,z:dz/length},side={x:forward.z,z:-forward.x};
    const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([a,b])=>({x:x+side.x*a!*.30+forward.x*b!*.225,z:z+side.z*a!*.30+forward.z*b!*.225}));
    if(corners.some(p=>!builtSpaceContainsPoint(space,{...p,y:floor+.01})||!builtSpaceContainsPoint(space,{...p,y:floor+1.90})))return false;
    return !occupied.some(zone=>{
      const box=[{x:zone.x[0],z:zone.z[0]},{x:zone.x[0],z:zone.z[1]},{x:zone.x[1],z:zone.z[0]},{x:zone.x[1],z:zone.z[1]}];
      // Separating axes of the oriented footprint and the axis-aligned reservation.
      return [{x:1,z:0},{x:0,z:1},forward,side].every(axis=>{
        const a=corners.map(p=>p.x*axis.x+p.z*axis.z),b=box.map(p=>p.x*axis.x+p.z*axis.z);
        return Math.max(...a)>Math.min(...b)+1e-7&&Math.max(...b)>Math.min(...a)+1e-7;
      });
    });
  };
  if(clear(origin.x,origin.z))return pose;
  const candidates:IAutoMovieVector3[]=[];
  for(const {x:xs,z:zs} of ranges){
    for(let xi=0;xi<=Math.ceil((xs[1]-xs[0])/.10);xi++)for(let zi=0;zi<=Math.ceil((zs[1]-zs[0])/.10);zi++){
      const x=xs[0]+xi*.10,z=zs[0]+zi*.10;
      if(clear(x,z))candidates.push({x,y:floor+eye,z});
    }
  }
  candidates.sort((a,b)=>Math.hypot(a.x-origin.x,a.z-origin.z)-Math.hypot(b.x-origin.x,b.z-origin.z)||a.x-b.x||a.z-b.z);
  const position=candidates[0];
  return position===undefined?null:{position,target:target(position.x,position.z),reason:[pose.reason,`Standing footprint moved ${Math.hypot(position.x-origin.x,position.z-origin.z).toFixed(3)} m from boundary/body/swing occupancy within ${space.id}.`].filter(Boolean).join(" ")};
};
