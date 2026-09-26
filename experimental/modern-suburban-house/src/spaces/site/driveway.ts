/**
 * `driveway`: the concrete drive rising to the garage threshold.
 *
 * Design owner: `docs/spaces/site/driveway.md#driveway-plan`. X is the garage
 * door's rough opening X = [6.10, 11.10] widened by 0.20 m on each side:
 * [5.90, 11.30]. It runs from the garage front outer face Z = -0.30 to the
 * paving end Z = 6.50 (site/00-access). Its top blends the garage floor
 * −0.15 m to the front walk datum −0.45 m with no cross slope:
 * D(Z) = (1 − u) × (−0.15) + u × (−0.45), u = (Z + 0.30) / 6.80. Base 0.15 m.
 * No vehicle is authored.
 */
import { PALETTE } from "../palette";
import { GARAGE_FRONT_DOOR } from "../envelope/front";
import { GARAGE } from "../building";
import { part, rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import { DRIVE_DEPTH, seamRect } from "./paving";
import type { ISiteBuild } from "./zone";

/** Driveway extent, metres. */
/**
 * @evidence spaces/site/driveway.md DRIVEWAY fixes the widened garage-door strip and its front paving end.
 * @evidence principles/core/source-units.md#source-scope-preservation The intervals reserve concrete paving only and contain no vehicle or off-site street geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Fixed X/Z tuples give driveTop and the slab one repeatable plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The driveway parent specifies the widened opening and Z end, so the plan needed no additional road edge.
 */
export const DRIVEWAY = {
  x: [GARAGE_FRONT_DOOR.from - 0.2, GARAGE_FRONT_DOOR.to + 0.2] as const,
  z: [GARAGE.outer.z[1], 6.5] as const,
};

/** Driveway top at Z. */
/**
 * @evidence spaces/site/driveway.md driveTop interpolates the drive's single longitudinal ramp between garage and front-walk heights.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads STOREYS as a value import and changes no cross-slope or garage datum.
 * @evidence principles/core/source-units.md#source-substantive-completion The affine expression gives a deterministic top Y for every Z along the drive.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The driveway parent supplies both end heights and ramp length; no extra grade was selected.
 */
export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};

/** Emit the driveway slab. */
/**
 * @evidence spaces/site/driveway.md This builder returns the sloped driveway solid and its exterior standing zone.
 * @evidence spaces/site/driveway.md#driveway-plan The slab follows driveTop from garage threshold to paving end, while anchors record both ramp endpoints.
 * @evidence principles/core/source-units.md#source-scope-preservation It leaves cars absent and uses the shared DRIVE_DEPTH rather than inventing a concrete base.
 * @evidence principles/core/source-units.md#source-substantive-completion One stable paving part and ramped zone are returned in a fixed structure.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The driveway parent fixes width, gradient endpoints, and base depth; this builder needed no new site contact.
 */
export const buildDriveway = (frontConnectorZ: readonly [number, number], sideConnectorZ: readonly [number, number]): ISiteBuild => ({
  zones: [
    {
      id: "driveway",
      owner: "site/driveway.ts",
      outline: rect(DRIVEWAY.x, DRIVEWAY.z),
      anchor: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[0]),
        z: DRIVEWAY.z[0],
      },
      rampTo: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[1]),
        z: DRIVEWAY.z[1],
      },
    },
  ],
  parts: [
    part(
      "driveway",
      "site/driveway.ts",
      "paving",
      PALETTE.concrete,
      slopedSlab({
        plan: seamRect(
          DRIVEWAY.x,
          DRIVEWAY.z,
          [frontConnectorZ],
          [sideConnectorZ],
        ),
        top: (_x, z) => driveTop(z),
        thickness: DRIVE_DEPTH,
      }),
    ),
  ],
});
