import { type AutoMovieArchetype, createPhone } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

import HumanPocket = AutoMovieMotionHumanPrehension.HumanPocket;

/** The rigid custody bound: a stowed or held prop's drift in its carrier's frame, metres. */
const RIGID: number = 0.001;

/**
 * A phone stowed in a trouser pocket comes out into the hand and goes back.
 *
 * Scenarios, on the average man with the right pocket and the small woman
 * with the left:
 * 1. Before the take-out the phone rides the pocket's bone at the pocket's
 *    point and keeps that offset as the body moves.
 * 2. From grip closure to the put-down the phone keeps one offset in the
 *    hand, and the custody change is continuous.
 * 3. After the put-down it rides the pocket's bone again, through a walk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three custody phases and the cast.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed phone frame against the displayed pocket bone and hand; a phone that drifts in its pocket, slips in the hand, jumps at a handover or stays behind after the put-down fails.
 * @evidence contracts/development/testing.md#independent-expectations The pocket's point is the body's own region frame; rigid custody keeps a fixed offset in the carrier's frame, bounded at 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Both pockets on two bodies, before, during and after the hand's custody.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain on canonical bodies.
 */
export function test_motion_billiards_pocket(): void {
  for (const [fit, site, hand] of [
    ["m-average", "frontRight", "right"],
    ["f-small", "frontLeft", "left"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const phone: AutoMovieArchetype<createPhone.Affordance, string> =
      createPhone();
    const mount: HumanPocket.IMount = HumanPocket.mount(body, site);
    const film: HumanPerformance = new HumanPerformance({
      seed: "pocket",
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
        HumanPocket.stow(
          HumanObject.prop("phone", phone, {
            at: { x: 0, y: 0, z: 1 },
            yaw: 0,
          }),
          "a",
          body,
          site,
        ),
      ],
      composition: HumanPocket.putBack(
        HumanPocket.takeOut(HumanChain.subject("a"), "phone", "grip", hand).act(
          "stand",
          { hold: 0.5 },
        ),
        "phone",
        body,
        site,
        hand,
      ).act("walk", { to: { x: 0, y: 0, z: 0.8 } }).node,
    });
    assertTakeClean(`${fit} pocket`, film);
    const [take, , put] = film.segments("a") as IAutoMovieMotionHumanSegment[];
    const closed: number = event(take!, "gripClosed");
    const released: number = event(put!, "release");

    TestValidator.predicate(
      `${fit}: the stowed phone rides the pocket`,
      [0, closed / 2].every(
        (t: number): boolean =>
          Vector3.distance(
            local(film.prop("phone", t), film.bones("a", t).get(mount.bone)!),
            mount.offset.position,
          ) <= RIGID,
      ),
    );
    const inHand: IAutoMovieVector3 = local(
      film.prop("phone", closed + 0.01),
      film.bones("a", closed + 0.01).get(`${hand}Hand`)!,
    );
    TestValidator.predicate(
      `${fit}: the hand keeps the phone from closure to placement`,
      [0.25, 0.5, 0.75].every((share: number): boolean => {
        const t: number = closed + share * (event(put!, "placed") - closed);
        return (
          Vector3.distance(
            local(
              film.prop("phone", t),
              film.bones("a", t).get(`${hand}Hand`)!,
            ),
            inHand,
          ) <= RIGID
        );
      }),
    );
    const after: IAutoMovieVector3 = local(
      film.prop("phone", released + 0.01),
      film.bones("a", released + 0.01).get(mount.bone)!,
    );
    TestValidator.predicate(
      `${fit}: the phone rides the pocket again through the walk`,
      [0.5, 0.75, 1].every((share: number): boolean => {
        const t: number = released + share * (film.duration - released);
        return (
          Vector3.distance(
            local(film.prop("phone", t), film.bones("a", t).get(mount.bone)!),
            after,
          ) <= RIGID
        );
      }),
    );
  }
}

/** The film second of a segment's named event. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}

/** A prop's position in a displayed bone's frame, metres. */
function local(
  prop: IAutoMovieRigidTransform,
  bone: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(bone.worldRotation),
    Vector3.subtract(prop.position, bone.worldPosition),
  );
}
