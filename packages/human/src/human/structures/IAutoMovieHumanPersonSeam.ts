/**
 * How one face basis and one body basis meet at the neck, decided once from
 * their neutral surfaces.
 *
 * Both anatomies end in an open loop on the same neck: the face's skin stops
 * below the chin and the body's skin starts above the shoulders, and the two
 * were cut from one source mesh at different times, so their loops no longer
 * share vertices and their skins overlap by several millimetres. The seam
 * fixes how to join them so that every later document, shape or pose only
 * moves vertices and never changes which triangles exist:
 *
 * - `covered` body vertices lie above the face loop, in the band both skins
 *   describe, and the body gives up every triangle they touch. The face owns
 *   the neck's form, the way it owns the head's; the body owns everything
 *   below its retained loop.
 * - `ribbon` triangulates the strip between the two loops. Its vertices are
 *   the loops' own, so the seam has no vertex of its own to disagree with a
 *   neighbour: local numbers `0 .. faceLoop.length - 1` are the face loop in
 *   order and the following `bodyLoop.length` numbers are the body loop.
 * - `collar` says how the retained body loop and a band of skin below it follow
 *   the face's neck when the two documents ask for different necks (see
 *   `conformHumanPersonCollar`).
 *
 * Everything derived from a basis embeds that basis: `faceBasis` and
 * `bodyBasis` name the revisions the numbers were computed on, so a seam
 * applied to another revision is detected instead of being merely wrong.
 * Vertex numbers are the connected skin surfaces' shared vertices, before
 * material and UV splitting.
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

  /** Body skin vertices above the face loop; every triangle touching one is removed. */
  covered: number[];

  /** Triangles of the strip between the loops, over the local numbering documented above. */
  ribbon: number[];

  /** How the body follows the face's neck. */
  collar: {
    /** Metres of skin below the retained loop that follow it, measured along the surface. */
    reachMetres: number;

    /**
     * For each vertex of `bodyLoop`, the face loop edge nearest to it at the
     * neutral: edge `edge` runs from `faceLoop[edge]` to the next loop vertex
     * and `fraction` in [0,1] is the foot of the perpendicular along it.
     */
    follow: { edge: number; fraction: number }[];

    /**
     * The skin vertices that follow, each with the two loop vertices that
     * bracket it by azimuth about the neck (`bodyLoop` indices `low` and
     * `high`, `along` in [0,1] from the first to the second) and its weight in
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
