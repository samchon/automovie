
import { GARAGE, MAIN } from "../building";
import { CHIMNEY_CAP_OVERHANG } from "../envelope/left";
import { PALETTE } from "../palette";
import { CHIMNEY_PLAN } from "../roof/junctions";
import { block } from "../solids";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { SIDE_WALK } from "./side-walk";

const OWNER = "site/fence.ts";
const F = GARAGE.outer.z[1];
const L = Math.min(CHIMNEY_PLAN.x[0] - CHIMNEY_CAP_OVERHANG, MAIN.outer.x[0]) - 0.6;
const R = SIDE_WALK.x[1] + 0.35;
const B = SIDE_WALK.backBand[0] - 0.35;
const S = SIDE_WALK.top;
const TOP = S + 1.7;
const BOTTOM = S + 0.05;
const POST = 0.06;
const HALF = 0.05;

/** Emit the fence runs and gate posts while leaving the model leaf opening clear. */
export const buildFence = (): IHousePart[] => {
  const post = (id: string, x: number, z: number): IHousePart =>
    part(
      id,
      OWNER,
      "fence",
      PALETTE.fenceWood,
      block([x - POST, S, z - POST], [x + POST, TOP, z + POST]),
    );
  const runX = (id: string, x0: number, x1: number, z: number): IHousePart =>
    ({
      ...part(id, OWNER, "fence", PALETTE.fenceWood, block([x0, BOTTOM, z - HALF], [x1, TOP, z + HALF])),
      pendingMapGround: "map-ground-pending",
    });
  const runZ = (id: string, z0: number, z1: number, x: number): IHousePart =>
    ({
      ...part(id, OWNER, "fence", PALETTE.fenceWood, block([x - HALF, BOTTOM, z0], [x + HALF, TOP, z1])),
      pendingMapGround: "map-ground-pending",
    });
  const [gate0, gate1] = SIDE_WALK.x;
  return [
    part(
      "fence-end-post-left",
      OWNER,
      "fence",
      PALETTE.fenceWood,
      block(
        [MAIN.outer.x[0] - 2 * POST, S, F - POST],
        [MAIN.outer.x[0], TOP, F + POST],
      ),
    ),
    runX("fence-left-front", L + POST, MAIN.outer.x[0] - 2 * POST, F),
    post("fence-post-left-front", L, F),
    runZ("fence-left", B + POST, F - POST, L),
    post("fence-post-left-back", L, B),
    runX("fence-back", L + POST, R - POST, B),
    post("fence-post-right-back", R, B),
    runZ("fence-right", B + POST, F - POST, R),
    post("fence-post-right-front", R, F),
    runX("fence-right-front-outer", gate1 + 2 * POST, R - POST, F),
    part(
      "gate-post-east",
      OWNER,
      "fence",
      PALETTE.fenceWood,
      block([gate1, S, F - POST], [gate1 + 2 * POST, TOP, F + POST]),
    ),
    part(
      "gate-post-west",
      OWNER,
      "fence",
      PALETTE.fenceWood,
      block([gate0 - 2 * POST, S, F - POST], [gate0, TOP, F + POST]),
    ),
    runX(
      "fence-right-front-inner",
      GARAGE.outer.x[1] + 2 * POST,
      gate0 - 2 * POST,
      F,
    ),
    part(
      "fence-end-post-right",
      OWNER,
      "fence",
      PALETTE.fenceWood,
      block(
        [GARAGE.outer.x[1], S, F - POST],
        [GARAGE.outer.x[1] + 2 * POST, TOP, F + POST],
      ),
    ),
  ];
};
