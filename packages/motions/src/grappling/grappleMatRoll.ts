import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { floorEntry } from "../floor/floorEntry";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";

/**
 * Continue a grounded shoulder exchange into a mat roll as soon as the
 * receiver's seat reaches the floor. The fitted seat and back keys supply
 * the endpoints. The feet finish bearing at the seat and the roll lets the
 * body's changing colliders rest on the mat through the handoff.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two fitted endpoints, the floor contact handoff and the point of release for the feet.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the first fitted seat bearing, the settled back pose and the existing floor blend. The roll follows the exact current floor height as the pelvis gives bearing to the trunk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing support path up to the seat, one continuous floor roll, then one settled endpoint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The roll uses the fitted seat and back endpoints and the existing whole-body floor constraint. Its events follow the displayed support exchange.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolves two fixed endpoints once. Each intermediate roll sample uses the prepared floor blend and its current floor reading.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates contact acquisition to support, solved joint extraction to GymnasticsFlight and the collider-constrained blend to floorEntry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains two endpoint poses and the finite floor reader until the plan is released. No sampled trajectory is cached.
 */
export function grappleMatRoll(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const start: number = plan.contacts.find(
    (contact) => contact.part === "seat",
  )!.from;
  const end: number = plan.events.find(
    (event) => event.name === "settled",
  )!.share;
  const startTime: number = start * plan.duration;
  const endTime: number = end * plan.duration;
  const seated: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
    body,
    plan.posture(startTime),
  );
  const settled: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
    body,
    plan.posture(endTime),
  );
  const roll: ReturnType<typeof floorEntry.between> = floorEntry.between(
    body,
    seated,
    settled,
  );
  const ground: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
  return {
    ...plan,
    events: [
      ...plan.events.filter((event) => event.share < start),
      { name: "matTransfer", share: start },
      { name: "settled", share: end },
      { name: "recoveredOnMat", share: 1 },
    ],
    contacts: plan.contacts.map((contact) => {
      if (contact.part === "seat") return { ...contact, to: end };
      if (contact.part === "back") return { ...contact, from: end };
      return { ...contact, to: Math.min(start, contact.to) };
    }),
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      const [time, , resolution, projection] = args;
      if (time <= startTime) return plan.posture(...args);
      if (time >= endTime) return settled;
      const posture: IAutoMovieMotionHumanPosture = roll(
        minimumJerk.share((time - startTime) / (endTime - startTime)),
        resolution,
        projection,
      );
      return {
        ...posture,
        root: { ...posture.root, y: ground(posture, resolution, projection) },
      };
    },
  };
}
