/**
 * One affine projected piece on an actual native skin feature. Endpoints delimit the represented curve, not a chord across different nearest sheets. Constant projection pieces carry zero arc length.
 *
 * @evidence contracts/common.md#principled-implementation Affine native-feature endpoints and physical accumulated lengths form one course interval.
 * @evidence contracts/common.md#clear-and-simple-design Both free-guide projection and native chart compilation share this physical span seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A span does not authorize a chord crossing unsupported sheets; zero physical length remains a constant station interval.
 * @evidence contracts/common.md#meaningful-documentation Endpoints and lengths use head metres and precedingLengthMetres counts prior physical spans.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Span interpolation/nearest projection execute in course compiler/readers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same emitted endpoints serve length and later attachment distance reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compiler-owned endpoint arrays live with their course and this erased type acquires no source mesh.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinSpan {
  /** First projected head-frame point, metres. */
  start: readonly number[];

  /** Last projected head-frame point, metres. */
  end: readonly number[];

  /** Arc length of this straight, source-supported piece, metres. */
  lengthMetres: number;

  /** Arc length preceding this piece, metres. */
  precedingLengthMetres: number;
}
