import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanMutual,
  HumanRefusal,
} from "@automovie/motions";
import { AutoMovieMotionHumanAuditPartner } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import type { motionHumanLawSweep } from "../../../features/internal/motionHumanLawSweep";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/** A displayed palm's outer skin point and normal in world coordinates. */
interface IPalm {
  /** World metres. */
  point: IAutoMovieVector3;
  /** Unit outward normal. */
  normal: IAutoMovieVector3;
}

/**
 * Two performers meet with opposed palms at a shared instant.
 *
 * Scenarios:
 * 1. The same unequal pair meets high and low. Their displayed palms touch within 10 mm without excessive body penetration.
 * 2. Separating the shoulders beyond their combined reach is refused on partner.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans two heights and observes both palm frames, partner penetration and the public refusal axis.
 * @evidence contracts/development/testing.md#independent-expectations The frame and skin thickness determine the displayed point, opposed normals have a negative dot product, and the low contact must lie below the high contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Changes just the contact height or pair separation. The meeting-window unit checks the duration, and the fit unit checks reflection.
 * @evidence contracts/development/testing.md#execution-ownership Runs two in-memory meetings and one refusal on the same two bodies.
 * @evidence contracts/development/common.md#meaningful-documentation States both body types, the anatomical measurement and the skin limit.
 */
export function test_motion_ride_high_five_surfaces(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const a: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const people = (gap: number): motionHumanLawSweep.IPerson[] => [
    { subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0 },
    { subject: "b", body: b, at: { x: 0, y: 0, z: gap }, yaw: 180 },
  ];
  const perform = (
    kind: MeetingHeight,
    cast: motionHumanLawSweep.IPerson[],
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "mutual",
      cast,
      HumanChain.mutual(
        HumanMutual.highFive,
        { one: HumanChain.subject("a"), other: HumanChain.subject("b") },
        { kind, hand: "right" },
      ).node,
    );
  const cast: motionHumanLawSweep.IPerson[] = people(0.7);
  const heights: number[] = [];
  for (const kind of ["high", "low"] as const) {
    const film: motionHumanLaw.IFilm = perform(kind, cast);
    const meet: number = motionHumanLaw.event(film, "meet", "a");
    const release: number = motionHumanLaw.event(film, "rebound", "a");
    all.check(
      "the two roles meet together before rebound",
      Math.abs(meet - motionHumanLaw.event(film, "meet", "b")) < 1e-9 &&
        meet < release,
    );
    for (const seconds of [meet, (meet + release) / 2]) {
      const first: IPalm = palm(film, "a", a, seconds);
      const other: IPalm = palm(film, "b", b, seconds);
      const gap: number = Vector3.distance(first.point, other.point);
      all.check(`${kind}: palms are ${gap} m apart`, gap <= 0.01);
      all.check(
        "contact normals face each other",
        Vector3.dot(first.normal, other.normal) < 0,
      );
      if (seconds === meet) heights.push((first.point.y + other.point.y) / 2);
    }
    const worst: ReturnType<
      typeof AutoMovieMotionHumanAuditPartner.measure
    >["worst"] = AutoMovieMotionHumanAuditPartner.measure(
      film,
      cast[0]!,
      cast[1]!,
    ).worst;
    all.check(
      `${kind}: penetration ${worst.value} m at ${worst.seconds} s on ${worst.where}`,
      worst.value <= 0.01,
    );
  }
  all.check("the low contact is below the high one", heights[1]! < heights[0]!);
  let refusal: unknown;
  try {
    perform("high", people(2 * b.measure.stature));
  } catch (error: unknown) {
    refusal = error;
  }
  all.check(
    `separated arms refuse their partner: ${String(refusal)}`,
    refusal instanceof HumanRefusal &&
      refusal.kind === "reach" &&
      refusal.axis === "partner",
  );
  all.assert("two opposed palms meet at the requested height");
}

/** Transform the resting hand socket and its pad through the displayed wrist. */
function palm(
  film: motionHumanLaw.IFilm,
  who: string,
  body: IAutoMovieMotionHumanBody,
  seconds: number,
): IPalm {
  const wrist: IAutoMovieResolvedBone = film
    .bones(who, seconds)
    .get("rightHand")!;
  const rest: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["palmRight"] =
    body.surfaces.sockets.palmRight;
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    wrist.worldRotation,
    rest.normal,
  );
  const skin: number = AutoMovieMotionHumanTouchEffector.pad(body, "right", {
    surface: "palm",
    shape: "flat",
  });
  return {
    point: Vector3.addScaled(
      Vector3.add(
        wrist.worldPosition,
        Quaternion.rotateVector(wrist.worldRotation, rest.point),
      ),
      normal,
      skin,
    ),
    normal,
  };
}

/** The two prescribed palm heights. */
type MeetingHeight = "high" | "low";
