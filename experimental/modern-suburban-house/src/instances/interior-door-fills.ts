/**
 * Place the eleven reviewed interior leaves on the environment's actual door
 * voids. The opening and boundary owner supplies the position, width, wall
 * depth and storey height; the instance owner supplies the room-facing yaw.
 */
import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { InteriorDoor } from "../models/interior-door";

type DoorPrototype = ReturnType<InteriorDoor["build"]>;
type Placement = { id: string; modelId: string; transform: IAutoMovieMeshTransform };

/** Outward +Z points into the room where each reviewed door opens. */
const ROOM_YAW: Readonly<Record<string, number>> = {
  "laundry-garage-door": -Math.PI / 2,
  "entry-living-door": -Math.PI / 2,
  "service-powder-door": Math.PI / 2,
  "service-laundry-door": Math.PI / 2,
  "service-pantry-door": Math.PI / 2,
  "hall-primary-door": Math.PI,
  "primary-wardrobe-door": -Math.PI / 2,
  "hall-bedroom-two-door": 0,
  "hall-bedroom-three-door": Math.PI / 2,
  "hall-shower-door": Math.PI,
  "hall-tub-door": Math.PI / 2,
};

const EXTERIOR_DOORS = new Set([
  "front-door",
  "garage-front-door",
  "garden-door",
]);
const OPEN_PASSAGES = [
  "living-common-opening",
  "service-common-opening",
] as const;
const TOLERANCE = 1e-7;

/** One model and one unit-scale placement for each interior door opening. */
export class InteriorDoorFills {
  public build(environment: IAutoMovieBuiltEnvironment): {
    prototypes: DoorPrototype[];
    instances: Placement[];
  } {
    const allDoors = environment.openings.filter(
      (opening) => opening.kind === "door",
    );
    const seen = new Set(allDoors.map((opening) => opening.id));
    const expected = Object.keys(ROOM_YAW);
    if (seen.size !== allDoors.length || seen.size !== expected.length + EXTERIOR_DOORS.size ||
      expected.some((id) => !seen.has(id)) || [...EXTERIOR_DOORS].some((id) => !seen.has(id)))
      throw new Error(
        "interior door opening population differs from reviewed assignments",
      );
    for (const id of OPEN_PASSAGES) {
      const matches = environment.openings.filter(
        (opening) => opening.id === id,
      );
      if (matches.length !== 1 || matches[0]!.kind !== "opening" || matches[0]!.fill !== null)
        throw new Error(`open passage must remain empty: ${id}`);
    }
    const boundaries = new Map(
      environment.boundaries.map((boundary) => [boundary.id, boundary]),
    );
    const builder = new InteriorDoor();
    const prototypes: DoorPrototype[] = [];
    const instances: Placement[] = [];
    for (const opening of allDoors) {
      const yaw = ROOM_YAW[opening.id];
      if (yaw === undefined) continue;
      const face = boundaries.get(opening.boundary)?.face;
      const outline = opening.profile?.outline;
      if (face === undefined || outline === undefined || outline.length !== 4)
        throw new Error(
          `interior door has no rectangular wall host: ${opening.id}`,
        );
      const values = outline.map((point) => point.x);
      const heights = outline.map((point) => point.y);
      const u0 = Math.min(...values), u1 = Math.max(...values);
      const bottom = Math.min(...heights), top = Math.max(...heights);
      const axisAligned = outline.every((point,index)=>{
        const next=outline[(index+1)%outline.length]!;
        const dx=Math.abs(next.x-point.x),dy=Math.abs(next.y-point.y);
        return (dx>TOLERANCE && dy<TOLERANCE) || (dy>TOLERANCE && dx<TOLERANCE);
      });
      if (![u0,u1,bottom,top].every(Number.isFinite) || u1-u0 <= 0 ||
        Math.abs(top-bottom-2.20) > TOLERANCE || !axisAligned ||
        [u0,u1].some((x)=>[bottom,top].some((y)=>
          !outline.some((point)=>Math.abs(point.x-x)<TOLERANCE &&
            Math.abs(point.y-y)<TOLERANCE))))
        throw new Error(
          `interior door outline disagrees with reviewed opening: ${opening.id}`,
        );
      const q = face.rotation;
      if (![face.origin.x,face.origin.y,face.origin.z,q.x,q.y,q.z,q.w].every(Number.isFinite) ||
        Math.abs(q.x)>TOLERANCE || Math.abs(q.z)>TOLERANCE ||
        Math.abs(Math.hypot(q.y,q.w)-1)>TOLERANCE)
        throw new Error(
          `interior door host is not a level wall: ${opening.id}`,
        );
      const hostYaw = 2*Math.atan2(q.y,q.w);
      const tangent = { x: Math.cos(hostYaw), z: -Math.sin(hostYaw) };
      const normal = { x: Math.sin(hostYaw), z: Math.cos(hostYaw) };
      const room = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const alignment = normal.x*room.x + normal.z*room.z;
      if (Math.abs(Math.abs(alignment)-1)>TOLERANCE)
        throw new Error(`interior door host faces wrong axis: ${opening.id}`);
      const center = (u0+u1)/2;
      const translation = {
        x: face.origin.x + tangent.x*center + room.x*face.thickness/2,
        y: face.origin.y + bottom,
        z: face.origin.z + tangent.z*center + room.z*face.thickness/2,
      };
      const built = builder.build({
        id:opening.id,
        width:u1-u0,
        wallThickness:face.thickness,
      });
      prototypes.push(built);
      instances.push({
        id:`fill:${opening.id}`,
        modelId:built.model.id,
        transform:{
          translation,
          rotation:{ x:0, y:Math.sin(yaw/2), z:0, w:Math.cos(yaw/2) },
        },
      });
    }
    return { prototypes, instances };
  }
}
