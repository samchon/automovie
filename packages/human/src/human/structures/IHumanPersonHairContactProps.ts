import type { IHumanPersonHairContactMesh } from "./IHumanPersonHairContactMesh";

/**
 * Actual posed body and placed hair consumed by the person contact stage.
 *
 * @evidence contracts/common.md#principled-implementation Posed body triangles and placed hair meet in the same person frame; a legacy clearance remains separate from geometry-owned per-part gaps.
 * @evidence contracts/common.md#clear-and-simple-design The person contact stage owns the relation between hair and shoulders, so its inputs contain both populations explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained body triangles supply actual contact incidence; no body crop or example-specific shoulder mask is encoded in these inputs.
 * @evidence contracts/common.md#meaningful-documentation Comments state metre coordinates, retained source triangles and the distinction between legacy and emitted-layout clearances.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Body and hair arrays specify contact operands without choosing query construction or two-pass station correction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input record has no contact cache; the owning operation decides reuse of its signed body query among hair parts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This read-only contact transport owns no query or task; the synchronous contact operation owns its temporary copied geometry.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactProps {
  /** Posed shared body positions, metres in the person model frame. */
  readonly positions: readonly number[];

  /** Retained source triangles over the shared body vertices. */
  readonly indices: readonly number[];

  /** Actual generated hair meshes in the same frame. */
  readonly hair: readonly IHumanPersonHairContactMesh[];

  /** Legacy ribbon gap in metres; emitted layouts retain their own part gaps. */
  readonly clearance: number;
}
