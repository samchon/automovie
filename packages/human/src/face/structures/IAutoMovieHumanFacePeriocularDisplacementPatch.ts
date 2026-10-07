/**
 * Native skin annulus carrying one eye's resolved lid displacement.
 * Its boundary roles are the publisher's coarse station conventions, not
 * measured tissue boundaries or the material chart's expanded outer border.
 * The runtime retains exact boundary pins and owns physical admission after
 * interpolation; topological registration proves no offset injectivity.
 *
 * @evidence contracts/common.md#principled-implementation Actual host triangle ordinals and two source-authored native edge cycles describe a finite annulus; the producer owns oriented incidence, boundary completeness and source identity checks.
 * @evidence contracts/common.md#clear-and-simple-design One host generation owns triangles and both boundary-to-source correspondences without adding a personal curve or independent geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No spatial radius, texture weld, renderer exception or fixed subject-specific displacement enters this registration.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes authored movement boundaries, canonical sample identity and topological qualification from tissue metrology and physical admission.
 * @evidence contracts/modeling.md#spatial-conventions Host coordinates use the cage's existing head-local metre frame; this incidence record performs no coordinate conversion.
 * @evidence contracts/modeling.md#shared-boundaries The posterior and fixed preseptal native cycles are one source-owned registration consumed by source authoring and runtime seating.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing skin incidence and defines no new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries resolved source correspondence, not an authoring parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Registers original native triangles without emitting a primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The normal seating and assembly consumers own observation of displaced skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source-authored row roles do not register measured tissue extent or a clinical displacement field.
 * @evidenceExclude contracts/anatomy.md#permitted-range No physiological bound is defined by this finite topological domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This publisher-owned registration adds no personal geometry or authorable anatomical scalar.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularDisplacementPatch {
  /** Must match the skin partition and cage generation. */
  generation: string;

  /** Actual native skin host, in the cage's head-local metre frame. */
  surface: string;

  /** Actual oriented triangle ordinals in that host's index array. */
  triangles: number[];

  /** Oriented posterior native edge cycle, without a repeated closing vertex. */
  posteriorBoundary: number[];

  /** Oppositely oriented fixed preseptal cycle, with the same closing rule. */
  preseptalBoundary: number[];

  /** Canonical source samples corresponding exactly to posteriorBoundary. */
  posteriorSamples: number[];

  /** Canonical source samples corresponding exactly to preseptalBoundary. */
  preseptalSamples: number[];

  /** These roles come from source authoring, not clinical acquisition. */
  qualification: "authoredConvention";
}
