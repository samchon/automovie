import type {
  IAutoMovieContourLoftEmission64,
  IAutoMovieJsonArraySource,
  IAutoMovieMesh,
} from "..";

/**
 * Complete contour channels backed by immutable JSON fragments. Empty array
 * identities are publication placeholders, never validation inputs.
 */
export interface IAutoMovieRecoveryContourFileMesh {
  /** Mesh with empty channel placeholders backed by arraySources. */
  mesh: IAutoMovieMesh;

  /** Generating-curve placeholder backed by actual construction fragments. */
  construction: object[];

  /** Hash-bound complete fragments keyed by their exact placeholder identity. */
  arraySources: ReadonlyMap<
    readonly unknown[],
    readonly IAutoMovieJsonArraySource[]
  >;

  /** Original kernel reports and actual complete vertex/triangle counts. */
  emission: IAutoMovieContourLoftEmission64;

  /** Source-free raw tables retained as generating lineage, not live handles. */
  tables: {
    /** Path of the persisted physical-position fragment channel, in millimetres. */
    positionsMm: string;
    /**
     * Path of the persisted accumulated triangle-area channel used for normal
     * qualification.
     */
    accumulatedArea: string;
  };

  /** Scalar channel checks do not certify whole topology, area or rasterization. */
  qualification: {
    /**
     * True records that stored binary64 values passed finite admission before
     * publication.
     */
    finite64: true;

    /**
     * True records that the emitted raster representation remains finite after
     * binary32 conversion.
     */
    finite32: true;

    /**
     * True records that stored indices lie within the generated vertex
     * population.
     */
    indexRange: true;

    /**
     * Deferred means canonical-identity validation remains the downstream
     * engine admission owner's responsibility.
     */
    canonicalValidation: "deferred";

    /** False explicitly withholds an independent raster-area qualification. */
    rasterAreaQualified: false;
  };
}
