/**
 * Open courtyard and fountain consumer inputs from docs/spaces/rooms/courtyard.md#court-volume.
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

/**
 * @evidence spaces/rooms/courtyard.md Defines the courtyard plan by four west/east-court and court-back/front datums.
 * @evidence principles/core/source-units.md#source-scope-preservation Defines the plan only through the datums.
 * @evidence principles/core/source-units.md#source-substantive-completion The as const rectangle gives floors, cells and fountain centre the same plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the 7.0×7.85m courtyard range of rooms/courtyard.md unchanged.
 */
export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;

/**
 * Lower solid floor of the open courtyard, without separate artificial ground beneath the fountain.
 * @evidence spaces/rooms/courtyard.md Emits the courtyard floor as a slab finished at -0.12m.
 * @evidence principles/core/source-units.md#source-scope-preservation Adds no separate ground below the fountain; courtyard height comes from the storey.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one floor-compartment input; the 0.12m difference from the colonnade floor appears as a step in irregular-grid faces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the courtyard -0.12m of rooms/courtyard.md and storey.md unchanged.
 */
export const templeCourtyardFloor = () => roomFloorInput(
  "courtyard", [{ ...templeCourtyardPlan, id: "body", floor: y.courtyard }],
  [], y.slabThickness, y.floor,
);

/**
 * Continuous stone-step surface ownership of docs/spaces/rooms/courtyard.md#court-volume.
 * Assigns the colonnade slab's courtyard-facing vertical end to the courtyard
 * without copying it. Selects only faces matching actual input coordinates and excludes buried lower faces.
 * @evidence spaces/rooms/courtyard.md Assigns the exposed courtyard-facing vertical ends of colonnade slabs (stone steps) to courtyard surface ownership.
 * @evidence principles/core/source-units.md#source-scope-preservation Selects only colonnade sides matching actual input coordinates (four courtyard boundaries, heights -0.12~0), excludes buried faces and duplicates none.
 * @evidence principles/core/source-units.md#source-substantive-completion Takes one face and returns ownership as a boolean; floor assembly changes its surface to courtyard.floor.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements continuous stone-step ownership from rooms/courtyard.md#court-volume unchanged.
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

/**
 * @evidence spaces/rooms/courtyard.md Emits the courtyard space record (id courtyard) as one exact cell.
 * @evidence spaces/rooms/courtyard.md#court-volume Uses a finite logical range from finished floor -0.12m to colonnade eave-support height 3.20m, making no ceiling or shadow face.
 * @evidence principles/core/source-units.md#source-scope-preservation Does not turn the logical cap into sky-blocking geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one single-cell space; observation centres and corners use this cell for containment.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the range and two heights of rooms/courtyard.md#court-volume unchanged.
 */
export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.courtEave)],
});

/**
 * Arithmetic centre of room boundaries and member inputs in m, without proving a completed fountain.
 * @evidence spaces/rooms/courtyard.md Emits metre-valued consumer inputs: basin centre at the courtyard's arithmetic midpoint, outer diameter 2.0m, rim 0.52m, water 0.08m below and jet 0.65m.
 * @evidence principles/core/source-units.md#source-scope-preservation Makes no basin geometry; returns only inputs for later models/systems.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns calculated centre coordinates and four heights so consumers do not choose dimensions again.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the fountain dimensions of rooms/courtyard.md#court-volume unchanged.
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
