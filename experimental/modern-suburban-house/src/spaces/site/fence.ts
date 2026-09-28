/**
 * `garden-fence` and `side-yard-gate`: the wooden fence around the garden and
 * the opening and posts for its gate. The leaf belongs to the model prototype.
 *
 * Design owners: `docs/spaces/site/fence.md` and
 * `site/side-walk.md#side-gate-interface`. Centre lines: front plane F is the
 * gate plane, the garage front outer face Z = -0.30; left line L is 0.60 m left
 * of the farther-left of the chimney cap and the main wall, derived from
 * their source bounds; right line R is 0.35 m right of the side path: 13.85; back line B is
 * 0.35 m behind the back cross path: −17.75. Runs: main left wall → (L, F) →
 * (L, B) → (R, B) → (R, F) → the garage front-right corner, leaving the gate
 * interval X = [12.30, 13.50]. Posts are 0.12 m square, gate posts stand
 * outside the interval, end posts stand just outside the building faces;
 * panels occupy 0.05 m each side of the centre line. The panel top equals the
 * reserved gate leaf top, S + 1.70 m; the model owns the closed leaf.
 *
 * Provisional: the panel bottom is g + 0.05 m on the maps ground g, which does
 * not exist yet (maps disabled). This owner uses the side path top S = −0.45 m
 * in place of g so the fence stands in the blocking view; the ground contact is
 * not complete and is reported as such.
 */
import { GARAGE, MAIN } from "../building";
import { CHIMNEY_CAP_OVERHANG } from "../envelope/left";
import { PALETTE } from "../palette";
import { CHIMNEY_PLAN } from "../roof/junctions";
import { block } from "../solids";
import { part, type IHousePart } from "../solid-records";
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
/**
 * @evidence spaces/site/fence.md This builder emits the fixed garden fence and gate posts while leaving the movable leaf empty.
 * @evidenceReview spaces/site/fence.md #a7ccfe8 `buildFence` emits fixed runs, corner/end posts and two gate posts; its front run splits around `SIDE_WALK.x`, and no movable gate leaf is returned.
 * @evidence spaces/site/fence.md#fence-enclosure-plan The left, back, right, and front runs meet at shared posts; end posts terminate at MAIN and GARAGE outer faces.
 * @evidenceReview spaces/site/fence.md#fence-enclosure-plan #ee6f771 `buildFence` orders left-front, left, back, right and right-front runs through posts at `(L,F)`, `(L,B)`, `(R,B)` and `(R,F)`; its end posts reach `MAIN.outer.x[0]` and `GARAGE.outer.x[1]`.
 * @evidence spaces/site/fence.md#fence-gate-junction Two posts flank SIDE_WALK.x and the front panel omits that gate interval.
 * @evidenceReview spaces/site/fence.md#fence-gate-junction #ee70766 The two `gate-post-*` blocks touch the outer edges of `SIDE_WALK.x`, and `fence-right-front-inner` and `-outer` stop at their far faces, leaving the full gate interval open.
 * @evidence spaces/site/fence.md#fence-ground-profile Panel tops follow the side-walk datum plus 1.70 m; bottoms use its provisional ground proxy plus 0.05 m.
 * @evidenceReview spaces/site/fence.md#fence-ground-profile #8697d24 `runX` and `runZ` span from `SIDE_WALK.top + 0.05` to `SIDE_WALK.top + 1.7` and carry `map-ground-pending`, so the lower edge is an explicit display proxy rather than an asserted map contact.
 * @evidence principles/core/source-units.md#source-scope-preservation Value imports keep building/path contacts aligned, and no gate leaf or map-ground foundation is emitted.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `F` and both end posts derive from building bounds, `L` derives from chimney/main bounds, and `R`, `B`, `S` derive from `SIDE_WALK`; the return array contains fixed fence parts without a gate leaf or foundation.
 * @evidence principles/core/source-units.md#source-substantive-completion Stable post and run ids yield a continuous fixed enclosure except for the authored gate gap.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The returned `fence-*` ids cover each fixed leg from the main wall through four corners to the garage wall, while the two named gate posts bound the sole omitted front interval.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The initial source revealed a missing ground datum; the fence design now authorizes only a marked temporary display bottom.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `site/fence.md#fence-ground-profile` now authorizes a temporary `S + 0.05 m` lower edge while maps ground is absent; `runX` and `runZ` mark those panels `map-ground-pending` instead of claiming final contact.
 */
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
