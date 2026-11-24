import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose, qclose, vclose } from "../../../features/internal/predicates";

const { pickUpMoving } = AutoMovieMotionHumanPrehension;

/**
 * Intercept a glass on a translating support and take custody at closure.
 *
 * Scenarios:
 * 1. The support advances 0.10 m in 0.50 s. The displayed hand reaches
 *    the glass there, with the glass attached through lift and the next action.
 * 2. A pre-closure cut to stand leaves the glass moving on the support.
 * 3. A glass outside reach at closure refuses the pick up.
 * 4. A conveyor callback with a zero quaternion refuses the interception.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support motion, displayed grasp, continued custody, cut and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the placed events, displayed palm and prop frames from the public performance.
 * @evidence contracts/development/testing.md#independent-expectations A linear support travels 0.20 m/s, so the glass travels 0.10 m before closure and 0.20 m if left on it for one second. A 0.15 s uniform brake from 0.20 m/s carries it 0.015 m horizontally. The lifted glass rises by the authored 0.10 m and its hand-local offset stays constant.
 * @evidence contracts/development/testing.md#distinguishing-cases An entry-frame reach misses the displaced glass. A continuing mount cannot lift and a premature handover cannot continue translating after the cut. A zero quaternion has no rigid rotation even when the computed mount looks valid.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous specification owns its performances and pure frame readers.
 */
export function test_motion_prehension_moving_pick_up(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const frame: IAutoMovieRigidTransform = {
    position: zero,
    rotation: identity,
  };
  const start: IAutoMovieVector3 = {
    x: -0.25,
    y: 0.9 * body.measure.hipHeight,
    z: 0.35,
  };
  const support: IAutoMovieMotionHumanProp = {
    subject: "support",
    frame,
    points: {},
    affordances: [
      {
        id: "socket",
        kind: "socket",
        frame: {
          translation: zero,
          rotation: identity,
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
      },
    ],
    motion: (seconds: number): IAutoMovieRigidTransform => ({
      position: { ...zero, x: 0.2 * seconds },
      rotation: identity,
    }),
  };
  const glass: IAutoMovieMotionHumanProp = HumanObject.prop(
    "glass",
    createDrinkware({ kind: "glass" }),
    { at: start, yaw: 0 },
  );
  const chain: IAutoMovieMotionHumanChain = HumanChain.extend({ pickUpMoving })
    .subject("a")
    .pickUpMoving({
      prop: "glass",
      handle: "body",
      lift: 0.1,
      closeAt: 0.5,
    });
  /** Place the same pickup in each authored staging scenario. */
  const perform = (
    composition: IAutoMovieMotionHumanChain,
    position: IAutoMovieVector3 = start,
    carrier: IAutoMovieMotionHumanProp = support,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "moving-pick-up",
      laws: [pickUpMoving],
      props: [
        carrier,
        {
          ...glass,
          mounted: {
            prop: support.subject,
            point: "socket",
            offset: { position, rotation: identity },
          },
        },
      ],
      performers: [
        {
          subject: "a",
          body,
          at: zero,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: composition.node,
    });

  const film: HumanPerformance = perform(chain.stand({ hold: 1, sway: 0 }));
  const pick: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
  /** Read an authored pickup event in film seconds. */
  const instant = (name: string): number =>
    pick.start +
    pick.plan.events.find((event): boolean => event.name === name)!.share *
      pick.plan.duration;
  const closed: number = instant("gripClosed");
  const liftOff: number = instant("liftOff");
  const lifted: number = instant("lifted");
  const catchFrame: IAutoMovieRigidTransform = film.prop(glass.subject, closed);
  TestValidator.predicate(
    "closure meets the glass 0.10 m beyond its entry position",
    nclose(closed, 0.5, 1e-9) &&
      vclose(
        film.prop(glass.subject, 0.25).position,
        { ...start, x: -0.2 },
        1e-6,
      ) &&
      vclose(catchFrame.position, { ...start, x: -0.15 }, 1e-6),
  );

  /** The mean displayed speed over a short interval bracketing a phase boundary. */
  const xSpeed = (from: number, to: number): number =>
    (film.prop(glass.subject, to).position.x -
      film.prop(glass.subject, from).position.x) /
    (to - from);

  // Over 0.02 s on either side of closure, the mean speeds are 0.20 m/s
  // before it and 0.20 * (1 - 0.01 / 0.15) m/s during the brake.
  TestValidator.predicate(
    "the displayed glass preserves the incoming speed through closure and brakes to rest",
    nclose(xSpeed(closed - 0.02, closed), 0.2, 1e-5) &&
      nclose(xSpeed(closed, closed + 0.02), 0.1867, 0.06) &&
      nclose(xSpeed(liftOff - 0.02, liftOff), 0.0133, 0.04) &&
      nclose(film.prop(glass.subject, liftOff).position.x, -0.135, 0.005) &&
      nclose(film.prop(glass.subject, lifted).position.x, -0.135, 0.008),
  );
  const grip = glass.affordances!.find((item): boolean => item.id === "body")!;
  const gripPoint: IAutoMovieVector3 = Vector3.add(
    { ...start, x: -0.15 },
    grip.frame.translation,
  );
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    film.bones("a", closed),
    "right",
    "palm",
    "flat",
  ).point;
  TestValidator.predicate(
    "the displayed palm lies on the intercepted glass, within its radius and fit tolerance",
    Vector3.length(Vector3.subtract(palm, gripPoint)) <=
      (grip.aperture ?? 0.08) / 2 + 0.025,
  );

  /** Read the displayed glass origin in the displayed hand frame. */
  const seat = (seconds: number): IAutoMovieRigidTransform => {
    const hand: IAutoMovieResolvedBone = film
      .bones("a", seconds)
      .get("rightHand")!;
    const prop: IAutoMovieRigidTransform = film.prop(glass.subject, seconds);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, hand.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };
  };
  const first: IAutoMovieRigidTransform = seat(closed + 0.001);
  const raised: IAutoMovieRigidTransform = seat(lifted);
  const later: IAutoMovieRigidTransform = seat(film.duration - 0.1);
  TestValidator.predicate(
    "the glass rises by the lift and keeps its hand-local seat in the next action",
    nclose(film.prop(glass.subject, lifted).position.y - start.y, 0.1, 0.012) &&
      vclose(first.position, raised.position, 0.001) &&
      vclose(first.position, later.position, 0.001) &&
      qclose(first.rotation, raised.rotation) &&
      qclose(first.rotation, later.rotation),
  );

  const cut: HumanPerformance = perform(
    chain.until({ share: 0.25 }).stand({ hold: 1, sway: 0 }),
  );
  TestValidator.predicate(
    "a cut before closure leaves the glass on its moving mount",
    vclose(cut.prop(glass.subject, 1).position, { ...start, x: -0.05 }, 1e-6),
  );

  let refusal: unknown;
  try {
    perform(chain, { ...start, z: 3 });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "the out-of-reach interception refuses the authored grip",
    refusal instanceof HumanRefusal && refusal.kind === "reach",
  );

  let invalidTrack: unknown;
  try {
    perform(chain, start, {
      ...support,
      motion: (seconds: number): IAutoMovieRigidTransform => ({
        position: { ...zero, x: 0.2 * seconds },
        rotation: seconds === 0.25 ? { ...identity, w: 0 } : identity,
      }),
    });
  } catch (error) {
    invalidTrack = error;
  }
  TestValidator.predicate(
    "a zero quaternion within an otherwise linear track refuses closure",
    invalidTrack instanceof HumanRefusal &&
      invalidTrack.kind === "parameter" &&
      invalidTrack.axis === "closeAt",
  );
}
