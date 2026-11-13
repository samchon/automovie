/**
 * A request an archetype refuses, as a value its author can act on: which archetype, which axis of the request is at fault, the value given, what would have been accepted, and what to change.
 *
 * The author is a production's coding agent, which reads no picture before it composes, so the refusal is its only feedback. The same facts are fields, so a program reads them without parsing the message, and they carry the names of the motion vocabulary's refusal (`kind`, `axis`, `value`, `feasible`, `reason`, `fix`) so one handler reads both.
 *
 * A refusal depends on the request alone, never on the seed: a seed only draws inside bands that are accepted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who reads a refusal, that its facts are fields, and that it never depends on the seed.
 * @evidence contracts/development/design.md#principled-representation One error class whose fields are the refusal contract of #3375 applied to objects: a closed kind, the axis, the given value and a feasible set that is a range or a list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The archetypes own it because `motions`, which owns `HumanRefusal`, is not a dependency of this package; every producer, accessor and articulation raises it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The feasible set is a discriminated union, so a range never carries alternatives.
 */
export class ArchetypeRefusal extends Error {
  /** The class of refusal. */
  public readonly kind: ArchetypeRefusal.Kind;

  /** The archetype that refused, by its producer's name, such as `chair`. */
  public readonly archetype: string;

  /** The axis at fault: a parameter's or dimension's name, or `affordance`, `articulation`, `site`. */
  public readonly axis: string;

  /** The value given on that axis, as the author wrote it. */
  public readonly value: unknown;

  /** What the axis accepts here: a range, the alternatives, or null when neither applies. */
  public readonly feasible: ArchetypeRefusal.Feasible | null;

  /** Why it is refused, with the numbers. */
  public readonly reason: string;

  /** One sentence naming what to change. */
  public readonly fix: string;

  /**
   * A refusal.
   *
   * @param props Its facts; the message is composed from them as `archetype axis: reason; feasible: ...; fix: ...`.
   */
  public constructor(props: ArchetypeRefusal.IProps) {
    const feasible: ArchetypeRefusal.Feasible | null = props.feasible ?? null;
    super(
      `${props.archetype} ${props.axis}: ${props.reason}${
        feasible === null
          ? ""
          : `; feasible: ${ArchetypeRefusal.describe(feasible)}`
      }; fix: ${props.fix}`,
    );
    this.name = "ArchetypeRefusal";
    this.kind = props.kind;
    this.archetype = props.archetype;
    this.axis = props.axis;
    this.value = props.value;
    this.feasible = feasible;
    this.reason = props.reason;
    this.fix = props.fix;
  }

  /**
   * A feasible set as text: `0.38 to 0.56 m`, or the alternatives listed, `none` for an empty list.
   *
   * @param feasible The set.
   * @returns The text.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both forms and the empty list's text.
   * @evidence contracts/development/implementation.md#principled-implementation String composition over the two members of the union.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per member.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Numbers are printed as given, never rounded into a different bound.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per listed value.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one value.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public static describe(feasible: ArchetypeRefusal.Feasible): string {
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

/**
 * Companion types of {@link ArchetypeRefusal}.
 */
export namespace ArchetypeRefusal {
  /**
   * The classes of refusal, each repaired at a different place:
   *
   * - `parameter`: a parameter or a fixed dimension outside what the producer accepts; change the value.
   * - `affordance`: an affordance id the archetype does not declare; name one that exists.
   * - `articulation`: a travel outside an articulation's range, or an id that is no articulation; change the travel or the id.
   * - `site`: a site coordinate outside the affordance's extent; keep it inside 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation What a refusal is about, as a closed union of literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; set at every throw site of the package and read by an author's handler.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
   */
  export type Kind = "parameter" | "affordance" | "articulation" | "site";

  /**
   * What an axis accepts: a numeric range or a list of alternatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation What an axis accepts instead: a numeric range or a list of alternatives, discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a member of every refusal's facts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A discriminated union, so a range cannot carry values nor a list bounds.
   */
  export type Feasible = IRange | IAlternatives;

  /**
   * A numeric range, both ends included; an open end is null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A numeric range in a stated unit; an end without a limit is null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by parameter and articulation refusals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Open ends are null, not sentinel numbers.
   */
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

  /**
   * The values that would have been accepted, as the author writes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The values that would have been accepted, as the author writes them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by refusals of an id or of a closed choice.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IAlternatives {
    /** The discriminator. */
    kind: "alternatives";

    /** The accepted values. */
    values: readonly string[];
  }

  /**
   * The facts of a refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The facts of one refusal: its kind, the archetype's name, the axis at fault, the value given, what is feasible, why, and one sentence of repair.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the constructor's only argument, each member published on the error.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None beyond what each member's own comment states.
   */
  export interface IProps {
    /** The class. */
    kind: Kind;

    /** The archetype that refuses, by its producer's name. */
    archetype: string;

    /** The axis at fault. */
    axis: string;

    /** The value given. */
    value: unknown;

    /** What the axis accepts; null or absent when neither a range nor alternatives apply. */
    feasible?: Feasible | null;

    /** Why it is refused, with the numbers. */
    reason: string;

    /** One sentence naming what to change. */
    fix: string;
  }
}
