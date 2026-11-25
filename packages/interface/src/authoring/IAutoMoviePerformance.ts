import type { IAutoMovieEditorialMarker } from "../cinematics/IAutoMovieEditorialMarker";
import type { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * Thin verb program compiled by performShot into one shot through staged input,
 * motion, coupling, camera and artifact gates.
 *
 * Draft is the first complete program and revise records the author's
 * correction decision. The engine's semantic action gates and compiler read
 * exactly revise.final ?? draft; a non-null final replaces the draft entirely,
 * while a separate whole-record schema boundary may still inspect draft shape.
 * Handwritten keyframes enter through enact. plan and revise.review are review
 * prose that no engine gate reads.
 */
export interface IAutoMoviePerformance {
  /**
   * Non-blank script beat realized by this program. When the caller supplies no
   * shot id, the compiled shot is identified as `shot:<beat>`.
   */
  beat: string;

  /**
   * Named editorial annotations on the shot clock, admitted independently of
   * draft or final actions.
   */
  editorialMarkers?: readonly IAutoMovieEditorialMarker[];

  /** How the intended action decomposes into verbs and timing; never read. */
  plan: string;

  /**
   * First complete action program, camera frame actions included; selected by
   * engine semantic compilation only while revise.final is null.
   */
  draft: IAutoMovieActionCall[];

  /** Auditable self-review and optional corrected program. */
  revise: {
    /** Range, causality, region, camera and timing assessment; never read. */
    review: string;

    /**
     * Complete corrected action program that replaces the draft, or null when
     * the draft stands.
     */
    final: IAutoMovieActionCall[] | null;
  };

  /**
   * Finite positive shot-local duration in seconds; every action span must lie
   * inside `[0, duration]`.
   */
  duration: number;
}
