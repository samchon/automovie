import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * The evaluated exterior against which a body's inward rays are observed.
 *
 * The mesh may include the head that continues an open body collar. Each
 * native body vertex names its actual vertex in this mesh. This identity,
 * rather than a positional exclusion radius, determines incident triangles.
 * All positions retain the body's evaluated metre frame. Providing this
 * reference does not establish embedding, anatomical thickness or coverage.
 *
 * @evidence contracts/common.md#principled-implementation Explicit origin incidence permits the same ray query on a continued exterior without shifting origins or excluding a metric neighborhood.
 * @evidence contracts/common.md#clear-and-simple-design One mesh and one native-origin map carry the query responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies actual evaluated exterior geometry and origin identity; no missing geometry is fabricated.
 * @evidence contracts/common.md#meaningful-documentation States origin addressing, common frame and the limits of a supplied reference.
 * @evidence contracts/modeling.md#spatial-conventions Mesh positions are metres in the evaluated body frame; vertex indices are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The native-origin map carries actual shared sample incidence into the query mesh.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries an existing query exterior rather than defining an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries evaluated geometry with no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The query carrier displays no form; the construction consumer observes its skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No tissue value is specified by this evaluated-geometry carrier.
 * @evidenceExclude contracts/anatomy.md#permitted-range The consuming ray observation owns its refusal conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is evaluated host geometry rather than a person's shaping input.
 * @author Samchon
 */
export interface IHumanBodyLayerExterior {
  /** Evaluated exterior triangles, including any actual continuing sheets. */
  mesh: IAutoMovieMesh;

  /** One resident exterior vertex index for each native body vertex. */
  originVertices: readonly number[];
}
