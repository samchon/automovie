import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPianoPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropDrive,
} from "@automovie/interface";

import { pianoPedal } from "./pianoPedal";
import { pianoScore } from "./pianoScore";

/**
 * Play a keyboard score while the right foot works the damper pedal. Both parts
 * start on the same seated pose. The pedal owns the right leg and its contact
 * schedule, while the score writes the hands. Keys and pedal retain their
 * authored timing even when one part is shorter.
 */
export const pianoPerformance: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPianoPerformance> =
  {
    name: "pianoPerformance",
    interrupts: {},
    plan,
  };

/**
 * Join the two parts without adding a second transition or moving the bench.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the common entry, limb ownership and duration rule.
 * @evidence contracts/development/implementation.md#principled-implementation Composes disjoint joints and prop drives and changes normalized event shares to the combined duration.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan each part once and merge their contacts, clocks and posture.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the pedal's actual contact windows and keeps its right foot free during transport.
 * @evidence contracts/development/implementation.md#efficient-algorithms Samples each existing plan once per posture and prepares the event and drive arrays once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the standalone keyboard and pedal plans.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the two prepared parts for this performance.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoPerformance>,
): IAutoMovieMotionHumanActionPlan {
  const { prop, notes, pedal } = context.params;
  const keyboard: IAutoMovieMotionHumanActionPlan = pianoScore.plan({
    ...context,
    params: { prop, notes },
  });
  const foot: IAutoMovieMotionHumanActionPlan = pianoPedal.plan({
    ...context,
    params: { ...pedal, prop },
  });
  const duration: number = Math.max(keyboard.duration, foot.duration);
  const events: IAutoMovieMotionEvent[] = [keyboard, foot].flatMap((part) =>
    part.events.map((event) => ({
      ...event,
      share: event.share * (part.duration / duration),
    })),
  );
  const drives: IAutoMovieMotionPropDrive[] = [keyboard, foot].flatMap((part) =>
    (part.drives ?? []).map((drive) => ({
      ...drive,
      from: drive.from * (part.duration / duration),
      to: drive.to * (part.duration / duration),
    })),
  );
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...keyboard.contacts.filter((contact) => contact.part !== "rightFoot"),
    ...foot.contacts
      .filter((contact) => contact.part === "rightFoot")
      .map((contact) => ({
        ...contact,
        from: contact.from * (foot.duration / duration),
        to: contact.to === 1 ? 1 : contact.to * (foot.duration / duration),
      })),
  ];
  return {
    ...keyboard,
    duration,
    events: events.sort((a, b) => a.share - b.share),
    contacts,
    drives,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const hands: IAutoMovieMotionHumanPosture = keyboard.posture(
        Math.min(seconds, keyboard.duration),
      );
      const leg: IAutoMovieMotionHumanPosture = foot.posture(
        Math.min(seconds, foot.duration),
      );
      return {
        ...hands,
        limbs: { ...hands.limbs, rightLeg: leg.limbs.rightLeg },
        joints: { ...hands.joints, rightToes: leg.joints.rightToes },
      };
    },
  };
}
