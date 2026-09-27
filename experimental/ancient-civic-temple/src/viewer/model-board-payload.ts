/**
 * The neutral review population consumes the actual model source classes.
 * It records design addresses and named size/pose variants without copying
 * their meshes. The browser receives the current source result verbatim.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import {
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { TempleColumns } from "../models/columns";
import { TempleEntablature } from "../models/entablature";
import { TempleOpenings } from "../models/openings";
import { TempleCladding } from "../models/cladding";
import { TempleFixtures } from "../models/fixtures";
import { TempleWares } from "../models/wares";
import { TempleLandscape } from "../models/landscape";
import { TemplePortable } from "../models/portable";
import { TempleRitual } from "../models/ritual";
import { templeDoorPassages } from "../spaces/openings";

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
      "models/openings.md#door-frame",
      openings.doorFrame(door.id),
    ),
  );
  const doubleDoors=(["door-entry","door-sanctuary"] as const).flatMap((door)=>
    (["closed","open"] as const).map((state)=>
      item(
        `double.${door}.${state}`,
        "models/openings.md#double-door-leaf",
        openings.doubleLeaf(door, state),
      ),
    ),
  );
  const singleDoors=(["door-offering","door-administration","door-records",
    "door-storage","door-yard","door-service-exterior"] as const).flatMap((door)=>
    (["closed","open"] as const).map((state)=>item(`single.${door}.${state}`,
      "models/openings.md#single-door-leaf",openings.singleLeaf(door,state))));
  return {
    models:[
      ...([12,19] as const).map((angle)=>item(`column.colonnade.${angle}`,
        "models/columns.md#colonnade-column",columns.colonnade(angle))),
      item("column.porch","models/columns.md#porch-column",columns.porch()),
      ...(["north","south","east","west"] as const).map((side)=>item(`beam.${side}`,
        "models/entablature.md#colonnade-beam",beams.colonnadeBeam(side))),
      item("rafter.12.sample","models/entablature.md#rafter",beams.rafter(12,1,"colonnade-12-sample")),
      item("rafter.19.sample","models/entablature.md#rafter",beams.rafter(19,1,"colonnade-19-sample")),
      ...beams.sanctuaryRafters().map((model)=>item(model.id,
        "models/entablature.md#rafter",model)),
      item("entablature.porch","models/entablature.md#porch-entablature",beams.porch()),
      item("truss.sanctuary","models/entablature.md#sanctuary-truss",beams.sanctuaryTruss()),
      item("joist.room","models/entablature.md#ceiling-joist",beams.ceilingJoist()),
      ...doors,...doubleDoors,...singleDoors,
      ...([0.30,0.60] as const).map((thickness)=>item(`window.${thickness}`,
        "models/openings.md#window-frame",openings.windowFrame(thickness))),
      item("tile.roof","models/cladding.md#roof-tile",cladding.roofTile()),
      item("tile.roof.3x3","models/cladding.md#roof-tile",
        repeated(cladding.roofTile(),Array.from({ length:9 },(_,i)=>
          [(i%3-1)*0.40,Math.floor(i/3)*0.44] as const),"tile.roof.3x3")),
      ...([19,22] as const).map((angle)=>item(`tile.ridge.${angle}`,
        "models/cladding.md#ridge-tile",cladding.ridgeTile(angle))),
      ...([19,22] as const).map((angle)=>item(`tile.ridge.${angle}.three`,
        "models/cladding.md#ridge-tile",repeated(cladding.ridgeTile(angle),
          [[0,0],[0,0.40],[0,0.80]],`tile.ridge.${angle}.three`))),
      item("fixture.fountain","models/fixtures.md#fountain",fixtures.fountain()),
      item("fixture.altar","models/fixtures.md#altar",fixtures.altar()),
      item("fixture.niche","models/fixtures.md#niche",fixtures.niche()),
      item("fixture.lampstand","models/fixtures.md#lampstand",fixtures.lampstand()),
      item("fixture.offering-table","models/fixtures.md#offering-table",fixtures.offeringTable()),
      ...(["offering","administration"] as const).map((kind)=>item(`fixture.display-shelf.${kind}`,
        "models/fixtures.md#display-shelf",fixtures.displayShelf(kind))),
      ...(["writing","reading"] as const).map((kind)=>item(`fixture.desk.${kind}`,
        "models/fixtures.md#desk",fixtures.desk(kind))),
      item("fixture.stool","models/fixtures.md#stool",fixtures.stool()),
      item("fixture.scroll-shelf","models/fixtures.md#scroll-shelf",fixtures.scrollShelf()),
      item("fixture.chest","models/fixtures.md#chest",fixtures.chest()),
      item("ware.storage-jar","models/wares.md#storage-jar",wares.storageJar()),
      item("ware.carry-jar","models/wares.md#carry-jar",wares.carryJar()),
      item("ware.small-vessel","models/wares.md#small-vessel",wares.smallVessel()),
      item("ware.offering-bowl","models/wares.md#offering-bowl",wares.offeringBowl()),
      item("ware.basket","models/wares.md#basket",wares.basket()),
      ...(["rolled","bundle","open"] as const).map((state)=>item(`ware.scroll.${state}`,
        "models/wares.md#scroll",wares.scroll(state))),
      item("landscape.cypress","models/landscape.md#cypress",landscape.cypress()),
      item("landscape.broad-tree","models/landscape.md#broad-tree",landscape.broadTree()),
      item("landscape.grass-tuft","models/landscape.md#grass-tuft",landscape.grassTuft()),
      ...(["gable","shed"] as const).map((kind)=>item(`landscape.neighbor-house.${kind}`,
        "models/landscape.md#neighbor-house",landscape.neighborHouse(kind))),
      ...(["standard","short"] as const).map((kind)=>item(`portable.bench.${kind}`,
        "models/portable.md#bench",portable.bench(kind))),
      item("portable.lamp","models/portable.md#portable-lamp",portable.portableLamp()),
      item("portable.jar-rack","models/portable.md#jar-rack",portable.jarRack()),
      item("portable.carrying-yoke","models/portable.md#carrying-yoke",portable.carryingYoke()),
      item("portable.handcart","models/portable.md#handcart",portable.handcart()),
      item("portable.bucket","models/portable.md#bucket",portable.bucket()),
      item("portable.planter","models/portable.md#planter",portable.planter()),
      item("portable.votive-plaque","models/portable.md#votive-plaque",portable.votivePlaque()),
      item("portable.offering-tray","models/portable.md#offering-tray",portable.offeringTray()),
      ...(["standard","small"] as const).map((kind)=>item(`portable.textile.${kind}`,
        "models/portable.md#textile",portable.textile(kind))),
      item("portable.stylus","models/portable.md#stylus",portable.stylus()),
      item("portable.writing-tablet","models/portable.md#writing-tablet",portable.writingTablet()),
      item("portable.rope-coil","models/portable.md#rope-coil",portable.ropeCoil()),
      item("ritual.censer","models/ritual.md#censer",ritual.censer()),
      item("ritual.floor-cushion","models/ritual.md#floor-cushion",ritual.floorCushion()),
      item("ritual.jar-stand","models/ritual.md#jar-stand",ritual.jarStand()),
    ],
  };
};
