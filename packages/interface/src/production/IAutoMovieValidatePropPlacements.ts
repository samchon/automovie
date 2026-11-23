import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

/** Data and callback contracts shared by the ValidatePropPlacements operations. */
export namespace IAutoMovieValidatePropPlacements {
  /**
   * Validate a source-owned prop registry, its unique staged join, its typed
   * building relations, its support graph, the bearing of every prop on the
   * face it says holds it up, and every transformed volume it claims.
   *
   * Registry construction is deliberately a separate first pass. A lamp may
   * cite a table declared later without changing the result, while duplicate
   * prop, set-piece, or building-environment identities stay explicit rather
   * than being hidden by `Map`'s last-write-wins behavior. Each prop is forged
   * with `forgeProp`, whose violations are re-rooted at the prop's path, and
   * must be staged by exactly one set piece drawing its model.
   *
   * A relation must cite a target kind its relation kind accepts, a target that
   * resolves, and, for a prop affordance, a different, uniquely declared prop
   * whose affordance has the kind the relation needs: `stack-top` to rest on,
   * `socket` to attach, `hook` to hang. A prop occupies at most one space and
   * fills at most one opening, every building relation stays in the occupied
   * space's environment, a supporting prop stays there too, and contact
   * relations may not form a cycle. Footprints and clearances need finite,
   * positive extents and clearance ids are non-blank and unique per prop.
   *
   * A prop omitting placement makes no relation, containment, overlap or
   * passage claim of its own, but its staged occupancy can obstruct another
   * prop's clearance and its model affordances can support another prop.
   * Geometry delegates to validatePropPlacementGeometry: a space subtree with
   * neither cells nor shells imposes no containment restriction, shell-only
   * spaces are measured, and model-less fills or ambiguous staging joins cannot
   * supply the corresponding bounds.
   *
   * Where a prop's appearance came from changes nothing here. A prop drawing an
   * external asset (`IAutoMoviePropSpec.modelRef`) forges like any other, so it
   * is contained, borne, cleared, and judged against passages through exactly
   * these rules, read off the deterministic proxy `propOccupancyBounds`
   * measures and the affordances its own spec declares.
   */
  export type IProps = {
    /**
     * Source-owned registry whose exact node and target identities are
     * retained.
     */
    props: readonly IAutoMoviePropSpec[];

    /**
     * Staged set pieces joining each declared prop to its model and world
     * placement.
     */
    set: readonly IAutoMovieStageSetPiece[];

    /** Built environments that relation targets may reference. */
    builtEnvironments: readonly IAutoMovieBuiltEnvironment[];
  };
}
