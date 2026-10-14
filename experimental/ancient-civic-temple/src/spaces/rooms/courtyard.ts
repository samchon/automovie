/**
 * Open courtyard and fountain consumer inputs
 * Finite cell caps assign observations; they are not ceiling meshes, shadows or clipping.
 * Later prototypes/systems own the basin and jet; this owner copies no geometry.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { FloorBoundaryFace } from "../../geometry/floor-faces";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";
export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;

/**
 * Lower solid floor of the open courtyard, without separate artificial ground beneath the fountain.
 */
export const templeCourtyardFloor = () => roomFloorInput(
  "courtyard", [{ ...templeCourtyardPlan, id: "body", floor: y.courtyard }],
  [], y.slabThickness, y.floor,
);

/**
 * Continuous stone-step surface ownership
 * Assigns the colonnade slab's courtyard-facing vertical end to the courtyard
 * without copying it. Selects only faces matching actual input coordinates and excludes buried lower faces.
 */
export const templeCourtyardOwnsCurb = (face: FloorBoundaryFace): boolean => {
  if (face.space !== "colonnade" || face.direction === "top" || face.direction === "bottom") return false;
  const withinHeight = face.corners.every((v) => v.y >= y.courtyard && v.y <= y.floor);
  if (!withinHeight) return false;
  const onX = (x: number) => face.corners.every((v) =>
    v.x === x && v.z >= p.courtBack && v.z <= p.courtFront,
  );
  const onZ = (z: number) => face.corners.every((v) =>
    v.z === z && v.x >= p.westCourt && v.x <= p.eastCourt,
  );
  return onX(p.westCourt) || onX(p.eastCourt) || onZ(p.courtBack) || onZ(p.courtFront);
};
export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.courtEave)],
});

/**
 * Arithmetic centre of room boundaries and member inputs in m, without proving a completed fountain.
 */
export const templeFountainInputs = () => {
  const rimHeight = y.courtyard + 0.52;
  const waterHeight = rimHeight - 0.08;
  return {
    center: { x: (templeCourtyardPlan.west + templeCourtyardPlan.east) / 2, y: y.courtyard,
      z: (templeCourtyardPlan.north + templeCourtyardPlan.south) / 2 },
    outerDiameter: 2,
    rimHeight,
    waterHeight,
    jetTop: waterHeight + 0.65,
  };
};
