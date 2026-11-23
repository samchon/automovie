import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMoviePropRelationTarget } from "../harness/IAutoMoviePropRelationTarget";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

/** Borrowed placement registries used to resolve a relation's rest-world anchor. */
export namespace IAutoMoviePropAnchorFrame {
  /**
   * The world frame a placement relation anchors to, or `null` when it has
   * none.
   *
   * This is the relative-transform half of placement: a source that wants
   * twelve chairs around a table asks for the table's `stack-top` frame once
   * and offsets from it in a loop, instead of typing twelve world positions
   * that stop being right the moment the table moves. Each target kind answers
   * as follows:
   *
   * - `prop-affordance`: the affordance's frame under the staged piece's
   *   transform; `null` when the prop, its staged piece or the affordance is
   *   missing.
   * - `element`: the element's rest-pose world transform.
   * - `boundary`: the rest-pose world transform of its first realizing element.
   * - `opening`: the rest-pose world transform of its filling element; `null` for
   *   an open cut.
   * - `surface`: a point inside the widest convex piece of the patch, at the
   *   patch's height there, with identity rotation and unit scale; `null` for a
   *   patch with no area.
   * - `space`: always `null`, because a region has no frame.
   *
   * A building target also answers `null` when its environment, element or
   * record is missing or an element's parent chain is missing or cyclic. Rest
   * pose means operating states are ignored: an anchor on a door is where the
   * door hangs, not where it swings to. Lookups take the first record of a
   * given id; two records sharing one id is a contradiction
   * {@link validatePropPlacements} refuses by name, so resolving it a second
   * time here would report the same defect in a worse place.
   *
   * The composed affine matrix is returned as a decomposed TRS with normalized
   * rotation. Rotations combined with nonuniform parent scales can introduce
   * shear that this representation does not preserve; the result is not a
   * general affine anchor matrix. Matrix4.decompose can throw when derived
   * affine arithmetic cannot produce a finite frame; null covers the stated
   * missing/cyclic/absent-face cases, not every numerical failure.
   */
  export type IProps = {
    /**
     * Borrowed discriminated placement target. A space always has no anchor;
     * opening requires a fill and boundary uses its first realizing element.
     */
    target: IAutoMoviePropRelationTarget;
    /**
     * Borrowed buildings searched by exact id, taking the first match. Rest
     * element ancestry must resolve; missing or cyclic ancestry yields null.
     */
    environments: readonly IAutoMovieBuiltEnvironment[];
    /**
     * Borrowed prop registry for prop-affordance targets; omitted means empty.
     * Its model must declare the requested affordance.
     */
    props?: readonly IAutoMoviePropSpec[];
    /**
     * Borrowed staged pieces for prop-affordance placement; omitted means
     * empty. The selected piece's full transform composes with the local
     * affordance frame.
     */
    set?: readonly IAutoMovieStageSetPiece[];
  };
}
