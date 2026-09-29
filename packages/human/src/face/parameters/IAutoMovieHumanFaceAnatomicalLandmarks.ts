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
  /** Candidate annotations are research inputs; only independently reviewed mappings may lower an edit. */
  status: "candidate" | "reviewed";
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
  /** An existing source vertex or a point inside one source triangle. */
  export type Anchor =
    | {
        kind: "vertex";
        /** Source surface ID, never a personal asset name. */
        surface: string;
        /** Zero-based vertex index on the immutable source surface. */
        vertex: number;
      }
    | {
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
