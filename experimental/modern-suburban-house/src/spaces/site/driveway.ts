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
import { part } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import { DRIVE_DEPTH, seamRect } from "./paving";
import type { ISiteBuild } from "./zone";

/** Driveway extent, metres. */
/**
 * @evidence spaces/site/driveway.md DRIVEWAY fixes the widened garage-door strip and its front paving end.
 * @evidenceReview spaces/site/driveway.md #ab087eb DRIVEWAY takes both X limits from GARAGE_FRONT_DOOR with 0.2 added outside each jamb; its Z interval starts at GARAGE.outer.z[1] and ends at the front paving limit 6.5.
 * @evidence principles/core/source-units.md#source-scope-preservation The intervals reserve concrete paving only and contain no vehicle or off-site street geometry.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 DRIVEWAY exports only the garage-door-centred X limits and the wall-to-paving Z limits; it supplies no vehicle position or street extension beyond the site end.
 * @evidence principles/core/source-units.md#source-substantive-completion Fixed X/Z tuples give driveTop and the slab one repeatable plan.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f DRIVEWAY is a concrete pair of X and Z intervals; driveTop uses its Z ends, and buildDriveway uses the same intervals for the ramp zone and slab plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan widens garage-front-door by 0.20 m on each X side and runs from the garage outer front wall to the front paving end; DRIVEWAY imports the opening and wall.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The driveway-plan parent specifies a door-centred 0.20 m widening and the outer garage wall to paving-end reach; DRIVEWAY obtains the door opening and wall from their owners and exposed no missing boundary decision.
 */
export const DRIVEWAY = {
  x: [GARAGE_FRONT_DOOR.from - 0.2, GARAGE_FRONT_DOOR.to + 0.2] as const,
  z: [GARAGE.outer.z[1], 6.5] as const,
};

/** Driveway top at Z. */
/**
 * @evidence spaces/site/driveway.md driveTop interpolates the drive's single longitudinal ramp between garage and front-walk heights.
 * @evidenceReview spaces/site/driveway.md #ab087eb driveTop normalizes its Z argument over DRIVEWAY.z and linearly blends STOREYS.garageFloor with STOREYS.frontWalk, matching the parent's longitudinal D(Z) with no X-dependent grade.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads STOREYS as a value import and changes no cross-slope or garage datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 driveTop reads the existing STOREYS.garageFloor and STOREYS.frontWalk values at the two DRIVEWAY.z ends; it changes neither datum and introduces no lateral slope.
 * @evidence principles/core/source-units.md#source-substantive-completion The affine expression gives a deterministic top Y for every Z along the drive.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f For each Z input, driveTop computes one normalized fraction and returns its weighted endpoint height without mutable state, so the slab and ramp zone receive the same deterministic height rule.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan interpolates the garage finished floor to the front-walk height over its authored Z reach and forbids a lateral grade; driveTop applies that one formula.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The driveway-plan parent fixes linear height between the garage and walk at the two authored Z ends and forbids cross slope; driveTop implements that expression without needing a new parent height or grade decision.
 */
export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};

/** Emit the driveway slab. */
/**
 * @evidence spaces/site/driveway.md This builder returns the sloped driveway solid and its exterior standing zone.
 * @evidenceReview spaces/site/driveway.md #ab087eb buildDriveway returns a driveway zone over DRIVEWAY's rectangle and one paving part whose slopedSlab uses seamRect at the front and side connector ends; neither return value adds a vehicle.
 * @evidence spaces/site/driveway.md#driveway-plan The slab follows driveTop from garage threshold to paving end, while anchors record both ramp endpoints.
 * @evidenceReview spaces/site/driveway.md#driveway-plan #7dd0623 The part's slopedSlab evaluates driveTop(z), while the zone's anchor and rampTo evaluate the same function at opposite DRIVEWAY.z ends; both follow the authored garage-to-walk ramp.
 * @evidence principles/core/source-units.md#source-scope-preservation It leaves cars absent and uses the shared DRIVE_DEPTH rather than inventing a concrete base.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildDriveway emits only one paving part and its zone, imports DRIVE_DEPTH for the base, and has no car or parking-marking part outside the driveway-plan scope.
 * @evidence principles/core/source-units.md#source-substantive-completion One stable paving part and ramped zone are returned in a fixed structure.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildDriveway supplies both the slopedSlab mesh plan and the zone's two height anchors in a fixed ISiteBuild result; consumers need no missing ramp or zone implementation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan fixes the door-centred width and two height endpoints, while paving-depth-reservation assigns a 0.15 m base; buildDriveway emits that sloped slab and its matching zone.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The driveway-plan parent fixes the door width, two ramp heights and connector sides, and paving-depth-reservation fixes its base depth; buildDriveway consumes those values for its slab and matching zone without exposing a missing parent rule.
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
