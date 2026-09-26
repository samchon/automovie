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
import { type IHousePart, part, rect, slab } from "../solids";
import { DRIVEWAY, driveTop } from "./driveway";
import { WALK_DEPTH, blendedRun } from "./paving";
import { LOWER_LANDING } from "./terrace";
import type { IExteriorZone, ISiteBuild } from "./zone";

const OWNER = "site/side-walk.ts";

/** Side path geometry, metres. */
/**
 * @evidence spaces/site/side-walk.md SIDE_WALK records the side path X band, both cross bands, and lower-landing top.
 * @evidence principles/core/source-units.md#source-scope-preservation Its back band derives from imported LOWER_LANDING and does not extend beyond the authored waiting area.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed intervals and elevation let the side-walk builder close three paving bands consistently.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The side-walk parent supplies width and cross-band reaches; LOWER_LANDING fixes the rear contact.
 */
export const SIDE_WALK = {
  x: [12.3, 13.5] as const,
  frontBand: [5.1, 6.3] as const,
  backBand: [LOWER_LANDING.z[0] - 1.2, LOWER_LANDING.z[0]] as const,
  top: LOWER_LANDING.top,
};

/** Emit the three bands of the side path. */
/**
 * @evidence spaces/site/side-walk.md This builder links the drive to the garden landing in three joined surface bands.
 * @evidence spaces/site/side-walk.md#side-walk-plan Two flat slabs and a blended front connector keep one continuous walking surface at the lower landing height.
 * @evidence spaces/site/side-walk.md#side-gate-interface Two named waiting zones straddle the gate plane taken from imported GARAGE bounds.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder returns paving and standing zones while the fence owner creates the gate posts and model owner the leaf.
 * @evidence principles/core/source-units.md#source-substantive-completion The three solid bands and two zone records are emitted with stable ids and shared end coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Side-walk and gate parent units fix the three bands and waiting spans; source added no extra exterior path.
 */
export const buildSideWalk = (): ISiteBuild => {
  const s = SIDE_WALK.top;
  const [left, right] = [DRIVEWAY.x[1], SIDE_WALK.x[0]];
  const flat = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart =>
    part(id, OWNER, "paving", PALETTE.paving, slab({ outline: rect(x, z), bottom: s - WALK_DEPTH, top: s }));
  // The two gate waiting zones (side-gate-interface): +Z 0.10-1.60 m and -Z 1.30-2.80 m from the
  // gate plane, the garage front outer face, over the full path width.
  const gate = GARAGE.outer.z[1];
  const zone = (id: string, z: readonly [number, number]): IExteriorZone => ({
    id,
    owner: OWNER,
    outline: rect(SIDE_WALK.x, z),
    anchor: { x: (SIDE_WALK.x[0] + SIDE_WALK.x[1]) / 2, y: s, z: (z[0] + z[1]) / 2 },
    rampTo: null,
  });
  const continuous: IExteriorZone = {
    id: "side-walk", owner: OWNER,
    outline: [
      { x: LOWER_LANDING.x[0], z: SIDE_WALK.backBand[0] }, { x: SIDE_WALK.x[1], z: SIDE_WALK.backBand[0] },
      { x: SIDE_WALK.x[1], z: SIDE_WALK.frontBand[1] }, { x: DRIVEWAY.x[1], z: SIDE_WALK.frontBand[1] },
      { x: DRIVEWAY.x[1], z: SIDE_WALK.frontBand[0] }, { x: SIDE_WALK.x[0], z: SIDE_WALK.frontBand[0] },
      { x: SIDE_WALK.x[0], z: SIDE_WALK.backBand[1] }, { x: LOWER_LANDING.x[0], z: SIDE_WALK.backBand[1] },
    ],
    anchor: { x: SIDE_WALK.x[0], y: s, z: SIDE_WALK.frontBand[0] }, rampTo: null,
    patches: [
      { outline: rect(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]]), anchor: { x: SIDE_WALK.x[0], y: s, z: SIDE_WALK.backBand[0] }, rampTo: null },
      { outline: rect([LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand), anchor: { x: LOWER_LANDING.x[0], y: s, z: SIDE_WALK.backBand[0] }, rampTo: null },
      { outline: rect([left, right], SIDE_WALK.frontBand), anchor: { x: left, y: driveTop(SIDE_WALK.frontBand[0]), z: SIDE_WALK.frontBand[0] }, rampTo: { x: right, y: s, z: SIDE_WALK.frontBand[0] } },
    ],
  };
  const zones = [continuous, zone("side-front-access", [gate + 0.1, gate + 1.6]), zone("side-rear-access", [gate - 2.8, gate - 1.3])];
  const parts: IHousePart[] = [
    flat("side-walk-long", SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]]),
    flat("side-walk-back", [LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
    ...blendedRun({
      id: "side-walk-front-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: SIDE_WALK.frontBand,
      height: (x, z) => {
        const t = (x - left) / (right - left);
        return (1 - t) * driveTop(z) + t * s;
      },
      depth: WALK_DEPTH,
    }),
  ];
  return { zones, parts };
};
