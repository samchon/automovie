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
 * @evidenceReview spaces/site/driveway.md #ab087eb driveway.ts:27-30 x = GARAGE_FRONT_DOOR.from-0.2 / .to+0.2, z = [GARAGE.outer.z[1], 6.5]; driveway.md:27 (rough door opening +0.20 m each side; back = garage-front-door outer wall face; front = paving end).
 * @evidence principles/core/source-units.md#source-scope-preservation The intervals reserve concrete paving only and contain no vehicle or off-site street geometry.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 DRIVEWAY (driveway.ts:27-30) holds only X/Z intervals; driveway.ts creates no vehicle or street geometry; driveway.md:31 forbids vehicles and leaves the outside connection to the map/space interface.
 * @evidence principles/core/source-units.md#source-substantive-completion Fixed X/Z tuples give driveTop and the slab one repeatable plan.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f DRIVEWAY is resolved once at module load (driveway.ts:27-30); driveTop :40, slab plan :77-82 and zone :57-67 read the same tuples.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan widens garage-front-door by 0.20 m on each X side and runs from the garage outer front wall to the front paving end; DRIVEWAY imports the opening and wall.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 driveway.md:27 X = rough opening +0.20 m each side, back = garage-front-door outer wall face, front = paving end; envelope/front.md garage-front-opening rough X=[6.10,11.10], wall Z=[-0.55,-0.30]; driveway.ts:13-14,28-29 import GARAGE_FRONT_DOOR and GARAGE (outer.z[1]=-0.3, building.ts:48).
 */
export const DRIVEWAY = {
  x: [GARAGE_FRONT_DOOR.from - 0.2, GARAGE_FRONT_DOOR.to + 0.2] as const,
  z: [GARAGE.outer.z[1], 6.5] as const,
};

/** Driveway top at Z. */
/**
 * @evidence spaces/site/driveway.md driveTop interpolates the drive's single longitudinal ramp between garage and front-walk heights.
 * @evidenceReview spaces/site/driveway.md #ab087eb v-141 driveway.ts:34-37 u=(z-z0)/(z1-z0), (1-u)*STOREYS.garageFloor + u*STOREYS.frontWalk; driveway.md:29 D(Z) linear between garage floor Y and front walk Y, no cross slope.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads STOREYS as a value import and changes no cross-slope or garage datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 driveway.ts:14 imports STOREYS, :36 reads garageFloor/frontWalk (storeys.ts:36,42) read-only; the function has no X term (no cross slope).
 * @evidence principles/core/source-units.md#source-substantive-completion The affine expression gives a deterministic top Y for every Z along the drive.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 driveway.ts:35-36 affine in z, pure.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan interpolates the garage finished floor to the front-walk height over its authored Z reach and forbids a lateral grade; driveTop applies that one formula.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 driveway.md:29 u=(Z-door outer Z)/(paving end Z-door outer Z), D(Z)=(1-u)·garage floor+u·front walk, "측방 경사는 추가하지 않는다"; driveway.ts:39-42 u over DRIVEWAY.z, STOREYS.garageFloor to STOREYS.frontWalk, no X term.
 */
export const driveTop = (z: number): number => {
  const u = (z - DRIVEWAY.z[0]) / (DRIVEWAY.z[1] - DRIVEWAY.z[0]);
  return (1 - u) * STOREYS.garageFloor + u * STOREYS.frontWalk;
};

/** Emit the driveway slab. */
/**
 * @evidence spaces/site/driveway.md This builder returns the sloped driveway solid and its exterior standing zone.
 * @evidenceReview spaces/site/driveway.md #ab087eb driveway.ts:52-88 returns one slopedSlab part 'driveway' and one zone 'driveway'; driveway.md:27,33 (drive surface/edge owner = driveway.ts).
 * @evidence spaces/site/driveway.md#driveway-plan The slab follows driveTop from garage threshold to paving end, while anchors record both ramp endpoints.
 * @evidenceReview spaces/site/driveway.md#driveway-plan #7dd0623 Slab top (_x,z)=>driveTop(z) over DRIVEWAY.z (driveway.ts:76-85); zone anchor y=driveTop(z[0]) (:58-62) and rampTo y=driveTop(z[1]) (:63-67); driveway.md:29.
 * @evidence principles/core/source-units.md#source-scope-preservation It leaves cars absent and uses the shared DRIVE_DEPTH rather than inventing a concrete base.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 No vehicle part in driveway.ts; thickness: DRIVE_DEPTH (driveway.ts:84) imported from paving.ts:33.
 * @evidence principles/core/source-units.md#source-substantive-completion One stable paving part and ramped zone are returned in a fixed structure.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f parts = one 'driveway' part (driveway.ts:71-86); zones = one 'driveway' zone with rampTo (:54-68); literal ids, fixed object shape.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Driveway-plan fixes the door-centred width and two height endpoints, while paving-depth-reservation assigns a 0.15 m base; buildDriveway emits that sloped slab and its matching zone.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 driveway.md:27 (opening +0.20 each side, "문과 다른 중심을 따로 저작하지 않는다"), :29 two end heights; 01-paving-support.md:25 driveway 0.15 m base; driveway.ts:52-88 emits the slopedSlab (thickness DRIVE_DEPTH) and its ramp zone.
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
