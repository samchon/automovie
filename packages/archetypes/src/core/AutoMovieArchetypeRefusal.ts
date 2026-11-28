/**
 * Reports why an archetype could not accept a requested value or contact.
 *
 * Read `archetype`, `kind`, `axis`, `value`, `feasible`, `reason` and `fix`
 * when handling the error. The message presents these facts for an author.
 */
export class AutoMovieArchetypeRefusal extends Error {
  /** Category of the failed request. */
  public readonly kind: AutoMovieArchetypeRefusal.Kind;

  /** Producer name reported by the operation that refused the request. */
  public readonly archetype: string;

  /** Parameter, dimension or contact axis that failed admission. */
  public readonly axis: string;

  /** Value received by the refusing operation. */
  public readonly value: unknown;

  /**
   * Accepted numeric range or alternatives. Null indicates no set was supplied.
   */
  public readonly feasible: AutoMovieArchetypeRefusal.Feasible | null;

  /** Explanation of the failed admission condition. */
  public readonly reason: string;

  /** A change that lets the author recover or choose another request. */
  public readonly fix: string;

  /**
   * Create a refusal with structured fields and a readable message.
   *
   * @param props Facts supplied by the operation that refused the request.
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
   * Format a feasible range or alternatives for an author.
   *
   * @param feasible Range with optional bounds or list of accepted values.
   * @returns Text such as `0.38 to 0.56 m`, `at least 1`, a list of names,
   *   `any` for an unbounded range or `none` for an empty list.
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

/** Categories and recovery information for structured archetype refusals. */
export namespace AutoMovieArchetypeRefusal {
  /**
   * Operation that refused the request.
   *
   * `parameter` covers inputs and dimensions. `affordance` covers contact
   * lookup. `articulation` covers a moving contact or requested travel.
   * `site` covers a requested position on an affordance.
   */
  export type Kind = "parameter" | "affordance" | "articulation" | "site";

  /** Accepted values for the reported axis, as an inclusive range or a list. */
  export type Feasible = IRange | IAlternatives;

  /** Inclusive numeric range. Null denotes a side without a bound. */
  export interface IRange {
    /** Identifies numeric-range recovery information. */
    kind: "range";

    /** Inclusive lower bound, or null when the lower side is unbounded. */
    minimum: number | null;

    /** Inclusive upper bound, or null when the upper side is unbounded. */
    maximum: number | null;

    /**
     * Label for the supplied bounds. Use the empty string for a unitless value.
     */
    unit: string;
  }

  /** Available authored choices represented as labels. */
  export interface IAlternatives {
    /** Identifies enumerated recovery information. */
    kind: "alternatives";

    /**
     * Choices as the author would enter them. An empty array gives no alternatives.
     */
    values: readonly string[];
  }

  /** Facts supplied by the operation that defines an archetype refusal. */
  export interface IProps {
    /** Category of failed operation. */
    kind: Kind;

    /** Producer name for the refused request. */
    archetype: string;

    /** Name of the input or contact axis that failed admission. */
    axis: string;

    /** Received value, including malformed data. */
    value: unknown;

    /** Optional accepted range or alternatives. */
    feasible?: Feasible | null;

    /** Condition that the request failed. */
    reason: string;

    /** Change the author can make to resolve the refusal. */
    fix: string;
  }
}
