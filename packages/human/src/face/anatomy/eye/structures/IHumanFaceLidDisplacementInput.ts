import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Native lid-annulus topology and exact displacement constraints supplied by
 * the lid seating owner. This is internal source interpolation, not a public
 * sculpting input. Source sample identities identify seam copies exactly.
 *
 * All positions and displacement pins use the same head-local metre frame.
 * Every topological boundary sample needs an explicit pin, including stationary
 * boundaries. Interior cage stations may also be pinned. The helper refuses
 * conflicting pins on aliases instead of selecting one by insertion order.
 *
 * @evidence contracts/common.md#principled-implementation Selected native triangles, canonical sample identities and exact pins define a Dirichlet graph without spatial welding or an inferred influence radius.
 * @evidence contracts/common.md#clear-and-simple-design One input separates topology, source identity and caller-owned displacement constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary pins are explicit; absent constraints do not become zero displacement.
 * @evidence contracts/common.md#meaningful-documentation States units, source ownership, alias semantics and the complete boundary constraint requirement.
 * @evidence contracts/modeling.md#spatial-conventions Positions and pins share the source head-local metre frame, with its existing origin and axes.
 * @evidence contracts/modeling.md#shared-boundaries Boundary vertex identities and their exact displacements come from the seating owner and are shared by every source alias.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries interpolation inputs for existing skin, not a part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries resolved displacements, not anatomical channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Supplies existing topology and creates no primitives.
 * @evidenceExclude contracts/modeling.md#rendered-observation The seating consumer owns observation of its assembled skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value or tissue constitutive law.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source constraints are not public human authoring inputs.
 * @author Samchon
 */
export interface IHumanFaceLidDisplacementInput {
  /** Unmodified flat XYZ source positions in head-local metres. */
  positions: readonly number[];

  /** Flat triangle indices of the complete selected native lid annulus. */
  indices: readonly number[];

  /** Canonical source sample identity for every vertex in positions. */
  samples: readonly number[];

  /** Exact metre displacements at boundary and optional interior stations. */
  pins: ReadonlyMap<number, IAutoMovieVector3>;

  /** Complete topological boundary vertices; aliases name the same sample. */
  boundaryVertices: readonly number[];
}
