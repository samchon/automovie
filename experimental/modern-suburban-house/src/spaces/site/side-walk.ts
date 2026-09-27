/**
 * `side-walk`: the service path from the driveway past the garage to the
 * garden lower landing.
 *
 * Design owner: `docs/spaces/site/side-walk.md#side-walk-plan`. The long path
 * starts 0.60 m right of the garage outer right face 11.70 and is 1.20 m wide:
 * X = [12.30, 13.50]. The front connector is the 1.20 m band 1.40 m to 0.20 m
 * short of the paving end, Z = [5.10, 6.30], from the driveway's right edge
 * 11.30 to the path; between the driveway and the path's left edge its top
 * blends D(Z) to S linearly in X, and on the path it stays at S. The back
 * cross path runs −Z from the lower landing's outer end, 1.20 m wide, from the
 * landing's left edge to the path. S is the lower landing height, −0.45 m. The
 * three bands form one surface; each area is emitted once. Base 0.12 m.
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { part, type IHousePart } from "../solid-records";
import { rect, slopedSlab } from "../solids";
import { driveTop, DRIVEWAY } from "./driveway";
import {
  blendedRun,
  pavingFreeEdge,
  pavingHeightfield,
  seamRect,
  WALK_DEPTH,
} from "./paving";
import { LOWER_LANDING } from "./terrace";
import type { IExteriorZone, ISiteBuild } from "./zone";

const OWNER = "site/side-walk.ts";
const PATH_WIDTH = 1.2;

/** Side path geometry, metres. */
/**
 * @evidence spaces/site/side-walk.md SIDE_WALK records the side path X band, both cross bands, and lower-landing top.
 * @evidenceReview spaces/site/side-walk.md #c741222 SIDE_WALK derives the long path X band from GARAGE, its front cross band from the driveway paving end, its rear band from LOWER_LANDING, and its top from the landing.
 * @evidence principles/core/source-units.md#source-scope-preservation Its rear band takes the landing's outer Z as its endpoint and extends one path width behind it; the builder takes its X start from LOWER_LANDING.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 SIDE_WALK.backBand is [LOWER_LANDING.z[0] - PATH_WIDTH, LOWER_LANDING.z[0]]; buildSideWalk begins the rear strip at LOWER_LANDING.x[0], so it meets that authored landing only at its edge.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed intervals and elevation let the side-walk builder close three paving bands consistently.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildSideWalk uses SIDE_WALK.x, frontBand, backBand and top to place the long level strip, rear cross strip, front grade and continuous zone from one set of intervals.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Side-walk-plan puts the path 0.60 m east of GARAGE's right outer wall and takes its rear junction from garden-lower-landing-plan; SIDE_WALK derives those contacts.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Side-walk-plan fixes the +X 0.60 m garage offset, 1.20 m width and rear contact at the landing outer end; SIDE_WALK derives those boundaries from GARAGE and LOWER_LANDING without a new route placement.
 */
export const SIDE_WALK = {
  x: [GARAGE.outer.x[1] + 0.6, GARAGE.outer.x[1] + 0.6 + PATH_WIDTH] as const,
  frontBand: [DRIVEWAY.z[1] - 1.4, DRIVEWAY.z[1] - 0.2] as const,
  backBand: [LOWER_LANDING.z[0] - PATH_WIDTH, LOWER_LANDING.z[0]] as const,
  top: LOWER_LANDING.top,
};

/** Emit the three bands of the side path. */
/**
 * @evidence spaces/site/side-walk.md This builder links the drive to the garden landing in three joined surface bands.
 * @evidenceReview spaces/site/side-walk.md #c741222 buildSideWalk emits a long strip beside the garage, a rear strip touching LOWER_LANDING and a blended front connector from DRIVEWAY.x[1], forming the three bands assigned to the path.
 * @evidence spaces/site/side-walk.md#side-walk-plan Two flat slabs hold the lower landing height; the front connector blends from the driveway grade into that height.
 * @evidenceReview spaces/site/side-walk.md#side-walk-plan #c5f5cb5 The long and rear slabs use LOWER_LANDING.top; connectorHeight blends driveTop(z) to that same height across X for the front band instead of leaving a step at the driveway.
 * @evidence spaces/site/side-walk.md#side-gate-interface Two named waiting zones straddle the gate plane taken from imported GARAGE bounds.
 * @evidenceReview spaces/site/side-walk.md#side-gate-interface #b1d46df buildSideWalk takes the gate plane from GARAGE.outer.z[1] and constructs full-width side-front-access and side-rear-access zones at the target's offset intervals on opposite sides.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder returns paving and standing zones while the fence owner creates the gate posts and model owner the leaf.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildSideWalk returns paving parts and standing zones; fence.ts retains the gate posts and opening, and the later gate model retains the moving leaf and hardware.
 * @evidence principles/core/source-units.md#source-substantive-completion Three solid bands and three zone records (continuous walk and two gate waits) share their end coordinates.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildSideWalk returns the long, rear and blended front paving bands together with one continuous side-walk zone and the two gate waiting zones, all tied to SIDE_WALK's bounds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Side-walk-plan gives the long path plus front and rear cross bands, and side-gate-interface sets waiting on both sides of the gate; buildSideWalk returns those three access zones.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Side-walk-plan fixes the three surface bands and side-gate-interface assigns both waiting offsets; buildSideWalk realizes one continuous zone plus those two waits without requiring a new parent route.
 */
export const buildSideWalk = (): ISiteBuild => {
  const s = SIDE_WALK.top;
  const [left, right] = [DRIVEWAY.x[1], SIDE_WALK.x[0]];
  const connectorHeight = (x: number, z: number): number => {
    const t = (x - left) / (right - left);
    return (1 - t) * driveTop(z) + t * s;
  };
  const flat = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(
      id,
      OWNER,
      "paving",
      PALETTE.paving,
      slopedSlab({
        plan: rect(x, z), top: () => s, thickness: WALK_DEPTH,
        freeEdge: pavingFreeEdge(x, z, (a, b) =>
          Math.abs(a.x - SIDE_WALK.x[0]) < 1e-8 && Math.abs(b.x - SIDE_WALK.x[0]) < 1e-8),
      }),
    );
  // The two gate waiting zones (side-gate-interface): +Z 0.10-1.60 m and -Z 1.30-2.80 m from the
  // gate plane, the garage front outer face, over the full path width.
  const gate = GARAGE.outer.z[1];
  const zone = (id: string, z: readonly [number, number]): IExteriorZone => ({
    id,
    owner: OWNER,
    outline: rect(SIDE_WALK.x, z),
    anchor: {
      x: (SIDE_WALK.x[0] + SIDE_WALK.x[1]) / 2,
      y: s,
      z: (z[0] + z[1]) / 2,
    },
    rampTo: null,
  });
  const continuous: IExteriorZone = {
    id: "side-walk",
    owner: OWNER,
    outline: [
      { x: LOWER_LANDING.x[0], z: SIDE_WALK.backBand[0] },
      { x: SIDE_WALK.x[1], z: SIDE_WALK.backBand[0] },
      { x: SIDE_WALK.x[1], z: SIDE_WALK.frontBand[1] },
      { x: DRIVEWAY.x[1], z: SIDE_WALK.frontBand[1] },
      { x: DRIVEWAY.x[1], z: SIDE_WALK.frontBand[0] },
      { x: SIDE_WALK.x[0], z: SIDE_WALK.frontBand[0] },
      { x: SIDE_WALK.x[0], z: SIDE_WALK.backBand[1] },
      { x: LOWER_LANDING.x[0], z: SIDE_WALK.backBand[1] },
    ],
    anchor: { x: SIDE_WALK.x[0], y: s, z: SIDE_WALK.frontBand[0] },
    rampTo: null,
    groundAt: (x, z) =>
      x >= SIDE_WALK.x[0] || z < SIDE_WALK.frontBand[0]
        ? s
        : connectorHeight(x, z),
    patches: [
      {
        outline: seamRect(
          SIDE_WALK.x,
          [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]],
          [SIDE_WALK.frontBand],
        ),
        anchor: { x: SIDE_WALK.x[0], y: s, z: SIDE_WALK.backBand[0] },
        rampTo: null,
      },
      {
        outline: rect([LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
        anchor: { x: LOWER_LANDING.x[0], y: s, z: SIDE_WALK.backBand[0] },
        rampTo: null,
      },
      {
        outline: rect([left, right], SIDE_WALK.frontBand),
        anchor: {
          x: left,
          y: driveTop(SIDE_WALK.frontBand[0]),
          z: SIDE_WALK.frontBand[0],
        },
        rampTo: { x: right, y: s, z: SIDE_WALK.frontBand[0] },
        height: pavingHeightfield(
          [left, right],
          SIDE_WALK.frontBand,
          connectorHeight,
        ),
      },
    ],
  };
  const zones = [
    continuous,
    zone("side-front-access", [gate + 0.1, gate + 1.6]),
    zone("side-rear-access", [gate - 2.8, gate - 1.3]),
  ];
  const parts: IHousePart[] = [
    part("side-walk-long", OWNER, "paving", PALETTE.paving, slopedSlab({
      plan: seamRect(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]], [SIDE_WALK.frontBand]),
      top: () => s,
      thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]], (a, b) =>
        Math.abs(a.x - SIDE_WALK.x[0]) < 1e-8 && Math.abs(b.x - SIDE_WALK.x[0]) < 1e-8 &&
        ((Math.min(a.z, b.z) >= SIDE_WALK.frontBand[0] - 1e-8 && Math.max(a.z, b.z) <= SIDE_WALK.frontBand[1] + 1e-8) ||
         (Math.min(a.z, b.z) >= SIDE_WALK.backBand[0] - 1e-8 && Math.max(a.z, b.z) <= SIDE_WALK.backBand[1] + 1e-8))),
    })),
    flat("side-walk-back", [LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
    ...blendedRun({
      id: "side-walk-front-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: SIDE_WALK.frontBand,
      height: connectorHeight,
      depth: WALK_DEPTH,
      joined: (a, b) => Math.abs(a.x - right) < 1e-8 && Math.abs(b.x - right) < 1e-8,
    }),
  ];
  return { zones, parts };
};
