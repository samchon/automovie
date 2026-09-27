/**
 * `front-walk`: the walk from the porch steps to the paving end, and its cross
 * connector to the driveway.
 *
 * Design owner: `docs/spaces/site/front-walk.md#front-walk-plan`. Width and
 * centre X follow the porch stair: X = [0.15, 1.65]. It starts at the first
 * porch riser Z = 2.80 (two 0.30 m treads in front of the porch edge 2.20) and
 * runs to the paving end Z = 6.50, level at the front walk datum −0.45 m, so it
 * contains the 1.20 m lower waiting in front of the steps. The cross connector
 * is Z = [4.25, 5.45] from the walk's right edge X = 1.65 to the driveway's left
 * edge X = 5.90, its top blending the walk height to D(Z) linearly in X. Base
 * 0.12 m (01-paving-support).
 */
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { driveTop, DRIVEWAY } from "./driveway";
import {
  blendedRun,
  pavingFreeEdge,
  pavingHeightfield,
  seamRect,
  WALK_DEPTH,
} from "./paving";
import {
  PORCH_STEP_CENTRE_X,
  PORCH_STEP_FRONT_Z,
  PORCH_STEP_HALF_WIDTH,
} from "../porch";

const OWNER = "site/front-walk.ts";

/** Front walk extent, metres. */
/**
 * @evidence spaces/site/front-walk.md The porch-axis path and its cross band have one plan record for slab, zone, and connector.
 * @evidenceReview spaces/site/front-walk.md #6ad7b42 FRONT_WALK (front-walk.ts:36-40) is read by the slab (:105), zone outline and patches (:60-100) and connector (:52,106-114).
 * @evidence spaces/site/front-walk.md#front-walk-plan X follows the porch-step centre, the inner Z follows its front riser, and the cross band keeps its reviewed Z limits.
 * @evidenceReview spaces/site/front-walk.md#front-walk-plan #a688486 front-walk.ts:37 x = PORCH_STEP_CENTRE_X ± PORCH_STEP_HALF_WIDTH; :38 z[0] = PORCH_STEP_FRONT_Z (porch.ts:69, 2.2+2×0.3 = first riser); :39 connectorZ [4.25,5.45] = front-walk.md:31; front-walk.md:29 width/centre consume the porch stair, inner Z from the first riser.
 * @evidence principles/core/source-units.md#source-scope-preservation The path consumes PORCH_STEP_CENTRE_X and PORCH_STEP_FRONT_Z rather than owning a second entry axis.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 front-walk.ts:20-24,37-38 import and use PORCH_STEP_CENTRE_X and PORCH_STEP_FRONT_Z (also PORCH_STEP_HALF_WIDTH); no own axis literal; front-walk.md:29.
 * @evidence principles/core/source-units.md#source-substantive-completion The slab, joined zone patches, and exterior connector read the same path bounds.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Slab seamRect(FRONT_WALK.x, FRONT_WALK.z) (front-walk.ts:105), zone outline :60-69 and patches :79-100, connector left=FRONT_WALK.x[1], z=FRONT_WALK.connectorZ (:52,110-111); environment.ts:329-331 connector route also reads FRONT_WALK.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan places the T connector at the driveway side and consumes porch-platform-access for the 1.50 m stair-width near contact; this record shares those bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front-walk.md:31 connector X from walk right edge to driveway left edge; :29 width/centre consume the porch stair; porch.md:27 "진입 계단 폭은 1.50 m이며 현관문 개구부 중심 X"; front-walk.ts:37-39 uses PORCH_STEP_* and DRIVEWAY.z[1].
 */
export const FRONT_WALK = {
  x: [PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH, PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH] as const,
  z: [PORCH_STEP_FRONT_Z, DRIVEWAY.z[1]] as const,
  connectorZ: [4.25, 5.45] as const,
};

/** Emit the walk and its sloped cross connector. */
/**
 * @evidence spaces/site/front-walk.md This builder owns the porch-axis walk and its cross connector to the drive.
 * @evidenceReview spaces/site/front-walk.md #6ad7b42 buildFrontWalk (front-walk.ts:50-117) emits the 'front-walk' slab and the 'front-walk-connector' blendedRun ending at DRIVEWAY.x[0]; front-walk.md:31,35.
 * @evidence spaces/site/front-walk.md#front-walk-plan The level walk reaches from the porch steps to Z=6.50; its connector blends the walk height to driveTop.
 * @evidenceReview spaces/site/front-walk.md#front-walk-plan #a688486 Slab level at STOREYS.frontWalk from FRONT_WALK.z[0] to DRIVEWAY.z[1]=6.5 (front-walk.ts:38,51,105); connectorHeight (1-t)·walkY+t·driveTop(z) (:53-56) = front-walk.md:31 formula.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses DRIVEWAY and driveTop value imports and creates no second driveway or porch landing.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 front-walk.ts:18 imports DRIVEWAY/driveTop, used :52,55,64-65,93; parts are only the 'front-walk' slab and connector triangles (:104-115); no driveway or porch landing solid.
 * @evidence principles/core/source-units.md#source-substantive-completion A flat slab, triangulated connector parts, and a named walk zone return together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Returns {zones:[zone], parts} (front-walk.ts:116): flat slab :105, blendedRun triangles :106-114, one named 'front-walk' zone :57-103.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan fixes the porch-axis walk, lower waiting pad, and T band to the driveway; buildFrontWalk emits those surfaces and standing zones without another crossing.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front-walk.md:29,31 fix the walk incl. the lower waiting and the T band (true). But buildFrontWalk emits one zone 'front-walk' (front-walk.ts:57-103,116) with walk + connector patches, not "standing zones"; the waiting pad has no zone of its own (porch.ts:172-183 front-porch zone is the platform).
 */
export const buildFrontWalk = (): ISiteBuild => {
  const walkY = STOREYS.frontWalk;
  const [left, right] = [FRONT_WALK.x[1], DRIVEWAY.x[0]];
  const connectorHeight = (x: number, z: number): number => {
    const t = (x - left) / (right - left);
    return (1 - t) * walkY + t * driveTop(z);
  };
  const zone: IExteriorZone = {
    id: "front-walk",
    owner: OWNER,
    outline: [
      { x: FRONT_WALK.x[0], z: FRONT_WALK.z[0] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.z[0] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[0] },
      { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[0] },
      { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[1] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[1] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.z[1] },
      { x: FRONT_WALK.x[0], z: FRONT_WALK.z[1] },
    ],
    anchor: {
      x: (FRONT_WALK.x[0] + FRONT_WALK.x[1]) / 2,
      y: walkY,
      z: FRONT_WALK.z[0],
    },
    rampTo: null,
    groundAt: (x, z) => x <= left ? walkY : connectorHeight(x, z),
    patches: [
      {
        outline: seamRect(
          FRONT_WALK.x,
          FRONT_WALK.z,
          [],
          [FRONT_WALK.connectorZ],
        ),
        anchor: { x: FRONT_WALK.x[0], y: walkY, z: FRONT_WALK.z[0] },
        rampTo: null,
      },
      {
        outline: rect([left, right], FRONT_WALK.connectorZ),
        anchor: { x: left, y: walkY, z: FRONT_WALK.connectorZ[0] },
        rampTo: {
          x: right,
          y: driveTop(FRONT_WALK.connectorZ[0]),
          z: FRONT_WALK.connectorZ[0],
        },
        height: pavingHeightfield(
          [left, right],
          FRONT_WALK.connectorZ,
          connectorHeight,
        ),
      },
    ],
  };
  const parts: IHousePart[] = [
    part("front-walk", OWNER, "paving", PALETTE.paving, slopedSlab({
      plan: seamRect(FRONT_WALK.x, FRONT_WALK.z, [], [FRONT_WALK.connectorZ]),
      top: () => walkY,
      thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(FRONT_WALK.x, FRONT_WALK.z, (a, b) =>
        Math.abs(a.x - left) < 1e-8 && Math.abs(b.x - left) < 1e-8 &&
        Math.min(a.z, b.z) >= FRONT_WALK.connectorZ[0] - 1e-8 &&
        Math.max(a.z, b.z) <= FRONT_WALK.connectorZ[1] + 1e-8),
    })),
    ...blendedRun({
      id: "front-walk-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: FRONT_WALK.connectorZ,
      height: connectorHeight,
      depth: WALK_DEPTH,
      joined: (a, b) => Math.abs(a.x - left) < 1e-8 && Math.abs(b.x - left) < 1e-8,
    }),
  ];
  return { zones: [zone], parts };
};
