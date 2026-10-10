/**
 * Native skin annulus carrying one eye's resolved lid displacement.
 * Its boundary roles are the publisher's coarse station conventions, not
 * measured tissue boundaries or the material chart's expanded outer border.
 * The runtime retains exact boundary pins and owns physical admission after
 * interpolation; topological registration proves no offset injectivity.
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
