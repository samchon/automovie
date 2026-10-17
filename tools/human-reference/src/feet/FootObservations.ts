import type { Family } from "../schema/Family.ts";
import type { Section } from "../schema/Section.ts";

/**
 * Holds physical foot section observations and the stations excluded from fitting.
 * Source and producer hashes belong to the enclosing immutable artifact.
 *
 * @evidence contracts/common.md#principled-implementation Explicit reserved section IDs separate fitting observations from independent source-plane qualification, and planar crossing counts preserve source defects.
 * @evidence contracts/common.md#clear-and-simple-design One regional result contains section families and their declared observation roles without duplicating source meshes or a fitted skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural result embeds no population coefficient, identity catalogue or expected reconstructed answer.
 * @evidence contracts/common.md#meaningful-documentation Documents held-out roles, source-defect witnesses and the enclosing artifact's provenance responsibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result interface selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased result interface performs no reusable work or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface acquires no runtime resources.
 *
 * @author Samchon
 */
export interface FootObservations {
  /** Region in the declared native subject frame. */
  region: string;

  /** Physical plane protocols define station fractions and millimetre offsets; every section names one of these family IDs. */
  families: Family[];

  /** Coordinates and station offsets are millimetres; includes fitting, reserved, absent and ankle-clipped observations. */
  sections: Section[];

  /** Odd indexed physical stations and every oblique plane; fitting must exclude them. */
  reservedSectionIds: string[];

  /** Proper crossings within exact planar source arcs, not projected silhouettes. */
  sourceCrossings: { section: string; loop: number; count: number }[];

  /** Limits of the geometric protocol and unsupported anatomical interpretations. */
  limits: string[];
}
