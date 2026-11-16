import { createDrinkware } from "@automovie/archetypes";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanPosture,
  StrikingHeld,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Future-use aiming belongs to one candidate question. A law that keeps its
 * public aim callback must read the candidate's current real posture after
 * that question returns or throws, rather than keep its old bone cache.
 *
 * A small canonical Human picks up the actual glass used by the existing
 * pickup-reach regression. Two registered consumers return the real stand
 * plan: the first asks the public demands reader, and the second observes
 * actual self-region aims. No replacement posture producer is installed.
 *
 * Scenarios:
 * 1. Within one query two aims agree and read the owned stand's joint
 *    records as often as a one-aim query, rather than resolve it twice.
 *    A second candidate's translated stance translates its anatomical point.
 * 2. After normal return and an owned demands exception, a retained aim
 *    follows a new stand posture supplied on the same candidate grip.
 * 3. Repeating that retained callback preserves both point and normal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real pickup fixture, public callback path, lifetime boundaries and rigid-translation oracle.
 * @evidence contracts/development/testing.md#behavioral-verification Builds one actual performance with a real prop, counts reads of an owned wrapper's actual stand joint records through context.demands, and reads the retained aim after return and throw; duplicate FK input work, stale candidate bones or leaked query state fail.
 * @evidence contracts/development/testing.md#independent-expectations Rigidly translating the whole canonical stand by the declared vector translates any own anatomical region by that vector and leaves its normal unchanged; no cache state or source-pattern oracle is read.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeated aims, two candidate postures, the same grip with a later actual stance, successful/throwing demand callbacks and repeated retained calls. Nested query work counts remain a separate scope obligation.
 * @evidence contracts/development/testing.md#execution-ownership One polygon Human and actual glass, owned registered callbacks and ordinary stand plans in memory; no engine function, global or private API is replaced.
 */
export function test_human_motion_core_ahead_lifetime(): void {
  type Aim = IHumanActionContext["aim"];
  type Goal = ReturnType<Aim>;
  const body: IHumanBody = { ...motionHumanBody("f-small") };
  const target: AutoMovieMotionTarget = { kind: "self", region: "mouth" };
  const shift: IAutoMovieVector3 = { x: 0.7, y: 0, z: -0.4 };
  const complaints: string[] = [];
  const sentinel: Error = new Error("owned demands failure");
  let throwing: boolean = false;
  let aims: number = 2;
  let jointReads: number = 0;
  let retained: Aim | undefined;
  let observed: Goal | undefined;
  const observation: () => {
    read: Aim | undefined;
    goal: Goal | undefined;
  } = (): { read: Aim | undefined; goal: Goal | undefined } => ({
    read: retained,
    goal: observed,
  });
  const posture: (at: IAutoMovieVector3) => IHumanPosture = (
    at: IAutoMovieVector3,
  ): IHumanPosture => {
    const actual: IHumanPosture = stand.posture(body, at, 0);
    return {
      ...actual,
      get joints(): IHumanPosture["joints"] {
        jointReads++;
        return actual.joints;
      },
    };
  };
  const same: (
    label: string,
    one: Goal,
    two: Goal,
    translation: IAutoMovieVector3,
  ) => void = (
    label: string,
    one: Goal,
    two: Goal,
    translation: IAutoMovieVector3,
  ): void => {
    const gap: number = Math.hypot(
      two.point.x - one.point.x - translation.x,
      two.point.y - one.point.y - translation.y,
      two.point.z - one.point.z - translation.z,
    );
    const normal: number =
      one.normal === undefined || two.normal === undefined
        ? Infinity
        : Math.hypot(
            two.normal.x - one.normal.x,
            two.normal.y - one.normal.y,
            two.normal.z - one.normal.z,
          );
    if (!(gap <= 1e-9 && normal <= 1e-9))
      complaints.push(`${label}: point ${gap} m, normal ${normal}`);
  };
  const inspect: IHumanActionLaw = {
    name: "inspectDemands",
    interrupts: stand.interrupts,
    demands: (
      ahead: IHumanActionLaw.IAhead,
    ): readonly IHumanActionLaw.IDemand[] => {
      retained = ahead.aim;
      const first: Goal = ahead.aim(target, ahead.start);
      if (aims === 2)
        same(
          "two aims inside one question",
          first,
          ahead.aim(target, ahead.start),
          { x: 0, y: 0, z: 0 },
        );
      observed = first;
      if (throwing) throw sentinel;
      return [];
    },
    plan: (context: IHumanActionContext): IHumanActionPlan =>
      stand.plan({ ...context, params: { seconds: 0.1 } }),
  };
  const ask: IHumanActionLaw = {
    name: "askGrips",
    interrupts: stand.interrupts,
    plan: (context: IHumanActionContext): IHumanActionPlan => {
      for (const fails of [false, true]) {
        throwing = false;
        retained = undefined;
        observed = undefined;
        const grip: IHumanActionLaw.IGrip = {
          prop: "glass",
          side: "right",
          posture: posture({ x: 0, y: 0, z: 0 }),
          tool: (
            points: Parameters<IHumanActionLaw.IGrip["tool"]>[0],
          ): ReturnType<IHumanActionLaw.IGrip["tool"]> =>
            StrikingHeld.of(context, "right", "glass", points),
        };
        aims = 1;
        jointReads = 0;
        context.demands!(grip);
        const once: number = jointReads;
        if (!(once > 0))
          complaints.push("the real stand's joint records were never read");
        aims = 2;
        throwing = fails;
        jointReads = 0;
        try {
          context.demands!(grip);
          if (fails) complaints.push("throwing demand returned normally");
        } catch (error) {
          if (!fails || error !== sentinel) throw error;
        }
        if (jointReads !== once)
          complaints.push(
            `two aims read stand joint records ${jointReads} times; one aim read ${once}`,
          );
        const outcome: { read: Aim | undefined; goal: Goal | undefined } =
          observation();
        const read: Aim | undefined = outcome.read;
        const origin: Goal | undefined = outcome.goal;
        if (read === undefined || origin === undefined) {
          complaints.push("the future law was not asked about the actual grip");
          continue;
        }
        grip.posture = posture(shift);
        const moved: Goal = read(target, context.start);
        same(
          `retained aim after ${fails ? "throw" : "return"}`,
          origin,
          moved,
          shift,
        );
        same("repeated retained aim", moved, read(target, context.start), {
          x: 0,
          y: 0,
          z: 0,
        });
        throwing = false;
        context.demands!(grip);
        const repeated: Goal | undefined = observation().goal;
        if (repeated === undefined)
          complaints.push("a second candidate question was not observed");
        else same("a translated candidate question", origin, repeated, shift);
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
      .registered("askGrips", { prop: "glass" })
      .registered("inspectDemands", { prop: "glass" }).node,
  });
  TestValidator.equals(
    "future-use aims release each question's bones",
    complaints,
    [],
  );
}
