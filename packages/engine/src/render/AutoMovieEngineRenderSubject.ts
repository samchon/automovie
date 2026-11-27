import { type IAutoMovieRenderSubject, type IAutoMovieRenderSubjectOfCompiledShot, type IAutoMovieRenderSubjectOfShot } from "@automovie/interface";
import { renderSubjectOfCompiledShot as renderSubjectOfCompiledShotImplementation } from "./internal/renderSubjectOfCompiledShot";
import { renderSubjectOfShot as renderSubjectOfShotImplementation } from "./internal/renderSubjectOfShot";

/** Public operations for Auto Movie Engine Render Subject. */
export namespace AutoMovieEngineRenderSubject {
  /**
   * Read a compiled shot as the complete drawable world one frame commits to.
   *
   * {@link renderSubjectOfShot} leaves the simulated drawables to its
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
   */
  export function autoMovieRenderSubjectOfCompiledShot(props: IAutoMovieRenderSubjectOfCompiledShot.IProps): IAutoMovieRenderSubject {
    return renderSubjectOfCompiledShotImplementation(props);
  }

  /**
   * Read a compiled shot as a render subject.
   *
   * The canonical compiled-shot adapter uses this field projection and derives
   * the artifact's simulated drawable rows. Other callers must supply those rows
   * explicitly; omitted supplemental arrays become empty. Texture upload and
   * residency facts come from the capture host, rather than the compiled
   * artifact.
   */
  export function autoMovieRenderSubjectOfShot(props: IAutoMovieRenderSubjectOfShot.IProps): IAutoMovieRenderSubject {
    return renderSubjectOfShotImplementation(props);
  }
}
