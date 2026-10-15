import type { IHousePart } from "../../types/IHousePart";
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { blendedRun } from "./blendedRun";
import { driveTop } from "./driveTop";
import { DRIVEWAY } from "./DRIVEWAY";
import { pavingFreeEdge } from "./pavingFreeEdge";
import { pavingHeightfield } from "./pavingHeightfield";
import { seamRect } from "./seamRect";
import { SIDE_WALK } from "./SIDE_WALK";
import { LOWER_LANDING } from "./LOWER_LANDING";
import { WALK_DEPTH } from "./WALK_DEPTH";
import type { IExteriorZone } from "./IExteriorZone";
import type { ISiteBuild } from "./ISiteBuild";

const SIDE_WALK_OWNER = "site/side-walk.ts";
/** Emit the three bands of the side path. */

export const buildSideWalk = (): ISiteBuild => {
  const s = SIDE_WALK.top;
  const [left, right] = [DRIVEWAY.x[1], SIDE_WALK.x[0]];
  const connectorHeight = (x: number, z: number): number => {
    const t = (x - left) / (right - left);
    return (1 - t) * driveTop(z) + t * s;
  };
  const flat = (id: string, x: readonly [number, number], z: readonly [number, number]): IHousePart => part(
    id,
    SIDE_WALK_OWNER,
    "paving",
    PALETTE.paving,
    slopedSlab({
      plan: rect(x, z), top: () => s, thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(x, z, (a, b) => Math.abs(a.x - SIDE_WALK.x[0]) < 1e-8 && Math.abs(b.x - SIDE_WALK.x[0]) < 1e-8),
    })
  );
  // The two gate waiting zones (side-gate-interface): +Z 0.10-1.60 m and -Z 1.30-2.80 m from the
  // gate plane, the garage front outer face, over the full path width.
  const gate = GARAGE_OUTLINE.outer.z[1];
  const zone = (id: string, z: readonly [number, number]): IExteriorZone => ({
    id,
    owner: SIDE_WALK_OWNER,
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
    owner: SIDE_WALK_OWNER,
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
    groundAt: (x, z) => x >= SIDE_WALK.x[0] || z < SIDE_WALK.frontBand[0]
      ? s
      : connectorHeight(x, z),
    patches: [
      {
        outline: seamRect(
          SIDE_WALK.x,
          [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]],
          [SIDE_WALK.frontBand]
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
          connectorHeight
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
    part("side-walk-long", SIDE_WALK_OWNER, "paving", PALETTE.paving, slopedSlab({
      plan: seamRect(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]], [SIDE_WALK.frontBand]),
      top: () => s,
      thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(SIDE_WALK.x, [SIDE_WALK.backBand[0], SIDE_WALK.frontBand[1]], (a, b) => Math.abs(a.x - SIDE_WALK.x[0]) < 1e-8 && Math.abs(b.x - SIDE_WALK.x[0]) < 1e-8 &&
        ((Math.min(a.z, b.z) >= SIDE_WALK.frontBand[0] - 1e-8 && Math.max(a.z, b.z) <= SIDE_WALK.frontBand[1] + 1e-8) ||
          (Math.min(a.z, b.z) >= SIDE_WALK.backBand[0] - 1e-8 && Math.max(a.z, b.z) <= SIDE_WALK.backBand[1] + 1e-8))),
    })),
    flat("side-walk-back", [LOWER_LANDING.x[0], SIDE_WALK.x[0]], SIDE_WALK.backBand),
    ...blendedRun({
      id: "side-walk-front-connector",
      owner: SIDE_WALK_OWNER,
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
