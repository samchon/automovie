import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * Data and callback contracts shared by the RenderSubjectOfCompiledShot operations.
 *
 * @evidence contracts/development/design.md#principled-representation A compiled artifact and optional host texture/residency observations define the adapter's full drawable subject, including declared simulated domains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderSubjectOfCompiledShot owns the canonical conversion and delegates shared field projection to autoMovieRenderSubjectOfShot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Planting prototype costs remain null when the artifact cannot establish them; texture upload facts must come from the host.
 * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed compiled authority, domain inclusion and unknown native costs.
 */
export namespace IAutoMovieRenderSubjectOfCompiledShot {
  /**
   * Read a compiled shot as the complete drawable world one frame commits to.
   *
   * {@link autoMovieRenderSubjectOfShot} leaves the simulated drawables to its
   * caller, because it was written while the compiled shot carried none. It
   * carries them now: the artifact holds every fluid, cloth and planting domain
   * beside the bindings that place them, and this is the one conversion that
   * reads both. Anywhere else, and the colour a pond is painted in the mask and
   * the cost a report prices for it would come from two different readings of one
   * artifact.
   *
   * Every declared domain becomes one drawable, bound or not. A fluid domain no
   * water feature claims is still a free surface somebody staged, and a palette
   * that skipped it would have no colour to notice its absence with; what the
   * binding adds is the owning space, which is how a colour resolves to a room.
   *
   * Branch and leaf prototype costs stay `null` on purpose. The solid a renderer
   * sweeps along a branch is the renderer's own choice and is in no compiled
   * record, so the geometry metrics report `not-run` rather than approve a
   * triangle count this repository invented.
   *
   * @evidence contracts/development/design.md#principled-representation A compiled artifact and optional host texture/residency observations define the adapter's full drawable subject, including declared simulated domains.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderSubjectOfCompiledShot owns the canonical conversion and delegates shared field projection to autoMovieRenderSubjectOfShot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Planting prototype costs remain null when the artifact cannot establish them; texture upload facts must come from the host.
   * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed compiled authority, domain inclusion and unknown native costs.
   */
  export type IProps = {
    /** Fully builder-owned shot artifact. */
    compiled: IAutoMovieCompiledShotSource;
    /** Actual host-decoded upload and sharing facts for resolved source assets. */
    textures?: readonly IAutoMovieRenderTextureSource[];
    /** Other live scopes and context-retained texture storage, when not fresh. */
    textureResidency?: IAutoMovieRenderTextureResidency;
  };
}
