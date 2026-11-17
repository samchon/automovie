import { createDrinkware } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  StrikingHeld,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Nested future-use grip questions own separate FK/frame lifetimes, and an
 * inner return or exception must not discard an outer question's reuse.
 *
 * Scenarios:
 * 1. The unchanged small polygon Human/glass pickup fixture reaches two
 *    registered consumers that return actual stand plans. A one-aim query
 *    measures reads of an owned wrapper's real stand joint records.
 * 2. An outer mouth aim invokes the same public demands reader recursively
 *    for a translated stand, then aims again. The inner query also asks the
 *    performer's person alias. Two physical candidates need twice the
 *    one-aim input work, and returning to the outer scope needs no new FK.
 * 3. Repeat with an owned inner exception. The outer answer and reused FK
 *    survive it. Each retained inner/outer aim must read a later actual
 *    posture freshly after the complete query, twice each without caching.
 *
 * Translating a complete real stand by (0.7,0,-0.4) translates any anatomical
 * point by that vector and preserves its outward normal, within the existing
 * lifetime regression's 1e-9 bounds. Body and grip stay unchanged while each
 * synchronous query is active; only caller-owned postures change afterwards.
 * These are observed numeric calls, not replayed counts or foreign patches.
 * The regression is deferred and does not enlarge representative execution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the existing physical pickup fixture, nested normal/throw scopes, real reader-count baseline, retained callbacks and rigid-translation oracle.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public context.demands seam through an actual canonical pickup and real stand plans, recursively invokes that same reader and observes actual aim points/normals plus owned joint input reads.
 * @evidence contracts/development/testing.md#independent-expectations Rigid translation fixes point and normal expectations; two independent candidate FK queries require twice the observed single-query work, resuming an active outer query requires none, and completed retained calls each require a fresh read.
 * @evidence contracts/development/testing.md#distinguishing-cases Outer/inner distinct candidate poses, own-person alias, normal and thrown inner completion, resumed outer reads, four retained calls after posture changes and an owned sentinel distinguish scope loss, escaped caches and cross-candidate reuse.
 * @evidence contracts/development/testing.md#execution-ownership One deferred performance uses actual polygon Human and glass, owned registered callbacks/getters and public consumers; no private implementation, fake body, global replacement or additional process is used.
 */
export function test_human_motion_core_ahead_nested(): void {
  type Aim = IAutoMovieMotionHumanActionContext["aim"];
  type Goal = ReturnType<Aim>;
  type Question = { grip: IAutoMovieMotionHumanActionLaw.IGrip; read: Aim; goal: Goal };
  const findings: string[] = [];
  const branches: Set<string> = new Set();
  const body: IAutoMovieMotionHumanBody = { ...motionHumanBody("f-small") };
  const target: IAutoMovieMotionTarget = { kind: "self", region: "mouth" };
  const shift: IAutoMovieVector3 = { x: 0.7, y: 0, z: -0.4 };
  const sentinel: Error = new Error("owned nested demand failure");
  const state: {
    invoke: NonNullable<IAutoMovieMotionHumanActionContext["demands"]> | undefined;
    depth: number;
    single: boolean;
    fails: boolean;
    extra: number;
    outer: Question | undefined;
    inner: Question | undefined;
  } = {
    invoke: undefined,
    depth: 0,
    single: true,
    fails: false,
    extra: 0,
    outer: undefined,
    inner: undefined,
  };
  let jointReads: number = 0;
  const posture: (at: IAutoMovieVector3) => IAutoMovieMotionHumanPosture = (
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture => {
    const actual: IAutoMovieMotionHumanPosture = stand.posture(body, at, 0);
    return {
      ...actual,
      get joints(): IAutoMovieMotionHumanPosture["joints"] {
        jointReads++;
        return actual.joints;
      },
    };
  };
  const same: (
    label: string,
    first: Goal,
    next: Goal,
    delta: IAutoMovieVector3,
  ) => void = (
    label: string,
    first: Goal,
    next: Goal,
    delta: IAutoMovieVector3,
  ): void => {
    const distance: number = Math.hypot(
      next.point.x - first.point.x - delta.x,
      next.point.y - first.point.y - delta.y,
      next.point.z - first.point.z - delta.z,
    );
    const normal: number =
      first.normal === undefined || next.normal === undefined
        ? Infinity
        : Math.hypot(
            next.normal.x - first.normal.x,
            next.normal.y - first.normal.y,
            next.normal.z - first.normal.z,
          );
    if (!(distance <= 1e-9 && normal <= 1e-9))
      findings.push(`${label}: point ${distance} m, normal ${normal}`);
  };
  const outcomes: () => {
    outer: Question | undefined;
    inner: Question | undefined;
  } = (): { outer: Question | undefined; inner: Question | undefined } => ({
    outer: state.outer,
    inner: state.inner,
  });
  const inspect: IAutoMovieMotionHumanActionLaw = {
    name: "inspectNestedDemands",
    interrupts: stand.interrupts,
    demands: (
      ahead: IAutoMovieMotionHumanActionLaw.IAhead,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] => {
      const first: Goal = ahead.aim(target, ahead.start);
      if (state.single) return [];
      if (state.depth === 0) {
        state.outer = { grip: ahead.grip, read: ahead.aim, goal: first };
        const inner: IAutoMovieMotionHumanActionLaw.IGrip = {
          ...ahead.grip,
          posture: posture(shift),
        };
        state.depth = 1;
        try {
          state.invoke!(inner);
          if (state.fails)
            findings.push(
              "the inner demand failed to throw its owned sentinel",
            );
        } catch (error) {
          if (!state.fails || error !== sentinel) throw error;
        } finally {
          state.depth = 0;
        }
        const reads: number = jointReads;
        same("resumed outer candidate", first, ahead.aim(target, ahead.start), {
          x: 0,
          y: 0,
          z: 0,
        });
        state.extra = jointReads - reads;
      } else {
        state.inner = { grip: ahead.grip, read: ahead.aim, goal: first };
        same(
          "own person alias",
          first,
          ahead.aim(
            { kind: "person", subject: ahead.subject, region: "mouth" },
            ahead.start,
          ),
          { x: 0, y: 0, z: 0 },
        );
        if (state.fails) throw sentinel;
      }
      return [];
    },
    plan: (context: IAutoMovieMotionHumanActionContext): IAutoMovieMotionHumanActionPlan =>
      stand.plan({ ...context, params: { seconds: 0.1 } }),
  };
  const ask: IAutoMovieMotionHumanActionLaw = {
    name: "askNestedGrips",
    interrupts: stand.interrupts,
    plan: (context: IAutoMovieMotionHumanActionContext): IAutoMovieMotionHumanActionPlan => {
      state.invoke = context.demands;
      if (state.invoke === undefined)
        throw new Error(
          "the actual grip consumer lacks its public demands reader",
        );
      const grip: IAutoMovieMotionHumanActionLaw.IGrip = {
        prop: "glass",
        side: "right",
        posture: posture({ x: 0, y: 0, z: 0 }),
        tool: (
          points: Parameters<IAutoMovieMotionHumanActionLaw.IGrip["tool"]>[0],
        ): ReturnType<IAutoMovieMotionHumanActionLaw.IGrip["tool"]> =>
          StrikingHeld.of(context, "right", "glass", points),
      };
      state.single = true;
      jointReads = 0;
      state.invoke(grip);
      const single: number = jointReads;
      if (!(single > 0))
        findings.push("the single real candidate never read its stand joints");
      state.single = false;
      for (const fails of [false, true]) {
        state.fails = fails;
        state.outer = undefined;
        state.inner = undefined;
        state.extra = -1;
        grip.posture = posture({ x: 0, y: 0, z: 0 });
        jointReads = 0;
        state.invoke(grip);
        if (jointReads !== 2 * single || state.extra !== 0)
          findings.push(
            `nested ${fails ? "throw" : "return"}: ${jointReads} stand reads, expected ${2 * single}; resumed outer added ${state.extra}`,
          );
        const completed: {
          outer: Question | undefined;
          inner: Question | undefined;
        } = outcomes();
        if (completed.outer === undefined || completed.inner === undefined) {
          findings.push("the two actual candidate queries were not observed");
          continue;
        }
        const outer: Question = completed.outer;
        const inner: Question = completed.inner;
        same("nested translated candidate", outer.goal, inner.goal, shift);
        outer.grip.posture = posture(shift);
        inner.grip.posture = posture({ x: 0, y: 0, z: 0 });
        jointReads = 0;
        for (let i: number = 0; i < 2; i++) {
          same(
            "completed outer reads current posture",
            outer.goal,
            outer.read(target, context.start),
            shift,
          );
          same(
            "completed inner reads current posture",
            inner.goal,
            inner.read(target, context.start),
            { x: -shift.x, y: -shift.y, z: -shift.z },
          );
        }
        if (jointReads !== 4 * single)
          findings.push(
            `four completed callbacks read stand records ${jointReads} times, expected ${4 * single}`,
          );
        branches.add(fails ? "throw" : "return");
      }
      return stand.plan({ ...context, params: { seconds: 0.1 } });
    },
  };
  new HumanPerformance({
    seed: "reach",
    laws: [ask, inspect],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
        at: {
          x: 0.15,
          y: 0.58 * body.measure.stature,
          z: 0.17 * body.measure.stature,
        },
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "glass", handle: "body", hand: "right" })
      .registered("askNestedGrips", { prop: "glass" })
      .registered("inspectNestedDemands", { prop: "glass" }).node,
  });
  for (const branch of ["return", "throw"])
    if (!branches.has(branch))
      findings.push(
        `the actual nested ${branch} demand branch was never exercised`,
      );
  TestValidator.equals(
    "nested grip questions isolate active and completed aim scopes",
    findings,
    [],
  );
}
