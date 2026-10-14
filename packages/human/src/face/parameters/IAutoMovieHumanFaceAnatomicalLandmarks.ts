/**
 * Immutable source-basis correspondence for measured facial landmarks.
 * This is prepared with a shared, versioned asset, never supplied as a
 * person's parameter document. Each anchor follows its original surface
 * through identity and performance by topology; no anchor moves a vertex.
 * A source may admit only the landmarks it can identify under the same
 * protocol. A missing landmark leaves its dependent metric unsupported,
 * rather than triggering a silhouette or photograph-ray approximation.
 * Traditional 3D Facial Norms soft-tissue sites and the limits of alternative
 * curvature definitions are described by Weinberg et al. and Katina et al.
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4841760/;
 * https://onlinelibrary.wiley.com/doi/full/10.1111/joa.12407).
 *
 * @evidence contracts/common.md#principled-implementation Basis identity, source-byte digest, protocol and review status bind resident vertex/triangle anchors to one immutable source; omission leaves dependent measurements unsupported. The declared source correspondence still has no evaluator or basis-bound admission, so its type alone certifies neither identity nor landmark validity.
 * @evidence contracts/common.md#clear-and-simple-design Midline anchors and independently owned Side records share one Anchor union while basis/protocol/review status stay at the source-record owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal mesh, silhouette ray or arbitrary vertex movement replaces missing correspondence; candidate status is not an independently reviewed mapping.
 * @evidence contracts/common.md#meaningful-documentation The comment explains immutable source ownership, topology-following correspondence, unavailable metrics, review status, and protocol limits, with anchor indexing and barycentric requirements beside their fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares source correspondence and runs no vertex lookup, interpolation or anatomical measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis fields identify source provenance but do not implement an evaluator cache or invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record acquires no source asset bytes or mesh handle; the source-basis loader and eventual evaluator own those resources.
 *
 * @publicUnconsumed measureHumanFaceAnatomicalParameters: The type-first source correspondence needs an evaluator and basis-bound admission before any measured control can be presented by the editor.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAnatomicalLandmarks {
  /** Exact immutable basis identity. */
  basis: string;

  /** SHA-256 of the supplied source asset bytes, not a personal document. */
  basisSha256: string;

  /** Traditional closed-mouth 3DFN surface landmark definition. */
  protocol: "3dfn-surface-landmarks";

  /** Candidate/rejected annotations are research records; only independently reviewed mappings may lower an edit. */
  status: "candidate" | "reviewed" | "rejected";

  /** Midline source points; omission means the source does not certify a point. */
  midline?: {
    /** Most anterior midforehead soft-tissue point above the nasal root. */
    glabella?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Midline depression at the nasal root. */
    nasion?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Anterior-most nasal tip point. */
    pronasale?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Junction of nasal septum and upper lip. */
    subnasale?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Midpoint of the upper vermilion border. */
    labialeSuperius?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Midpoint of apposed upper and lower lips. */
    stomion?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Midpoint of the lower vermilion border. */
    labialeInferius?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Midline lower-lip to chin crease. */
    sublabiale?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Most anterior midline soft-tissue chin point. */
    pogonion?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Inferoanterior midline soft-tissue chin point. */
    gnathion?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;

    /** Most posterior midline cranial point under the protocol. */
    opisthocranion?: IAutoMovieHumanFaceAnatomicalLandmarks.Anchor;
  };

  /** Bilateral points are separately annotated, not mirrored. */
  left?: IAutoMovieHumanFaceAnatomicalLandmarks.Side;

  /** Bilateral points are separately annotated, not mirrored. */
  right?: IAutoMovieHumanFaceAnatomicalLandmarks.Side;
}

export namespace IAutoMovieHumanFaceAnatomicalLandmarks {
  /**
   * An existing source vertex or a point inside one source triangle.
   *
   * @evidence contracts/common.md#principled-implementation The kind-discriminated union distinguishes a resident vertex ordinal from a resident triangle and its ordered barycentric weights; actual residency and finite/nonnegative normalized weights require runtime admission that remains unimplemented.
   * @evidence contracts/common.md#clear-and-simple-design Two direct source-address forms share surface identity without invented XYZ controls or another correspondence wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither branch creates personal geometry, moves an anchor or silently repairs invalid weights/indices.
   * @evidence contracts/common.md#meaningful-documentation Members state source surface ownership, zero-based immutable ordinals, pre-split triangle identity and finite normalized corner weights.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This union selects no lookup or interpolation algorithm; it represents a source address only.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An anchor address defines no evaluated-correspondence cache or dependency equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration allocates no mesh or acquisition handle; the source annotation record holds its scalar address or weight triple.
   *
   * @author Samchon
   */
  export type Anchor =
    | {
        /** Existing source-vertex address. */
        kind: "vertex";

        /** Source surface ID, never a personal asset name. */
        surface: string;

        /** Zero-based vertex index on the immutable source surface. */
        vertex: number;
      }
    | {
        /** Barycentric address inside one existing source triangle. */
        kind: "triangle";

        /** Source surface ID, never a personal asset name. */
        surface: string;

        /** Zero-based source triangle index before output splitting. */
        triangle: number;

        /** Barycentric weights in source-corner order, finite/nonnegative and summing to one. */
        weights: [number, number, number];
      };

  /**
   * Named surface point definitions on one anatomical side.
   *
   * @evidence contracts/common.md#principled-implementation Twelve optional anatomical surface sites each carry an Anchor under the parent basis/protocol, without mirroring a missing point from the other side.
   * @evidence contracts/common.md#clear-and-simple-design One Side vocabulary serves independently annotated left/right records while the source identity stays outside each point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing sites stay unavailable, and an extreme-point name does not replace source annotation or prove its clinical correspondence.
   * @evidence contracts/common.md#meaningful-documentation Every field states the site definition, including cranial breadth, canthi, alar transitions and lip commissure, rather than repeating the anchor type.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This named-site interface performs no extreme-point search or landmark evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Side record defines no shared measurement cache or request identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no imaging data or surface buffers; its source annotation owner holds the optional addresses.
   *
   * @author Samchon
   */
  export interface Side {
    /** Maximum lateral cranial breadth point. */
    euryon?: Anchor;

    /** Minimum lateral frontal breadth point. */
    frontotemporale?: Anchor;

    /** Maximum lateral zygomatic breadth point. */
    zygion?: Anchor;

    /** Soft-tissue angle of the mandible. */
    gonion?: Anchor;

    /** Superior notch of tragus at the face. */
    tragion?: Anchor;

    /** Medial canthus of the palpebral fissure. */
    endocanthion?: Anchor;

    /** Lateral canthus of the palpebral fissure. */
    exocanthion?: Anchor;

    /** Most lateral alar point. */
    alare?: Anchor;

    /** Alar base at the nasal-floor junction. */
    subalare?: Anchor;

    /** Alar curvature transition toward the cheek. */
    alarCurvature?: Anchor;

    /** Philtral ridge at the upper vermilion border. */
    cristaPhiltri?: Anchor;

    /** Labial commissure where upper and lower vermilion meet. */
    cheilion?: Anchor;
  }
}
