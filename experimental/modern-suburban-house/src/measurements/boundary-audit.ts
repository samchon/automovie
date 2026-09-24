/**
 * Pure fixtures for the space-boundary segment producer.
 *
 * `space-audit.ts` calls this before measuring the actual house. Fixtures use
 * two adjacent convex cells, a spanning cell, and a stepped outline rather
 * than values copied from the current house. They pin side assignment, the
 * world X/Z axis change, a one-sided envelope, omission of a non-separating
 * face, and clipping of a wall outline. No mesh or second boundary is made.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";

import { clipOutline, segmentsOf } from "../spaces/boundaries";
import type { IWallFace, IWallPoint } from "../spaces/solids";

type Range = readonly [number, number];

const room = (id: string, x: Range, y: Range, z: Range): IAutoMovieBuiltSpace => ({
  id,
  kind: "room",
  parent: "ground-storey",
  cells: [{
    id: `${id}/0`,
    planes: [
      { normal: { x: 1, y: 0, z: 0 }, offset: x[1] },
      { normal: { x: -1, y: 0, z: 0 }, offset: -x[0] },
      { normal: { x: 0, y: 1, z: 0 }, offset: y[1] },
      { normal: { x: 0, y: -1, z: 0 }, offset: -y[0] },
      { normal: { x: 0, y: 0, z: 1 }, offset: z[1] },
      { normal: { x: 0, y: 0, z: -1 }, offset: -z[0] },
    ],
  }],
});

const rectangle: IWallPoint[] = [
  { u: 0, y: 0 }, { u: 2, y: 0 }, { u: 2, y: 2 }, { u: 0, y: 2 },
];

const face = (axis: "x" | "z", outline: readonly IWallPoint[] = rectangle): IWallFace => ({
  axis,
  across: [-0.1, 0.1],
  outline,
  holes: [{ id: "door", from: 0.5, to: 1.5, bottom: 0, top: 1.2 }],
});

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`boundary segment fixture: ${message}`);
};

/** Run the positive, negative, and boundary fixtures used by the house audit. */
export const verifyBoundarySegments = (): void => {
  const west = room("west", [0, 2], [0, 2], [-1, -0.1]);
  const east = room("east", [0, 2], [0, 2], [0.1, 1]);
  const alongX = segmentsOf([west, east], face("x"));
  assert(alongX.length === 1, "adjacent rooms did not yield one merged X-face segment");
  assert(alongX[0]!.sides[0] === "west" && alongX[0]!.sides[1] === "east", "X-face side IDs or sign are wrong");
  assert(alongX[0]!.u[0] === 0 && alongX[0]!.u[1] === 2 && alongX[0]!.y[1] === 2, "void cuts changed the room boundary extent");

  const left = room("left", [-1, -0.1], [0, 2], [0, 2]);
  const right = room("right", [0.1, 1], [0, 2], [0, 2]);
  const alongZ = segmentsOf([left, right], face("z"));
  assert(alongZ.length === 1 && alongZ[0]!.sides[0] === "left" && alongZ[0]!.sides[1] === "right", "Z-face side assignment failed");

  const exposed = segmentsOf([west], face("x"));
  assert(exposed.length === 1 && exposed[0]!.sides[1] === "house-site", "a one-sided face lost the exterior side");
  const spanning = room("both", [0, 2], [0, 2], [-1, 1]);
  assert(segmentsOf([spanning], face("x")).length === 0, "a face inside one room became a boundary");

  const stepped: IWallPoint[] = [
    { u: 0, y: 0 }, { u: 2, y: 0 }, { u: 2, y: 1 },
    { u: 1, y: 1 }, { u: 1, y: 2 }, { u: 0, y: 2 },
  ];
  const result = segmentsOf([west, east], face("x", stepped));
  assert(result.length === 2, "a stepped face lost or filled its missing upper corner");
  assert(result.some((part) => part.u[0] === 0 && part.u[1] === 1 && part.y[1] === 2), "stepped upper boundary was not retained");

  const clipped = clipOutline(stepped, [0.5, 1.5], [0.5, 1.5]);
  assert(clipped.length >= 4, "clipping removed a nonempty stepped wall");
  assert(clipped.every((p) => p.u >= 0.5 && p.u <= 1.5 && p.y >= 0.5 && p.y <= 1.5), "clipping escaped its metric bounds");
  assert(clipOutline(rectangle, [3, 4], [0, 2]).length === 0, "a disjoint clip returned a face");
};
