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
 * @evidence contracts/development/common.md#meaningful-documentation States who reads a refusal, what each carries, that it is seed-independent and how it is located.
 * @evidence contracts/development/design.md#principled-representation An `Error` whose message is composed from typed fields, so the text and the fields cannot disagree.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fields an author repairs from, one constructor and the locating copy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The feasible set is a closed union of a range and alternatives, not free text.
 */
export class HumanRefusal extends Error {
  /** The class of refusal. */
  public readonly kind: HumanRefusal.Kind;

  /** The performer who was to act; empty until the performance locates the refusal. */
  public readonly performer: string;

  /** The action refused; empty until located, unless the law named it. */
  public readonly act: string;

  /** Which occurrence of that action in the performer's chain, from 1; 0 until located. */
  public readonly instance: number;

  /** The axis at fault: a parameter's name, or `cut`, `channel`, `base`. */
  public readonly axis: string;

  /** The value given on that axis, as the author wrote it or as it was measured. */
  public readonly value: unknown;

  /** What the axis accepts here: a range, the alternatives, or null when neither applies. */
  public readonly feasible: HumanRefusal.Feasible | null;

  /** Why it is refused, with the measured numbers. */
  public readonly reason: string;

  /** One sentence naming what to change. */
  public readonly fix: string;

  /**
   * A refusal.
   *
   * @param props Its facts; the message is composed from them.
   */
  public constructor(props: HumanRefusal.IProps) {
    super(HumanRefusal.message(props));
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
  public locate(where: HumanRefusal.IWhere): HumanRefusal {
    if (this.performer !== "" && this.act !== "" && this.instance !== 0)
      return this;
    return new HumanRefusal({
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
   * The message of a refusal: `performer.act#instance axis: reason;
   * feasible: ...; fix: ...`, the place left out until it is known.
   *
   * @param props The refusal's facts.
   * @returns The message.
   */
  public static message(props: HumanRefusal.IProps): string {
    const place: string =
      (props.performer ?? "") === "" && (props.act ?? "") === ""
        ? ""
        : `${props.performer ?? ""}${props.performer && props.act ? "." : ""}${props.act ?? ""}${
            (props.instance ?? 0) === 0 ? "" : `#${props.instance}`
          } `;
    const feasible: HumanRefusal.Feasible | null = props.feasible ?? null;
    return `${place}${props.axis}: ${props.reason}${
      feasible === null ? "" : `; feasible: ${HumanRefusal.describe(feasible)}`
    }; fix: ${props.fix}`;
  }

  /**
   * A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the
   * alternatives listed.
   *
   * @param feasible The set.
   * @returns The text.
   */
  public static describe(feasible: HumanRefusal.Feasible): string {
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

/**
 * Companion types of {@link HumanRefusal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each class of refusal and each member.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the class and the feasible set; plain records for the facts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a refusal is built from and located by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No free-form bag of details: every fact has a named member.
 */
export namespace HumanRefusal {
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
   */
  export type Kind = (typeof KINDS)[number];

  /** The classes of refusal as data, from which {@link Kind} is derived: what a page and a test generator list. */
  export const KINDS = [
    "parameter",
    "reach",
    "affordance",
    "channel",
    "cut",
    "participant",
    "base",
    "rule",
  ] as const;

  /** What an axis accepts: a numeric range or a list of alternatives. */
  export type Feasible = IRange | IAlternatives;

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

  /** The values that would have been accepted, as the author writes them. */
  export interface IAlternatives {
    /** The discriminator. */
    kind: "alternatives";

    /** The accepted values. */
    values: readonly string[];
  }

  /** A place in the film. */
  export interface IWhere {
    /** The performer. */
    performer: string;

    /** The action. */
    act: string;

    /** The occurrence of the action in the performer's chain, from 1. */
    instance: number;
  }

  /** The facts of a refusal. */
  export interface IProps extends Partial<IWhere> {
    /** The class. */
    kind: Kind;

    /** The axis at fault. */
    axis: string;

    /** The value given or measured. */
    value: unknown;

    /** What the axis accepts; null or absent when neither a range nor alternatives apply. */
    feasible?: Feasible | null;

    /** Why it is refused, with the measured numbers. */
    reason: string;

    /** One sentence naming what to change. */
    fix: string;
  }
}
