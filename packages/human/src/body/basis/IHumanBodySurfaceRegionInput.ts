import type { IHumanPhysicalSampleRegistration } from "../../common/structures/IHumanPhysicalSampleRegistration";

/**
 * One evaluation's arrays for the projector `createHumanBodySurfaceRegionParts`
 * returns.
 *
 * Positions, normals, colours and relief weights are the shaped connected
 * surface's per-vertex arrays; the skin material selects which regions take
 * colours and relief. Supplied physical samples use the same corner table;
 * absent registration preserves legacy output.
 *
 * @evidence contracts/common.md#principled-implementation One evaluation's connected-surface arrays and optional physical registration go through the region's single source-to-UV gather.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the projector's anonymous input type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV ordinals, normal islands and coordinate contact never become source identity.
 * @evidence contracts/common.md#meaningful-documentation States each array's alignment, the skin-material selection and default absence.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres and normals unit vectors in the body frame, three numbers per connected-surface vertex.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The projector's regions define the parts; the input names none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input carries evaluated arrays, not shaping channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The projector emits the region meshes.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The input builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder observes the emitted parts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input carries evaluated geometry, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The input bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal evaluation state, not a person-authoring input.
 * @author Samchon
 */
export interface IHumanBodySurfaceRegionInput {
  /** Shaped connected-surface positions, XYZ metres per vertex. */
  positions: number[];

  /** Connected-surface normals, XYZ per vertex. */
  normals: number[];

  /** Material ID of the skin regions that take colours and relief. */
  skinMaterial: string;

  /** Linear RGB per vertex for the skin regions, or null for none. */
  colors: number[] | null;

  /** Relief weight per vertex for the skin regions, or null for none. */
  reliefWeights: number[] | null;

  /** Optional instance-bound physical sample registration of the surface. */
  physical?: IHumanPhysicalSampleRegistration;
}
