/**
 * The neutral review population consumes the actual model source classes.
 * It records model labels and named size/pose variants without copying
 * their meshes. The browser receives the current source result verbatim.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import {
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { TempleColumns } from "../models/TempleColumns";
import { TempleEntablature } from "../models/TempleEntablature";
import { TempleOpenings } from "../models/TempleOpenings";
import { TempleCladding } from "../models/TempleCladding";
import { TempleFixtures } from "../models/TempleFixtures";
import { TempleWares } from "../models/TempleWares";
import { TempleLandscape } from "../models/TempleLandscape";
import { TemplePortable } from "../models/TemplePortable";
import { TempleRitual } from "../models/TempleRitual";
import { templeDoorPassages } from "../spaces/templeDoorPassages";

const item = (key:string,design:string,model:IAutoMovieModel) => ({
  key,
  design,
  model,
});
const repeated = (model: IAutoMovieModel, placements: readonly (readonly [number,number])[],
  id: string): IAutoMovieModel => ({
    ...model,
    id,
    parts:model.parts.map((part)=>{
      if(part.geometry.type!=="mesh")throw new Error(`${model.id}/${part.id}: mesh required`);
      const mesh=part.geometry.mesh;
      return {
        ...part,
        geometry:{
          type:"mesh" as const,
          mesh:mergeAutoMovieMeshes(
            placements.map(([x,z])=>
              transformAutoMovieMesh(mesh, {
                translation:{ x, y:0, z },
              }),
            ),
          ),
        },
      };
    }),
  });

export const createModelBoardPayload = () => {
  const columns=new TempleColumns(), beams=new TempleEntablature();
  const openings=new TempleOpenings(), cladding=new TempleCladding();
  const fixtures=new TempleFixtures(),wares=new TempleWares();
  const landscape=new TempleLandscape(),portable=new TemplePortable(),ritual=new TempleRitual();
  const doors=templeDoorPassages.map((door)=>
    item(
      `frame.${door.id}`,
      "door-frame",
      openings.doorFrame(door.id),
    ),
  );
  const doubleDoors=(["door-entry","door-sanctuary"] as const).flatMap((door)=>
    (["closed","open"] as const).map((state)=>
      item(
        `double.${door}.${state}`,
        "double-door-leaf",
        openings.doubleLeaf(door, state),
      ),
    ),
  );
  const singleDoors=(["door-offering","door-administration","door-records",
    "door-storage","door-yard","door-service-exterior"] as const).flatMap((door)=>
    (["closed","open"] as const).map((state)=>item(`single.${door}.${state}`,
      "single-door-leaf",openings.singleLeaf(door,state))));
  return {
    models:[
      ...([12,19] as const).map((angle)=>item(`column.colonnade.${angle}`,
        "colonnade-column",columns.colonnade(angle))),
      item("column.porch","porch-column",columns.porch()),
      ...(["north","south","east","west"] as const).map((side)=>item(`beam.${side}`,
        "colonnade-beam",beams.colonnadeBeam(side))),
      item("rafter.12.sample","rafter",beams.rafter(12,1,"colonnade-12-sample")),
      item("rafter.19.sample","rafter",beams.rafter(19,1,"colonnade-19-sample")),
      ...beams.sanctuaryRafters().map((model)=>item(model.id,
        "rafter",model)),
      item("entablature.porch","porch-entablature",beams.porch()),
      item("truss.sanctuary","sanctuary-truss",beams.sanctuaryTruss()),
      item("joist.room","ceiling-joist",beams.ceilingJoist()),
      ...doors,...doubleDoors,...singleDoors,
      ...([0.30,0.60] as const).map((thickness)=>item(`window.${thickness}`,
        "window-frame",openings.windowFrame(thickness))),
      item("tile.roof","roof-tile",cladding.roofTile()),
      item("tile.roof.3x3","roof-tile",
        repeated(cladding.roofTile(),Array.from({ length:9 },(_,i)=>
          [(i%3-1)*0.40,Math.floor(i/3)*0.44] as const),"tile.roof.3x3")),
      ...([19,22] as const).map((angle)=>item(`tile.ridge.${angle}`,
        "ridge-tile",cladding.ridgeTile(angle))),
      ...([19,22] as const).map((angle)=>item(`tile.ridge.${angle}.three`,
        "ridge-tile",repeated(cladding.ridgeTile(angle),
          [[0,0],[0,0.40],[0,0.80]],`tile.ridge.${angle}.three`))),
      item("fixture.fountain","fountain",fixtures.fountain()),
      item("fixture.altar","altar",fixtures.altar()),
      item("fixture.niche","niche",fixtures.niche()),
      item("fixture.lampstand","lampstand",fixtures.lampstand()),
      item("fixture.offering-table","offering-table",fixtures.offeringTable()),
      ...(["offering","administration"] as const).map((kind)=>item(`fixture.display-shelf.${kind}`,
        "display-shelf",fixtures.displayShelf(kind))),
      ...(["writing","reading"] as const).map((kind)=>item(`fixture.desk.${kind}`,
        "desk",fixtures.desk(kind))),
      item("fixture.stool","stool",fixtures.stool()),
      item("fixture.scroll-shelf","scroll-shelf",fixtures.scrollShelf()),
      item("fixture.chest","chest",fixtures.chest()),
      item("ware.storage-jar","storage-jar",wares.storageJar()),
      item("ware.carry-jar","carry-jar",wares.carryJar()),
      item("ware.small-vessel","small-vessel",wares.smallVessel()),
      item("ware.offering-bowl","offering-bowl",wares.offeringBowl()),
      item("ware.basket","basket",wares.basket()),
      ...(["rolled","bundle","open"] as const).map((state)=>item(`ware.scroll.${state}`,
        "scroll",wares.scroll(state))),
      item("landscape.cypress","cypress",landscape.cypress()),
      item("landscape.broad-tree","broad-tree",landscape.broadTree()),
      item("landscape.grass-tuft","grass-tuft",landscape.grassTuft()),
      ...(["gable","shed"] as const).map((kind)=>item(`landscape.neighbor-house.${kind}`,
        "neighbor-house",landscape.neighborHouse(kind))),
      ...(["standard","short"] as const).map((kind)=>item(`portable.bench.${kind}`,
        "bench",portable.bench(kind))),
      item("portable.lamp","portable-lamp",portable.portableLamp()),
      item("portable.jar-rack","jar-rack",portable.jarRack()),
      item("portable.carrying-yoke","carrying-yoke",portable.carryingYoke()),
      item("portable.handcart","handcart",portable.handcart()),
      item("portable.bucket","bucket",portable.bucket()),
      item("portable.planter","planter",portable.planter()),
      item("portable.votive-plaque","votive-plaque",portable.votivePlaque()),
      item("portable.offering-tray","offering-tray",portable.offeringTray()),
      ...(["standard","small"] as const).map((kind)=>item(`portable.textile.${kind}`,
        "textile",portable.textile(kind))),
      item("portable.stylus","stylus",portable.stylus()),
      item("portable.writing-tablet","writing-tablet",portable.writingTablet()),
      item("portable.rope-coil","rope-coil",portable.ropeCoil()),
      item("ritual.censer","censer",ritual.censer()),
      item("ritual.floor-cushion","floor-cushion",ritual.floorCushion()),
      item("ritual.jar-stand","jar-stand",ritual.jarStand()),
    ],
  };
};
