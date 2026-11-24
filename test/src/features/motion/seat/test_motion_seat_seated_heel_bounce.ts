import { createRailPlatform } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeatedHeelBounce,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A 10-degree seated heel rocker repeats at the authored frequency while
 * retaining the seat and opposite foot supports. Check one right-foot beat on
 * ground and two left-foot beats on an elevated, named support.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed foot sockets and joints at each half-beat and each return, as well as the declared contact windows and refusals.
 * @evidence contracts/development/testing.md#independent-expectations Predicts peak heel rise by rotating the displayed heel-to-ball vector by the authored angle, and duration from the authored rate.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite sides and body builds, one and two beats, ground and prop supports, standing entry and excessive amplitude.
 * @evidence contracts/development/testing.md#execution-ownership Builds the public chain on prepared bodies with an in-memory rail platform.
 * @evidence contracts/development/common.md#meaningful-documentation Names the body motion, contact invariants and analytic sampling instants.
 */
export function test_motion_seat_seated_heel_bounce(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = [];
  const platform: ReturnType<typeof createRailPlatform> = createRailPlatform();
  for (const name of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const props: IAutoMovieMotionHumanSeatedHeelBounce =
        name === "m-average"
          ? { side: "right", count: 1, cadence: 2, amplitude: 10 }
          : { side: "left", count: 2, cadence: 3, amplitude: 10 };
      const elevated: boolean = name === "f-small";
      const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      const at: IAutoMovieVector3 = elevated
        ? platform.affordance("platform").frame.translation
        : origin;
      const floor: number = at.y;
      const perform = (
        amplitude: number,
        startsSeated: boolean,
        side: string = props.side,
      ): IAutoMovieMotionHumanPerformance => {
        let chain: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
          "a",
        ).stand({
          hold: 0.3,
          sway: 0,
          ...(elevated ? { on: { prop: "platform" } } : {}),
        });
        if (startsSeated)
          chain = chain.sit({
            seat: {
              at: {
                x: at.x,
                y: floor + AutoMovieMotionHumanSeat.seated.popliteal(body),
                z: body.rest.get("leftFoot")!.z - 0.1,
              },
              yaw: 0,
              depth: 0.45,
            },
            hold: 0.4,
          });
        return new HumanPerformance({
          seed: "heel-bounce",
          props: elevated
            ? [
                HumanObject.prop("platform", platform, {
                  at: origin,
                  yaw: 0,
                  fixed: true,
                }),
              ]
            : [],
          performers: [
            {
              subject: "a",
              body,
              at,
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          laws: [AutoMovieMotionHumanSeat.seatedHeelBounce],
          composition: chain.registered(
            AutoMovieMotionHumanSeat.seatedHeelBounce.name,
            {
              ...props,
              amplitude,
              side,
            },
          ).node,
        });
      };
      const performance: IAutoMovieMotionHumanPerformance = perform(
        props.amplitude,
        true,
      );
      const bounce: IAutoMovieMotionHumanSegment = performance
        .segments("a")
        .at(-1)!;
      const other: "leftFoot" | "rightFoot" =
        props.side === "left" ? "rightFoot" : "leftFoot";
      const moving: "leftFoot" | "rightFoot" = `${props.side}Foot`;
      const beginning: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("a", bounce.start);
      const [heel, ball, toe] = HumanFoot.sockets(body, beginning, props.side);
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        beginning.get(moving)!.worldRotation,
        { x: 1, y: 0, z: 0 },
      );
      const radius: IAutoMovieVector3 = Vector3.subtract(
        heel!.point,
        ball!.point,
      );
      const expectedRise: number =
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(axis, props.amplitude),
          radius,
        ).y - radius.y;

      if (Math.abs(bounce.plan.duration - props.count / props.cadence) > 1e-8)
        findings.push(
          `${name}: the duration does not match the beat count and cadence`,
        );
      for (const [part, kind, from] of [
        [moving, "pivot", 0],
        [moving, "plant", 1],
        [other, "plant", 0],
        ["seat", "seat", 0],
      ] as const) {
        const contact: IAutoMovieMotionHumanContactWindow | undefined =
          bounce.plan.contacts.find(
            (window: IAutoMovieMotionHumanContactWindow): boolean =>
              window.part === part && window.kind === kind,
          );
        if (
          contact?.from !== from ||
          contact.to !== 1 ||
          (elevated
            ? contact.support.kind !== "prop" ||
              contact.support.subject !== "platform"
            : contact.support.kind !== "ground")
        )
          findings.push(
            `${name}: the ${part} does not retain its ${kind} on the entry support`,
          );
      }
      for (let i: number = 1; i <= 2 * props.count; ++i) {
        const seconds: number = bounce.start + i / (2 * props.cadence);
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          performance.bones("a", seconds);
        const [
          shownHeel,
          shownBall,
          shownToe,
        ]: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
          body,
          bones,
          props.side,
        );
        const rise: number = shownHeel!.point.y - heel!.point.y;
        const expected: number = i % 2 === 0 ? 0 : expectedRise;
        if (Math.abs(rise - expected) > 0.003)
          findings.push(
            `${name} at half-beat ${i}: heel rise ${rise} m, expected ${expected} m`,
          );
        if (
          Vector3.length(Vector3.subtract(shownBall!.point, ball!.point)) >
            0.002 ||
          Math.abs(shownToe!.point.y - toe!.point.y) > 0.002 ||
          Math.min(shownBall!.point.y, shownToe!.point.y) < floor - 0.003
        )
          findings.push(
            `${name} at half-beat ${i}: forefoot slipped or penetrated its support`,
          );
        const knee: AutoMovieHumanoidBone = `${props.side}LowerLeg`;
        const kneeTravel: number = Vector3.length(
          Vector3.subtract(
            bones.get(knee)!.worldPosition,
            beginning.get(knee)!.worldPosition,
          ),
        );
        if (i % 2 === 0 ? kneeTravel > 0.002 : kneeTravel <= 0.002)
          findings.push(
            `${name} at half-beat ${i}: unexpected knee travel ${kneeTravel} m`,
          );
        for (const bone of ["hips", other] as const) {
          const displacement: number = Vector3.length(
            Vector3.subtract(
              bones.get(bone)!.worldPosition,
              beginning.get(bone)!.worldPosition,
            ),
          );
          if (displacement > 0.002)
            findings.push(
              `${name} at half-beat ${i}: ${bone} moved ${displacement} m`,
            );
        }
      }
      if (elevated) continue;
      for (const [value, startsSeated, side, expected] of [
        [props.amplitude, false, props.side, "base"],
        [120, true, props.side, "amplitude"],
        [props.amplitude, false, "both", "side"],
      ] as const) {
        let caught: unknown;
        try {
          perform(value, startsSeated, side);
        } catch (error) {
          caught = error;
        }
        if (!(caught instanceof HumanRefusal && caught.axis === expected))
          findings.push(
            `${name}: expected refusal on ${expected}, got ${String(caught)}`,
          );
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.equals("the seated heel bounces on a planted forefoot", findings, []);
  checks.assert("seat seated heel bounce");
}
