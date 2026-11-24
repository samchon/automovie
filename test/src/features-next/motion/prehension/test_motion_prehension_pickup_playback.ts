import { createDrinkware } from "@automovie/archetypes";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { qclose, vclose } from "../../../features/internal/predicates";

/**
 * A fixed pickup preserves its displayed loading phase when sought in any
 * order, including when the same action is read through an external law.
 *
 * Scenarios:
 * 1. Read the final lift before seeking to closure, loading and lift-off.
 * 2. Seek on either side of lift-off and repeat the interior loading read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the requested playback order and the ordinary fallback route.
 * @evidence contracts/development/testing.md#behavioral-verification Compares all displayed bones and the held glass across the native and ordinary public performance paths.
 * @evidence contracts/development/testing.md#independent-expectations The two performances use the same authored pickup, with the external law forcing ordinary posture evaluation. This checks playback equivalence. The moving pickup specification independently checks lift height and reach refusals.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes both sides of the phase, its exact endpoints and a repeated interior sample after a rewind.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous test owns both in-memory polygon-body performances and the ordinary-reader law.
 */
export function test_motion_prehension_pickup_playback(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const props: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "glass",
    handle: "body",
    lift: 0.1,
  };
  const foreign: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPickUp.IParams> =
    {
      ...AutoMovieMotionHumanPrehension.pickUp,
      name: "ordinaryPickUp",
      family: AutoMovieMotionHumanPrehension.pickUp.name,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanPrehension.pickUp.plan(context),
      }),
    };

  /** Use identical staging and seed for the built-in and external laws. */
  const perform = (ordinary: boolean): HumanPerformance => {
    const chain = HumanChain.subject("a");
    return new HumanPerformance({
      seed: "fixed-pickup-playback",
      laws: [foreign],
      props: [
        HumanObject.prop("glass", createDrinkware({ kind: "glass" }), {
          at: { x: -0.15, y: 0.9 * body.measure.hipHeight, z: 0.35 },
          yaw: 0,
        }),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (ordinary
        ? chain.registered("ordinaryPickUp", props, "grip")
        : chain.pickUp(props, "grip")
      ).node,
    });
  };
  const native: HumanPerformance = perform(false);
  const ordinary: HumanPerformance = perform(true);
  const segment: IAutoMovieMotionHumanSegment = native.segments("a")[0]!;
  /** Convert an event share to the film clock. */
  const at = (name: string): number =>
    segment.start +
    segment.plan.events.find((event): boolean => event.name === name)!.share *
      segment.plan.duration;
  const closed: number = at("gripClosed");
  const liftOff: number = at("liftOff");
  const loading: number = closed + (liftOff - closed) * 0.371;
  for (const t of [
    at("lifted"),
    liftOff + 1e-7,
    loading,
    closed,
    liftOff,
    closed - 1e-7,
    loading,
  ]) {
    const actual: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      native.bones("a", t);
    const expected: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      ordinary.bones("a", t);
    const attached: IAutoMovieRigidTransform = native.prop("glass", t);
    const reference: IAutoMovieRigidTransform = ordinary.prop("glass", t);
    TestValidator.predicate(
      `fixed pickup at ${t} seconds`,
      actual.size === expected.size &&
        [...actual].every(([bone, shown]): boolean => {
          const other: IAutoMovieResolvedBone | undefined = expected.get(bone);
          return (
            other !== undefined &&
            vclose(shown.worldPosition, other.worldPosition, 1e-9) &&
            qclose(shown.worldRotation, other.worldRotation)
          );
        }) &&
        vclose(attached.position, reference.position, 1e-9) &&
        qclose(attached.rotation, reference.rotation),
    );
  }
}
