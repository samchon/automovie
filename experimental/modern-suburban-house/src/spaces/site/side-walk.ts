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
import { part, rect, slab, type IHousePart } from "../solids";
import { driveTop, DRIVEWAY } from "./driveway";
import { blendedRun, pavingHeightfield, seamRect, WALK_DEPTH } from "./paving";
import { LOWER_LANDING } from "./terrace";
import type { IExteriorZone, ISiteBuild } from "./zone";

const OWNER = "site/side-walk.ts";
const PATH_WIDTH = 1.2;

/** Side path geometry, metres. */
/**
 * @evidence spaces/site/side-walk.md SIDE_WALK records the side path X band, both cross bands, and lower-landing top.
 * @evidence principles/core/source-units.md#source-scope-preservation Its back band derives from imported LOWER_LANDING and does not extend beyond the authored waiting area.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed intervals and elevation let the side-walk builder close three paving bands consistently.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Side-walk-plan puts the path 0.60 m east of GARAGE's right outer wall and takes its rear junction from garden-lower-landing-plan; SIDE_WALK derives those contacts.
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
 * @evidence spaces/site/side-walk.md#side-walk-plan Two flat slabs hold the lower landing height; the front connector blends from the driveway grade into that height.
 * @evidence spaces/site/side-walk.md#side-gate-interface Two named waiting zones straddle the gate plane taken from imported GARAGE bounds.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder returns paving and standing zones while the fence owner creates the gate posts and model owner the leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion Three solid bands and three zone records (continuous walk and two gate waits) share their end coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Side-walk-plan gives the long path plus front and rear cross bands, and side-gate-interface sets waiting on both sides of the gate; buildSideWalk returns those three access zones.
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
      slab({ outline: rect(x, z), bottom: s - WALK_DEPTH, top: s }),
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
    part("side-walk-long", OWNER, "paving", PALETTE.paving, slab({ outline: seamRect(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]], [SIDE_WALK.frontBand]), bottom: s - WALK_DEPTH, top: s })),
    flat("side-walk-back", [LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
    ...blendedRun({
      id: "side-walk-front-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: SIDE_WALK.frontBand,
      height: connectorHeight,
      depth: WALK_DEPTH,
    }),
  ];
  return { zones, parts };
};
