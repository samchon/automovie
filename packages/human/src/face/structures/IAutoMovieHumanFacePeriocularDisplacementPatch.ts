/**
 * Native skin annulus carrying one eye's resolved lid displacement.
 * Its boundary roles are the publisher's coarse station conventions, not
 * measured tissue boundaries or the material chart's expanded outer border.
 * The runtime retains exact boundary pins and owns physical admission after
 * interpolation; topological registration proves no offset injectivity.
 *
 * @evidence contracts/common.md#principled-implementation seatHumanFaceLidCage matches native posterior/preseptal witnesses to canonical samples, supplies exact boundary pins and extends their displacement over actual triangle adjacency using the existing positive-weight Dirichlet graph owner.
 * @evidence contracts/common.md#clear-and-simple-design Two oppositely oriented boundary cycles, their parallel sample identities and native triangle ordinals define one coarse source annulus independently of expanded material attachment disks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer checks generation/host/boundary correspondence and triangle ordinals, while interpolation requires complete pins and connected free components; numerical residual convergence proves neither injectivity nor optical clearance or tissue physiology.
 * @evidence contracts/common.md#meaningful-documentation Native index domains, cycle-closing rules, authored qualification and fixed preseptal support identify the actual movement patch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The registration record implements no graph assembly or numerical solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canonical adjacency is consumer input rather than a retained Laplacian cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher arrays create no solver vectors, seated skin or derived normals.
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
