/**
 * A request an archetype refuses, as a value its author can act on: which
 * archetype, which axis of the request is at fault, the value given, what would
 * have been accepted, and what to change.
 *
 * The author is a production's coding agent, which reads no picture before it
 * composes, so the refusal is its only feedback. The same facts are fields, so
 * a program reads them without parsing the message, and they carry the names of
 * the motion vocabulary's refusal (`kind`, `axis`, `value`, `feasible`,
 * `reason`, `fix`) so one handler reads both.
 *
 * A refusal depends on the request alone, never on the seed: a seed only draws
 * inside bands that are accepted.
 */
export class AutoMovieArchetypeRefusal extends Error {
  /** The class of refusal. */
  public readonly kind: AutoMovieArchetypeRefusal.Kind;

  /** The archetype that refused, by its producer's name, such as `chair`. */
  public readonly archetype: string;

  /**
   * The axis at fault: a parameter's or dimension's name, or `affordance`,
   * `articulation`, `site`.
   */
  public readonly axis: string;

  /** The value given on that axis, as the author wrote it. */
  public readonly value: unknown;

  /**
   * What the axis accepts here: a range, the alternatives, or null when neither
   * applies.
   */
  public readonly feasible: AutoMovieArchetypeRefusal.Feasible | null;

  /** Why it is refused, with the numbers. */
  public readonly reason: string;

  /** One sentence naming what to change. */
  public readonly fix: string;

  /**
   * A refusal.
   *
   * @param props Its facts; the message is composed from them as `archetype
   *   axis: reason; feasible: ...; fix: ...`.
   */
  public constructor(props: AutoMovieArchetypeRefusal.IProps) {
    const feasible: AutoMovieArchetypeRefusal.Feasible | null =
      props.feasible ?? null;
    super(
      `${props.archetype} ${props.axis}: ${props.reason}${
        feasible === null
          ? ""
          : `; feasible: ${AutoMovieArchetypeRefusal.describe(feasible)}`
      }; fix: ${props.fix}`,
    );
    this.name = "AutoMovieArchetypeRefusal";
    this.kind = props.kind;
    this.archetype = props.archetype;
    this.axis = props.axis;
    this.value = props.value;
    this.feasible = feasible;
    this.reason = props.reason;
    this.fix = props.fix;
  }

  /**
   * A feasible set as text: `0.38 to 0.56 m`, or the alternatives listed,
   * `none` for an empty list.
   *
   * @param feasible The set.
   * @returns The text.
   */
  public static describe(feasible: AutoMovieArchetypeRefusal.Feasible): string {
    if (feasible.kind === "alternatives")
      return feasible.values.length === 0 ? "none" : feasible.values.join(", ");
    const unit: string = feasible.unit === "" ? "" : ` ${feasible.unit}`;
    if (feasible.minimum !== null && feasible.maximum !== null)
      return `${feasible.minimum} to ${feasible.maximum}${unit}`;
    if (feasible.minimum !== null) return `at least ${feasible.minimum}${unit}`;
    if (feasible.maximum !== null) return `at most ${feasible.maximum}${unit}`;
    return `any${unit}`;
  }
}

/** Companion types of {@link AutoMovieArchetypeRefusal}. */
export namespace AutoMovieArchetypeRefusal {
  /**
   * The classes of refusal, each repaired at a different place:
   *
   * - `parameter`: a parameter or a fixed dimension outside what the producer
   *   accepts; change the value.
   * - `affordance`: an affordance id the archetype does not declare; name one
   *   that exists.
   * - `articulation`: a travel outside an articulation's range, or an id that is
   *   no articulation; change the travel or the id.
   * - `site`: a site coordinate outside the affordance's extent; keep it inside 0
   *   to 1.
   */
  export type Kind = "parameter" | "affordance" | "articulation" | "site";

  /** What an axis accepts: a numeric range or a list of alternatives. */
  export type Feasible = IRange | IAlternatives;

  /** A numeric range, both ends included; an open end is null. */
  export interface IRange {
    /** The discriminator. */
    kind: "range";

    /** The least accepted value, or null when unbounded below. */
    minimum: number | null;

    /** The greatest accepted value, or null when unbounded above. */
    maximum: number | null;

    /** The unit of both ends (`m`, `kg`, `degrees`), or empty for a pure number. */
    unit: string;
  }

  /** The values that would have been accepted, as the author writes them. */
  export interface IAlternatives {
    /** The discriminator. */
    kind: "alternatives";

    /** The accepted values. */
    values: readonly string[];
  }

  /** The facts of a refusal. */
  export interface IProps {
    /** The class. */
    kind: Kind;

    /** The archetype that refuses, by its producer's name. */
    archetype: string;

    /** The axis at fault. */
    axis: string;

    /** The value given. */
    value: unknown;

    /**
     * What the axis accepts; null or absent when neither a range nor
     * alternatives apply.
     */
    feasible?: Feasible | null;

    /** Why it is refused, with the numbers. */
    reason: string;

    /** One sentence naming what to change. */
    fix: string;
  }
}
