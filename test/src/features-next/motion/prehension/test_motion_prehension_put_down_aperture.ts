import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPutDownAperture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { putDownAperture } = AutoMovieMotionHumanPrehension;

/**
 * A held solid object aligns at an opening, moves to a seat, and stays on
 * its receptacle while the empty hand leaves through the opening.
 *
 * Scenarios:
 * 1. Two different polygon bodies carry through a horizontal and an oblique
 *    opening. The displayed object tracks the authored insertion line within
 *    15 mm at interior quarter phases, aligns within 15 degrees on arrival,
 *    and changes by at most 1 mm across the aperture and mounting instants.
 * 2. The seated object follows a later receptacle translation by 1 mm after
 *    the hand has withdrawn.
 * 3. A missing opening, incompatible attitude, and unreachable opening refuse.
 *    The built-in placement still has only its usual events.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the actors, path, ordered events, refusal cases and measured bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Installs the typed law through the public chain and reads displayed object frames and the grip and mounting boundaries.
 * @evidence contracts/development/testing.md#independent-expectations Expected positions come from the authored opening, seat and receiver translation. Ossmy et al. use 15 degrees for aperture alignment. The campaign specifies 15 mm for target contact and 1 mm for rigid grip.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks two insertion directions and body proportions, three incompatible requests and ordinary placement.
 * @evidence contracts/development/testing.md#execution-ownership Uses local canonical skeleton fixtures and the in-memory resolver without a viewer.
 */
export function test_motion_prehension_put_down_aperture(): void {
  const Chain: IAutoMovieMotionHumanChain.IExtension<{
    putDownAperture: typeof putDownAperture;
  }> = HumanChain.extend({ putDownAperture });
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
  for (const [name, slope] of [
    ["m-average", 0],
    ["f-small", 0.04],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const hand: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(
        body,
        AutoMovieMotionHumanStance.stand.posture(body, origin, 0),
      ),
    ).get("rightHand")!;
    const start: IAutoMovieVector3 = hand.worldPosition;
    const mouth: IAutoMovieVector3 = Vector3.add(start, {
      x: 0,
      y: 0.09,
      z: 0.07,
    });
    const path: IAutoMovieVector3 = { x: 0.035, y: slope, z: 0.11 };
    const seat: IAutoMovieVector3 = Vector3.add(mouth, path);
    const shift: IAutoMovieVector3 = { x: 0.12, y: 0, z: 0 };
    const rotation: IAutoMovieRigidTransform["rotation"] = hand.worldRotation;
    const offset: IAutoMovieVector3 = { x: 0, y: 0.02, z: 0 };
    const socket = (
      id: string,
      position: IAutoMovieVector3,
      attitude: IAutoMovieRigidTransform["rotation"] = rotation,
    ): IAutoMovieAffordance => ({
      id,
      kind: "socket",
      frame: Transform.of(Vector3.subtract(position, offset), attitude),
      extent: null,
    });
    const receiver: IAutoMovieMotionHumanProp = {
      subject: "case",
      frame: { position: offset, rotation: Quaternion.identity() },
      points: {},
      affordances: [
        socket("opening", mouth),
        socket("seat", seat),
        socket("far", { ...mouth, z: mouth.z + 2 }),
        socket(
          "twisted",
          mouth,
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
            rotation,
          ),
        ),
      ],
      motion: (seconds: number): IAutoMovieRigidTransform => ({
        position: Vector3.add(
          offset,
          Vector3.scale(shift, Math.max(0, Math.min(1, seconds - 8))),
        ),
        rotation: Quaternion.identity(),
      }),
    };
    const parcel: IAutoMovieMotionHumanProp = {
      subject: "parcel",
      frame: {
        position: start,
        rotation: Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 25),
          rotation,
        ),
      },
      points: {},
    };
    const stage = (aperture?: string): HumanPerformance => {
      const chain: ReturnType<typeof Chain.subject> =
        Chain.subject("actor").registered("holdParcel");
      const placed: IAutoMovieMotionHumanChain =
        aperture === undefined
          ? chain.putDown({ prop: "parcel", to: seat })
          : chain.putDownAperture({
              prop: "parcel",
              onto: { prop: "case", aperture, point: "seat" },
            } satisfies IAutoMovieMotionHumanPutDownAperture);
      return new HumanPerformance({
        seed: "place-through-opening",
        performers: [
          {
            subject: "actor",
            body,
            at: origin,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        laws: [hold, putDownAperture],
        props: [receiver, parcel],
        composition: placed.stand({ hold: 10 }).node,
      });
    };
    const film: HumanPerformance = stage("opening");
    const segment: IAutoMovieMotionHumanSegment = film.segments("actor")[1]!;
    const event = (name: string): number =>
      segment.start +
      segment.plan.duration *
        (segment.plan.events.find(
          (item: IAutoMovieMotionEvent): boolean => item.name === name,
        )?.share ?? NaN);
    const aperture: number = event("aperture");
    const placed: number = event("placed");
    const release: number = event("release");
    const frame = (seconds: number): IAutoMovieRigidTransform =>
      film.prop("parcel", seconds);
    const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(a, b));

    TestValidator.predicate(
      name + " order",
      aperture > segment.start &&
        aperture < placed &&
        placed < release &&
        segment.end < 8,
    );
    const opening: IAutoMovieRigidTransform = frame(aperture);
    const seated: IAutoMovieRigidTransform = frame(placed);
    TestValidator.predicate(
      name + " aligns at the aperture",
      distance(opening.position, mouth) <= 0.015 &&
        Quaternion.angle(opening.rotation, rotation) <= Math.PI / 12,
    );
    const length: number = Vector3.length(path);
    const axis: IAutoMovieVector3 = Vector3.scale(path, 1 / length);
    for (const phase of [0.25, 0.5, 0.75]) {
      const t: number = aperture + (placed - aperture) * phase;
      const delta: IAutoMovieVector3 = Vector3.subtract(
        frame(t).position,
        mouth,
      );
      const depth: number = Vector3.dot(delta, axis);
      TestValidator.predicate(
        name + " insertion along the authored corridor at phase " + phase,
        depth >= -0.015 &&
          depth <= length + 0.015 &&
          Vector3.length(Vector3.subtract(delta, Vector3.scale(axis, depth))) <=
            0.015,
      );
    }
    for (const time of [aperture, placed])
      TestValidator.predicate(
        name + " crosses without a position jump at " + time,
        distance(frame(time - 1e-4).position, frame(time + 1e-4).position) <=
          0.001,
      );
    TestValidator.predicate(
      name + " stays seated through opening the hand and moves with the case",
      distance(seated.position, seat) <= 0.001 &&
        distance(frame(release).position, seat) <= 0.001 &&
        distance(frame(9).position, Vector3.add(seat, shift)) <= 0.001,
    );

    const exit: number = release + placed - aperture;
    // The empty hand traverses the same insertion span in reverse.
    const empty: IAutoMovieResolvedBone = film
      .bones("actor", exit)
      .get("rightHand")!;
    TestValidator.predicate(
      name + " the empty wrist passes the opening again",
      distance(empty.worldPosition, mouth) <= 0.015 &&
        distance(frame(exit).position, seat) <= 0.001,
    );

    if (name === "m-average") {
      for (const [invalid, kind, axis] of [
        ["missing", "affordance", "onto"],
        ["twisted", "affordance", "onto.aperture"],
        ["far", "reach", "prop"],
      ] as const) {
        let refusal: unknown;
        try {
          stage(invalid);
        } catch (error) {
          refusal = error;
        }
        TestValidator.predicate(
          invalid + " mouth is refused",
          refusal instanceof HumanRefusal &&
            refusal.kind === kind &&
            refusal.axis === axis,
        );
      }
      TestValidator.equals(
        "ordinary placement retains its events",
        stage()
          .segments("actor")[1]!
          .plan.events.map((item: IAutoMovieMotionEvent): string => item.name),
        ["placed", "release"],
      );
    }
  }
}
