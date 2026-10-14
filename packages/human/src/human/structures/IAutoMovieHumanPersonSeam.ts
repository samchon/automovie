/**
 * How one face basis and one body basis meet at the neck, decided once from their neutral surfaces.
 *
 * Compatible neutral face/body surfaces supply one open neck loop each in a common metre Y-up/+Z-forward frame. The seam captures their index correspondence and the sampled overlap cut; it does not establish common source provenance or an anatomical overlap magnitude. The person builder subdivides each evaluated boundary according to its shared Float32 samples, so shape or pose may change the emitted triangle population:
 *
 * - `covered` body vertices lie above the face loop, in the band both skins describe, and the body clips each triangle through a frozen scalar field. The face owns the neck's form, the way it owns the head's; the body owns everything below its retained loop; lower original rows stay interior.
 * - `ribbon` records the original adjacency between the two loops for joined normal calculation. The person builder emits the subdivided skins without a ribbon part. Local numbers `0 .. faceLoop.length - 1` are the face loop in order and the following `bodyLoop.length` numbers are the body loop.
 * - `collar` says how the retained body loop and a band of skin below it follow the face's neck when the two documents ask for different necks (see `conformHumanPersonCollar`).
 *
 * `faceBasis` and `bodyBasis` record the revisions used to derive the seam. Low-level cut/collar/stitch readers do not compare these labels; callers must keep the matching basis context and captured arrays unchanged. Frozen means reused correspondence, not runtime freezing. Vertex numbers address skin surfaces before material and UV splitting. The body's original vertices keep their numbers; cut intersections append after the original position count. A caller evaluates those endpoints through evaluateHumanPersonCut before reading bodyLoop or applying the collar.
 *
 * @evidence contracts/common.md#principled-implementation Oriented loops and a captured affine cut preserve index correspondence under unchanged matching source context; revision labels record provenance without implementing a low-level mismatch guard.
 * @evidence contracts/common.md#clear-and-simple-design One seam keeps revision identity, cut topology and collar correspondence together because every downstream evaluation must address the same neutral source vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller-authored seams may omit cutting only under the documented retained-boundary legacy contract; index correspondence does not authenticate common source anatomy or detect revision mismatch by itself.
 * @evidence contracts/common.md#meaningful-documentation Comments define metre axes, original/appended numbering, caller-owned revision matching, mutable captured arrays, cut signs, affine fractions and collar weighting without physiological proof.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The frozen neck-cut and collar correspondence metadata are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the frozen neck-cut and collar correspondence metadata; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring frozen neck-cut and collar correspondence metadata acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSeam {
  /** Revision of the face basis the seam was derived on. */
  faceBasis: string;

  /** Revision of the body basis the seam was derived on. */
  bodyBasis: string;

  /** The neck axis: the vertical through this point of the horizontal plane, in metres, about which azimuth is measured. */
  axis: { x: number; z: number };

  /** Identity of the face's skin surface, the one whose loop is the neck cut. */
  faceSurface: string;

  /** Identity of the body's skin surface. */
  bodySurface: string;

  /** The face's neck loop, in the direction its triangles run. */
  faceLoop: number[];

  /** The body's retained loop after the covered band is removed, in the direction its triangles run. */
  bodyLoop: number[];

  /** Positive source samples of the covered band; cut preserves the below-boundary portions of incident triangles. */
  covered: number[];

  /**
   * Frozen piecewise-linear cut over the neutral body's source vertices. Positive margins are removed; zero is retained. New vertices append after `margins.length`, one per undirected crossing edge, and evaluate neutral or already posed endpoints with the same affine stencil. Corner attributes use each region's own chart. Legacy caller-authored seams may omit this when they already supply a retained boundary and no clipping is required.
   */
  cut?: {
    /** Signed vertex samples in metres, not an analytic angular boundary. */
    margins: number[];

    /** Canonical source endpoints a < b and fraction from a towards b. */
    intersections: { a: number; b: number; t: number }[];

    /** Retained source triangles, including appended crossing identities. */
    indices: number[];
  };

  /** Original cross-loop adjacency for normal calculation, over the local numbering documented above; not an emitted skin part. */
  ribbon: number[];

  /** How the body follows the face's neck. */
  collar: {
    /** Positive metre reach below the retained loop, derived from triangle-edge graph distances or supplied explicitly; not an exact continuous-surface geodesic. */
    reachMetres: number;

    /**
     * Positive metre height above the face loop over which its weights rise from the body's at the collar to the head's alone. Derived from sampled body head-weight mass at graph distances or supplied explicitly; this is a rig transition convention.
     */
    headReachMetres: number;

    /**
     * For each vertex of `bodyLoop`, the face loop edge nearest to it at the neutral: edge `edge` runs from `faceLoop[edge]` to the next loop vertex and `fraction` is its nearest coordinate clamped to [0,1]. Endpoint hits need not be perpendicular.
     */
    follow: { edge: number; fraction: number }[];

    /**
     * The skin vertices that follow, each with the two loop vertices that bracket its nearest-face parameter (`bodyLoop` indices `low` and `high`, `along` in [0,1] from the first to the second). A boundary source reads its own loop identity even when projected samples tie; an interior query reads the last tied resident. Caller-authored seams without a cut retain their original angular lookup. Its weight is in (0,1], one at the loop and falling to nothing at `reachMetres`.
     */
    band: {
      vertex: number;
      low: number;
      high: number;
      along: number;
      weight: number;
    }[];
  };
}
