import type {
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "./ExerciseKey";

/**
 * A workout's spans: down from standing into the first key, each
 * repetition's way between its keys and its hold, and up again, each span
 * a clock phase named by the instant that opens it (`workout`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the spans are and who reads them.
 * @evidence contracts/development/design.md#principled-representation Named phases in seconds and the two keys each span goes between.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span, the repetition step and the planned record `workout.plan` reads, and their one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every key and duration is the kind's or the author's; nothing is stated here.
 */
export namespace workoutSpans {
  /**
   * One span of the plan: from an instant, between two keys.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation An instant's name and two exercise keys.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the posture and contact readers take.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A held span names the same key twice.
   */
  export interface ISpan {
    /** The instant that opens the span. */
    from: string;

    /** The key at its start. */
    a: IAutoMovieMotionHumanExerciseKey.IKey;

    /** The key at its end. */
    b: IAutoMovieMotionHumanExerciseKey.IKey;
  }

  /**
   * A repetition's span with the route events it goes between and its side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation Event names and whether the repetition is done on the other side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a support borne only in some postures reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The names are the route's own events.
   */
  export interface IBetween {
    /** The instant that opens the span. */
    name: string;

    /** The route event the span leaves. */
    was: string;

    /** The route event the span reaches. */
    is: string;

    /** Whether the repetition is done on the other side. */
    other: boolean;
  }

  /**
   * What the spans are built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The kind's route, the counts and seconds the author and kind give, and the standing key.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values `workout.plan` passes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hold is absent when the author gives none, so the route's own holds apply.
   */
  export interface IProps {
    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkoutKind;

    /** The kind's route for this body and support. */
    route: readonly IAutoMovieMotionHumanWorkoutKind.IStep[];

    /** Repetitions, a positive whole number. */
    reps: number;

    /** Whether the body is left on its support. */
    stay: boolean;

    /** The author's hold of a held key, seconds, when given. */
    hold: number | undefined;

    /** The standing key the way down starts from and the way up returns to. */
    stood: IAutoMovieMotionHumanExerciseKey.IKey;

    /** Seconds of the way down. */
    setup: number;

    /** Seconds of the closing settle, after the way up. */
    relax: number;
  }

  /**
   * The planned spans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation Clock phases, spans, repetition records and held instants, in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `workout.plan` reads to make its clock, posture and contacts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The four arrays are built together and stay aligned.
   */
  export interface IPlanned {
    /** The clock's phases. */
    phases: IAutoMovieMotionClockPhase[];

    /** The spans, one per phase. */
    spans: ISpan[];

    /** Each repetition span's events and side. */
    between: IBetween[];

    /** The held instants. */
    held: string[];
  }

  /**
   * Build the spans.
   *
   * @param props What the spans are built from.
   * @returns The planned spans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Way down, each repetition's step and hold in route order (mirrored on alternate sides for an alternating kind), way up unless staying, then the settle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span helper and one loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Durations are the kind's or the author's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in repetitions times route steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The mirrored route is made once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays and keeps nothing.
   */
  export function of(props: IProps): IPlanned {
    const kind: IAutoMovieMotionHumanWorkoutKind = props.kind;
    const route: readonly IAutoMovieMotionHumanWorkoutKind.IStep[] =
      props.route;
    const reps: number = props.reps;
    const first: IAutoMovieMotionHumanWorkoutKind.IStep = route[0]!;
    const mirrored:
      | readonly IAutoMovieMotionHumanExerciseKey.IKey[]
      | undefined =
      kind.alternate === true && reps >= 2
        ? route.map(
            (
              step: IAutoMovieMotionHumanWorkoutKind.IStep,
              i: number,
            ): IAutoMovieMotionHumanExerciseKey.IKey =>
              i === 0 ? step.key : ExerciseKey.mirror(step.key),
          )
        : undefined;
    const stayed: (step: IAutoMovieMotionHumanWorkoutKind.IStep) => number = (
      step: IAutoMovieMotionHumanWorkoutKind.IStep,
    ): number =>
      step.held === true && props.hold !== undefined ? props.hold : step.hold;

    // The spans: down from standing, the repetitions, up again.
    const planned: IPlanned = { phases: [], spans: [], between: [], held: [] };
    const span: (
      from: string,
      seconds: number,
      a: IAutoMovieMotionHumanExerciseKey.IKey,
      b: IAutoMovieMotionHumanExerciseKey.IKey,
    ) => void = (
      from: string,
      seconds: number,
      a: IAutoMovieMotionHumanExerciseKey.IKey,
      b: IAutoMovieMotionHumanExerciseKey.IKey,
    ): void => {
      planned.phases.push({ name: from, seconds });
      planned.spans.push({ from, a, b });
    };
    span("enter", props.setup, props.stood, first.key);

    // Each repetition's span with the postures it goes between, by their
    // events, and whether it is done on the other side: what a support
    // borne only in some postures reads.
    let last: IAutoMovieMotionHumanExerciseKey.IKey = first.key;
    for (let r: number = 1; r <= reps; r++) {
      for (let i: number = 1; i <= route.length; i++) {
        const step: IAutoMovieMotionHumanWorkoutKind.IStep =
          route[i % route.length]!;
        const other: boolean = kind.alternate === true && r % 2 === 0;
        const key: IAutoMovieMotionHumanExerciseKey.IKey =
          i < route.length && other ? mirrored![i % route.length]! : step.key;
        span(`${step.leave}${r}`, step.seconds, last, key);
        span(`${step.event}${r}`, stayed(step), key, key);
        planned.between.push(
          {
            name: `${step.leave}${r}`,
            was: route[i - 1]!.event,
            is: step.event,
            other,
          },
          { name: `${step.event}${r}`, was: step.event, is: step.event, other },
        );
        if (step.held === true) planned.held.push(`${step.event}${r}`);
        last = key;
      }
    }
    if (!props.stay) span("release", kind.enter, last, props.stood);
    const left: IAutoMovieMotionHumanExerciseKey.IKey = props.stay
      ? last
      : props.stood;
    span("relax", props.relax, left, left);
    return planned;
  }
}
