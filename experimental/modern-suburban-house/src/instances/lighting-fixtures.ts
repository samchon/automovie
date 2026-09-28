/** Fixture bodies consume the same practical-light records as their illumination. */
import { LightingFixtures } from "../models/lighting-fixtures";
import { HouseLighting } from "../systems/lighting";
import type { IHouse } from "../spaces/house";
import { roomLevels } from "../spaces/rooms/shared";
import type { IAutoMovieMeshTransform } from "@automovie/engine";
type Built=ReturnType<LightingFixtures["flush"]>;
type Placement={id:string;modelId:string;transform:IAutoMovieMeshTransform};
/** Twenty-five fixed light bodies; the four portable lamps belong to their hosts. */
export class FixedLightFixtures {
  public build(house:IHouse):{prototypes:Built[];instances:Placement[]} {
    const maker=new LightingFixtures(),prototypes:Built[]=[],instances:Placement[]=[];
    const add=(id:string,built:Built,x:number,y:number,z:number,yaw=0):void=>{
      if(!prototypes.some(p=>p.model.id===built.model.id))prototypes.push(built);
      instances.push({id,modelId:built.model.id,transform:{translation:{x,y,z},rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}}});
    };
    for(const light of new HouseLighting().build().lights){
      if(light.type!=="point"||light.id.includes("nightstand"))continue;
      const [,space,role]=light.id.split(":"),p=light.transform.translation;
      const room=house.spaces.find(r=>r.id===space),ceiling=space==="main-stair"?roomLevels(house.spaces.find(r=>r.id==="upper-hall")!)[1]:room?roomLevels(room)[1]:undefined;
      if(ceiling===undefined)throw new Error(`light fixture has no room: ${light.id}`);
      const id=light.id.replace(/^light:/,"fixture:");
      if(role!.includes("pendant"))add(id,maker.pendant(role==="dining-pendant"?"dining":"island"),p.x,ceiling,p.z);
      else if(role==="vanity")add(id,maker.vanity(),space==="powder-room"?p.x:space==="tub-bathroom"?5.50:3.07,p.y,space==="powder-room"?-.25:p.z,space==="powder-room"?Math.PI:-Math.PI/2);
      else add(id,maker.flush(space==="garage"),p.x,ceiling,p.z);
    }
    add("fixture:front-porch:door-sconce",maker.porch(),.15,1.80,0);
    return {prototypes,instances};
  }
}
