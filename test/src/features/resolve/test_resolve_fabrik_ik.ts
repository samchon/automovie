import { Matrix4 } from "../../../../packages/engine/src/math/Matrix4";
import { resolveWorldDrivers } from "../../../../packages/engine/src/resolve/resolveWorldDrivers";
import { IAutoMovieIKDriver, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

const W: (p: IAutoMovieVector3) => number[] = (p: IAutoMovieVector3): number[] =>
  Matrix4.compose(p, { x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 1, z: 1 });

const fabrik: (over: Partial<IAutoMovieIKDriver>) => IAutoMovieIKDriver = (over: Partial<IAutoMovieIKDriver>): IAutoMovieIKDriver => ({
  type: "ik",
  chain: ["r", "m", "t"],
  goal: "g",
  pole: null,
  solver: "fabrik",
  iterations: 50,
  influence: 1,
  ...over,
});

const bentWorld: (goal: IAutoMovieVector3) => Map<string, number[]> = (goal: IAutoMovieVector3): Map<string, number[]> =>
  new Map([
    ["r", W({ x: 0, y: 0, z: 0 })],
    ["m", W({ x: 1, y: 0, z: 0 })],
    ["t", W({ x: 1, y: 1, z: 0 })],
    ["g", W(goal)],
  ]);

const at: (world: Map<string, number[]>, id: string) => IAutoMovieVector3 = (world: Map<string, number[]>, id: string): IAutoMovieVector3 =>
  Matrix4.position(world.get(id)!);

const dist: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * FABRIK uses backward/forward position passes within a fixed iteration budget, preserving segment lengths at full influence and fully extending toward unreachable goals.
 *
 * Scenarios:
 *
 * 1. A reachable goal converges (the tip lands within 1e-3 of the goal) and both
 *    segment lengths are preserved to 1e-9 (FABRIK re-places at exact lengths
 *    by construction).
 * 2. An unreachable goal is a closed form, not an iteration: every joint sits on
 *    the root→goal ray at its cumulative length, exactly.
 * 3. A four-node chain converges too: the long-chain case the analytic two-bone
 *    solver cannot express.
 * 4. The measure-zero degenerate where a backward pass lands two joints on the
 *    same point takes the deterministic fallback direction and still terminates
 *    with exact segment lengths.
 * 5. The same inputs replay identically.
 * 6. `influence: 0.5` blends the tip linearly toward the solved position.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies real FABRIK world drivers and checks tip residuals, full-influence segment lengths, unreachable extension, influence blending and deterministic replay.
 * @evidence contracts/testing.md#independent-expectations Authored unit offsets fix total reach and unreachable extension lies on the goal ray at cumulative lengths; half-influence compares the rest tip with this solver's full result and is a blending oracle, not an independent full-solve oracle.
 * @evidence contracts/testing.md#distinguishing-cases Reachable/unreachable targets, straight/four-node chains, coincident-joint fallback, full/half influence and exact replay cover these solver examples; zero influence, analytic poles and malformed iteration budgets are not asserted here.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_fabrik_ik entry runs synchronous CPU numerical scene-node chains through direct source calls; these conventional lengths establish no anatomical reach envelope or GPU appearance.
 */
export function test_resolve_fabrik_ik(): void {
  // 1. reachable goal, exact lengths
  const w1: Map<string, number[]> = bentWorld({ x: 1.2, y: 0.5, z: 0 });
  resolveWorldDrivers([fabrik({})], w1, new Map(), new Map());
  TestValidator.predicate(
    "tip converges onto the goal",
    dist(at(w1, "t"), { x: 1.2, y: 0.5, z: 0 }) <= 1e-3,
  );
  TestValidator.equals(
    "segment lengths exact",
    namedFacts([
      ["ncloseDistAt", (): boolean  => nclose(dist(at(w1, "r"), at(w1, "m")), 1, 1e-9)],
      ["ncloseDistAt2", (): boolean  => nclose(dist(at(w1, "m"), at(w1, "t")), 1, 1e-9)],
    ]),
    { ncloseDistAt: true, ncloseDistAt2: true },
  );

  // 2. unreachable goal → closed-form full extension along the ray
  const w2: Map<string, number[]> = bentWorld({ x: 0, y: 5, z: 0 });
  resolveWorldDrivers([fabrik({})], w2, new Map(), new Map());
  TestValidator.predicate(
    "mid on the ray at its cumulative length",
    vclose(at(w2, "m"), { x: 0, y: 1, z: 0 }, 1e-9),
  );
  TestValidator.predicate(
    "tip on the reachable shell toward the goal",
    vclose(at(w2, "t"), { x: 0, y: 2, z: 0 }, 1e-9),
  );

  // 3. four-node chain
  const w3: Map<string, number[]> = new Map([
    ["a", W({ x: 0, y: 0, z: 0 })],
    ["b", W({ x: 1, y: 0, z: 0 })],
    ["c", W({ x: 2, y: 0, z: 0 })],
    ["d", W({ x: 3, y: 0, z: 0 })],
    ["g", W({ x: 1.5, y: 1.5, z: 0 })],
  ]);
  resolveWorldDrivers(
    [fabrik({ chain: ["a", "b", "c", "d"] })],
    w3,
    new Map(),
    new Map(),
  );
  TestValidator.predicate(
    "long chain converges",
    dist(at(w3, "d"), { x: 1.5, y: 1.5, z: 0 }) <= 1e-3,
  );
  TestValidator.equals(
    "long chain keeps every segment length",
    namedFacts([
      ["ncloseDistAt", (): boolean  => nclose(dist(at(w3, "a"), at(w3, "b")), 1, 1e-9)],
      ["ncloseDistAt2", (): boolean  => nclose(dist(at(w3, "b"), at(w3, "c")), 1, 1e-9)],
      ["ncloseDistAt3", (): boolean  => nclose(dist(at(w3, "c"), at(w3, "d")), 1, 1e-9)],
    ]),
    { ncloseDistAt: true, ncloseDistAt2: true, ncloseDistAt3: true },
  );

  // 4. coincident-joint degenerate: straight chain folded onto its own mid
  const w4: Map<string, number[]> = new Map([
    ["r", W({ x: 0, y: 0, z: 0 })],
    ["m", W({ x: 1, y: 0, z: 0 })],
    ["t", W({ x: 2, y: 0, z: 0 })],
    ["g", W({ x: 1, y: 0, z: 0 })],
  ]);
  resolveWorldDrivers([fabrik({})], w4, new Map(), new Map());
  TestValidator.equals(
    "degenerate fold terminates with exact lengths",
    namedFacts([
      ["ncloseDistAt", (): boolean  => nclose(dist(at(w4, "r"), at(w4, "m")), 1, 1e-9)],
      ["ncloseDistAt2", (): boolean  => nclose(dist(at(w4, "m"), at(w4, "t")), 1, 1e-9)],
    ]),
    { ncloseDistAt: true, ncloseDistAt2: true },
  );

  // 5. determinism
  const w5: Map<string, number[]> = bentWorld({ x: 1.2, y: 0.5, z: 0 });
  resolveWorldDrivers([fabrik({})], w5, new Map(), new Map());
  TestValidator.equals(
    "deterministic replay",
    namedFacts([
      ["vcloseAtW5", (): boolean  => vclose(at(w5, "m"), at(w1, "m"), 0)],
      ["vcloseAtW52", (): boolean  => vclose(at(w5, "t"), at(w1, "t"), 0)],
    ]),
    { vcloseAtW5: true, vcloseAtW52: true },
  );

  // 6. influence blend
  const w6: Map<string, number[]> = bentWorld({ x: 1.2, y: 0.5, z: 0 });
  resolveWorldDrivers([fabrik({ influence: 0.5 })], w6, new Map(), new Map());
  const solvedTip: IAutoMovieVector3 = at(w1, "t");
  TestValidator.predicate(
    "half influence blends the tip linearly",
    vclose(
      at(w6, "t"),
      {
        x: (1 + solvedTip.x) / 2,
        y: (1 + solvedTip.y) / 2,
        z: solvedTip.z / 2,
      },
      1e-9,
    ),
  );
}
