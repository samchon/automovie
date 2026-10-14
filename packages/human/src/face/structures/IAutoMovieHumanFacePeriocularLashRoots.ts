/**
 * The anterior lid-edge rows on which free eyelashes are rooted.
 *
 * The source producer registers these native skin vertices separately from
 * the posterior palpebral margins. Both rows run medial to lateral and share
 * the margin record's surface. Evaluators read the final performed skin;
 * the registration supplies no clinical follicle spacing or tissue depth.
 *
 * @evidence contracts/common.md#principled-implementation buildHumanFaceLashRows reads the registered anterior skin chains on the final surface; available source charts/native boundaries retain all knots before equal arc-length shaft stations are selected.
 * @evidence contracts/common.md#clear-and-simple-design Independent upper/lower root rows share the margin owner's skin surface while posterior contact margins remain separate registrations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive populations require valid resident roots and a noncollapsed supported arc; optional eligibility can restrict adjacent segments, but uniform rendering stations do not establish follicle spacing or tissue depth.
 * @evidence contracts/common.md#meaningful-documentation Anterior versus posterior ownership and medial-to-lateral direction prevent using contact margins as biological implantation evidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The row record performs no arc measurement, source walk or station sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registered root identity provides correspondence, not cached performed curves here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source index arrays acquire no shafts, chart derivatives or eye-frame buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashRoots {
  /** Anterior upper-lid skin row, medial to lateral. */
  upper: number[];

  /** Anterior lower-lid skin row, medial to lateral. */
  lower: number[];
}
