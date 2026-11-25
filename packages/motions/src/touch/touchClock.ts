import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { poseBones } from "../posture/poseBones";
import type { touchCrossedSupport } from "./touchCrossedSupport";
import type { touchHold } from "./touchHold";
import { touchReach } from "./touchReach";
import type { touchRegion } from "./touchRegion";

/**
 * A touch's clock (`touch`): the reach takes the free-space transport time of
 * the farther hand's distance to its region at the entry, and at least as long
 * as the arms need to keep within the audit's travel bound (`touchReach`); the
 * stroke repeats `count` times at the form's period (or a given repetition's),
 * holds, and returns in the reach's time, the manner scaling the whole.
 *
 * @param prepared The touch's prepared values.
 * @returns The clock.
 */
export function touchClock(
  prepared: touchClock.IPrepared,
): IAutoMovieMotionClock {
  const {
    context,
    bones,
    hands,
    region,
    effector,
    attempt,
    reached,
    laid,
    kind,
    count,
    hold,
    repeated,
    modifiers,
  }: touchClock.IPrepared = prepared;
  const body = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

  // The reach's length: the farther hand's distance to its region at the entry.
  let far: number = 0;
  for (const [side, target] of hands) {
    const at: IAutoMovieVector3 = region(target)(entry, 0).point;
    const from: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
      body,
      bones,
      side,
      effector,
    );
    far = Math.max(
      far,
      Math.hypot(at.x - from.x, at.y - from.y, at.z - from.z),
    );
  }
  // At least as long as the arms need to keep within the audit's travel bound.
  const reach: number = Math.max(
    attempt?.reach ?? 0,
    AutoMovieMotionHumanTiming.transport(far),
    touchReach.duration(
      body,
      context.entry.pose,
      reached,
      hands,
      effector,
      region,
      laid,
    ),
  );
  const repetition: number =
    repeated ??
    AutoMovieMotionHumanTouchForm.period(
      body,
      kind,
      AutoMovieMotionHumanTiming.seconds(
        AutoMovieMotionHumanTouchForm.FORMS[kind].period,
      ),
    );
  return AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: reach,
      attack: count * repetition,
      hold,
      retract: reach,
    }),
    modifiers,
  );
}

/** Companion types of {@link touchClock}. */
export namespace touchClock {
  /** What the touch's plan prepared before its clock. */
  export interface IPrepared {
    /** The touch's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>;

    /** The entry's bones, a presented arm's as presented. */
    bones: ReturnType<typeof poseBones>;

    /** Each touching hand and its region. */
    hands: [AutoMovieHumanSide, IAutoMovieMotionTarget][];

    /** A region at a second, on the posture as the stance leans it. */
    region: (
      target: IAutoMovieMotionTarget,
    ) => ReturnType<ReturnType<typeof touchRegion.reader>>;

    /** The touching part of the hand. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The crossed-support attempt this plan is, if any. */
    attempt: touchCrossedSupport.IAttempt | undefined;

    /** The posture the arms are solved on at plan time. */
    reached: IAutoMovieMotionHumanPosture;

    /** Each hand's layout on its region. */
    laid: touchHold.Lay;

    /** The touch's kind. */
    kind: IAutoMovieMotionHumanTouchForm.Kind;

    /** The stroke's repetitions. */
    count: number;

    /** The hold after the strokes, seconds. */
    hold: number;

    /** A given repetition's length, seconds, replacing the form's. */
    repeated: number | undefined;

    /** The manner's modifiers. */
    modifiers: IAutoMovieMotionManner.IModifiers;
  }
}
