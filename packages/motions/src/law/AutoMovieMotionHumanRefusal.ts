import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";

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
 *   new AutoMovieMotionHumanPerformance(input);
 * } catch (error) {
 *   if (error instanceof AutoMovieMotionHumanRefusal)
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
 * ({@link AutoMovieMotionHumanRefusal.locate}) before it reaches the author.
 */
export class AutoMovieMotionHumanRefusal extends Error {
  /** The class of refusal. */
  public readonly kind: IAutoMovieMotionHumanRefusal.Kind;

  /**
   * The performer who was to act; empty until the performance locates the
   * refusal.
   */
  public readonly performer: string;

  /** The action refused; empty until located, unless the law named it. */
  public readonly act: string;

  /**
   * Which occurrence of that action in the performer's chain, from 1; 0 until
   * located.
   */
  public readonly instance: number;

  /** The axis at fault: a parameter's name, or `cut`, `channel`, `base`. */
  public readonly axis: string;

  /** The value given on that axis, as the author wrote it or as it was measured. */
  public readonly value: unknown;

  /**
   * What the axis accepts here: a range, the alternatives, or null when neither
   * applies.
   */
  public readonly feasible: IAutoMovieMotionHumanRefusal.Feasible | null;

  /** Why it is refused, with the measured numbers. */
  public readonly reason: string;

  /** One sentence naming what to change. */
  public readonly fix: string;

  /**
   * A refusal.
   *
   * @param props Its facts; the message is composed from them.
   */
  public constructor(props: IAutoMovieMotionHumanRefusal.IProps) {
    super(AutoMovieMotionHumanRefusal.message(props));
    this.name = "HumanRefusal";
    this.kind = props.kind;
    this.performer = props.performer ?? "";
    this.act = props.act ?? "";
    this.instance = props.instance ?? 0;
    this.axis = props.axis;
    this.value = props.value;
    this.feasible = props.feasible ?? null;
    this.reason = props.reason;
    this.fix = props.fix;
  }

  /**
   * This refusal with its place in the film, keeping any place it already
   * names: a law that named its own performer or action is not overwritten.
   *
   * @param where The performer, the action and the occurrence.
   * @returns The located refusal; this one when it is located already.
   */
  public locate(
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): IAutoMovieMotionHumanRefusal {
    if (this.performer !== "" && this.act !== "" && this.instance !== 0)
      return this;
    return new AutoMovieMotionHumanRefusal({
      kind: this.kind,
      performer: this.performer === "" ? where.performer : this.performer,
      act: this.act === "" ? where.act : this.act,
      instance: this.instance === 0 ? where.instance : this.instance,
      axis: this.axis,
      value: this.value,
      feasible: this.feasible,
      reason: this.reason,
      fix: this.fix,
    });
  }

  /**
   * Run a step of the performance at a place in the film: a refusal the step
   * raises leaves located there ({@link AutoMovieMotionHumanRefusal.locate}), and any other
   * error leaves unchanged. This is the one boundary that places a law's
   * refusal; the step's own value is returned as it is.
   *
   * @param where The performer, the action and the occurrence the step runs
   *   for.
   * @param run The step.
   * @returns What the step returns.
   */
  public static located<T>(
    where: IAutoMovieMotionHumanRefusal.IWhere,
    run: () => T,
  ): T {
    try {
      return run();
    } catch (error) {
      throw error instanceof AutoMovieMotionHumanRefusal ? error.locate(where) : error;
    }
  }

  /**
   * The message of a refusal: `performer.act#instance axis: reason; feasible:
   * ...; fix: ...`, the place left out until it is known.
   *
   * @param props The refusal's facts.
   * @returns The message.
   */
  public static message(props: IAutoMovieMotionHumanRefusal.IProps): string {
    const place: string =
      (props.performer ?? "") === "" && (props.act ?? "") === ""
        ? ""
        : `${props.performer ?? ""}${props.performer && props.act ? "." : ""}${props.act ?? ""}${
            (props.instance ?? 0) === 0 ? "" : `#${props.instance}`
          } `;
    const feasible: IAutoMovieMotionHumanRefusal.Feasible | null =
      props.feasible ?? null;
    return `${place}${props.axis}: ${props.reason}${
      feasible === null ? "" : `; feasible: ${AutoMovieMotionHumanRefusal.describe(feasible)}`
    }; fix: ${props.fix}`;
  }

  /**
   * A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the alternatives
   * listed.
   *
   * @param feasible The set.
   * @returns The text.
   */
  public static describe(
    feasible: IAutoMovieMotionHumanRefusal.Feasible,
  ): string {
    if (feasible.kind === "alternatives")
      return feasible.values.length === 0 ? "none" : feasible.values.join(", ");
    const unit: string = feasible.unit === "" ? "" : ` ${feasible.unit}`;
    const whole: string = feasible.whole === true ? " (a whole number)" : "";
    const above: boolean =
      feasible.open === "minimum" || feasible.open === "both";
    const below: boolean =
      feasible.open === "maximum" || feasible.open === "both";
    if (feasible.minimum !== null && feasible.maximum !== null)
      return `${above ? "more than " : ""}${feasible.minimum} to ${below ? "less than " : ""}${feasible.maximum}${unit}${whole}`;
    if (feasible.minimum !== null)
      return `${above ? "more than" : "at least"} ${feasible.minimum}${unit}${whole}`;
    if (feasible.maximum !== null)
      return `${below ? "less than" : "at most"} ${feasible.maximum}${unit}${whole}`;
    return `any${unit}${whole}`;
  }
}

/** Companion types of {@link HumanRefusal}. */
export namespace AutoMovieMotionHumanRefusal {
  /**
   * The classes of refusal as data, from which {@link Kind} is derived: what a
   * page and a test generator list.
   */
  export const KINDS = [
    "parameter",
    "reach",
    "affordance",
    "channel",
    "cut",
    "participant",
    "base",
    "rule",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanRefusal.Kind>[];
}
