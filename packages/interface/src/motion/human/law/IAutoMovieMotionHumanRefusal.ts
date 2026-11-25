/**
 * A composition the vocabulary refuses to perform, as a value its author can
 * act on: who was to act, which action, which axis of it is at fault, the value
 * given, what would have been accepted, and what to change.
 *
 * The author of a composition is a coding agent that never sees the film it
 * asks for until it is built, so a refusal is its only feedback. Each refusal
 * therefore names one axis and one repair, and the same facts are fields, so a
 * program reads them without parsing the message:
 *
 * ```ts
 * try {
 *   new HumanPerformance(input);
 * } catch (error) {
 *   if (error instanceof HumanRefusal)
 *     console.log(error.axis, error.feasible, error.fix);
 * }
 * ```
 *
 * A refusal is deterministic: it depends on the composition, the bodies and the
 * places, never on the seed. Repair it at the axis it names (move the target,
 * change the value, release the hand, declare the cut); catching it and
 * carrying on performs nothing.
 *
 * A law that refuses knows the axis but not always its place in the film, so it
 * may raise a refusal with no performer; the performance locates it
 * ({@link HumanRefusal.locate}) before it reaches the author.
 */
export interface IAutoMovieMotionHumanRefusal extends Error {
  /** The class of refusal. */
  readonly kind: IAutoMovieMotionHumanRefusal.Kind;

  /**
   * The performer who was to act; empty until the performance locates the
   * refusal.
   */
  readonly performer: string;

  /** The action refused; empty until located, unless the law named it. */
  readonly act: string;

  /**
   * Which occurrence of that action in the performer's chain, from 1; 0 until
   * located.
   */
  readonly instance: number;

  /** The axis at fault: a parameter's name, or `cut`, `channel`, `base`. */
  readonly axis: string;

  /** The value given on that axis, as the author wrote it or as it was measured. */
  readonly value: unknown;

  /**
   * What the axis accepts here: a range, the alternatives, or null when neither
   * applies.
   */
  readonly feasible: IAutoMovieMotionHumanRefusal.Feasible | null;

  /** Why it is refused, with the measured numbers. */
  readonly reason: string;

  /** One sentence naming what to change. */
  readonly fix: string;

  /**
   * This refusal with its place in the film, keeping any place it already
   * names: a law that named its own performer or action is not overwritten.
   *
   * @param where The performer, the action and the occurrence.
   * @returns The located refusal; this one when it is located already.
   */
  locate(
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): IAutoMovieMotionHumanRefusal;
}

/** Companion types of {@link HumanRefusal}. */
export namespace IAutoMovieMotionHumanRefusal {
  /** A numeric range; an open end is null. */
  export interface IRange {
    /** The discriminator. */
    kind: "range";

    /** The least accepted value, or null when unbounded below. */
    minimum: number | null;

    /** The greatest accepted value, or null when unbounded above. */
    maximum: number | null;

    /** The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number. */
    unit: string;

    /** Whether only whole numbers are accepted. */
    whole?: boolean;

    /** Which ends are excluded from the range; both are included when absent. */
    open?: "minimum" | "maximum" | "both";
  }

  /** The callable constructor and static factories. */
  export interface IConstructor {
    /**
     * A refusal.
     *
     * @param props Its facts; the message is composed from them.
     */
    new (
      props: IAutoMovieMotionHumanRefusal.IProps,
    ): IAutoMovieMotionHumanRefusal;

    /**
     * The message of a refusal: `performer.act#instance axis: reason; feasible:
     * ...; fix: ...`, the place left out until it is known.
     *
     * @param props The refusal's facts.
     * @returns The message.
     */
    message(props: IAutoMovieMotionHumanRefusal.IProps): string;

    /**
     * A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the
     * alternatives listed.
     *
     * @param feasible The set.
     * @returns The text.
     */
    describe(feasible: IAutoMovieMotionHumanRefusal.Feasible): string;
  }

  /**
   * The classes of refusal, each repaired at a different place:
   *
   * - `parameter`: a value outside what the action accepts; change the value.
   * - `reach`: a target, site or support the body cannot reach from where it is;
   *   move the target, come nearer, or let the body lean or step.
   * - `affordance`: a prop, a point or a grip that is missing or already held;
   *   name one that exists or release the hand.
   * - `channel`: two movements claim one body part at one time; give one of them
   *   another part or another time.
   * - `cut`: an action is cut where its law declares no window; cut inside a
   *   declared window.
   * - `participant`: a performer, a partner's action or an anchor the action
   *   reads is absent; add it or place it earlier.
   * - `base`: the state the action is entered from does not allow it (the feet,
   *   the seat, the heading); change what precedes it.
   * - `rule`: the placed performance breaks a production rule it was given.
   */
  export type Kind = (readonly [
    "parameter",
    "reach",
    "affordance",
    "channel",
    "cut",
    "participant",
    "base",
    "rule",
  ])[number];

  /** What an axis accepts: a numeric range or a list of alternatives. */
  export type Feasible =
    | IAutoMovieMotionHumanRefusal.IRange
    | IAutoMovieMotionHumanRefusal.IAlternatives;

  /** The values that would have been accepted, as the author writes them. */
  export interface IAlternatives {
    /** The discriminator. */
    kind: "alternatives";

    /** The accepted values. */
    values: readonly string[];
  }

  /**
   * The message of a refusal: `performer.act#instance axis: reason; feasible:
   * ...; fix: ...`, the place left out until it is known. The facts of a
   * refusal.
   */
  export interface IProps extends Partial<IAutoMovieMotionHumanRefusal.IWhere> {
    /** The class. */
    kind: IAutoMovieMotionHumanRefusal.Kind;

    /** The axis at fault. */
    axis: string;

    /** The value given or measured. */
    value: unknown;

    /**
     * What the axis accepts; null or absent when neither a range nor
     * alternatives apply.
     */
    feasible?: IAutoMovieMotionHumanRefusal.Feasible | null;

    /** Why it is refused, with the measured numbers. */
    reason: string;

    /** One sentence naming what to change. */
    fix: string;
  }

  /**
   * This refusal with its place in the film, keeping any place it already
   * names: a law that named its own performer or action is not overwritten. A
   * place in the film.
   */
  export interface IWhere {
    /** The performer. */
    performer: string;

    /** The action. */
    act: string;

    /** The occurrence of the action in the performer's chain, from 1. */
    instance: number;
  }
}
