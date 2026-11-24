import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A stagehand sets a parcel onto a translating socket and opens the hand
 * while matching the carrier's speed.
 *
 * Scenarios:
 * 1. After a half-second hold, the built-in placement brings the parcel's
 *    offset socket within 15 mm of the socket on a mounted receiver and
 *    preserves that placement. The displayed wrist moves with the receiver
 *    while the fingers open.
 * 2. Without a source socket, the kept offset puts the parcel origin on the seat.
 * 3. A turning track and a track with a zero quaternion are refused on `onto`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the clock, placement, opening and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public putDown chain and reads the displayed parcel and wrist before and after mounting.
 * @evidence contracts/development/testing.md#independent-expectations Computes the receiving socket from its authored position, attitude and horizontal speed. The aperture placement specification supplies 15 mm and 15 degrees for socket alignment and 1 mm for mounting continuity. The 3 mm travel tolerance distinguishes tracking the 18.6 mm displacement from keeping the wrist fixed.
 * @evidence contracts/development/testing.md#distinguishing-cases Omits the source socket in the origin case and changes only track rotation in the invalid cases. Samples distinguish placement, opening continuity and mounted travel.
 * @evidence contracts/development/testing.md#execution-ownership Builds one polygon body and in-memory performances with the same carrier path and seat geometry.
 */
export function test_motion_prehension_moving_socket_put_down(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const hand: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(
      body,
      AutoMovieMotionHumanStance.stand.posture(body, origin, 0),
    ),
  ).get("rightHand")!;
  const seat: IAutoMovieVector3 = Vector3.add(hand.worldPosition, {
    x: 0.02,
    y: 0.08,
    z: 0.08,
  });
  const speed: number = 0.12;
  const via: IAutoMovieVector3 = { x: 0.015, y: 0, z: 0 };
  const worldVia: IAutoMovieVector3 = Quaternion.rotateVector(
    hand.worldRotation,
    via,
  );
  const hold: IAutoMovieMotionHumanActionLaw = {
    name: "holdParcel",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan({
        ...context,
        params: { hold: 0.5, sway: 0 },
      }),
      holds: [{ side: "right", prop: "parcel", from: 0 }],
    }),
  };
  const parcel: IAutoMovieMotionHumanProp = {
    subject: "parcel",
    frame: { position: hand.worldPosition, rotation: hand.worldRotation },
    points: {},
    affordances: [
      {
        id: "base",
        kind: "socket",
        frame: Transform.of(via, Quaternion.identity()),
        extent: null,
      },
    ],
  };
  const stage = (
    track: "translate" | "turn" | "malformed",
    viaSocket: boolean = true,
  ): HumanPerformance => {
    const carrier: IAutoMovieMotionHumanProp = {
      subject: "carrier",
      frame: { position: origin, rotation: Quaternion.identity() },
      points: {},
      affordances: [
        {
          id: "rack",
          kind: "socket",
          frame: Transform.of(origin, Quaternion.identity()),
          extent: null,
        },
      ],
      motion: (seconds: number): IAutoMovieRigidTransform => ({
        position: { ...origin, z: speed * seconds },
        rotation:
          track === "turn"
            ? Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 20 * seconds)
            : track === "malformed"
              ? { x: 0, y: 0, z: 0, w: 0 }
              : Quaternion.identity(),
      }),
    };
    const receiver: IAutoMovieMotionHumanProp = {
      subject: "receiver",
      frame: { position: origin, rotation: Quaternion.identity() },
      points: {},
      mounted: {
        prop: "carrier",
        point: "rack",
        offset: { position: origin, rotation: Quaternion.identity() },
      },
      affordances: [
        {
          id: "seat",
          kind: "socket",
          frame: Transform.of(
            viaSocket ? Vector3.add(seat, worldVia) : seat,
            hand.worldRotation,
          ),
          extent: null,
        },
      ],
    };
    return new HumanPerformance({
      seed: "moving-socket-placement",
      performers: [
        {
          subject: "actor",
          body,
          at: origin,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        carrier,
        receiver,
        viaSocket
          ? parcel
          : {
              ...parcel,
              frame: {
                ...parcel.frame,
                position: Vector3.add(parcel.frame.position, worldVia),
              },
            },
      ],
      laws: [hold],
      composition: HumanChain.subject("actor")
        .registered("holdParcel")
        .putDown({
          prop: "parcel",
          onto: {
            prop: "receiver",
            point: "seat",
            ...(viaSocket ? { via: "base" } : {}),
          },
        })
        .stand({ hold: 1 }).node,
    });
  };
  const film: HumanPerformance = stage("translate");
  const segment: IAutoMovieMotionHumanSegment = film.segments("actor")[1]!;
  const placed: number = segment.start + segment.plan.contact!;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  const expected = (t: number): IAutoMovieVector3 => ({
    ...seat,
    z: seat.z + speed * t,
  });
  TestValidator.predicate(
    "placement uses the nonzero film clock",
    segment.start >= 0.5,
  );
  for (const t of [
    placed - 0.001,
    placed,
    placed + 0.001,
    segment.end + 0.25,
  ]) {
    const parcelFrame: IAutoMovieRigidTransform = film.prop("parcel", t);
    TestValidator.predicate(
      `the two named sockets coincide at ${t} s`,
      distance(
        Vector3.add(
          parcelFrame.position,
          Quaternion.rotateVector(parcelFrame.rotation, via),
        ),
        Vector3.add(expected(t), worldVia),
      ) <= 0.015,
    );
    TestValidator.predicate(
      `the socket attitudes align at ${t} s`,
      Quaternion.angle(parcelFrame.rotation, hand.worldRotation) <=
        Math.PI / 12,
    );
  }
  TestValidator.predicate(
    "mounting preserves the displayed frame across the contact",
    distance(
      film.prop("parcel", placed - 0.001).position,
      film.prop("parcel", placed + 0.001).position,
    ) <= 0.001,
  );
  const mountedA: number = segment.end + 0.1;
  const mountedB: number = segment.end + 0.4;
  TestValidator.predicate(
    "the mounted parcel moves 36 mm after the hand withdraws",
    distance(
      Vector3.subtract(
        film.prop("parcel", mountedB).position,
        film.prop("parcel", mountedA).position,
      ),
      { x: 0, y: 0, z: speed * (mountedB - mountedA) },
    ) <= 0.001,
  );
  const openingA: number = placed + 0.025;
  const openingB: number = placed + 0.18;
  const wrist = (t: number): IAutoMovieVector3 =>
    film.bones("actor", t).get("rightHand")!.worldPosition;
  TestValidator.predicate(
    "the displayed wrist crosses into opening within 1 mm of the carrier's travel",
    distance(Vector3.subtract(wrist(placed + 0.001), wrist(placed - 0.001)), {
      x: 0,
      y: 0,
      z: speed * 0.002,
    }) <= 0.001,
  );
  for (const t of [openingA, openingB])
    TestValidator.predicate(
      `the opening wrist follows the socket at ${t} s`,
      distance(wrist(t), expected(t)) <= 0.015,
    );
  TestValidator.predicate(
    "the displayed wrist matches the opening window's 18.6 mm travel",
    distance(Vector3.subtract(wrist(openingB), wrist(openingA)), {
      x: 0,
      y: 0,
      z: speed * (openingB - openingA),
    }) <= 0.003,
  );

  const originPlacement: HumanPerformance = stage("translate", false);
  const originSegment: IAutoMovieMotionHumanSegment =
    originPlacement.segments("actor")[1]!;
  const originContact: number =
    originSegment.start + originSegment.plan.contact!;
  TestValidator.predicate(
    "without a source socket the offset parcel origin meets the seat",
    distance(
      originPlacement.prop("parcel", originContact).position,
      expected(originContact),
    ) <= 0.01,
  );

  for (const track of ["turn", "malformed"] as const) {
    let refusal: unknown;
    try {
      stage(track).segments("actor");
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `the ${track} socket is outside the rigid direct placement track`,
      refusal instanceof HumanRefusal && refusal.axis === "onto",
    );
  }
}
