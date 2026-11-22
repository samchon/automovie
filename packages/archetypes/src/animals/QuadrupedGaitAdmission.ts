import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";

/**
 * Admission of a gait table's optional extensions: landmark swing heights and collected gaits. Kept apart from `AutoMovieArchetypeQuadrupedLocomotion.admit` for that file's size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two extensions it admits.
 * @evidence contracts/development/design.md#principled-representation Pure admission functions over the table's optional fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Called only by `AutoMovieArchetypeQuadrupedLocomotion.admit`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid entries refuse; nothing is dropped.
 */
export namespace QuadrupedGaitAdmission {
  /**
   * Admit a gait's landmark elevation, each coordinate from zero to one.
   *
   * @param elevation The gait's elevation, if any.
   * @param axis The gait's refusal axis.
   * @returns The copied elevation field to spread into the gait, empty when absent.
   * @throws {AutoMovieArchetypeRefusal} For a missing record or a coordinate outside zero to one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The coordinates run along the cannon from the fetlock to the carpus or hock, so only zero to one names a point on it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check both ends, return a copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small copy.
   */
  export function elevation(
    elevation: AutoMovieArchetypeQuadrupedGait.IElevation | undefined,
    axis: string,
  ): Pick<AutoMovieArchetypeQuadrupedGait.IGait, "elevation"> {
    if (elevation === undefined) return {};
    for (const end of ["fore", "hind"] as const)
      if (
        elevation === null ||
        typeof elevation !== "object" ||
        !(elevation[end] >= 0 && elevation[end] <= 1)
      )
        refuse(
          `${axis}.elevation.${end}`,
          elevation,
          "supply a fraction from zero through one",
        );
    return { elevation: { fore: elevation.fore, hind: elevation.hind } };
  }

  /**
   * Admit a table's collected-gait map: each key an explicit-only gait, each value an automatically ordered gait it is collected out of.
   *
   * @param collected The table's map, if any.
   * @param order The admitted automatic gaits.
   * @param explicit The admitted explicit-only gaits.
   * @returns The copied field to spread into the table, empty when absent.
   * @throws {AutoMovieArchetypeRefusal} For a key that is not explicit-only or a value that is not ordered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the copy and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A collected gait is entered by slowing out of an automatic gait (`QuadrupedRideClock.collectedSpeed`), so its parent must be one the ride can select by speed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the entries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An invalid entry refuses rather than being dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the entries and the gait lists.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the gait lists the table admission already built.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one small copy.
   */
  export function collected(
    collected: AutoMovieArchetypeQuadrupedGait.ITable["collected"],
    order: readonly AutoMovieArchetypeQuadrupedGait.Gait[],
    explicit: readonly AutoMovieArchetypeQuadrupedGait.Gait[],
  ): Pick<AutoMovieArchetypeQuadrupedGait.ITable, "collected"> {
    if (collected === undefined) return {};
    if (collected === null || typeof collected !== "object")
      refuse(
        "table.collected",
        collected,
        "map explicit gaits to ordered gaits",
      );
    const copy: Partial<
      Record<
        AutoMovieArchetypeQuadrupedGait.Gait,
        AutoMovieArchetypeQuadrupedGait.Gait
      >
    > = {};
    for (const [kind, parent] of Object.entries(collected)) {
      if (
        !explicit.includes(kind as AutoMovieArchetypeQuadrupedGait.Gait) ||
        parent === undefined ||
        !order.includes(parent)
      )
        refuse(
          `table.collected.${kind}`,
          parent,
          "collect an explicit gait out of an ordered gait",
        );
      copy[kind as AutoMovieArchetypeQuadrupedGait.Gait] = parent;
    }
    return { collected: copy };
  }

  /** One structured admission refusal, in the table admission's terms. */
  function refuse(axis: string, value: unknown, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "quadrupedLocomotion",
      axis,
      value,
      reason,
      fix: "Supply an explicit valid locomotion table or authored clock.",
    });
  }
}
