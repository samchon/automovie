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
 * @evidenceReview spaces/site/front-walk.md #6ad7b42 FRONT_WALK supplies the X/Z span used by the flat slab and zone outline, plus the cross-band Z limits read by the zone patch and connector mesh.
 * @evidence spaces/site/front-walk.md#front-walk-plan X follows the porch-step centre, the inner Z follows its front riser, and the cross band keeps its reviewed Z limits.
 * @evidenceReview spaces/site/front-walk.md#front-walk-plan #a688486 FRONT_WALK derives both X sides from the porch-step centre and half-width, starts at PORCH_STEP_FRONT_Z, ends at the driveway paving end and keeps the authored cross band Z = [4.25, 5.45].
 * @evidence principles/core/source-units.md#source-scope-preservation The path consumes PORCH_STEP_CENTRE_X and PORCH_STEP_FRONT_Z rather than owning a second entry axis.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 FRONT_WALK reads PORCH_STEP_CENTRE_X, PORCH_STEP_HALF_WIDTH and PORCH_STEP_FRONT_Z from the porch owner rather than storing a separate entrance axis or first-riser position.
 * @evidence principles/core/source-units.md#source-substantive-completion The slab, joined zone patches, and exterior connector read the same path bounds.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The flat seamRect, continuous zone outline, cross patch and blendedRun all consume FRONT_WALK's bounds, giving the paving and walking records the same plan.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan places the T connector at the driveway side and consumes porch-platform-access for the 1.50 m stair-width near contact; this record shares those bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Front-walk-plan takes the main path width and axis from the porch step and the cross band toward the driveway; FRONT_WALK uses those porch bounds and the driveway's paving end without needing a new entrance alignment.
 */
export const FRONT_WALK = {
  x: [PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH, PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH] as const,
  z: [PORCH_STEP_FRONT_Z, DRIVEWAY.z[1]] as const,
  connectorZ: [4.25, 5.45] as const,
};

/** Emit the walk and its sloped cross connector. */
/**
 * @evidence spaces/site/front-walk.md This builder owns the porch-axis walk and its cross connector to the drive.
 * @evidenceReview spaces/site/front-walk.md #6ad7b42 buildFrontWalk emits one flat porch-axis paving part, a blendedRun reaching DRIVEWAY.x[0], and one continuous front-walk zone over those surfaces.
 * @evidence spaces/site/front-walk.md#front-walk-plan The level walk reaches from the porch steps to Z=6.50; its connector blends the walk height to driveTop.
 * @evidenceReview spaces/site/front-walk.md#front-walk-plan #a688486 The flat slab uses STOREYS.frontWalk from PORCH_STEP_FRONT_Z to DRIVEWAY.z[1]; connectorHeight blends that level with driveTop(z) across X as the front-walk plan specifies.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses DRIVEWAY and driveTop value imports and creates no second driveway or porch landing.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildFrontWalk imports DRIVEWAY and driveTop for the cross connection and emits only its own walk slab and connector pieces, leaving the driveway and porch landing to their owners.
 * @evidence principles/core/source-units.md#source-substantive-completion A flat slab, triangulated connector parts, and a named walk zone return together.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildFrontWalk returns the flat slopedSlab, triangulated blendedRun pieces and a single front-walk zone with separate level and heightfield patches in one ISiteBuild result.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Front-walk-plan fixes the porch-axis walk, lower waiting area and T band to the driveway; buildFrontWalk emits those surfaces and one joined standing zone without another crossing.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Front-walk-plan assigns the lower waiting area to the one level walk and the cross band to its driveway connection; buildFrontWalk emits both paving bodies under a single front-walk zone, so the parent needs no additional standing area.
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
