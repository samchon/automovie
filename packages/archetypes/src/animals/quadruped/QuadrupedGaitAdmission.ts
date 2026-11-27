import { AutoMovieArchetypeRefusal } from "../../core";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";

/*
 * Admission of a gait table's optional extensions: landmark swing heights and
 * collected gaits. Kept apart from
 * `AutoMovieArchetypeQuadrupedLocomotion.admit` for that file's size.
 */
export namespace QuadrupedGaitAdmission {
  /*
   * Admit a gait's landmark elevation, each coordinate from zero to one.
   * Parameter elevation: The gait's elevation, if any.
   * Parameter axis: The gait's refusal axis.
   * Returns: The copied elevation field to spread into the gait, empty when
   * absent.
   * For a missing record or a coordinate
   * outside zero to one.
   */
  export function elevation(
    elevation: AutoMovieArchetypeQuadrupedGait.IElevation | undefined,
    axis: string,
  ): Pick<AutoMovieArchetypeQuadrupedGait.IGait, "elevation"> {
    if (elevation === undefined) return {};
    for (const end of ["fore", "hind"] as const)
      if (elevation === null || !(elevation[end] >= 0 && elevation[end] <= 1))
        refuse(
          `${axis}.elevation.${end}`,
          elevation,
          "supply a fraction from zero through one",
        );
    return { elevation: { fore: elevation.fore, hind: elevation.hind } };
  }

  /*
   * Admit a table's collected-gait map: each key an explicit-only gait, each
   * value an automatically ordered gait it is collected out of.
   * Parameter collected: The table's map, if any.
   * Parameter order: The admitted automatic gaits.
   * Parameter explicit: The admitted explicit-only gaits.
   * Returns: The copied field to spread into the table, empty when absent.
   * For a key that is not explicit-only or
   * a value that is not ordered.
   */
  export function collected(
    collected: AutoMovieArchetypeQuadrupedGait.ITable["collected"],
    order: readonly AutoMovieArchetypeQuadrupedGait.Gait[],
    explicit: readonly AutoMovieArchetypeQuadrupedGait.Gait[],
  ): Pick<AutoMovieArchetypeQuadrupedGait.ITable, "collected"> {
    if (collected === undefined) return {};
    if (collected === null)
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
      const gait: AutoMovieArchetypeQuadrupedGait.Gait | undefined =
        explicit.find(
          (known: AutoMovieArchetypeQuadrupedGait.Gait): boolean =>
            known === kind,
        );
      if (
        gait === undefined ||
        parent === undefined ||
        !order.includes(parent)
      )
        refuse(
          `table.collected.${kind}`,
          parent,
          "collect an explicit gait out of an ordered gait",
        );
      copy[gait] = parent;
    }
    return { collected: copy };
  }

  /*
   * One structured admission refusal, in the table admission's terms.
   */
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
