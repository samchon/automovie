/**
 * Owned performed head/body coordinate arrays plus requested rest-field maxima from one shared skin formation. Coordinates use common metre Y-up/+Z-forward pose frame; canonical shared IDs receive one head-side posed value on both halves. Face/body field scalars instead summarize pre-pose neutral displacement, with eye-anchor rest shift removed from bodyField. These are numerical assembly observations rather than guaranteed bounds on final posed gaps, clinical proportions or global embeddedness.
 *
 * @evidence contracts/common.md#principled-implementation Actual formed/posed source halves and separate requested rest fields preserve common boundary publication and its observed source disagreement.
 * @evidence contracts/common.md#clear-and-simple-design Coordinate arrays remain distinct from two rest-field scalars while posing, normals and admission retain concrete owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared values do not hide adjacent-ring field steps or certify global geometry/clinical fit, and pre-pose maxima are not called final posed clearance bounds.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes posed metre arrays from rest-field observation timing and anchor-shift subtraction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result type executes no body skinning, field combination or maximum scan; the forming owner performs those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing formed buffers for normals/placement is evaluator behavior rather than memoization in this schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring the result acquires no source task or renderer; its actual caller owns returned coordinate arrays and scalar receipt lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFormedSkin {
  /** Posed head skin positions. */
  facePosed: number[];

  /** Posed body skin positions. */
  bodyPosed: number[];

  /** The largest face field step at a shared sample, metres. */
  faceField: number;

  /** Largest body rest-field step after removing the eye-anchor rest shift, metres. */
  bodyField: number;
}
