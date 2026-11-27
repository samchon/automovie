import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { floorEntry } from "../../floor/internal/floorEntry";
import { knockdown } from "../../reaction/internal/knockdown";
import { GymnasticsFlight } from "../../sport/GymnasticsFlight";

/**
 * Continue a grounded shoulder exchange into a mat roll as soon as the
 * receiver's seat reaches the floor. The fitted seat and back keys supply the
 * endpoints. The feet finish bearing at the seat and the roll lets the body's
 * changing colliders rest on the mat through the handoff.
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
        AutoMovieEngineMotionSampling.minimumJerkShare((time - startTime) / (endTime - startTime)),
      );
      return {
        ...posture,
        root: { ...posture.root, y: ground(posture, resolution, projection) },
      };
    },
  };
}
