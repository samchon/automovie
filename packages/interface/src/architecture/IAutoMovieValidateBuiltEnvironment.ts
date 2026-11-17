import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";

/**
 * Data and callback contracts shared by the ValidateBuiltEnvironment operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Validate the graph, geometry references, and spatial topology of a building. Member documentation states the supplied records, units and absence meanings used by validateBuiltEnvironment.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A typed building is not proof of valid references or numeric geometry; validateBuiltEnvironment collects those domain violations under its documented container premises.
 * @evidence contracts/development/design.md#principled-representation environment supplies the canonical building graph in world metres; validation resolves its authored identities, geometry and operating-state constraints without rewriting the graph.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateBuiltEnvironment, used by validateBuiltEnvironment. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateBuiltEnvironment {
  /**
   * Validate the graph, geometry references, and spatial topology of a building.
   *
   * Checks, in order: schema version 1 and metre units; owned models through
   * `validateModel` and runtime model references; logical spaces with their
   * cells or closed shells; the element and space hierarchies for dangling
   * parents and cycles; populations; ownership by exactly one building unit;
   * boundaries and their faces; openings, their voids inside the host face, their
   * operations, and void overlap on one boundary; connectors, their route shape,
   * landings and operations; and the support surfaces through `validateSpace`.
   * Only when none of that produced an error does it run the staged checks:
   * every closed panel fits its void, every carriage stands inside the stated-volume
   * space its state serves, and no operating state composes shear into the
   * element hierarchy.
   *
   * Record defects are collected with `$input` paths, warnings included. Typed containers and executable traversal depth remain premises; this is not a universal non-throw guarantee for arbitrary runtime values or resource exhaustion. Guarded lowering and downstream consumers refuse a rejected record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Validate the graph, geometry references, and spatial topology of a building. Member documentation states the supplied records, units and absence meanings used by validateBuiltEnvironment.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A typed building is not proof of valid references or numeric geometry; validateBuiltEnvironment collects those domain violations under its documented container premises.
   * @evidence contracts/development/design.md#principled-representation environment supplies the canonical building graph in world metres; validation resolves its authored identities, geometry and operating-state constraints without rewriting the graph.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateBuiltEnvironment.IProps, used by validateBuiltEnvironment. Its environment members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Building record to validate. */
    environment: IAutoMovieBuiltEnvironment;
  };
}
