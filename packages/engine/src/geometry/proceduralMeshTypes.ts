/**
 * Shared metric operands and results for procedural geometry. The stable
 * proceduralMesh entry re-exports these declarations for asset authors; the
 * shape, composition and topology owners consume the same types directly.
 * Coordinates are metres in the caller's local frame. Array ownership and
 * copying follow each operation's contract; these types perform no validation.
 */
import {
  IAutoMovieMesh,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One point of a code-authored 2D construction profile.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Expresses free-form construction geometry in real coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Carries one metric input to the geometry kernel.
 */
export interface IAutoMovieProfilePoint {
  /**
   * Horizontal profile coordinate in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps the authored horizontal dimension in metres.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric horizontal component of a free-form input.
   */
  x: number;
  /**
   * Vertical profile coordinate in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps the authored vertical dimension in metres.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric vertical component of a free-form input.
   */
  y: number;
}

/**
 * One axis-aligned rectangular void in a wall's local XY face.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Makes an opening a declared operand of wall construction.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the bounded subtraction input whose topology the wall builder preserves.
 */
export interface IAutoMovieWallOpening {
  /**
   * Stable opening identity used in diagnostics.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps each opening operand independently addressable.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies the opening involved in an operation or topology refusal.
   */
  id: string;
  /**
   * Left edge measured from the wall's left edge.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Locates the opening with a real wall-local dimension.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric horizontal placement of the void.
   */
  x: number;
  /**
   * Bottom edge measured from the wall's bottom edge.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Locates the opening with a real wall-local dimension.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric vertical placement of the void.
   */
  y: number;
  /**
   * Positive opening width.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the physical width of the opening operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies one bounded metric extent of the void.
   */
  width: number;
  /**
   * Positive opening height.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the physical height of the opening operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the other bounded metric extent of the void.
   */
  height: number;
}

/**
 * A rigid translate / unit-quaternion rotate / per-axis scale placement.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Places a mesh as one operand in a composed assembly.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Defines the transform input applied before mesh composition.
 */
export interface IAutoMovieMeshTransform {
  /**
   * Metres added after rotation and scale; omitted means the origin.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps mesh placement in real metric coordinates.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric translation component of placement.
   */
  translation?: IAutoMovieVector3;
  /**
   * Unit quaternion applied after scale; omitted means identity.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Declares the rotation used while composing a mesh operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the orientation applied without changing member topology.
   */
  rotation?: IAutoMovieQuaternion;
  /**
   * Per-axis scale applied first; omitted means unit scale.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Applies the declared dimensional scale to a mesh operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the per-axis dimensional transform.
   */
  scale?: IAutoMovieVector3;
}

/**
 * One named member of an assembly, optionally placed by its own transform.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Preserves an addressable member inside a logical mesh group.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Retains member identity while composing shared geometry.
 */
export interface IAutoMovieMeshPart {
  /**
   * Stable member identity, unique inside one assembly.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Keeps the grouped member independently addressable.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves individual identity inside the composed group.
   */
  id: string;
  /**
   * The member's geometry in its own local frame.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Carries the geometry owned by one logical group member.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Keeps the member's own representation distinguishable after composition.
   */
  mesh: IAutoMovieMesh;
  /**
   * Where the member sits in the assembly frame.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Places one member without erasing its group identity.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Resolves member placement while preserving individuality.
   */
  transform?: IAutoMovieMeshTransform;
}

/**
 * The index range one assembly member occupies in the merged mesh.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Retains group membership after buffers are merged.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Maps each individual member to its merged triangle span.
 */
export interface IAutoMovieMeshGroup {
  /**
   * The contributing {@link IAutoMovieMeshPart.id}.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Names the member represented by this merged span.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves the contributor's identity in the merged result.
   */
  id: string;
  /**
   * First index of the member's triangles inside the merged index array.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Keeps the member's geometry addressable within the group.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Defines where this individual's contribution begins.
   */
  start: number;
  /**
   * How many indices the member contributes; always a multiple of three.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Bounds the member's addressable contribution to the group.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Defines the exact span owned by this individual.
   */
  count: number;
}

/**
 * One merged mesh plus the material groups its members occupy.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Produces one composed mesh without discarding its member groups.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves individual member spans in the merged output.
 */
export interface IAutoMovieMeshAssembly {
  /**
   * The merged rigid mesh.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Carries the geometry shared by the logical assembly.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Provides the composed representation alongside member identities.
   */
  mesh: IAutoMovieMesh;
  /**
   * Declaration-ordered index ranges, one per contributing member.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Retains the declared ordering and addressability of group members.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Maps every individual contributor into the shared mesh.
   */
  groups: IAutoMovieMeshGroup[];
}

/**
 * What a mesh's triangle topology actually is, measured rather than assumed.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Reports the actual topology of authored mesh geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Makes operation output topology explicit and inspectable.
 */
export interface IAutoMovieMeshTopology {
  /**
   * Triangle count, including degenerate ones.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Counts the faces present in the measured topology.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the complete triangle population of an operation result.
   */
  triangles: number;
  /**
   * Triangles whose welded corners are not three distinct points.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Identifies faces that collapse after positional welding.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Exposes the degenerate output population for validation.
   */
  degenerate: number;
  /**
   * Zero-based triangle ordinals skipped by the same positional-weld rule.
   * A count cannot establish whether a later conversion lost a different face
   * while recovering an earlier redundant one; these identities preserve that
   * correspondence without reconstructing the weld calculation in a consumer.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Identifies each face already redundant under positional welding so downstream conversion can distinguish it from newly lost geometry.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Reports exact degenerate source-face identities for validation of the corresponding final output faces.
   */
  degenerateTriangles: number[];
  /**
   * Position, normal, or uv components that are not finite numbers.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Measures numeric failures in mesh buffers.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Reports non-finite geometry components as structural evidence.
   */
  nonFinite: number;
  /**
   * Welded edges used by exactly one triangle: the open boundary.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures the open boundary of the authored surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports edges left with only one incident face.
   */
  boundaryEdges: number;
  /**
   * Welded edges used by three or more triangles.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures topology that cannot represent a manifold surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports edges with conflicting face incidence.
   */
  nonManifoldEdges: number;
  /**
   * True when every welded edge is shared by exactly two triangles.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology States whether the mesh forms a closed two-manifold.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Summarizes the closed-edge invariant of the result.
   */
  watertight: boolean;
  /**
   * Divergence-theorem signed volume; exact for a closed polyhedron.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures the orientation and enclosed volume of a closed mesh.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Exposes the signed-volume invariant of the operation output.
   */
  volume: number;
}

/**
 * One closed ring's span inside a triangulation's shared point list.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Preserves each planar boundary as a distinct closed ring.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Records a ring's topology inside the canonical point buffer.
 */
export interface IAutoMovieRegionRing {
  /**
   * First index the ring owns in {@link IAutoMovieRegionTriangulation.points}.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Keeps the ring boundary addressable in the shared geometry.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies where this ring begins in canonical storage.
   */
  start: number;
  /**
   * How many points the ring owns.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Bounds the points belonging to one closed boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies the complete canonical span of this ring.
   */
  count: number;
}

/**
 * A free-form planar region resolved into counter-clockwise triangles.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves an outer boundary and holes into reusable geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns canonical points, rings, and triangles from the region operation.
 */
export interface IAutoMovieRegionTriangulation {
  /**
   * Every ring's points in one list, canonically wound: the outer ring
   * counter-clockwise first, then each hole clockwise in declared order.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Canonicalizes the winding of every region boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the point buffer on which ring topology is defined.
   */
  points: IAutoMovieProfilePoint[];
  /**
   * Where each ring sits in {@link points}; `rings[0]` is the outer ring.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Distinguishes the outer boundary from each authored hole.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves the ring structure of the canonical region.
   */
  rings: IAutoMovieRegionRing[];
  /**
   * Corner indices into {@link points}, three per counter-clockwise triangle.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes the resolved face connectivity of the planar region.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the topology emitted by the triangulation operation.
   */
  triangles: number[];
  /**
   * Enclosed area in square metres: the outer ring less every hole.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Measures the actual metric area of the free-form region.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Reports a physical result derived from metric geometry inputs.
   */
  area: number;
}

/**
 * One station of a loft: where it sits along the path and what it looks like.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Declares one operand of a multi-section loft operation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies one compatible section to the loft topology.
 */
export interface IAutoMovieLoftSection {
  /**
   * Where the section sits along the path, `0` at its first point and `1` at
   * its last, measured by chord length.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Places the section within the loft operation.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Defines the interpolation station used to connect compatible rings.
   */
  at: number;
  /**
   * The enclosing ring, in the path frame's right / up axes, in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the section's metric outer boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the free-form enclosing profile of a loft station.
   */
  outer: readonly IAutoMovieProfilePoint[];
  /**
   * Rings removed from the section; omitted means a solid section.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Preserves the declared holes in each loft section.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the inner boundaries that the connected topology must retain.
   */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}
