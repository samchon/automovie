import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";

/**
 * Public composer callbacks share completed prefixes inside one synchronous
 * query. Each top-level preparation before-query owns a temporary scope;
 * it does not retain every sampled planning time until preparation finishes.
 *
 * The analytic base has root.x=t and pitch=10t. A trunk write adds one to
 * pitch, and a head write reads that prefix twice and writes 20t+2 to its
 * head flexion. Counters observe these owned callbacks without changing
 * their arithmetic. The two primitive inputs are deliberately reversed.
 *
 * Scenarios:
 * 1. Four independent preparation queries at t and one at t+epsilon read
 *    their actual prefixes afresh. Nested base reads within each trunk
 *    evaluation still share work. Values remain 10t and 10t+1.
 * 2. Each public query owns fresh work. A retained prefix reader called
 *    outside evaluation opens fresh work for every call.
 * 3. A reentrant public posture at another time restores the outer scope,
 *    after both normal return and an inner owned exception.
 * 4. A failed outer write publishes no partial result to the next query.
 *    A reader retained by a throwing prepare also leaves no active scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the declared arithmetic, separate top-level preparation queries, nested prefix sharing, observational counters and evaluation lifetime boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Calls only public composition, prepare/write callbacks and posture readers; duplicate prefixes inside a query, preparation-wide sharing, cross-call retention, lost enclosing scope or swallowed/retained failure fails counts or numeric outputs.
 * @evidence contracts/development/testing.md#independent-expectations The base defines 10t, the trunk adds one, and two equal prefix reads give 20t+2. Preparation explicitly requests four independent t queries and one nearby query, including two trunk prefixes. Within a public or nested query each required prefix is computed once; counts observe this scope contract rather than heap bytes or a cache's contents.
 * @evidence contracts/development/testing.md#distinguishing-cases Independent preparation queries, nested exact prefixes, adjacent exact times, reverse primitive order, retained readers, normal and throwing nested public queries, outer-write failure and prepare failure.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous mechanism unit owns deterministic public extension callbacks and counters, as compose_action does; no body producer, foreign function, global or runtime is replaced.
 */
export function test_motion_catalogue_composition_operator(): void {
  const failures: string[] = [];
  const reads: Map<number, number> = new Map();
  const writes: Map<number, number> = new Map();
  const retained: IRetainedReaders = {};
  const sentinel: Error = new Error("owned composer failure");
  const t: number = 0.25;
  const nearby: number = t + Number.EPSILON;
  let mode: QueryMode = "plain";
  let depth: number = 0;
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => {
    if (!condition) failures.push(label);
  };
  const count: (map: Map<number, number>, seconds: number) => void = (
    map: Map<number, number>,
    seconds: number,
  ): void => {
    map.set(seconds, (map.get(seconds) ?? 0) + 1);
  };
  const reset: () => void = (): void => {
    reads.clear();
    writes.clear();
  };
  const base: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    contacts: [],
    events: [],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      count(reads, seconds);
      return {
        root: { x: seconds, y: 0, z: 0 },
        yaw: 0,
        pitch: 10 * seconds,
        roll: 0,
        joints: {},
        limbs: {},
      };
    },
  };
  const trunk: IAutoMovieMotionHumanPrimitive = {
    channels: ["trunk"],
    from: 0,
    to: 1,
    prepare: (before: Reader): void => {
      retained.base = before;
      check("base prefix during prepare", nclose(before(t).pitch, 2.5, 0));
      before(t);
      before(nearby);
    },
    write: (
      under: IAutoMovieMotionHumanPosture,
      seconds: number,
      before?: Reader,
    ): IAutoMovieMotionHumanPosture => {
      count(writes, seconds);
      if (before === undefined)
        throw new Error("The composed trunk has no base reader");
      check(
        "nested base prefix first read",
        nclose(before(seconds).pitch, 10 * seconds, 0),
      );
      check(
        "nested base prefix second read",
        nclose(before(seconds).pitch, 10 * seconds, 0),
      );
      return { ...under, pitch: under.pitch + 1 };
    },
  };
  const head: IAutoMovieMotionHumanPrimitive = {
    channels: ["head"],
    from: 0,
    to: 1,
    prepare: (before: Reader): void => {
      retained.trunk = before;
      check("trunk prefix during prepare", nclose(before(t).pitch, 3.5, 0));
      before(t);
    },
    write: (
      under: IAutoMovieMotionHumanPosture,
      seconds: number,
      before?: Reader,
    ): IAutoMovieMotionHumanPosture => {
      const first: IAutoMovieMotionHumanPosture = before!(seconds);
      if (depth === 1 && mode === "inner-failure") throw sentinel;
      if (depth === 0 && (mode === "nested" || mode === "inner-failure")) {
        depth++;
        try {
          const nested: IAutoMovieMotionHumanPosture = plan!.posture(0.75);
          check("nested numeric result", nclose(nested.joints.head![0], 17, 0));
        } catch (error) {
          if (mode !== "inner-failure" || error !== sentinel) throw error;
        } finally {
          depth--;
        }
      }
      const second: IAutoMovieMotionHumanPosture = retained.trunk!(seconds);
      if (mode === "outer-failure" && depth === 0) throw sentinel;
      return {
        ...under,
        joints: { ...under.joints, head: [first.pitch + second.pitch, 0, 0] },
      };
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock: AutoMovieMotionClock.of(1, []),
      primitives: [head, trunk],
    });
  check("prepare queries own separate exact-time work", reads.get(t) === 4);
  check(
    "prepare preserves adjacent exact time",
    reads.get(nearby) === 1 && reads.size === 2,
  );
  check(
    "prepare shares nested work only inside each requested trunk prefix",
    writes.get(t) === 2 && !writes.has(nearby),
  );
  for (const scenario of ["plain", "nested", "inner-failure"] as const) {
    mode = scenario;
    reset();
    const shown: IAutoMovieMotionHumanPosture = plan.posture(t);
    check(`${scenario}: root arithmetic`, nclose(shown.root.x, t, 0));
    check(`${scenario}: head arithmetic`, nclose(shown.joints.head![0], 7, 0));
    check(
      `${scenario}: outer scope restored`,
      reads.get(t) === 1 && writes.get(t) === 1,
    );
    check(
      `${scenario}: inner work scope`,
      scenario === "plain"
        ? reads.size === 1
        : reads.get(0.75) === 1 && writes.get(0.75) === 1,
    );
  }
  mode = "plain";
  reset();
  plan.posture(t);
  plan.posture(t);
  check(
    "two public queries own fresh scopes",
    reads.get(t) === 2 && writes.get(t) === 2,
  );
  reset();
  retained.trunk!(t);
  retained.trunk!(t);
  check(
    "retained reader outside evaluation owns fresh scopes",
    reads.get(t) === 2 && writes.get(t) === 2,
  );

  mode = "outer-failure";
  reset();
  let caught: unknown;
  try {
    plan.posture(t);
  } catch (error) {
    caught = error;
  }
  check("outer write preserves its actual exception", caught === sentinel);
  mode = "plain";
  const recovered: IAutoMovieMotionHumanPosture = plan.posture(t);
  check(
    "outer throw releases partial prefixes",
    reads.get(t) === 2 && writes.get(t) === 2,
  );
  check(
    "outer throw leaves correct next value",
    nclose(recovered.joints.head![0], 7, 0),
  );

  reset();
  caught = undefined;
  try {
    composeAutoMovieMotionHumanAction({
      base,
      clock: AutoMovieMotionClock.of(1, []),
      primitives: [
        {
          channels: ["head"],
          from: 0,
          to: 1,
          write: (
            under: IAutoMovieMotionHumanPosture,
          ): IAutoMovieMotionHumanPosture => under,
          prepare: (before: Reader): void => {
            retained.failed = before;
            before(t);
            throw sentinel;
          },
        },
      ],
    });
  } catch (error) {
    caught = error;
  }
  check("prepare preserves its actual exception", caught === sentinel);
  retained.failed!(t);
  retained.failed!(t);
  check(
    "throwing prepare releases its retained reader scope",
    reads.get(t) === 3,
  );
  TestValidator.equals("composer evaluation scopes", failures, []);
}

/** A prior primitive's completed contribution at the requested action-local second. */
type Reader = (seconds: number) => IAutoMovieMotionHumanPosture;

/** Readers retained by callbacks during preparation or a failing evaluation. */
interface IRetainedReaders {
  base?: Reader;
  trunk?: Reader;
  failed?: Reader;
}

/** The reentrant evaluation behavior exercised on the next query. */
type QueryMode = "plain" | "nested" | "inner-failure" | "outer-failure";
