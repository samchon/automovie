import { createWheelchair, rideWheelchair, wheelchairHandrimFrame } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHandrimStroke,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanHandrimStroke, HumanObject, HumanPerformance, HumanRefusal, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seated rider follows the moving material of both wheelchair rims
 * for the push, releases, and continues on the seat while the rims
 * roll away from the hands. Slowik et al. 2015, Table 1
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1) measured level
 * strokes of 78.3 degrees and 37.6% contact at 0.890 Hz. This fixture
 * stages those means on a straight course and centers the arc at the top.
 *
 * Scenarios:
 *
 * 1. On two body builds, a translated, yawed chair keeps the wrists
 *    within 0.7 hand lengths of the expected material points at catch,
 *    mid-push and release. The 0.7 hand bound is the ride grips spec's
 *    anatomical wrist offset. Each hand moves at least half a hand length
 *    away from the continuing rim point in recovery.
 * 2. The seat moves at most 10 mm relative to its chair throughout. The
 *    hands' ownership begins at catch and ends at release.
 * 3. Refuse rims on a transport chair, a center-only callback, and zero
 *    push duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged kinematics, bounds, body cases and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed wrists and seat from a composed HumanPerformance and checks the planned windows against the authored stroke clock.
 * @evidence contracts/development/testing.md#independent-expectations The expected circular points come from rolling distance divided by the rear wheel radius and the declared rim dimensions. The calculation never calls the specialized contact reader.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body builds, off-origin placement and yaw, three phases and three invalid inputs.
 * @evidence contracts/development/testing.md#execution-ownership Builds archetypes and performers in memory and invokes the public registered-action entry.
 */
export function test_human_motion_ride_handrim_stroke(): void {
  const arc: number = 78.3;
  const cycle: number = 1 / 0.890;
  const push: number = cycle * 0.376;
  const approach: number = 0.45;
  const recovery: number = cycle - push;
  const catchAngle: number = -arc / 2;
  const radians: number = Math.PI / 180;
  const params: IAutoMovieMotionHumanHandrimStroke = {
    on: "chair", rims: { left: "leftRim", right: "rightRim" },
    approach, push, recovery,
  };
  const notes: string[] = [];
  for (const key of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
    const chair: ReturnType<typeof createWheelchair> = createWheelchair({ kind: "selfPropelled" }, 2);
    const wheelRadius: number = chair.dimensions.wheelDiameter! / 2;
    const cruise: number = (wheelRadius * arc * radians) / push;
    const course: ReturnType<typeof rideWheelchair> = rideWheelchair(chair, {
      start: { x: 2, z: -1, heading: 63 },
      legs: [{ kind: "straight", length: 4 }],
      cruise,
      acceleration: cruise / 0.1,
      deceleration: cruise / 0.2,
    });
    const initial: IAutoMovieTransform = course.at(0).placement;
    const origin: IAutoMovieRigidTransform = {
      position: initial.translation, rotation: initial.rotation,
    };
    const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(chair, origin, "seat");
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(origin.rotation, { x: 0, y: 0, z: 0.20 });
    const performer: ConstructorParameters<typeof HumanPerformance>[0]["performers"][number] = {
      subject: "actor", body,
      at: { x: seat.at.x + ahead.x, y: 0, z: seat.at.z + ahead.z },
      yaw: seat.yaw, proficiency: { level: "trained" },
    };
    const prepare = (): ReturnType<typeof HumanChain.subject> => HumanChain.subject("actor").sit({ seat });
    const prepared: HumanPerformance = new HumanPerformance({
      seed: "handrim", performers: [performer], composition: prepare().node,
    });
    // The chair starts moving during approach and cruises during the push.
    const courseAtCatch: number = 0.30;
    const begins: number = prepared.duration + approach - courseAtCatch;
    const clock = (film: number): number => Math.max(0, film - begins);
    const placed = (film: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = course.at(clock(film)).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const bearing: ReturnType<typeof wheelchairHandrimFrame> =
      wheelchairHandrimFrame(course, courseAtCatch, catchAngle);
    const perform = (
      stroke: IAutoMovieMotionHumanHandrimStroke,
      kind: "stroke" | "hub" | "transport",
    ): HumanPerformance => new HumanPerformance({
      seed: "handrim",
      performers: [performer],
      laws: [HumanHandrimStroke],
      props: [
        HumanObject.prop(
          "chair",
          kind === "transport" ? createWheelchair({ kind: "transport" }, 2) : chair,
          origin,
          placed,
          (id: string, film: number): IAutoMovieTransform =>
            (kind === "stroke" ? bearing : course.frame)(
              id as createWheelchair.Affordance, clock(film),
            ),
        ),
      ],
      composition: prepare().registered("handrimStroke", stroke).node,
    });

    const performance: HumanPerformance = perform(params, "stroke");
    const segment: IAutoMovieMotionHumanSegment = performance.segments("actor")[1]!;
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(performance, "actor", body, 0);
    const catchAt: number = segment.entryTime + approach;
    const releaseAt: number = catchAt + push;
    const diagnostic = (ok: boolean, message: string): void => {
      if (!ok) notes.push(key + " " + message);
    };
    for (const side of ["left", "right"] as const) {
      const rim: ReturnType<typeof chair.affordance> = chair.affordance(params.rims[side] as createWheelchair.Affordance);
      const distance = (film: number): number => {
        // During the cruise, forward distance is speed times elapsed time.
        const angle: number = catchAngle * radians + cruise * (film - catchAt) / wheelRadius;
        const local: IAutoMovieVector3 = Vector3.add(rim.frame.translation, {
          x: 0, y: rim.radius! * Math.cos(angle), z: rim.radius! * Math.sin(angle),
        });
        const world: IAutoMovieRigidTransform = placed(film);
        const target: IAutoMovieVector3 = Vector3.add(
          world.position, Quaternion.rotateVector(world.rotation, local),
        );
        const wrist: IAutoMovieVector3 = HumanSignature.joint(reader, film, `${side}Hand`);
        return Vector3.length(Vector3.subtract(wrist, target));
      };
      for (const film of [catchAt, catchAt + push / 2, releaseAt]) {
        const gap: number = distance(film);
        diagnostic(gap <= 0.7 * body.measure.hand, `${side} wrist is ${gap} m off the rim at ${film}`);
      }
      const away: number = distance(releaseAt + recovery / 2);
      diagnostic(away >= 0.5 * body.measure.hand, `${side} wrist follows the rotating rim after release, gap ${away} m`);
      const grips: IAutoMovieMotionHumanContactWindow[] = segment.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "grip" && window.part === `${side}Hand`,
      );
      diagnostic(
        grips.length === 1 && grips[0]!.support.kind === "prop" && grips[0]!.support.subject === "chair" &&
        Math.abs(grips[0]!.from * segment.plan.duration - approach) < 1e-9 &&
        Math.abs(grips[0]!.to * segment.plan.duration - approach - push) < 1e-9,
        `${side} grip window departs from the authored phase times`,
      );
    }
    const seatOffset = (film: number): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = placed(film);
      return Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(HumanSignature.region(reader, "seat", film), frame.position),
      );
    };
    const initialOffset: IAutoMovieVector3 = seatOffset(segment.entryTime);
    for (let sample: number = 1; sample <= 8; ++sample) {
      const at: number = segment.entryTime + segment.plan.duration * sample / 8;
      const slip: number = Vector3.length(Vector3.subtract(seatOffset(at), initialOffset));
      diagnostic(slip <= 0.01, `seat slipped ${slip} m in the chair frame at ${at}`);
    }

    if (key === "m-average") {
      const refusal = (
        kind: "stroke" | "hub" | "transport",
        stroke: IAutoMovieMotionHumanHandrimStroke,
        axis: string,
      ): void => {
        try {
          perform(stroke, kind);
          diagnostic(false, `accepted the invalid ${kind} stroke targeting ${axis}`);
        } catch (error) {
          diagnostic(
            error instanceof HumanRefusal && error.axis === axis,
            `expected a structured ${axis} refusal for ${kind}, got ${String(error)}`,
          );
        }
      };
      refusal("transport", params, "rims.left");
      refusal("hub", params, "rims.left");
      refusal("stroke", { ...params, push: 0 }, "push");
    }
  }
  TestValidator.equals("seat continuity and bilateral handrim contact", notes, []);
}
