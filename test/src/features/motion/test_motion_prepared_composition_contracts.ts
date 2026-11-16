import {
  AutoMovieMotionClock,
  type AutoMovieMotionHumanChannel,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanActionPlan,
  type IHumanPosture,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Requested composition propagates declared dependencies through the active
 * prefix and gives each public evaluation its own failure-safe scope.
 *
 * Scenarios:
 * 1. Root=100+t, trunk=2*root.x and head=trunk+1 make an explicit three-link
 *    dependency. Requesting head executes those writers once and omits an
 *    independent hand; requesting root omits trunk/head/hand.
 * 2. The trunk's [0.2,0.8] window changes which writer is required. Exact
 *    endpoints write; adjacent outside times use the base's pitch=10t.
 *    Empty demand executes no writer and arbitrary seeks retain those values.
 * 3. A primitive without a reads declaration conservatively requires every
 *    earlier active channel. A time-dependent reads declaration chooses the
 *    root or trunk dependency actually used by its head computation.
 * 4. A nested public query, including one that throws an owned exception,
 *    cannot replace its enclosing prefix scope. Failed outer writes publish
 *    no result into the next public evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the analytic channel arithmetic, backward dependency and active-window semantics, optional reads default, dynamic reads and failure-scope lifetime in four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Composes actual public primitives and requests selected channels. Owned callback counters distinguish inactive from transitively required writers while hand-derived fields detect false skipped answers; nested and throwing public evaluations check restoration and subsequent recovery.
 * @evidence contracts/development/testing.md#independent-expectations The test's own pure writers define root=100+t, pitch=2root and head=pitch+1, while inactive trunk uses 10t. The declared dependency graph requires exactly root/trunk/head for head demand and no hand. Counter expectations derive from this graph and each window, not the implementation's cache or a fitted operation count.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers full/root/head/empty requests, transitive and absent dependencies, exact/adjacent window endpoints, backward and repeated seeks, dynamic dependencies on both sides, normal/throwing nested reads and outer failure recovery. Existing evaluation-scope tests own retained preparation-reader lifetimes; physical overlay/cut behavior remains separately covered.
 * @evidence contracts/development/testing.md#execution-ownership One portable discoverable unit owns its analytic extension callbacks, counters and exceptions. It replaces no foreign function or global and starts no body producer, host, viewer or compiler; borrowed partial postures are read only on requested channels.
 */
export function test_motion_prepared_composition_contracts(): void {
  const calls: Record<string, number> = {};
  const baseDemands: (readonly AutoMovieMotionHumanChannel[] | undefined)[] = [];
  let mode: "plain" | "nested" | "inner-failure" | "outer-failure" = "plain";
  let depth: number = 0;
  const sentinel: Error = new Error("owned demanded composition failure");

  /** Count only test-owned callback execution at its genuine public seam. */
  function count(name: string): void { calls[name] = (calls[name] ?? 0) + 1; }

  /** Each query begins with fresh counter observations. */
  function reset(): void {
    for (const name of Object.keys(calls)) delete calls[name];
    baseDemands.length = 0;
  }

  const base: IHumanActionPlan = {
    duration: 1, events: [], contacts: [],
    posture: (seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[]): IHumanPosture => {
      baseDemands.push(channels === undefined ? undefined : [...channels]);
      return { root: { x: seconds, y: 0, z: 0 }, yaw: 0,
        pitch: 10 * seconds, roll: 0, joints: {}, limbs: {} };
    },
  };
  const root: IAutoMovieMotionHumanPrimitive = {
    channels: ["root"], reads: [], from: 0, to: 1,
    write: (under: IHumanPosture, seconds: number): IHumanPosture => {
      count("root");
      return { ...under, root: { x: 100 + seconds, y: 0, z: 0 } };
    },
  };
  const trunk: IAutoMovieMotionHumanPrimitive = {
    channels: ["trunk"], reads: ["root"], from: 0.2, to: 0.8,
    write: (under: IHumanPosture): IHumanPosture => {
      count("trunk");
      return { ...under, pitch: 2 * under.root.x };
    },
  };
  const hand: IAutoMovieMotionHumanPrimitive = {
    channels: ["leftHand"], reads: [], from: 0, to: 1,
    write: (under: IHumanPosture): IHumanPosture => {
      count("hand");
      return { ...under, joints: { ...under.joints, leftIndexProximal: [7, 0, 0] } };
    },
  };
  const head: IAutoMovieMotionHumanPrimitive = {
    channels: ["head"], reads: ["trunk"], from: 0, to: 1,
    write: (under: IHumanPosture, seconds: number,
      before?: IAutoMovieMotionHumanPrimitive.Reader): IHumanPosture => {
      count(depth === 0 ? "head" : "inner-head");
      if (depth > 0 && mode === "inner-failure") throw sentinel;
      if (depth === 0 && (mode === "nested" || mode === "inner-failure")) {
        depth++;
        try { plan.posture(0.75, ["head"]); }
        catch (error) { if (mode !== "inner-failure" || error !== sentinel) throw error; }
        finally { depth--; }
        const prefix: IHumanPosture = before!(seconds, ["trunk"]);
        TestValidator.predicate("nested query restores the enclosing prefix",
          nclose(prefix.pitch, under.pitch, 0),
        );
      }
      if (depth === 0 && mode === "outer-failure") throw sentinel;
      return { ...under, joints: { ...under.joints, head: [under.pitch + 1, 0, 0] } };
    },
  };
  const plan: IHumanActionPlan = composeAutoMovieMotionHumanAction({
    base, clock: AutoMovieMotionClock.of(1, []), primitives: [hand, head, trunk, root],
  });
  for (const seconds of [0.5, 0.1, 0.8, 0.80001, 0.2, 0.19999, 0.5]) {
    reset();
    const active: boolean = seconds >= 0.2 && seconds <= 0.8;
    const reading: IHumanPosture = plan.posture(seconds, ["head"]);
    const expected: number = (active ? 2 * (100 + seconds) : 10 * seconds) + 1;
    TestValidator.predicate("requested head has its independently derived value",
      nclose(reading.joints.head![0], expected, 1e-12),
    );
    TestValidator.equals("only active transitive contributors execute", calls,
      active ? { root: 1, trunk: 1, head: 1 } : { head: 1 },
    );
    TestValidator.equals("base receives the transitive remaining demand", baseDemands,
      active ? [[]] : [["trunk"]],
    );
  }
  reset();
  TestValidator.predicate("root request retains the root arithmetic",
    nclose(plan.posture(0.5, ["root"]).root.x, 100.5, 0),
  );
  TestValidator.equals("root request executes no dependent or unrelated writer", calls, { root: 1 });
  reset();
  plan.posture(0.5, []);
  TestValidator.equals("empty demand invokes no primitive", calls, {});
  reset();
  const full: IHumanPosture = plan.posture(0.5);
  TestValidator.predicate("full read preserves every owned field",
    nclose(full.root.x, 100.5, 0) && nclose(full.pitch, 201, 0) &&
    nclose(full.joints.head![0], 202, 0) && nclose(full.joints.leftIndexProximal![0], 7, 0),
  );
  TestValidator.equals("full read executes every active writer once", calls,
    { root: 1, trunk: 1, head: 1, hand: 1 },
  );

  const arbitrary: IAutoMovieMotionHumanPrimitive = {
    channels: ["rightArm"], from: 0, to: 1,
    write: (under: IHumanPosture): IHumanPosture => {
      count("arbitrary");
      return { ...under, joints: { ...under.joints,
        rightUpperArm: [under.pitch + under.joints.leftIndexProximal![0], 0, 0] } };
    },
  };
  const conservative: IHumanActionPlan = composeAutoMovieMotionHumanAction({
    base, clock: AutoMovieMotionClock.of(1, []), primitives: [arbitrary, hand, head, trunk, root],
  });
  reset();
  TestValidator.predicate("omitted reads retains arbitrary-prefix behavior",
    nclose(conservative.posture(0.5, ["rightArm"]).joints.rightUpperArm![0], 208, 0),
  );
  TestValidator.equals("omitted reads requires all preceding active writers", calls,
    { root: 1, trunk: 1, head: 1, hand: 1, arbitrary: 1 },
  );
  const dynamic: IHumanActionPlan = composeAutoMovieMotionHumanAction({
    base, clock: AutoMovieMotionClock.of(1, []), primitives: [root, trunk, {
      channels: ["head"], from: 0, to: 1,
      reads: (seconds: number): readonly AutoMovieMotionHumanChannel[] =>
        seconds < 0.5 ? ["trunk"] : ["root"],
      write: (under: IHumanPosture, seconds: number): IHumanPosture => ({
        ...under, joints: { ...under.joints,
          head: [seconds < 0.5 ? under.pitch : under.root.x, 0, 0] },
      }),
    }],
  });
  for (const [seconds, expected] of [[0.25, 200.5], [0.5, 100.5]] as const) {
    reset();
    TestValidator.predicate("time-dependent declared dependency reaches its value",
      nclose(dynamic.posture(seconds, ["head"]).joints.head![0], expected, 0),
    );
    TestValidator.equals("dynamic demand includes only its selected prerequisite", calls,
      seconds < 0.5 ? { root: 1, trunk: 1 } : { root: 1 },
    );
  }

  for (const nested of ["nested", "inner-failure"] as const) {
    mode = nested;
    reset();
    TestValidator.predicate("nested partial query keeps the outer numeric answer",
      nclose(plan.posture(0.5, ["head"]).joints.head![0], 202, 0),
    );
    TestValidator.equals("nested work is independent and outer prefix remains shared", calls,
      { root: 2, trunk: 2, head: 1, "inner-head": 1 },
    );
  }
  mode = "outer-failure";
  let error: unknown;
  try { plan.posture(0.5, ["head"]); } catch (failure) { error = failure; }
  TestValidator.predicate("owned write error propagates unchanged", error === sentinel);
  mode = "plain";
  reset();
  TestValidator.predicate("query after failure recomputes a correct complete result",
    nclose(plan.posture(0.5, ["head"]).joints.head![0], 202, 0),
  );
  TestValidator.equals("failure leaves no successful prefix in a later scope", calls,
    { root: 1, trunk: 1, head: 1 },
  );
}
