import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieViolationAppendSink } from "../validation/IAutoMovieViolationAppendSink";

/**
 * Data and callback contracts shared by the ValidatePropPlacementGeometry
 * operations.
 */
export namespace IAutoMovieValidatePropPlacementGeometry {
  /**
   * Judge every volume the sound part of a prop registry claims: keep-out
   * clearances, pairwise occupancy, support contact, space containment, opening
   * fit and passage intrusion.
   *
   * "Sound" is deliberately narrow: a prop is measured only when it forged,
   * when its node is declared once, when exactly one staged piece places it,
   * and when any footprint it declares is a real volume. Measuring an
   * ambiguous, unforged or degenerate prop would report a second failure caused
   * by the first, and the author would correct the wrong line. Sound props
   * without a `placement` are still measured as occupants others must clear and
   * as hosts others rest on, but claim nothing themselves.
   *
   * Pairwise overlap is checked only when both staged props declare
   * `placement`, and is refused unless one declares contact through a prop
   * affordance. A prop is judged against the environment it occupies, or, when
   * it names no space, the one building all its building relations cite;
   * relations spanning two buildings name no single place and are not measured.
   * An opening is fitted through the rest-pose world box of the element filling
   * it, and a passage the prop fills is not reported as one it blocks.
   * Violations go to `out` in prop declaration order within each check.
   */
  export type IProps = {
    /**
     * Every registry entry in declaration order, with what the registry gate
     * resolved for it.
     */
    entries: readonly {
      /** The registry's prop. */
      prop: IAutoMoviePropSpec;

      /** Its index in the registry, for violation paths. */
      index: number;

      /** The one set piece staging it, or `undefined` when zero or several do. */
      piece: IAutoMovieStageSetPiece | undefined;

      /** Whether `forgeProp` accepted it. */
      forged: boolean;

      /** Whether its node is declared once. */
      unique: boolean;

      /** The uniquely declared environment of its `in-space` target, or `null`. */
      located: IAutoMovieBuiltEnvironment | null;
    }[];

    /** Built environments by id, holding only ids declared exactly once. */
    environments: ReadonlyMap<string, IAutoMovieBuiltEnvironment>;

    /** Collector the violations are appended to. */
    out: IAutoMovieViolationAppendSink;
  };
}
