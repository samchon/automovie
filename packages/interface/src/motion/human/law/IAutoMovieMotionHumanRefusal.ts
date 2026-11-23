/**
 * A composition the vocabulary refuses to perform, as a value its author can
 * act on: who was to act, which action, which axis of it is at fault, the
 * value given, what would have been accepted, and what to change.
 *
 * The author of a composition is a coding agent that never sees the film it
 * asks for until it is built, so a refusal is its only feedback. Each
 * refusal therefore names one axis and one repair, and the same facts are
 * fields, so a program reads them without parsing the message:
 *
 * ```ts
 * try { new HumanPerformance(input); }
 * catch (error) {
 *   if (error instanceof HumanRefusal) console.log(error.axis, error.feasible, error.fix);
 * }
 * ```
 *
 * A refusal is deterministic: it depends on the composition, the bodies and
 * the places, never on the seed. Repair it at the axis it names (move the
 * target, change the value, release the hand, declare the cut); catching it
 * and carrying on performs nothing.
 *
 * A law that refuses knows the axis but not always its place in the film, so
 * it may raise a refusal with no performer; the performance locates it
 * ({@link HumanRefusal.locate}) before it reaches the author.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who reads a refusal, what each carries, that it is seed-independent and how it is located. minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.
 * @evidence contracts/development/design.md#principled-representation An `Error` whose message is composed from typed fields, so the text and the fields cannot disagree. minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fields an author repairs from, one constructor and the locating copy. Runtime boundary references: compose/AutoMovieMotionHumanDrinkingArm.ts (AutoMovieMotionHumanDrinkingArm.refused, return); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.of.handless, return); everyday/HumanObstacle.ts (HumanObstacle.of.refuse, return); handling/handshakeReach.ts (handshakeReach.refusal, return); law/HumanBound.ts (HumanBound.refuse, return); law/HumanRefusal.ts (HumanRefusal.locate, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The feasible set is a closed union of a range and alternatives, not free text. The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
 */
export interface IAutoMovieMotionHumanRefusal extends Error {
  /** The class of refusal. */
  readonly kind: IAutoMovieMotionHumanRefusal.Kind;

  /** The performer who was to act; empty until the performance locates the refusal. */
  readonly performer: string;

  /** The action refused; empty until located, unless the law named it. */
  readonly act: string;

  /** Which occurrence of that action in the performer's chain, from 1; 0 until located. */
  readonly instance: number;

  /** The axis at fault: a parameter's name, or `cut`, `channel`, `base`. */
  readonly axis: string;

  /** The value given on that axis, as the author wrote it or as it was measured. */
  readonly value: unknown;

  /** What the axis accepts here: a range, the alternatives, or null when neither applies. */
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

/**
 * Companion types of {@link HumanRefusal}.
 *
 */
export namespace IAutoMovieMotionHumanRefusal {
  /**
   * A numeric range; an open end is null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.
   * @evidence contracts/development/design.md#principled-representation minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanBound.ts (HumanBound.within, open); law/HumanBound.ts (HumanBound.refuse, feasible).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanBound.within.
   */
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

  /**
   * The callable constructor and static factories.
   *
   * @evidence contracts/development/common.md#meaningful-documentation message: The message of a refusal: `performer.act#instance axis: reason; feasible: ...; fix: ...`, the place left out until it is known. describe: A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the alternatives listed.
   * @evidence contracts/development/design.md#principled-representation message: The message of a refusal: `performer.act#instance axis: reason; feasible: ...; fix: ...`, the place left out until it is known. describe: A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the alternatives listed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanRefusal contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanRefusal.IProps, IAutoMovieMotionHumanRefusal, IAutoMovieMotionHumanRefusal.Feasible identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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
     * The message of a refusal: `performer.act#instance axis: reason;
     * feasible: ...; fix: ...`, the place left out until it is known.
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
   * - `reach`: a target, site or support the body cannot reach from where it
   *   is; move the target, come nearer, or let the body lean or step.
   * - `affordance`: a prop, a point or a grip that is missing or already
   *   held; name one that exists or release the hand.
   * - `channel`: two movements claim one body part at one time; give one of
   *   them another part or another time.
   * - `cut`: an action is cut where its law declares no window; cut inside a
   *   declared window.
   * - `participant`: a performer, a partner's action or an anchor the action
   *   reads is absent; add it or place it earlier.
   * - `base`: the state the action is entered from does not allow it (the
   *   feet, the seat, the heading); change what precedes it.
   * - `rule`: the placed performance breaks a production rule it was given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The classes of refusal, each repaired at a different place:
   * @evidence contracts/development/design.md#principled-representation Closed choices "parameter", "reach", "affordance", "channel", "cut", "participant", "base", "rule" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanRefusal.ts (HumanRefusal); law/HumanRefusal.ts (HumanRefusal.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanRefusal.
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

  /**
   * What an axis accepts: a numeric range or a list of alternatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation What an axis accepts: a numeric range or a list of alternatives.
   * @evidence contracts/development/design.md#principled-representation A feasible alternative is either a numerical range or a discrete alternative list, with the discriminant selecting which information an author can act on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve.refuse, feasible); law/HumanRefusal.ts (HumanRefusal.describe, feasible); law/HumanRefusal.ts (HumanRefusal); law/HumanRefusal.ts (HumanRefusal.message).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanRefusal.IRange, IAutoMovieMotionHumanRefusal.IAlternatives identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Feasible =
    | IAutoMovieMotionHumanRefusal.IRange
    | IAutoMovieMotionHumanRefusal.IAlternatives;

  /**
   * The values that would have been accepted, as the author writes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: The discriminator. values: The accepted values.
   * @evidence contracts/development/design.md#principled-representation kind: The discriminator. values: The accepted values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanScheduleRefusal.ts (HumanScheduleRefusal.of).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanScheduleRefusal.of.
   */
  export interface IAlternatives {
    /** The discriminator. */
    kind: "alternatives";

    /** The accepted values. */
    values: readonly string[];
  }

  /**
   * The message of a refusal: `performer.act#instance axis: reason; feasible: ...; fix: ...`, the place left out until it is known. The facts of a refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation feasible: What the axis accepts; null or absent when neither a range nor alternatives apply.
   * @evidence contracts/development/design.md#principled-representation feasible: What the axis accepts; null or absent when neither a range nor alternatives apply.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanRefusal.ts (HumanRefusal.message, props); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window.located, refusal); law/HumanRefusal.ts (HumanRefusal).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanRefusal.IWhere, IAutoMovieMotionHumanRefusal.Kind, IAutoMovieMotionHumanRefusal.Feasible identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProps extends Partial<IAutoMovieMotionHumanRefusal.IWhere> {
    /** The class. */
    kind: IAutoMovieMotionHumanRefusal.Kind;

    /** The axis at fault. */
    axis: string;

    /** The value given or measured. */
    value: unknown;

    /** What the axis accepts; null or absent when neither a range nor alternatives apply. */
    feasible?: IAutoMovieMotionHumanRefusal.Feasible | null;

    /** Why it is refused, with the measured numbers. */
    reason: string;

    /** One sentence naming what to change. */
    fix: string;
  }

  /**
   * This refusal with its place in the film, keeping any place it already names: a law that named its own performer or action is not overwritten. A place in the film.
   *
   * @evidence contracts/development/common.md#meaningful-documentation performer: The performer. act: The action. instance: The occurrence of the action in the performer's chain, from 1.
   * @evidence contracts/development/design.md#principled-representation performer: The performer. act: The action. instance: The occurrence of the action in the performer's chain, from 1.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: law/HumanRefusal.ts (HumanRefusal.locate, where); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place, where); perform/HumanPerformanceRead.ts (HumanPerformanceRead.where, return); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.align, where); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.latency, where); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.resolve).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanRefusal.locate.
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
