/**
 * Builds the boundary faces of orthogonal floor compartments whose interiors do not overlap.
 * A non-uniform grid split only at input end lines and heights gives exact face joints, and
 * interior contact faces are not emitted. There is no fixed-resolution sampling or input mesh change.
 * Faces are convex quads in world m with outward winding. Every end point and the original IDs of
 * the physical compartments and spaces are kept so the engine can build normals and UVs.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { FloorInput } from "./FloorInput";
import type { FloorSlab } from "./FloorSlab";
import { FloorBoundaryFace } from "./FloorBoundaryFace";

interface Occupant {
  floor: FloorInput;
  slab: FloorSlab;
}

/**
 * Reads all rooms together so the interior faces between touching floors are removed too.
 * Positive volume overlap, empty input, duplicate IDs, non-finite values and reversed ranges are refused.
 * Whether the result is closed or non-manifold is measured later by the engine topology census.
 */
export const floorBoundaryFaces = (inputs: readonly FloorInput[]): FloorBoundaryFace[] => {
  const solids = inputs.flatMap((floor) => floor.slabs.map((slab) => ({ floor, slab })));
  if (solids.length === 0) throw new Error("floor: there is no floor solid input.");
  const spaces = new Set<string>();
  for (const floor of inputs) {
    if (spaces.has(floor.space) || floor.slabs.length === 0) {
      throw new Error(`${floor.space}/floor: duplicate owner or empty floor.`);
    }
    spaces.add(floor.space);
    const ids = new Set<string>();
    for (const slab of floor.slabs) {
      if (ids.has(slab.id)) throw new Error(`${floor.space}/floor: duplicate compartment ${slab.id}`);
      ids.add(slab.id);
      if (![slab.west, slab.east, slab.north, slab.south, slab.bottom, slab.floor].every(Number.isFinite) ||
          slab.west >= slab.east || slab.north >= slab.south || slab.bottom >= slab.floor) {
        throw new Error(`${floor.space}/floor/${slab.id}: a finite positive solid range is required.`);
      }
    }
  }
  const xs = orderedCoordinates(solids.flatMap(({ slab }) => [slab.west, slab.east]));
  const ys = orderedCoordinates(solids.flatMap(({ slab }) => [slab.bottom, slab.floor]));
  const zs = orderedCoordinates(solids.flatMap(({ slab }) => [slab.north, slab.south]));
  const occupied = new Map<string, Occupant>();
  for (let x = 0; x < xs.length - 1; ++x) {
    for (let y = 0; y < ys.length - 1; ++y) {
      for (let z = 0; z < zs.length - 1; ++z) {
        const cx = (xs[x]! + xs[x + 1]!) / 2;
        const cy = (ys[y]! + ys[y + 1]!) / 2;
        const cz = (zs[z]! + zs[z + 1]!) / 2;
        const matches = solids.filter(({ slab }) =>
          cx > slab.west && cx < slab.east && cz > slab.north && cz < slab.south &&
          cy > slab.bottom && cy < slab.floor,
        );
        if (matches.length > 1) {
          throw new Error(`floor: ${matches.map(({ floor, slab }) => `${floor.space}/${slab.id}`).join(", ")} overlap in volume`);
        }
        if (matches[0] !== undefined) occupied.set(key(x, y, z), matches[0]);
      }
    }
  }
  const faces: FloorBoundaryFace[] = [];
  for (const [address, owner] of occupied) {
    const [x, y, z] = address.split(",").map(Number);
    if (x === undefined || y === undefined || z === undefined) throw new Error("floor: grid address error");
    const x0 = xs[x]!, x1 = xs[x + 1]!;
    const y0 = ys[y]!, y1 = ys[y + 1]!;
    const z0 = zs[z]!, z1 = zs[z + 1]!;
    const v = (px: number, py: number, pz: number): IAutoMovieVector3 => ({ x: px, y: py, z: pz });
    const sides: Array<{
      direction: FloorBoundaryFace["direction"];
      neighbor: string;
      corners: IAutoMovieVector3[];
    }> = [
      { direction: "west", neighbor: key(x - 1, y, z), corners: [v(x0,y0,z0),v(x0,y0,z1),v(x0,y1,z1),v(x0,y1,z0)] },
      { direction: "east", neighbor: key(x + 1, y, z), corners: [v(x1,y0,z0),v(x1,y1,z0),v(x1,y1,z1),v(x1,y0,z1)] },
      { direction: "bottom", neighbor: key(x, y - 1, z), corners: [v(x0,y0,z0),v(x1,y0,z0),v(x1,y0,z1),v(x0,y0,z1)] },
      { direction: "top", neighbor: key(x, y + 1, z), corners: [v(x0,y1,z0),v(x0,y1,z1),v(x1,y1,z1),v(x1,y1,z0)] },
      { direction: "north", neighbor: key(x, y, z - 1), corners: [v(x0,y0,z0),v(x0,y1,z0),v(x1,y1,z0),v(x1,y0,z0)] },
      { direction: "south", neighbor: key(x, y, z + 1), corners: [v(x0,y0,z1),v(x1,y0,z1),v(x1,y1,z1),v(x0,y1,z1)] },
    ];
    for (const side of sides) {
      if (occupied.has(side.neighbor)) continue;
      faces.push({
        id: `${owner.floor.space}.${owner.slab.id}.${address}.${side.direction}`,
        space: owner.floor.space, slab: owner.slab.id, surface: owner.floor.surface,
        direction: side.direction, corners: side.corners,
      });
    }
  }
  return faces;
};

/** Does not move input coordinates. A solid of floating-point residual size is refused. */
const orderedCoordinates = (values: number[]): number[] => {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; ++i) {
    if (sorted[i]! - sorted[i - 1]! < 1e-9) {
      throw new Error("floor: distinct end lines closer than the numeric limit.");
    }
  }
  return sorted;
};

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
