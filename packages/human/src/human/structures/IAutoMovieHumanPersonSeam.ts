/**
 * How one face basis and one body basis meet at the neck, decided once from
 * their neutral surfaces.
 *
 * Both anatomies end in an open loop on the same neck: the face's skin stops
 * below the chin and the body's skin starts above the shoulders, and the two
 * were cut from one source mesh at different times, so their loops no longer
 * share vertices and their skins overlap by several millimetres. The seam
 * fixes the source identities and their correspondence. The person builder
 * subdivides each evaluated boundary according to its shared Float32 samples,
 * so shape or pose may change the emitted triangle population:
 *
 * - `covered` body vertices lie above the face loop, in the band both skins
 *   describe, and the body clips each triangle through a frozen scalar field. The face owns
 *   the neck's form, the way it owns the head's; the body owns everything
 *   below its retained loop; lower original rows stay interior.
 * - `ribbon` records the original adjacency between the two loops for joined
 *   normal calculation. The person builder emits the subdivided skins without
 *   a ribbon part. Local numbers `0 .. faceLoop.length - 1` are the face loop
 *   in order and the following `bodyLoop.length` numbers are the body loop.
 * - `collar` says how the retained body loop and a band of skin below it follow
 *   the face's neck when the two documents ask for different necks (see
 *   `conformHumanPersonCollar`).
 *
 * Everything derived from a basis embeds that basis: `faceBasis` and
 * `bodyBasis` name the revisions the numbers were computed on, so a seam
 * applied to another revision is detected instead of being merely wrong.
 * Vertex numbers are the connected skin surfaces' shared vertices before
 * material and UV splitting. The body's original vertices keep their numbers;
 * frozen cut intersections append after the original position count. A caller
 * evaluates those endpoints through evaluateHumanPersonCut before reading
 * bodyLoop or applying the collar.
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
   * Frozen piecewise-linear cut over the neutral body's source vertices.
   * Positive margins are removed; zero is retained. New vertices append after
   * `margins.length`, one per undirected crossing edge, and evaluate neutral or
   * already posed endpoints with the same affine stencil. Corner attributes
   * use each region's own chart. Legacy caller-authored seams may omit this
   * when they already supply a retained boundary and no clipping is required.
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
    /** Metres of skin below the retained loop that follow it, measured along the surface. */
    reachMetres: number;

    /**
     * Metres of the face's neck skin above the loop over which its weights
     * rise from the body's at the collar to the head's alone: the length over
     * which the body's own weights let the head go, read from them.
     */
    headReachMetres: number;

    /**
     * For each vertex of `bodyLoop`, the face loop edge nearest to it at the
     * neutral: edge `edge` runs from `faceLoop[edge]` to the next loop vertex
     * and `fraction` in [0,1] is the foot of the perpendicular along it.
     */
    follow: { edge: number; fraction: number }[];

    /**
     * The skin vertices that follow, each with the two loop vertices that
     * bracket its nearest-face parameter (`bodyLoop` indices `low` and
     * `high`, `along` in [0,1] from the first to the second). A boundary source
     * reads its own loop identity even when projected samples tie; an interior
     * query reads the last tied resident. Caller-authored seams without a cut
     * retain their original angular lookup. Its weight is in
     * (0,1], one at the loop and falling to nothing at `reachMetres`.
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
