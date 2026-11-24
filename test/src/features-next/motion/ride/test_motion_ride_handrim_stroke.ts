import {
  createWheelchair,
  rideWheelchair,
  wheelchairHandrimFrame,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHandrimStroke,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { fittedWheelchair } from "../../../features/internal/fittedWheelchair";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A seated rider follows the moving material of both wheelchair rims
 * for the push, releases, and continues on the seat while the rims
 * roll away from the hands. Slowik et al. 2015, Table 1
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1) measured level
 * strokes of 78.3 degrees and 37.6% contact at 0.890 Hz. This fixture
 * stages those means on a straight course using a low seat and forward axle.
 *
 * Scenarios:
 *
 * 1. On two body builds, a translated, yawed chair keeps the wrists
 *    within 10 mm of the expected wrist targets at catch, mid-push and
 *    release. Targets add the assumed palm thickness and the inward grip
 *    span to the independently calculated material points. In recovery
 *    the hands move relative to the chair and return to the ordinary
 *    seated entry pose within 10 mm, measured in the chair frame.
 * 2. The seat moves at most 10 mm relative to its chair at each sampled time.
 *    The hands' ownership begins at catch and ends at release.
 *    A sample shares one carrier frame across the posture and both hands.
 * 3. The stock chair fits a 30 degree arc on the average body. Refuse the
 *    longer arc on that chair, absent rims, a center-only point, swapped
 *    sides, a different chair's seat, a lower arc, and zero push duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged kinematics, bounds, body cases and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed wrists and seat from a composed HumanPerformance and checks the planned windows against the authored stroke clock.
 * @evidence contracts/development/testing.md#independent-expectations The expected circular points come from rolling distance divided by the rear wheel radius and the declared rim dimensions. The calculation never calls the specialized contact reader.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body builds, off-origin placement and yaw, three phases, a seated baseline for recovery, and invalid inputs.
 * @evidence contracts/development/testing.md#execution-ownership Builds archetypes and performers in memory and invokes the public registered-action entry.
 */
export function test_motion_ride_handrim_stroke(): void {
  const measuredArc: number = 78.3;
  const cycle: number = 1 / 0.89;
  const push: number = cycle * 0.376;
  const approach: number = 0.45;
  const recovery: number = cycle - push;
  const radians: number = Math.PI / 180;
  const params: IAutoMovieMotionHumanHandrimStroke = {
    on: "chair",
    rims: { left: "leftRim", right: "rightRim" },
    approach,
    push,
    recovery,
  };
  const notes: string[] = [];
  const contactGap: number = 0.01;
  for (const [key, stock] of [
    ["m-average", false],
    ["f-small", false],
    ["m-average", true],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
    const chair: ReturnType<typeof createWheelchair> = stock
      ? createWheelchair({ kind: "selfPropelled" }, 2)
      : fittedWheelchair(key === "f-small" ? 0.38 : 0.41);
    const wheelRadius: number = chair.dimensions.wheelDiameter! / 2;
    const arc: number = stock ? 30 : measuredArc;
    const catchAngle: number = -arc / 2;
    const cruise: number = (wheelRadius * arc * radians) / push;
    const route = (speed: number): ReturnType<typeof rideWheelchair> =>
      rideWheelchair(chair, {
        start: { x: 2, z: -1, heading: 63 },
        legs: [{ kind: "straight", length: 4 }],
        cruise: speed,
        acceleration: speed / 0.1,
        deceleration: speed / 0.2,
      });
    const course: ReturnType<typeof rideWheelchair> = route(cruise);
    const initial: IAutoMovieTransform = course.at(0).placement;
    const origin: IAutoMovieRigidTransform = {
      position: initial.translation,
      rotation: initial.rotation,
    };
    const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
      chair,
      origin,
      "seat",
    );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(origin.rotation, {
      x: 0,
      y: 0,
      z: 0.2,
    });
    const other: IAutoMovieRigidTransform = {
      ...origin,
      position: { ...origin.position, x: origin.position.x + 1.2 },
    };
    const otherSeat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
      chair,
      other,
      "seat",
    );
    const performer = (
      sitting: ReturnType<typeof HumanObject.seat>,
    ): ConstructorParameters<
      typeof HumanPerformance
    >[0]["performers"][number] => ({
      subject: "actor",
      body,
      at: { x: sitting.at.x + ahead.x, y: 0, z: sitting.at.z + ahead.z },
      yaw: sitting.yaw,
      proficiency: { level: "trained" },
    });
    const prepare = (
      sitting: ReturnType<typeof HumanObject.seat> = seat,
    ): ReturnType<typeof HumanChain.subject> =>
      HumanChain.subject("actor").sit({ seat: sitting });
    const prepared: HumanPerformance = new HumanPerformance({
      seed: "handrim",
      performers: [performer(seat)],
      composition: prepare().node,
    });
    // The chair starts moving during approach and cruises during the push.
    const courseAtCatch: number = 0.3;
    const begins: number = prepared.duration + approach - courseAtCatch;
    const clock = (film: number): number => Math.max(0, film - begins);
    const placed = (
      film: number,
      ride: ReturnType<typeof rideWheelchair> = course,
    ): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = ride.at(clock(film)).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const bearing: ReturnType<typeof wheelchairHandrimFrame> =
      wheelchairHandrimFrame(course, courseAtCatch, catchAngle);
    const lowBearing: ReturnType<typeof wheelchairHandrimFrame> =
      wheelchairHandrimFrame(course, courseAtCatch, 180);
    /** The source of the rim point and the seat arrangement under test. */
    type Case =
      | "stroke"
      | "hub"
      | "transport"
      | "wrongSeat"
      | "low"
      | "wideArc";
    let frameReads: number = 0;
    const perform = (
      stroke: IAutoMovieMotionHumanHandrimStroke,
      kind: Case,
    ): HumanPerformance => {
      const ride: ReturnType<typeof rideWheelchair> =
        kind === "wideArc"
          ? route((wheelRadius * measuredArc * radians) / push)
          : course;
      const points: ReturnType<typeof wheelchairHandrimFrame> =
        kind === "wideArc"
          ? wheelchairHandrimFrame(ride, courseAtCatch, -measuredArc / 2)
          : kind === "hub"
            ? course.frame
            : kind === "low"
              ? lowBearing
              : bearing;
      return new HumanPerformance({
        seed: "handrim",
        performers: [performer(kind === "wrongSeat" ? otherSeat : seat)],
        laws: [AutoMovieMotionHumanRide.handrimStroke],
        props: [
          HumanObject.prop(
            "chair",
            kind === "transport"
              ? createWheelchair({ kind: "transport" }, 2)
              : chair,
            origin,
            (film: number): IAutoMovieRigidTransform => {
              ++frameReads;
              return placed(film, ride);
            },
            (id: string, film: number): IAutoMovieTransform =>
              points(id as createWheelchair.Affordance, clock(film)),
          ),
          HumanObject.prop("other-chair", chair, other),
        ],
        composition: prepare(
          kind === "wrongSeat" ? otherSeat : seat,
        ).registered("handrimStroke", stroke).node,
      });
    };

    const performance: HumanPerformance = perform(params, "stroke");
    const segment: IAutoMovieMotionHumanSegment =
      performance.segments("actor")[1]!;
    const catchAt: number = segment.entryTime + approach;
    const releaseAt: number = catchAt + push;
    const diagnostic = (ok: boolean, message: string): void => {
      if (!ok) notes.push(`${key} ${stock ? "stock" : "fitted"} ${message}`);
    };
    const readsBefore: number = frameReads;
    segment.plan.posture(approach + push / 2);
    diagnostic(
      frameReads - readsBefore === 1,
      "stroke did not share one carrier frame",
    );
    const middle: number = releaseAt + recovery / 2;
    const terminal: number = segment.end;
    const movingApproach: number =
      (Math.max(segment.entryTime, begins) + catchAt) / 2;
    const rimTimes: readonly number[] = [
      catchAt,
      catchAt + push / 2,
      releaseAt,
    ];
    const local = (
      frame: IAutoMovieRigidTransform,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(point, frame.position),
      );
    const samples: Map<
      number,
      {
        frame: IAutoMovieRigidTransform;
        bones: ReturnType<HumanPerformance["bones"]>;
      }
    > = new Map();
    for (const film of [
      segment.entryTime,
      movingApproach,
      ...rimTimes,
      middle,
      terminal,
    ])
      samples.set(film, {
        frame: placed(film),
        bones: performance.bones("actor", film),
      });
    // Rigid carriage preserves the original neutral wrists in chair coordinates.
    const rest: ReturnType<HumanPerformance["bones"]> = prepared.bones(
      "actor",
      prepared.duration,
    );
    for (const side of ["left", "right"] as const) {
      const rim: ReturnType<typeof chair.affordance> = chair.affordance(
        params.rims[side] as createWheelchair.Affordance,
      );
      const wrist = (film: number): IAutoMovieVector3 => {
        const sample: NonNullable<ReturnType<typeof samples.get>> =
          samples.get(film)!;
        return local(
          sample.frame,
          sample.bones.get(`${side}Hand`)!.worldPosition,
        );
      };
      const wristTarget = (film: number): IAutoMovieVector3 => {
        // The wheel rolls through distance divided by radius. The wrist sits
        // beyond the palm's centre on the outboard side of the rim circle.
        const angle: number =
          catchAngle * radians + (cruise * (film - catchAt)) / wheelRadius;
        const fromAxle: number = rim.radius! + 0.075 * body.measure.hand;
        return Vector3.add(rim.frame.translation, {
          x: (side === "left" ? 1 : -1) * 0.35 * body.measure.hand,
          y: fromAxle * Math.cos(angle),
          z: fromAxle * Math.sin(angle),
        });
      };
      for (const film of rimTimes) {
        const gap: number = Vector3.length(
          Vector3.subtract(wrist(film), wristTarget(film)),
        );
        diagnostic(
          gap <= contactGap,
          `${side} displayed wrist misses its rim grip by ${gap} m at ${film}`,
        );
      }
      const released: IAutoMovieVector3 = wrist(releaseAt);
      const recovered: IAutoMovieVector3 = wrist(middle);
      const outside: number = Vector3.length(
        Vector3.subtract(recovered, wristTarget(middle)),
      );
      const moved: number = Vector3.length(
        Vector3.subtract(recovered, released),
      );
      diagnostic(
        outside >= 0.5 * body.measure.hand,
        `${side} wrist did not release the rotating rim`,
      );
      diagnostic(
        moved >= 0.15 * body.measure.hand,
        `${side} recovery wrist stayed at the release point`,
      );
      const restGap: number = Vector3.length(
        Vector3.subtract(
          wrist(terminal),
          local(origin, rest.get(`${side}Hand`)!.worldPosition),
        ),
      );
      diagnostic(
        restGap <= contactGap,
        `${side} recovery misses the seated rest wrist by ${restGap} m`,
      );
      const grips: IAutoMovieMotionHumanContactWindow[] =
        segment.plan.contacts.filter(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.kind === "grip" && window.part === `${side}Hand`,
        );
      diagnostic(
        grips.length === 1 &&
          grips[0]!.support.kind === "prop" &&
          grips[0]!.support.subject === "chair" &&
          Math.abs(grips[0]!.from * segment.plan.duration - approach) < 1e-9 &&
          Math.abs(grips[0]!.to * segment.plan.duration - approach - push) <
            1e-9,
        `${side} grip window departs from the authored phase times`,
      );
    }
    const seatRegion: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.seat;
    const seatOffset = (film: number): IAutoMovieVector3 => {
      const sample: NonNullable<ReturnType<typeof samples.get>> =
        samples.get(film)!;
      return local(
        sample.frame,
        resolveAutoMovieHumanoidSurfaces.place(
          seatRegion,
          sample.bones.get(seatRegion.bone)!,
        ).point,
      );
    };
    const initialOffset: IAutoMovieVector3 = seatOffset(segment.entryTime);
    for (const at of [movingApproach, ...rimTimes, middle, terminal]) {
      const slip: number = Vector3.length(
        Vector3.subtract(seatOffset(at), initialOffset),
      );
      diagnostic(
        slip <= 0.01,
        `seat slipped ${slip} m in the chair frame at ${at}`,
      );
    }

    if (stock) {
      const refusal = (
        kind: Case,
        stroke: IAutoMovieMotionHumanHandrimStroke,
        axis: string,
        reason: HumanRefusal["kind"],
      ): void => {
        try {
          perform(stroke, kind);
          diagnostic(
            false,
            `accepted the invalid ${kind} stroke targeting ${axis}`,
          );
        } catch (error) {
          diagnostic(
            error instanceof HumanRefusal &&
              error.axis === axis &&
              error.kind === reason,
            `expected a structured ${axis} refusal for ${kind}, got ${String(error)}`,
          );
        }
      };
      refusal("transport", params, "rims.left", "affordance");
      refusal("hub", params, "rims.left", "affordance");
      refusal(
        "stroke",
        { ...params, rims: { left: "rightRim", right: "leftRim" } },
        "rims.left",
        "affordance",
      );
      refusal("wrongSeat", params, "seat", "base");
      refusal("low", params, "rims.left", "reach");
      refusal("wideArc", params, "rims.left", "reach");
      refusal("stroke", { ...params, push: 0 }, "push", "parameter");
    }
  }
  TestValidator.equals(
    "seat continuity and bilateral handrim contact",
    notes,
    [],
  );
}
