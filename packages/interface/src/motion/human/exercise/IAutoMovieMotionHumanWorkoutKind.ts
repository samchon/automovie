import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBase } from "../law/IAutoMovieMotionHumanBase";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanExerciseKey } from "./IAutoMovieMotionHumanExerciseKey";

/**
 * One exercise of the workout law, as data: the postures a repetition passes
 * through, what bears the body while it works, and how the body gets there from
 * standing.
 */
export interface IAutoMovieMotionHumanWorkoutKind {
  /** What bears the body while it works. */
  base: IAutoMovieMotionHumanBase.Kind;

  /**
   * Where the bearing bones are put: `stance` where they are in standing (feet
   * that never leave the floor), `hips` where the first posture rests on the
   * floor with the pelvis over the place stood on, `bar` on a bar above the
   * place stood on.
   */
  anchor: "stance" | "hips" | "bar";

  /**
   * The bones whose mean place is kept while the body works, or the grip
   * sockets of hands closed on a bar, the bar in the fists.
   */
  pin: readonly IAutoMovieMotionHumanExerciseKey.Pin[];

  /**
   * The height of what the first posture rests on (a bench, a seat, a saddle),
   * for the `hips` anchor; the floor when absent.
   *
   * @param body The body.
   * @returns Metres above the floor.
   */
  raise?(body: IAutoMovieMotionHumanBody): number;

  /**
   * Whether the palms are laid on the floor under where the first posture has
   * the hands, and kept there while the body works.
   */
  hands?: boolean;

  /** The parts that bear while the body works, with how each bears. */
  supports: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[];

  /**
   * Whether a `stance` kind moves its bearing feet into a stance of its own (a
   * split, a straddle); otherwise the feet that bear are held on the places
   * they stand on at the entry.
   */
  strides?: boolean;

  /**
   * Whether a bar held in both hands (`load` with `other`) travels over the
   * middle of the feet, as a deadlift's and a press's does; where the key's
   * arms put it when absent.
   */
  midfoot?: boolean;

  /** Whether every other repetition is done on the other side. */
  alternate?: boolean;

  /**
   * Seconds from standing to the first posture and back; 0 when the first
   * posture is standing.
   */
  enter: number;

  /** Repetitions when the author names none. */
  count: number;

  /**
   * The postures of one repetition on a body: the first is where the exercise
   * starts and each repetition ends.
   *
   * @param body The body.
   * @param support The height above the floor of the prop's place the body
   *   bears on, metres, when the author names one (`on`); a kind done on
   *   equipment solves its angles from it, and others ignore it.
   * @returns The steps, at least one.
   */
  route(
    body: IAutoMovieMotionHumanBody,
    support?: number,
  ): readonly IAutoMovieMotionHumanWorkoutKind.IStep[];

  /**
   * How high the pinned joints stand above the place a `bar` anchor gives them,
   * when they do not lie on it: an ankle above a box's top, a wrist above a
   * bench's. On the place itself when absent.
   *
   * @param body The body.
   * @returns Metres.
   */
  rise?(body: IAutoMovieMotionHumanBody): number;

  /**
   * The height of the bars a `bar` kind is supported on when the author names
   * none: the places a support exercise's bars stand at, beside the place stood
   * on, as the dip's law defines its parallel bars "on two bars at the hips'
   * height", places unless the author names a prop (`WorkoutBodyweight`). A
   * `bar` kind with neither these nor a support of its own (`rise`) hangs from
   * a bar it must name.
   *
   * @param body The body.
   * @returns Metres above the floor.
   */
  bars?(body: IAutoMovieMotionHumanBody): number;
}

/** Companion types of {@link WorkoutKind}. */
export namespace IAutoMovieMotionHumanWorkoutKind {
  /** A part that bears and how. */
  export interface ISupport {
    /** The part. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** How it bears. */
    kind: IAutoMovieMotionHumanContactWindow["kind"];

    /**
     * Whether it bears on the prop the exercise is done on (the workout's
     * `on`): a hand on a bar or a bench, a foot on a box. On the ground when
     * absent, or when the author names no prop.
     */
    prop?: boolean;

    /**
     * The postures of the repetition it bears in, by their steps' `event`
     * names, and the way between two of them; every posture when absent. On a
     * repetition done on the other side (`alternate`), its other side's part
     * bears instead.
     */
    at?: readonly string[];
  }

  /** One posture of a repetition. */
  export interface IStep {
    /** The posture. */
    key: IAutoMovieMotionHumanExerciseKey.IKey;

    /** Seconds taken to reach it from the step before. */
    seconds: number;

    /** Seconds stayed in it. */
    hold: number;

    /** Whether the author's `hold` replaces this step's. */
    held?: boolean;

    /**
     * The event at which the body leaves for this posture, numbered by
     * repetition.
     */
    leave: string;

    /** The event at which the body arrives in it, numbered by repetition. */
    event: string;
  }
}
