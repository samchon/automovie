/** Fixed room contents; models own geometry and materials own their finishes. */
import type { IAutoMovieBuiltEnvironment, IAutoMovieModel } from "@automovie/interface";
import { identityTransform } from "../geometry/model-parts";
import { TempleFixtures } from "../models/fixtures";
import { TempleWares } from "../models/wares";
import { TemplePortable } from "../models/portable";
import { TempleRitual } from "../models/ritual";
import { TempleLandscape } from "../models/landscape";
import { templeLevels } from "../spaces/storey";

type Row = { role:string; model:IAutoMovieModel; space:string; x:number; z:number;
  yaw:number; support?:{ role:string; part:string; height?:number } };
const level = (model:IAutoMovieModel, side:"min"|"max", part?:string):number => {
  const values=model.parts.filter(entry=>part===undefined||entry.id===part).flatMap(entry=>{
    if(entry.geometry.type!=="mesh"||entry.transform!==null)
      throw new Error(`${model.id}/${entry.id}: local mesh required`);
    return entry.geometry.mesh.positions.filter((_,i)=>i%3===1);
  });
  if(values.length===0||!values.every(Number.isFinite))
    throw new Error(`${model.id}/${part??"*"}: finite support geometry required`);
  return side==="min"?Math.min(...values):Math.max(...values);
};

/**
 * @evidence instances/objects.md Seven room populations place the reviewed object prototypes at their authored role coordinates and actual host levels.
 * @evidence instances/objects.md#sanctuary The altar, niche, paired lamps, bowl, censer, textile and two cushions retain the northern axis and front activity area.
 * @evidence instances/objects.md#offering A long table and two shelves carry small offerings while the direct door and table circulation remain empty.
 * @evidence instances/objects.md#administration One writing desk and stool face the west approach; its tools and the small wall shelf remain distinct from records.
 * @evidence instances/objects.md#records A northern twenty-cell shelf receives fixed rolled and bundled scrolls with a separate reading desk and closed chest to the east.
 * @evidence instances/objects.md#storage Wall-side jars, rack, stand, chest and basket leave the central service entry empty.
 * @evidence instances/objects.md#yard A stationary cart and a few carrying objects occupy the north-east reserve rather than either service-door route.
 * @evidence instances/objects.md#courtyard Three edge benches, two planted pots, a bucket and an unlit lamp leave the fountain and colonnade clear.
 * @evidence principles/core/source-units.md#source-scope-preservation This assembly changes membership and transforms only; no model scale, geometry, material or room boundary is altered.
 * @evidence principles/core/source-units.md#source-substantive-completion Actual minimum mesh heights meet floors or named support parts, and every emitted member has a stable role and one room.
 * @evidence obligations/design/instance-sources.md#instance-source-design-ownership All roles, prototypes, horizontal coordinates, rotations and support owners come from the seven object instance H2s.
 * @evidence obligations/design/instance-sources.md#instance-source-stable-membership Explicit row order and named scroll cells reproduce the same IDs and transforms without random or call-order inputs.
 * @evidence obligations/design/instance-sources.md#instance-source-invalid-placement Duplicate role/model IDs, unknown rooms, missing or non-finite support geometry and forward support references throw before returning an environment.
 * @evidenceExclude upstream/design/instance-sources.md#design-revision-from-instance-source-work The seven H2s supply all membership, transforms and support rules; the rack's missing well is repaired at its model owner rather than hidden here.
 */
export const addTempleObjectInstances = (environment:IAutoMovieBuiltEnvironment):IAutoMovieBuiltEnvironment => {
  const fixtures=new TempleFixtures(),wares=new TempleWares(),portable=new TemplePortable(),ritual=new TempleRitual();
  const rows:Row[]=[];
  const add=(role:string,model:IAutoMovieModel,space:string,x:number,z:number,yaw=0,
    support?:Row["support"]):void=>{rows.push({role,model,space,x,z,yaw,support});};
  const atop=(role:string,part:string,height?:number):NonNullable<Row["support"]>=>({role,part,height});
  const altar=fixtures.altar(),niche=fixtures.niche(),lampstand=fixtures.lampstand();
  const small=wares.smallVessel(),bowl=wares.offeringBowl(),jar=wares.storageJar(),carry=wares.carryJar();
  const basket=wares.basket(),chest=fixtures.chest(),stool=fixtures.stool();
  const textile=portable.textile("standard"),cloth=portable.textile("small"),lamp=portable.portableLamp();
  add("sanctuary.altar",altar,"sanctuary",0,-7.7);
  add("sanctuary.niche",niche,"sanctuary",0,-9.65);
  add("sanctuary.niche-vessel",small,"sanctuary",0,-9.37,0,atop("sanctuary.niche","recess-frame",0.75));
  add("sanctuary.lamp.west",lampstand,"sanctuary",-1.8,-7.7);
  add("sanctuary.lamp.east",lampstand,"sanctuary",1.8,-7.7);
  add("sanctuary.bowl",bowl,"sanctuary",0,-7.9,0,atop("sanctuary.altar","top"));
  add("sanctuary.censer",ritual.censer(),"sanctuary",-0.4,-7.9,0,atop("sanctuary.altar","top"));
  add("sanctuary.cloth",cloth,"sanctuary",0.4,-7.75,0,atop("sanctuary.altar","top"));
  add("sanctuary.cushion.west",ritual.floorCushion(),"sanctuary",-0.55,-6.1);
  add("sanctuary.cushion.east",ritual.floorCushion(),"sanctuary",0.55,-6.1);
  add("offering.table",fixtures.offeringTable(),"offering",-7.7,0);
  add("offering.shelf.west",fixtures.displayShelf("offering"),"offering",-9.88,-6.5,Math.PI/2);
  add("offering.shelf.north",fixtures.displayShelf("offering"),"offering",-7.5,-9.63);
  add("offering.tray",portable.offeringTray(),"offering",-7.7,-0.55,0,atop("offering.table","top"));
  add("offering.tray-bowl",bowl,"offering",-7.7,-0.55,0,atop("offering.tray","floor"));
  add("offering.small-vessel",small,"offering",-7.7,0.1,0,atop("offering.table","top"));
  add("offering.cloth",textile,"offering",-7.7,0.65,0,atop("offering.table","top"));
  add("offering.plaque",portable.votivePlaque(),"offering",-7.8,-9.43,0,atop("offering.shelf.north","board",1.40));
  add("offering.shelf-vessel",small,"offering",-7.1,-9.43,0,atop("offering.shelf.north","board",0.58));
  add("offering.shelf-jar",carry,"offering",-9.68,-6.1,Math.PI/2,atop("offering.shelf.west","board",1.40));
  add("offering.lamp",lamp,"offering",-9.68,-6.8,0,atop("offering.shelf.west","board",0.58));
  add("administration.desk",fixtures.desk("writing"),"administration",9.2,7.5,Math.PI/2);
  add("administration.stool",stool,"administration",8.35,7.5);
  add("administration.shelf",fixtures.displayShelf("administration"),"administration",8.2,9.63,Math.PI);
  add("administration.scroll",wares.scroll("open"),"administration",9.12,7.25,Math.PI/2,atop("administration.desk","top"));
  add("administration.tablet",portable.writingTablet(),"administration",9.18,7.75,Math.PI/2,atop("administration.desk","top"));
  add("administration.stylus",portable.stylus(),"administration",9.38,7.7,Math.PI/2,atop("administration.desk","top"));
  add("administration.tool-vessel",small,"administration",9.39,7.15,0,atop("administration.desk","top"));
  add("administration.cloth",cloth,"administration",7.98,9.48,Math.PI/2,atop("administration.shelf","board",0.68));
  add("administration.shelf-vessel",small,"administration",8.45,9.48,0,atop("administration.shelf","board",0.13));
  add("administration.lamp",lamp,"administration",8.42,9.48,0,atop("administration.shelf","board",0.68));
  add("records.shelf",fixtures.scrollShelf(),"records",7.8,1.87);
  const rolled=wares.scroll("rolled"),bundle=wares.scroll("bundle");
  for(const [tier,height] of [0.04,0.37,0.70,1.03,1.36].entries())
    for(const [cell,offset] of [-0.6575,-0.21875,0.21875,0.6575].entries())
      add(`records.scroll.tier-${tier}.cell-${cell}`,(tier+cell)%2===0?rolled:bundle,
        "records",7.8+offset,2.07,0,atop("records.shelf","board",height));
  add("records.chest",chest,"records",9.4,2.95,-Math.PI/2);
  add("records.desk",fixtures.desk("reading"),"records",9.15,4.3,Math.PI/2);
  add("records.stool",stool,"records",8.35,4.3);
  add("records.tablet",portable.writingTablet(),"records",9.15,4.05,Math.PI/2,atop("records.desk","top"));
  add("records.stylus",portable.stylus(),"records",9.32,4.25,Math.PI/2,atop("records.desk","top"));
  add("records.cloth",cloth,"records",9.4,2.95,0,atop("records.chest","lid"));
  add("records.rope",portable.ropeCoil(),"records",9.12,4.5,0,atop("records.desk","top"));
  add("storage.rack",portable.jarRack(),"storage",7.4,-1.65);
  add("storage.rack-jar.west",jar,"storage",7.11,-1.65,0,atop("storage.rack","well"));
  add("storage.rack-jar.east",carry,"storage",7.69,-1.65,0,atop("storage.rack","well"));
  add("storage.stand",ritual.jarStand(),"storage",9.35,-1.6);
  add("storage.stand-jar",jar,"storage",9.35,-1.6,0,atop("storage.stand","ring"));
  add("storage.jar",jar,"storage",9.35,-0.8);
  add("storage.chest",chest,"storage",9.3,1.1);
  add("storage.cloth",textile,"storage",9.3,1.1,0,atop("storage.chest","lid"));
  add("storage.basket",basket,"storage",9.4,0.3);
  add("storage.rope",portable.ropeCoil(),"storage",8.7,1.2);
  add("yard.cart",portable.handcart(),"service-yard",9,-8.1);
  add("yard.yoke",portable.carryingYoke(),"service-yard",8.4,-7.1);
  add("yard.jar",jar,"service-yard",8,-9.2);
  add("yard.basket",basket,"service-yard",8.55,-9.2);
  add("yard.bucket",portable.bucket(),"service-yard",9.5,-7.1);
  add("yard.rope",portable.ropeCoil(),"service-yard",8.2,-7.65);
  add("court.bench.west",portable.bench("standard"),"courtyard",-2.7,4.9,Math.PI/2);
  add("court.bench.east",portable.bench("standard"),"courtyard",2.7,4.9,-Math.PI/2);
  add("court.bench.short",portable.bench("short"),"courtyard",2.7,-0.8,-Math.PI/2);
  add("court.lamp",lamp,"courtyard",-2.7,5.25,0,atop("court.bench.west","seat"));
  add("court.bucket",portable.bucket(),"courtyard",-2.7,4);
  const planter=portable.planter(),grass=new TempleLandscape().grassTuft();
  for(const [side,x] of [["west",-2.7],["east",2.7]] as const){
    add(`court.planter.${side}`,planter,"courtyard",x,2.2);
    add(`court.plant.${side}`,grass,"courtyard",x,2.2,0,atop(`court.planter.${side}`,"soil"));
  }
  const spaces=new Set(environment.spaces.map(space=>space.id));
  const ids=new Set(environment.elements.map(element=>element.id));
  const models=new Map(environment.models.map(model=>[model.id,model]));
  if(models.size!==environment.models.length)throw new Error("objects: duplicate input model ID");
  const placed=new Map<string,{model:IAutoMovieModel;y:number}>();
  const additions=rows.map(row=>{
    const id=`element.object.${row.role}`;
    if(ids.has(id))throw new Error(`${id}: duplicate member ID`);
    if(!spaces.has(row.space))throw new Error(`${id}: missing space ${row.space}`);
    ids.add(id);
    let datum=row.space==="courtyard"?templeLevels.courtyard:templeLevels.floor;
    if(row.support){
      const host=placed.get(row.support.role);
      if(!host)throw new Error(`${id}: missing preceding support ${row.support.role}`);
      const low=level(host.model,"min",row.support.part),high=level(host.model,"max",row.support.part);
      const local=row.support.height??high;
      if(local<low||local>high)throw new Error(`${id}: support level outside ${row.support.part}`);
      datum=host.y+local;
    }
    const height=datum-level(row.model,"min");
    if(![row.x,row.z,row.yaw,height].every(Number.isFinite))throw new Error(`${id}: non-finite transform`);
    placed.set(row.role,{model:row.model,y:height});
    models.set(row.model.id,row.model);
    return {id,kind:"fixture" as const,parent:"temple.root",model:row.model.id,space:row.space,
      transform:{...identityTransform(),translation:{x:row.x,y:height,z:row.z},
        rotation:{x:0,y:Math.sin(row.yaw/2),z:0,w:Math.cos(row.yaw/2)}}};
  });
  return {...environment,models:[...models.values()],elements:[...environment.elements,...additions]};
};
