/**
 * `garden-fence` and `side-yard-gate`: the wooden fence around the garden and
 * its closed gate.
 *
 * Design owners: `docs/spaces/site/fence.md` and
 * `site/side-walk.md#side-gate-interface`. Centre lines: front plane F is the
 * gate plane, the garage front outer face Z = -0.30; left line L is 0.60 m left
 * of the farther-left of the chimney cap (−6.40) and the main wall (−5.75):
 * −7.00; right line R is 0.35 m right of the side path: 13.85; back line B is
 * 0.35 m behind the back cross path: −17.75. Runs: main left wall → (L, F) →
 * (L, B) → (R, B) → (R, F) → the garage front-right corner, leaving the gate
 * interval X = [12.30, 13.50]. Posts are 0.12 m square, gate posts stand
 * outside the interval, end posts stand just outside the building faces;
 * panels occupy 0.05 m each side of the centre line. The panel top equals the
 * gate leaf top, S + 1.70 m; the closed gate leaf spans S + 0.05 to S + 1.70.
 *
 * Provisional: the panel bottom is g + 0.05 m on the maps ground g, which does
 * not exist yet (maps disabled). This owner uses the side path top S = −0.45 m
 * in place of g so the fence stands in the blocking view; the ground contact is
 * not complete and is reported as such.
 */
import { PALETTE } from "../palette";
import { type IHousePart, block, part } from "../solids";
import { SIDE_WALK } from "./side-walk";

const OWNER = "site/fence.ts";
const F = -0.3;
const L = -7.0;
const R = 13.85;
const B = -17.75;
const S = SIDE_WALK.top;
const TOP = S + 1.7;
const BOTTOM = S + 0.05;
const POST = 0.06;
const HALF = 0.05;

/** Emit the fence runs, posts and the closed gate leaf. */
export const buildFence = (): IHousePart[] => {
  const post = (id: string, x: number, z: number): IHousePart =>
    part(id, OWNER, "fence", PALETTE.fenceWood, block([x - POST, S, z - POST], [x + POST, TOP, z + POST]));
  const runX = (id: string, x0: number, x1: number, z: number): IHousePart =>
    part(id, OWNER, "fence", PALETTE.fenceWood, block([x0, BOTTOM, z - HALF], [x1, TOP, z + HALF]));
  const runZ = (id: string, z0: number, z1: number, x: number): IHousePart =>
    part(id, OWNER, "fence", PALETTE.fenceWood, block([x - HALF, BOTTOM, z0], [x + HALF, TOP, z1]));
  const [gate0, gate1] = SIDE_WALK.x;
  return [
    part("fence-end-post-left", OWNER, "fence", PALETTE.fenceWood, block([-5.75 - 2 * POST, S, F - POST], [-5.75, TOP, F + POST])),
    runX("fence-left-front", L + POST, -5.75 - 2 * POST, F),
    post("fence-post-left-front", L, F),
    runZ("fence-left", B + POST, F - POST, L),
    post("fence-post-left-back", L, B),
    runX("fence-back", L + POST, R - POST, B),
    post("fence-post-right-back", R, B),
    runZ("fence-right", B + POST, F - POST, R),
    post("fence-post-right-front", R, F),
    runX("fence-right-front-outer", gate1 + 2 * POST, R - POST, F),
    part("gate-post-east", OWNER, "fence", PALETTE.fenceWood, block([gate1, S, F - POST], [gate1 + 2 * POST, TOP, F + POST])),
    part("side-yard-gate-leaf", OWNER, "fence", PALETTE.fenceWood, block([gate0, BOTTOM, F - 0.025], [gate1, TOP, F + 0.025])),
    part("gate-post-west", OWNER, "fence", PALETTE.fenceWood, block([gate0 - 2 * POST, S, F - POST], [gate0, TOP, F + POST])),
    runX("fence-right-front-inner", 11.7 + 2 * POST, gate0 - 2 * POST, F),
    part("fence-end-post-right", OWNER, "fence", PALETTE.fenceWood, block([11.7, S, F - POST], [11.7 + 2 * POST, TOP, F + POST])),
  ];
};
