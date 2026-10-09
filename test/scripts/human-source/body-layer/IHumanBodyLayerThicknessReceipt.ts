/**
 * Byte-identified native thickness production, separate from layer admission.
 * Recipe hashes cover the four local TypeScript owners. Shared library bytes
 * remain inputs of the normal production's compiler and execution receipt.
 * Historical Python receipts remain parent evidence rather than this
 * producer's identity.
 * @author Samchon
 */
export interface IHumanBodyLayerThicknessReceipt {
  /** SHA-256 of the exact serialized field bytes. */
  fieldSha256: string;

  /** SHA-256 of the actual compressed input view bytes. */
  bodyViewSha256: string;

  /** Exact body basis addressed by the native vertex arrays. */
  basis: string;

  /** SHA-256 of the invoked TypeScript entry bytes. */
  producerSha256: string;

  /** Repository-relative recipe paths and their actual SHA-256 hashes. */
  recipes: Record<string, string>;

  /** Native vertex population, without UV or material seam duplication. */
  vertices: number;

  /** Observed thickness ranges grouped by the first maximal skin influence. */
  byDominantSegment: Record<string, IHumanBodyLayerThicknessSegmentObservation>;
}

/**
 * Native vertex census and metre ranges for one dominant rig segment.
 * @author Samchon
 */
interface IHumanBodyLayerThicknessSegmentObservation {
  /** Number of native vertices assigned to this segment. */
  vertices: number;

  /** Minimum and maximum combined epidermis/dermis thickness in metres. */
  skinMetres: [number, number];

  /** Minimum and maximum subcutaneous thickness in metres. */
  subcutaneousMetres: [number, number];
}
