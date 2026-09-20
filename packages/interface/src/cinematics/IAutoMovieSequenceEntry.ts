import { IAutoMovieTransition } from "./IAutoMovieTransition";
import { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence: an optional trim and incoming transition.
 *
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `IAutoMovieSequenceEntry` as the portable data boundary for the editorial transition handles requirement.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `IAutoMovieSequenceEntry` for the spec editorial transition overlap system contract.
 */
export interface IAutoMovieSequenceEntry {
  /**
   * Id of the {@link IAutoMovieShot} played here.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `shot` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `shot` for the spec editorial transition overlap system contract.
   */
  shot: string;

  /**
   * Trim into the shot (seconds), the OTIO `source_range` analogue, or `null`
   * to play the whole shot.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `trim` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `trim` for the spec editorial transition overlap system contract.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Blend into this entry from the previous one, or `null` for a hard cut (the
   * default).
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `transition` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `transition` for the spec editorial transition overlap system contract.
   */
  transition: IAutoMovieTransition | null;
}
