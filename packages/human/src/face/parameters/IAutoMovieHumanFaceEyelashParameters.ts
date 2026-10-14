/**
 * One eye's upper and lower eyelash populations as observed at their lids.
 * A study of 50 healthy Japanese adults measured the longest shaft and the
 * shaft count in the central 2 mm of the right upper and lower lids, and classified straight
 * versus curly form
 * (https://oatext.com/A-study-of-normal-eyelashes-in-Japanese-individuals.php).
 * The same landmark definition can be applied on the left, without treating
 * this right-only sample as a left-side norm. Its lateral-photograph angle is
 * relative to image vertical, so it is not a
 * portable 3D anatomical root angle and is absent here. This cohort supplies
 * no universal cutoff. The shaft count is biological, not renderer cards;
 * neither a lash root list nor a trajectory is authored here.
 *
 * @evidence contracts/common.md#principled-implementation Separate upper/lower Margin records retain clinical central-window counts, longest length and observed shaft form. Current rules keep them, with the clinical 2-mm acquisition window unregistered and no form-to-curl conversion despite existing generated shafts.
 * @evidence contracts/common.md#clear-and-simple-design One eye groups its two lid populations while the anatomical pair owns laterality and Margin owns the acquisition fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Right-only cohort observations supply no left-side norm, photographic image-vertical angle is not a 3D root angle, and biological shaft counts are not renderer cards.
 * @evidence contracts/common.md#meaningful-documentation The comment states clinical window/population, laterality extension, excluded image angle and unknown omissions, with upper/lower owners beside their fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type executes no strand generation or clinical lash count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lid observation grouping owns no repeated acquisition or generated-shaft cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no lash mesh or camera frame; the document owns its optional margin records.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelashParameters {
  /** Upper lid population. */
  upper?: IAutoMovieHumanFaceEyelashParameters.Margin;

  /** Lower lid population. */
  lower?: IAutoMovieHumanFaceEyelashParameters.Margin;
}

export namespace IAutoMovieHumanFaceEyelashParameters {
  /**
   * A lid margin's population-level dimensions.
   *
   * @evidence contracts/common.md#principled-implementation Longest visible length and biological root count share the same central 2-mm lid window, while straight/curly is an observed class rather than a numerical course. Current clinical acquisition remains unregistered.
   * @evidence contracts/common.md#clear-and-simple-design Three optional population fields describe one lid margin without per-shaft roots or trajectories.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Emitted shaft totals or sampled centreline lengths do not certify the clinical central-window protocol, and a form label supplies no default curve.
   * @evidence contracts/common.md#meaningful-documentation Members identify the common acquisition window, millimetre longest length, biological count and independent observed form.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The margin schema computes no longest-shaft search or root-window population.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no shared counting result or acquisition identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type retains no strand buffers or optical instrument resource; its observation owner holds the optional values.
   *
   * @author Samchon
   */
  export interface Margin {
    /** Longest visible shaft from the central 2 mm of lid edge, in mm. */
    longestCentralLengthMm?: number;

    /** Number of shafts rooted in that central 2 mm. */
    centralTwoMmShaftCount?: number;

    /** Observed shaft form, separate from any generated card curve. */
    form?: "straight" | "curly";
  }
}
