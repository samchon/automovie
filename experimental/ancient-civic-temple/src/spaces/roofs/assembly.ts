/**
 * Roof composition The wing
 * unit (west mono-pitch, north/south colonnade mono-pitch and east gable) retains
 * only the highest overlapping top, forming valleys at the courtyard's four
 * inner corners. Sanctuary and porch are separate units whose eaves float over
 * wing roofs without erasing lower faces. Patches preserve their original
 * owner, surface, tier and vertical thickness.
 */
import { clipPlan, partitionPlan, simplifyPlan, type RoofPatch } from "../../geometry/planar-domain";
import type { RoofRules } from "../../geometry/roof-planes";
import { templeColonnadeRoof } from "./colonnade";
import { templeEastRoof } from "./east";
import { templePorchRoof } from "./porch";
import { templeSanctuaryRoof } from "./sanctuary";
import { templeWestRoof } from "./west";

/**
 * Heights, thickness and projection use m; slopes use rad. Open-yard logical caps consume courtEave.
 */
export const templeRoofRules: RoofRules = {
  courtEave: 3.2,
  leanSlope: 12 * Math.PI / 180,
  gableSlope: 22 * Math.PI / 180,
  eastGableSlope: 19 * Math.PI / 180,
  normalThickness: 0.18,
  overhang: 0.35,
  eastWallSupport: 3.55,
  sanctuarySupport: 5.35,
  porchSupport: 4,
};

/**
 * Composes the wing unit and appends sanctuary/porch units without mutating input candidates.
 */
export const templeRoofEnvelope = (): RoofPatch[] => [
  ...composeHighest([
    ...templeWestRoof(templeRoofRules),
    ...templeColonnadeRoof(templeRoofRules),
    ...templeEastRoof(templeRoofRules),
  ]),
  ...templeSanctuaryRoof(templeRoofRules),
  ...templePorchRoof(templeRoofRules),
];

/** Declaration order breaks equal-height ties; overlaps retain only the highest top. */
const composeHighest = (candidates: readonly RoofPatch[]): RoofPatch[] =>
  candidates.flatMap((candidate, index) => {
    let pieces = [candidate.polygon];
    candidates.forEach((other, otherIndex) => {
      if (otherIndex === index) return;
      const difference = {
        x: candidate.height.x - other.height.x,
        z: candidate.height.z - other.height.z,
        constant: candidate.height.constant - other.height.constant,
      };
      const coplanar = Math.max(
        Math.abs(difference.x), Math.abs(difference.z), Math.abs(difference.constant),
      ) < 1e-9;
      pieces = pieces.flatMap((piece) => {
        const { inside, outside } = partitionPlan(piece, other.polygon);
        if (inside.length === 0) return outside;
        const retained = coplanar
          ? index < otherIndex ? inside : []
          : clipPlan(inside, difference);
        return retained.length === 0 ? outside : [...outside, retained];
      });
    });
    return pieces.map(simplifyPlan).filter((polygon) => polygon.length > 0).map((polygon, part) => ({
      ...candidate, polygon, id: `${candidate.id}.piece-${part}`,
    }));
  });
