import { IAutoMovieConstraintViolation, IAutoMovieSequence } from "@automovie/interface";

/**
 * An assembled cut: the {@link IAutoMovieSequence} the ASSEMBLE stage edited, or
 * the contradictions that stopped it.
 *
 * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMovieCut supports ordered output-track composition: An assembled cut: the {@link IAutoMovieSequence} the ASSEMBLE stage edited, or the contradictions that stopped it.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut realizes ordered output-track composition: An assembled cut: the {@link IAutoMovieSequence} the ASSEMBLE stage edited, or the contradictions that stopped it.
 * @author Samchon
 */
export type IAutoMovieCut = IAutoMovieCut.ISuccess | IAutoMovieCut.IFailure;

export namespace IAutoMovieCut {
  /**
   * Every entry referenced a built shot and every trim fit inside it.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMovieCut.ISuccess supports ordered output-track composition: Every entry referenced a built shot and every trim fit inside it.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.ISuccess realizes ordered output-track composition: Every entry referenced a built shot and every trim fit inside it.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks The true discriminator identifies a fully resolved ordered cut that is safe to render.
     * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.ISuccess.success marks the ordered sequence and runtime as renderable.
     */
    success: true;

    /**
     * The cut-list, ready for the renderer.
     *
     * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMovieCut.ISuccess.sequence supports ordered output-track composition: The cut-list, ready for the renderer.
     * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.ISuccess.sequence realizes ordered output-track composition: The cut-list, ready for the renderer.
     */
    sequence: IAutoMovieSequence;

    /**
     * Total running time in seconds (trims applied, transitions overlap-free).
     *
     * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMovieCut.ISuccess.runtime supports ordered output-track composition: Total running time in seconds (trims applied, transitions overlap-free).
     * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.ISuccess.runtime realizes ordered output-track composition: Total running time in seconds (trims applied, transitions overlap-free).
     */
    runtime: number;
  }

  /**
   * The cut referenced a missing shot or trimmed outside one.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMovieCut.IFailure supports ordered output-track composition: The cut referenced a missing shot or trimmed outside one.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.IFailure realizes ordered output-track composition: The cut referenced a missing shot or trimmed outside one.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks The false discriminator prevents an unresolved edit list from becoming the renderer's track.
     * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.IFailure.success prevents an unresolved edit list from becoming an output track.
     */
    success: false;

    /**
     * Every violation found, for the correction round.
     *
     * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks Reports each missing shot, invalid trim, and incompatible transition at its edit-entry path.
     * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMovieCut.IFailure.violations realizes ordered output-track composition: Every violation found, for the correction round.
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
