import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";

/**
 * Source-owned foot courses and actual emitted landmark observations.
 *
 * @evidence contracts/common.md#principled-implementation Separates registered source courses and module bindings from emitted vertex identities and initial placed-height measurements; anatomical construction stays with the source generator.
 * @evidence contracts/common.md#clear-and-simple-design One structural namespace describes the optional original-foot handoff without importing a Human runtime or another mesh builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fitted plantar plane, corrective scale or production support target enters the schema.
 * @evidence contracts/common.md#meaningful-documentation Documents source versus emitted frames, finite identities, articulation boundaries and numerical measurement limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These erased types execute no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source preparation and drawing lifetime own reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These records acquire no renderer or native resource.
 */
export namespace AutoMovieHumanPolygonFoot {
  /**
   * Existing articulated bones owning the two foot modules on each side.
   *
   * @evidence contracts/common.md#principled-implementation Enumerates the existing Subtalar/Midfoot module bindings rather than assigning the whole foot to one pivot.
   * @evidence contracts/common.md#clear-and-simple-design One finite binding type serves source modules and emitted witnesses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no film-specific bone or alternate rig.
   * @evidence contracts/common.md#meaningful-documentation Identifies the two existing bilateral articulation owners.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This union computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This union owns no reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This union owns no resource.
   */
  export type Bone = "leftSubtalar" | "rightSubtalar" | "leftMidfoot" | "rightMidfoot";

  /**
   * Anatomical landmark identities supplied by the source construction.
   *
   * @evidence contracts/common.md#principled-implementation Names one plantar heel and two metatarsal points without inferring them from a displayed hull.
   * @evidence contracts/common.md#clear-and-simple-design The same finite names index source references and emitted observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A named point is not automatically a floor contact.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes anatomical identity from physical contact admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This union computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This union owns no reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This union owns no resource.
   */
  export type Landmark = "plantarHeel" | "medialBall" | "lateralBall";

  /**
   * Opted-in bilateral source exterior, in registered rest-body metres.
   *
   * @evidence contracts/common.md#principled-implementation Retains both source module pairs and their original calibrated points with explicit units.
   * @evidence contracts/common.md#clear-and-simple-design One optional input augments the existing original-polygon emitter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No dense prepared model or substitute foot mesh is required.
   * @evidence contracts/common.md#meaningful-documentation Identifies registered rest frame and bilateral ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns preparation reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owns ordinary arrays.
   */
  export interface IInput {
    /** Source coordinate unit. */ units: "metres";
    /** Left source foot. */ left: ISide;
    /** Right source foot. */ right: ISide;
  }

  /**
   * Source hindfoot and forefoot separated at the existing Midfoot boundary.
   *
   * @evidence contracts/common.md#principled-implementation Carries independently bound module courses, source vertex references and source-course-only height observations.
   * @evidence contracts/common.md#clear-and-simple-design The shared seam belongs to these existing two modules, while articulated toes remain separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source height observations do not certify the emitted full-foot floor population.
   * @evidence contracts/common.md#meaningful-documentation States split articulation, source landmark addressing and limited height population.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The renderer copies shared source courses without regenerating anatomy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input owns no native resource.
   */
  export interface ISide {
    /** Source ankle/heel-to-Midfoot courses, bound to Subtalar. */ hindfoot: IModule;
    /** Source Midfoot-to-metatarsal courses, bound to Midfoot. */ forefoot: IModule;
    /** References to retained source course vertices. */ landmarks: Record<Landmark, ISourceLandmark>;
    /** Registered rest source-course heights; excludes separately emitted toes. */ support: { minimumHeight: number; landmarkHeights: Record<Landmark, number> };
  }

  /**
   * One source course sequence bound to an existing articulated foot bone.
   *
   * @evidence contracts/common.md#principled-implementation Explicit source axis and points control winding and geometry while the named existing bone controls placement.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the original course emitter rather than supplying a second indexed-mesh format.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The renderer chooses no anatomical coefficients or support targets.
   * @evidence contracts/common.md#meaningful-documentation Gives binding identity, registered axis and course ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source courses are prepared once by their generator.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input owns no native resource.
   */
  export interface IModule {
    /** Existing bone receiving this rigid module. */ bone: Bone;
    /** Nonzero longitudinal source axis in registered body coordinates. */ axis: [number, number, number];
    /** Original source sequence; each module retains a consistent point count. */ courses: ICourse[];
  }

  /**
   * A sampled calibrated foot course retaining source provenance.
   *
   * @evidence contracts/common.md#principled-implementation Extends the existing source-course contract with its canonical chain and station, leaving supplied geometry authoritative.
   * @evidence contracts/common.md#clear-and-simple-design Shares the neck/head course representation and the same existing module emitter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Provenance values do not generate replacement coordinates in Viewer.
   * @evidence contracts/common.md#meaningful-documentation Inherited extents are full dimensions in metres; source station remains millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The renderer consumes existing source samples.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input owns no native resource.
   */
  export interface ICourse extends AutoMovieHumanPolygon.IExteriorSection {
    /** Full extent along the canonical source section's first axis, metres. */ depth: number;
    /** Full extent along the canonical source section's second axis, metres. */ breadth: number;
    /** Canonical calibrated source chain. */ chain: "foot.left" | "foot.right" | "forefoot.left.1" | "forefoot.right.1" | "forefoot.left.2" | "forefoot.right.2";
    /** Original source longitudinal station, millimetres. */ stationMm: number;
  }

  /**
   * Exact source course/point address of one anatomical landmark.
   *
   * @evidence contracts/common.md#principled-implementation Ring-major indices identify an actual source point in one existing rigid module.
   * @evidence contracts/common.md#clear-and-simple-design Three scalar fields connect source identity to emitted vertex identity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No closest-point or hull-based relabeling creates the landmark.
   * @evidence contracts/common.md#meaningful-documentation Identifies zero-based course/point indexing and module ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This address computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This address owns no reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This address owns no native resource.
   */
  export interface ISourceLandmark {
    /** Existing source module. */ module: "hindfoot" | "forefoot";
    /** Zero-based course. */ course: number;
    /** Zero-based point within that course. */ point: number;
  }

  /**
   * Actual emitted Float32 vertex in its owning mesh's bone-local metre frame.
   *
   * @evidence contracts/common.md#principled-implementation The mesh registry and vertex index identify the actual emitted position; localPoint is copied from that Float32 attribute.
   * @evidence contracts/common.md#clear-and-simple-design Reuses existing parts/bones registries instead of creating a collision proxy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source labels stay attached to their retained emitted vertex rather than an estimated extremum.
   * @evidence contracts/common.md#meaningful-documentation Gives actual mesh lookup, zero-based vertex index and bone-local units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The drawing owns observation reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds immutable numbers without acquiring a mesh resource.
   */
  export interface IEmittedLandmark {
    /** Actual emitted mesh key in drawing.parts. */ readonly bone: Bone;
    /** Zero-based position-attribute vertex. */ readonly vertexIndex: number;
    /** Actual Float32 position, before posed bone placement. */ readonly localPoint: readonly [number, number, number];
  }

  /**
   * Initial placed drawing heights of every emitted foot part, including toes.
   *
   * @evidence contracts/common.md#principled-implementation Measures actual emitted position attributes under initial drawing placements and separates named landmark heights from full-foot minimum and numerical coincidence.
   * @evidence contracts/common.md#clear-and-simple-design Supplies fixed reference geometry for consumers while live pose inspection continues through actual mesh transforms.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No initial reference point is flattened and numerical coincidence is not a physical floor-clearance exemption.
   * @evidence contracts/common.md#meaningful-documentation Gives initial body frame, complete foot population, named subset and Float32 numerical measurement limit; setPose does not redefine this reference.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference geometry remains fixed for the drawing lifetime.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds immutable scalar measurements and names without acquiring a native resource.
   */
  export interface IPlantarSupport {
    /** Minimum initial body-frame Y over all emitted foot-descendant vertices, metres. */ readonly minimumHeight: number;
    /** Initial body-frame Y of each actual named vertex, metres. */ readonly landmarkHeights: Readonly<Record<Landmark, number>>;
    /** Named vertices numerically coincident with the actual full-foot minimum. */ readonly contactLandmarks: readonly Landmark[];
    /** Float32 affine-evaluation uncertainty bound, metres; no physical clearance waiver. */ readonly measurementTolerance: number;
  }
}
