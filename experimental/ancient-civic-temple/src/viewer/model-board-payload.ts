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
    ],
  };
};
