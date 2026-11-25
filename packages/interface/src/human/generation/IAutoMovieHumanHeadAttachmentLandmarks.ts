/**
 * Head-owned attachment sites from its generating profile and eye margins, `[x,
 * y, z]` calibration millimetres; these sites alone do not certify the realized
 * skin.
 */
export interface IAutoMovieHumanHeadAttachmentLandmarks {
  /** Vertex, the crown's highest point on the midline. */
  vertex: [number, number, number];

  /** Glabella, the forehead's most prominent midline point. */
  glabella: [number, number, number];

  /** Soft-tissue nasion. */
  nasion: [number, number, number];

  /** Lateral extreme of each eye's own planned margin, using that side's inputs. */
  exocanthion: Record<"left" | "right", [number, number, number]>;

  /**
   * Actual ear roots, otobasion superius and inferius; absent until the
   * realized ear module publishes its shared attachment boundary.
   */
  otobasion?: Record<
    "left" | "right",
    {
      /** Superior ear-root attachment in the registered body frame, millimetres. */
      superius: [number, number, number];
      /** Inferior ear-root attachment in the registered body frame, millimetres. */
      inferius: [number, number, number];
    }
  >;
}
