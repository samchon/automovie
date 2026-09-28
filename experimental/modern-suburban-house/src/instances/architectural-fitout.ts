/** Place fixed architectural fittings using the room reservations and model frames.
 * Opening fills remain in their dedicated producers; this owner adds the stair
 * finish, closets and room-bound cabinets and sanitary compartments. No mobile
 * furniture is emitted here. Coordinates are Y-up metres, yaw is radians.
 */
import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { Closet } from "../models/closet";
import { StairBaluster } from "../models/stair-baluster";
import { StairSkirt } from "../models/stair-skirt";
import { Bathrooms } from "../models/furnishings/bathrooms";
import { SanitaryFittings } from "../models/furnishings/sanitary-fittings";
import { Bedrooms } from "../models/furnishings/bedrooms";
import { KitchenDining } from "../models/furnishings/kitchen-dining";
import { Living } from "../models/furnishings/living";
import { ServiceRooms } from "../models/furnishings/service-rooms";
import type { IHouse } from "../spaces/house";
import { roomLevels } from "../spaces/rooms/shared";
import type { IRoomReservation } from "../spaces/rooms/reservations";

type Built = { model: IAutoMovieModel; faceByPart: Readonly<Record<string,string>> };
type Placement = { id:string; modelId:string; transform:IAutoMovieMeshTransform };

/** Fixed fittings retain their reviewed model dimensions and unit scale. */
export class ArchitecturalFitout {
  /** Assemble each fixed fitting exactly once, preserving reservation identities. */
  public build(house:IHouse):{prototypes:Built[];instances:Placement[]} {
    const prototypes:Built[]=[],instances:Placement[]=[];
    const zones=new Map(house.spaces.flatMap(space=>(space.reservations??[]).map(zone=>[
      zone.id,{zone,floor:roomLevels(space)[0]},
    ] as const)));
    const add=(id:string,built:Built,translation:{x:number;y:number;z:number},yaw=0):void=>{
      if(!prototypes.some(entry=>entry.model.id===built.model.id))prototypes.push(built);
      instances.push({id,modelId:built.model.id,transform:{translation,
        rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}}});
    };
    const zone=(id:string):{zone:IRoomReservation;floor:number}=>{
      const value=zones.get(id);
      if(!value)throw new Error(`fixed fitting has no reservation: ${id}`);
      return value;
    };
    // Models whose documented XZ is already the house frame need only a floor lift.
    const anchored=(id:string,built:Built):void=>{
      const entry=zone(id);
      add(id,built,{x:0,y:entry.floor,z:0});
    };
    // Model origin is rear edge centre; align it with the reservation's rear edge.
    const local=(id:string,built:Built,yaw:number):void=>{
      const {zone:z,floor}=zone(id);
      const x=yaw===Math.PI/2?z.x[0]:yaw===-Math.PI/2?z.x[1]:(z.x[0]+z.x[1])/2;
      const depth=yaw===Math.PI?z.z[1]:yaw===0?z.z[0]:(z.z[0]+z.z[1])/2;
      add(id,built,{x,y:z.y?.[0]??floor,z:depth},yaw);
    };
    const closets=new Closet();
    add("fill:entry-coat-opening",closets.coat(),{x:0,y:0,z:0});
    add("fill:upper-linen-opening",closets.linen(),{x:0,y:roomLevels(house.spaces.find(s=>s.id==="upper-hall")!)[0],z:0});
    add("stair-infill",new StairBaluster().build(),{x:0,y:0,z:0});
    add("stair-skirt",new StairSkirt().build(),{x:0,y:0,z:0});
    const kitchen=new KitchenDining();
    for(const [id,yaw,end] of [
      ["common-kitchen-back-base",0,"left"],
      ["common-kitchen-left-base-rear",Math.PI/2,"right"],
      ["common-kitchen-left-base-front",Math.PI/2,"none"],
    ] as const){
      const z=zone(id).zone;
      local(id,kitchen.baseRun(yaw===0?z.x[1]-z.x[0]:z.z[1]-z.z[0],end),yaw);
    }
    local("common-kitchen-left-wall-cabinet",kitchen.wallCabinet(1.30),Math.PI/2);
    local("common-kitchen-back-wall-cabinet",kitchen.wallCabinet(0.85),0);
    local("common-island",kitchen.island(),-Math.PI/2);
    const service=new ServiceRooms();
    anchored("laundry-folding-top",service.laundryTop());
    anchored("laundry-coat-hooks",service.coatHooks());
    anchored("laundry-upper-storage",service.laundryUpper());
    anchored("pantry-back-shelf",service.pantryShelves());
    const bedrooms=new Bedrooms();
    anchored("primary-wardrobe-hanging",bedrooms.wardrobeHanging());
    anchored("primary-wardrobe-shelves",bedrooms.wardrobeShelves());
    for(const id of ["bedroom-two-closet","bedroom-three-closet"])
      local(id,bedrooms.slidingCloset(),-Math.PI/2);
    const baths=new Bathrooms();
    local("powder-basin",baths.vanity(0.60,0.45,true),Math.PI);
    local("shower-bathroom-vanity",baths.vanity(0.70,0.55),-Math.PI/2);
    local("tub-bathroom-vanity",baths.vanity(0.85,0.55),-Math.PI/2);
    local("shower-bathroom-booth",baths.showerBooth(),0);
    local("tub-bathroom-tub",baths.bathtub(),-Math.PI/2);
    const sanitary=new SanitaryFittings();
    local("powder-toilet",sanitary.toilet(),-Math.PI/2);
    local("shower-bathroom-toilet",sanitary.toilet(),0);
    local("tub-bathroom-toilet",sanitary.toilet(),-Math.PI/2);
    local("powder-mirror",sanitary.mirror(.60),Math.PI);
    local("shower-bathroom-mirror",sanitary.mirror(.70),-Math.PI/2);
    local("tub-bathroom-mirror",sanitary.mirror(.85),-Math.PI/2);
    local("powder-towel",sanitary.towelBar(.50,.30),Math.PI);
    local("shower-bathroom-towel",sanitary.towelBar(.25,.40),Math.PI);
    local("tub-bathroom-towel",sanitary.towelBar(.75,.40),Math.PI/2);
    const rail=zone("tub-bathroom-curtain-rail");
    add("tub-bathroom-curtain-rail",sanitary.curtainRail(),{
      x:(rail.zone.x[0]+rail.zone.x[1])/2,y:rail.floor,z:rail.zone.z[0],
    });
    const fireplace=new Living().fireplace();
    // The space owns the brick void; the model's front plane meets its inner face.
    add("living-fireplace-insert",fireplace,{x:-4.95,y:0,z:-2.20},Math.PI/2);
    return {prototypes,instances};
  }
}
