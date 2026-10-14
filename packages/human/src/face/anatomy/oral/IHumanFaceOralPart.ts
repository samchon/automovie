import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One shared head-frame oral surface before its single rigid jaw owner acts.
 *
 * @evidence contracts/common.md#principled-implementation A generated oral mesh carries stable member/physical identities, material role and one rigid or already-performed owner.
 * @evidence contracts/common.md#clear-and-simple-design Drawing finish and query assembly consume the same actual generated points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source enamel artwork and gingival pigment remain licensed appearance, not biological pigment measurements.
 * @evidence contracts/common.md#meaningful-documentation Head-frame metre geometry precedes one head/jaw transform; performed soft walls already contain final positions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Assembly, posing and finishing execute mesh work at their respective owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable shared point ids join region boundaries without regenerating their coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns mesh and physical-point arrays; finish emits its own gathered copies while query consumers borrow these parts.
 *
 * @author Samchon
 */
export interface IHumanFaceOralPart {
  /** Stable generated member identity, independent of the source material. */
  id: string;

  /** Enamel retains source UV artwork; other roles share source gingival pigment. */
  materialRole: "enamel" | "gingiva" | "palate" | "floor" | "wall";

  /** Existing rigid source owner, or already performed final soft-wall coordinates. */
  owner: "head" | "jaw" | "performed";

  /** Actual source-frame mesh consumed by drawing and contact. */
  mesh: IAutoMovieMesh;

  /** Stable shared identities, including native cervical aliases. */
  physicalPoints: string[];
}
