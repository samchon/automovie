import type { tags } from "typia";

/**
 * The unit a bounded number of an action's parameters is stated in, carried
 * by its type into the schema the laws' parameters generate (`x-unit`), as
 * its bounds are: a refusal of the number names its unit (`s`, `m`,
 * `degrees`, `hand` lengths, `beats/min`), or none for a pure number (a
 * count, a share, a scale). The entry check reads it there
 * (`HumanPerformanceParams`), so no refusal of a bound loses its unit.
 *
 * @evidence contracts/development/design.md#principled-representation A type tag merged into the generated JSON Schema (typia's `JsonSchemaPlugin`), the channel the bounds already ride.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One tag over a closed set of unit names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The unit is the parameter's own declaration, never inferred from its name or its prose.
 */
export type HumanUnit<Unit extends HumanUnit.Name> = tags.JsonSchemaPlugin<{
  "x-unit": Unit;
}>;

/** Companion types of {@link HumanUnit}. */
export namespace HumanUnit {
  /** The units a parameter is stated in; empty for a pure number. */
  export type Name = "s" | "m" | "degrees" | "hand" | "beats/min" | "";

  /** A number from `Min` to `Max` with a default, in a unit: the bounds, the default and the unit carried into the schema as one type. */
  export type Bounded<
    Min extends number,
    Max extends number,
    Default extends number,
    Unit extends Name,
  > = number &
    tags.Minimum<Min> &
    tags.Maximum<Max> &
    tags.Default<Default> &
    HumanUnit<Unit>;
}
