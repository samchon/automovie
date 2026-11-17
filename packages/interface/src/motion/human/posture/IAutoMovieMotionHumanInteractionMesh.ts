import type { IAutoMovieTetrahedralizeDelaunay } from "../../../core/math/IAutoMovieTetrahedralizeDelaunay";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Adapt the spatial relations of a multi-body key pose to bodies of other
 * proportions by an interaction mesh (Ho, Komura and Tai 2010, "Spatial
 * relationship preserving character motion adaptation", ACM TOG 29(4),
 * article 33): a volumetric mesh over every joint and contact point of all
 * bodies at the key pose records how they lie among each other, and the
 * adapted pose is the one that deforms that mesh least, by its Laplacian
 * coordinates, while each body keeps its own bone lengths and every contact
 * its pairing, two points coinciding or held at a fixed offset.
 *
 * - **Mesh.** The Delaunay tetrahedralization of the points
 *   (`tetrahedralizeAutoMovieDelaunay`, Bowyer-Watson on Qhull's joggled
 *   input). Its edges are the points' neighbourhoods.
 * - **Laplacian coordinates.** Each point's offset from the inverse-distance
 *   weighted mean of its neighbours, excluding bone edges so deformation
 *   does not oppose the bone lengths being changed (Ho et al. 2010,
 *   equation 3 and section 5.1; `HumanInteractionMeshLaplacian`).
 * - **Solve.** `min sum_i |L(p)_i - d_i|^2 / 2` subject to each bone's
 *   length and each contact's pairing, by the l1 exact penalty's sequential
 *   convex optimisation with a trust region and a steered penalty
 *   (`HumanSequentialConvex`; Nocedal and Wright 2006, "Numerical
 *   Optimization", 2nd ed., sections 17.2 and 18.5; Byrd, Nocedal and Waltz
 *   2008): each convex model linearizes a bone `|p_i - p_j| = l` along its
 *   current direction and holds the Laplacian's quadratic exactly, solved by
 *   `HumanQuadraticProgram` within the region; a step is taken only where
 *   the merit falls, so a large change of proportions is approached in
 *   steps the linearization holds over.
 *
 * - **Sides.** Each tetrahedron not flat on the key pose keeps its
 *   orientation (`HumanInteractionMeshSide`), an inequality on its signed
 *   volume linearised as a hard row in each model: a point that crossed the face across from it would have passed
 *   through the bodies the mesh spans, the interpenetration the paper's
 *   mesh is built to reduce. The strictly positive determinant is the
 *   nonlinear solve's domain: a trial outside it has infinite merit and is
 *   rejected by the trust region, as an inversion barrier excludes flips
 *   (Schueller et al. 2013, "Locally Injective Mappings", section 3).
 *
 * Ho et al.'s full text (author upload: https://www.researchgate.net/publication/220183715_Spatial_Relationship_Preserving_Character_Motion_Adaptation)
 * uses collision constraints on bounding volumes during iterative
 * morphing. This key-pose adaptation instead keeps every recorded
 * tetrahedron's orientation as a hard domain, with the physical contact
 * accuracy of the whole-body fit (`HumanBodyFitMerit.TOLERANCE`), stricter
 * than #3438's 10 mm bone and contact acceptance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: One end's index. to: The other end's index. length: Metres.
 * @evidence contracts/development/design.md#principled-representation from: One end's index. to: The other end's index. length: Metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.spans, bone); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem.held, bone); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows, bones); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows.omitted, bone); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieTetrahedralizeDelaunay.IMesh identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanInteractionMesh {
  /**
   * A bone: two points and the length it keeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: One end's index. to: The other end's index. length: Metres.
   * @evidence contracts/development/design.md#principled-representation from: One end's index. to: The other end's index. length: Metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.spans, bone); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem.held, bone); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows, bones); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows.omitted, bone); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanInteractionMesh.adapt.spans.
   */
  export interface IBone {
    /** One end's index. */
    from: number;

    /** The other end's index. */
    to: number;

    /** Metres. */
    length: number;
  }

  /**
   * A contact: two points, usually of different bodies, held at a fixed offset.
   *
   * @evidence contracts/development/common.md#meaningful-documentation a: One point's index. b: The other point's index. offset: `a` minus `b`, world metres; they coincide when absent.
   * @evidence contracts/development/design.md#principled-representation a: One point's index. b: The other point's index. offset: `a` minus `b`, world metres; they coincide when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, return); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.spans, c); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem.held, c); posture/HumanInteractionMesh.ts (HumanInteractionMesh.offset, c).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IContact {
    /** One point's index. */
    a: number;

    /** The other point's index. */
    b: number;

    /** `a` minus `b`, world metres; they coincide when absent. */
    offset?: IAutoMovieVector3;
  }

  /**
   * Adapt a key pose. The adaptation's input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation reference: The key pose's points, world metres. start: The points to start from; the reference when absent or when this guess inverts a recorded tetrahedron. mesh: The reference's mesh, when built before; built here when absent.
   * @evidence contracts/development/design.md#principled-representation reference: The key pose's points, world metres. start: The points to start from; the reference when absent or when this guess inverts a recorded tetrahedron. mesh: The reference's mesh, when built before; built here when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanInteractionMesh.IBone, IAutoMovieMotionHumanInteractionMesh.IContact, IAutoMovieTetrahedralizeDelaunay.IMesh identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProps {
    /** The key pose's points, world metres. */
    reference: readonly IAutoMovieVector3[];

    /** The target bodies' bones. */
    bones: readonly IAutoMovieMotionHumanInteractionMesh.IBone[];

    /** The contacts to keep. */
    contacts: readonly IAutoMovieMotionHumanInteractionMesh.IContact[];

    /** The points to start from; the reference when absent or when this guess inverts a recorded tetrahedron. */
    start?: readonly IAutoMovieVector3[];

    /** The reference's mesh, when built before; built here when absent. */
    mesh?: IAutoMovieTetrahedralizeDelaunay.IMesh;
  }

  /**
   * Adapt a key pose. The adaptation's result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation points: The adapted points, world metres.
   * @evidence contracts/development/design.md#principled-representation points: The adapted points, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieTetrahedralizeDelaunay.IMesh identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IResult {
    /** The adapted points, world metres. */
    points: IAutoMovieVector3[];

    /** The mesh it kept. */
    mesh: IAutoMovieTetrahedralizeDelaunay.IMesh;
  }
}
