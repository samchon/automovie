import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKneel,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { bendFloorHand } from "./bendFloorHand";
import { braceOnThigh } from "./braceOnThigh";
import type { kneelPhaseTable } from "./kneelPhaseTable";

/*
 * A kneel's hands (`kneel.plan`): onto the thighs while the hips lower and off
 * them as the body starts to rise, the arms laid in one group, the hands opened
 * flat as the palms come to the thighs (`bendFloorHand`). Read from the plan's
 * context, body, clock, phases and the first phase up.
 * Parameter scope: What the plan's hands are laid from.
 * Returns: Each hand's arm and opening primitives.
 */
export function kneelHands(scope: kneelHands.IScope): kneelHands.IHands {
  const { context, body, clock, phases, next, duration }: kneelHands.IScope =
    scope;
  // The hands come onto the thighs while the hips lower and leave them as
  // the body starts to rise.
  const firstUp: IPhase | undefined = next;
  const handDown: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "lowering", phases[2]!.name);
  const handUp: ReturnType<typeof AutoMovieMotionClock.prepare> | undefined =
    firstUp === undefined
      ? undefined
      : AutoMovieMotionClock.prepare(clock, firstUp.name, "end");
  const lowered: (seconds: number) => number = (seconds: number): number =>
    handDown.progress(seconds) *
    (handUp === undefined ? 1 : 1 - handUp.progress(seconds));
  const armEnd: number = firstUp === undefined ? clock.at("settled") : duration;
  const armSpan: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: clock.at("lowering"),
    ready: clock.at(phases[2]!.name),
    relax: firstUp === undefined ? armEnd : clock.at(firstUp.name),
    end: armEnd,
  };
  const arms: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together(context.handover, true, context.tempo);
  const hand: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPrimitive =>
    braceOnThigh(
      body,
      side,
      AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      duration,
      lowered,
      armSpan,
      arms,
    );

  // The hands open onto the thighs as the palms come to them, as the crouch's
  // do: a relaxed hand's curled fingers would go into the thigh it lies on,
  // and the flat hand's thumb, which projects past the palm, is turned on
  // its metacarpal until it clears the palm's plane, as a palm laid on the
  // floor's is (`bendFloorHand`).
  const open: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPrimitive =>
    bendFloorHand(body, context.entry.posture, side, duration, lowered);

  return { hand, open };
}

/*
 * What a kneel's hands read and what they are.
 */
export namespace kneelHands {
  /*
   * What a kneel plan lays its hands from.
   */
  export interface IScope {
    /*
     * The action's context.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKneel.IParams>;

    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The travel clock.
     */
    clock: IAutoMovieMotionClock;

    /*
     * The phases.
     */
    phases: kneelPhaseTable.IPhase[];

    /*
     * The first phase after the settled hold, if the kneel rises.
     */
    next: kneelPhaseTable.IPhase | undefined;

    /*
     * The travel seconds.
     */
    duration: number;
  }

  /*
   * Each hand's primitives.
   */
  export interface IHands {
    /*
     * The hand's arm onto the thigh.
     * Parameter side: The hand.
     * Returns: The primitive.
     */
    hand: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive;

    /*
     * The hand opened onto the thigh.
     * Parameter side: The hand.
     * Returns: The primitive.
     */
    open: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive;
  }
}

/*
 * A phase between two key states (`kneelPhaseTable.IPhase`).
 */
type IPhase = kneelPhaseTable.IPhase;
