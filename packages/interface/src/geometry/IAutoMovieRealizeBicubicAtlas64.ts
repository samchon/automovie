import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieBicubicAtlasTessellation64 } from "./IAutoMovieBicubicAtlasTessellation64";

/** Request and result contracts for Engine bicubic atlas realization. */
export namespace IAutoMovieRealizeBicubicAtlas64 {
  /**
   * Select the optional data that survives atlas realization.
   *
   * Both options default to false. Supplied values must be booleans and are
   * checked before realization. Request triangle parameters to locate the
   * returned corners in their charts. Request patch coefficients to read the
   * bound millimetre grids for patches with retained triangles.
   */
  export type IOptions = {
    /**
     * Retain actual patch-local triangle-corner parameters for downstream
     * surface consumers; omitted allocates none.
     */
    retainTriangleParameters?: boolean;
    /**
     * Retain actual canonically bound grids for construction and field
     * consumers; omitted allocates none.
     */
    retainPatchCoefficients?: boolean;
  };

  /**
   * Return the retained atlas mesh and its processing results.
   *
   * The mesh uses model metres. A resource stop preserves earlier chunks in the
   * result. Domain completion and field-to-triangle approximation are separate
   * outcomes. A complete atlas can retain coarse cells outside the requested
   * approximation. The returned triangle order and its per-corner data persist
   * through vertex compaction.
   */
  export type IResult = {
    /**
     * Caller-owned indexed mesh in model metres; unreferenced render vertices
     * may be compacted after streaming ends while triangle order and physical
     * identities are preserved.
     */
    mesh: IAutoMovieMesh;
    /**
     * Requested [u0,v0,u1,v1,u2,v2] per retained triangle, with patch ownership
     * in `primitiveRanges`. Shared vertices can have different chart
     * coordinates on their incident triangles.
     */
    triangleParameters?: number[];
    /**
     * Requested prepared coefficient grids in mm; only patches with retained
     * triangles are included.
     */
    patchCoefficients?: NonNullable<
      IAutoMovieBicubicAtlasTessellation64.Summary["patchCoefficients"]
    >;
    /**
     * Whether the retained output covers the generator's patch domain without a
     * budget stop or omitted patch; coarse retention may still be complete.
     */
    complete: boolean;
    /**
     * Whether the terminal generator met its requested binary64 approximation
     * estimate and the result is complete; independent of source-fit and normal
     * qualifications.
     */
    approximationQualified: boolean;
    /** Ordered messages from admission, retained chunks and the terminal result. */
    diagnostics: string[];
    /**
     * Aggregated work and numerical qualifications from retained chunks, before
     * final removal of unreferenced render vertices.
     */
    counts: IResultCounts;
    /**
     * Patch and parameter-cell ownership of consecutive retained triangles;
     * triangle ordinals remain stable through render-vertex compaction.
     */
    primitiveRanges: IPrimitiveRange[];
  };

  /** Work totals and maximum cell estimate across retained atlas chunks. */
  export type IResultCounts = Pick<
    IResultCountFields,
    keyof IResultCountFields
  >;

  /** Numeric fields shared by realization and Recovery counts. */
  export interface IResultCountFields {
    /**
     * Count of retained over-tolerance leaf cells explicitly admitted by the
     * retain-coarse budget policy.
     */
    retainedCoarseCells: number;
    /**
     * Total proposed faces omitted for zero or nonfinite geometric area in
     * retained chunks.
     */
    omittedZeroAreaTriangles: number;
    /**
     * Count of newly emitted vertices with unresolved analytic normals,
     * including any later removed as unreferenced.
     */
    unresolvedVertexNormals: number;
    /**
     * Largest represented cell's binary64 Taylor error estimate, in millimetres
     * despite metre output geometry.
     */
    maxErrorBoundMm: number;
  }

  /** Consecutive retained triangles owned by one parameter cell on a patch. */
  export type IPrimitiveRange = Pick<
    IPrimitiveRangeFields,
    keyof IPrimitiveRangeFields
  >;

  /** Patch and triangle span fields shared by realization and Recovery. */
  export interface IPrimitiveRangeFields {
    /** ID of the generating atlas patch. */
    patch: string;

    /** Zero-based first triangle ordinal in the returned mesh. */
    firstTriangle: number;

    /** Number of consecutive retained triangles owned by this cell. */
    triangleCount: number;

    /** Lower normalized U bound in the generating patch chart. */
    u0: number;

    /** Upper normalized U bound in the generating patch chart. */
    u1: number;

    /** Lower normalized V bound in the generating patch chart. */
    v0: number;

    /** Upper normalized V bound in the generating patch chart. */
    v1: number;

    /**
     * Cell approximation estimate in millimetres. When coarse retention is
     * selected this estimate can exceed the requested tolerance.
     */
    approximationBoundMm: number;
  }
}
