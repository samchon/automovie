import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieBicubicAtlasTessellation64 } from "./curve/IAutoMovieBicubicAtlasTessellation64";

/**
 * Data and callback contracts shared by the RealizeBicubicAtlas64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Metre recipes yield metre meshes while retained kernel grids and approximation estimates use millimetres; triangle parameters remain normalized chart coordinates. Completeness, approximation qualification and diagnostics remain separate; optional retention flags do not imply source-fit certification.
 * @evidence contracts/development/design.md#principled-representation Metre recipes yield metre meshes while retained kernel grids and approximation estimates use millimetres; triangle parameters remain normalized chart coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieBicubicAtlas64 owns option admission and transfers its retained mesh, reports and requested construction data to consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Completeness, approximation qualification and diagnostics remain separate; optional retention flags do not imply source-fit certification.
 */
export namespace IAutoMovieRealizeBicubicAtlas64 {
  /**
   * Realize the public metre-valued bicubic recipe through its owning engine.
   * The polynomial kernel receives millimetres once and returns model metres.
   * Complete prior chunks survive a declared output budget; no source mesh is read.
   * Shared physical identities and actual global indices remain unchanged.
   * complete describes the retained patch domain, while approximationQualified
   * separately states whether the requested field-to-triangle estimate was met.
   * Retained coarse cells can preserve a complete domain with approximation false;
   * source-fit and normal qualifications remain independent of both fields.
   * After streaming ends, unreferenced render vertices left by a local omission
   * are compacted out. Triangle ordinals and physical domain/ID pairs remain the
   * same; only the returned render indices and source-table slots are remapped.
   * Requested triangle parameters retain actual chart coordinates per corner,
   * aligned with triangle ordinals and primitiveRanges, through that compaction.
   * A shared render vertex can have different incident chart coordinates; these
   * records are not per-vertex UV0, skin weights or semantic surface addresses.
   * Optional patch coefficients are the actual post-binding kernel grids in mm,
   * filtered to patches with retained triangles. They let construction consume
   * that same field instead of re-evaluating a pre-binding recipe. Omitted/false
   * retains no coefficient snapshots; invalid retention flags reject before work.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Two optional booleans independently request per-triangle normalized parameters and millimetre prepared grids. Omitted or false allocates neither optional product; retention does not change the generated surface or its qualifications.
   * @evidence contracts/development/design.md#principled-representation Two optional booleans independently request per-triangle normalized parameters and millimetre prepared grids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The bicubic realizer consumes these retention choices only for downstream chart/construction readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted or false allocates neither optional product; retention does not change the generated surface or its qualifications.
   */
  export type IOptions = {
    /** Retain actual patch-local triangle-corner parameters for downstream surface consumers; omitted allocates none. */
    retainTriangleParameters?: boolean;
    /** Retain actual canonically bound grids for construction and field consumers; omitted allocates none. */
    retainPatchCoefficients?: boolean;
  };

  /**
   * Realize the public metre-valued bicubic recipe through its owning engine.
   * The polynomial kernel receives millimetres once and returns model metres.
   * Complete prior chunks survive a declared output budget; no source mesh is read.
   * Shared physical identities and actual global indices remain unchanged.
   * complete describes the retained patch domain, while approximationQualified
   * separately states whether the requested field-to-triangle estimate was met.
   * Retained coarse cells can preserve a complete domain with approximation false;
   * source-fit and normal qualifications remain independent of both fields.
   * After streaming ends, unreferenced render vertices left by a local omission
   * are compacted out. Triangle ordinals and physical domain/ID pairs remain the
   * same; only the returned render indices and source-table slots are remapped.
   * Requested triangle parameters retain actual chart coordinates per corner,
   * aligned with triangle ordinals and primitiveRanges, through that compaction.
   * A shared render vertex can have different incident chart coordinates; these
   * records are not per-vertex UV0, skin weights or semantic surface addresses.
   * Optional patch coefficients are the actual post-binding kernel grids in mm,
   * filtered to patches with retained triangles. They let construction consume
   * that same field instead of re-evaluating a pre-binding recipe. Omitted/false
   * retains no coefficient snapshots; invalid retention flags reject before work.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retained metre triangles keep normalized corner parameters, physical identities and millimetre approximation observations. Complete domain, approximation qualification and optional coefficients remain independent; compacted render indices do not alter triangle ordinals.
   * @evidence contracts/development/design.md#principled-representation Retained metre triangles keep normalized corner parameters, physical identities and millimetre approximation observations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The bicubic realizer transfers newly owned mesh/report arrays to model and construction consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete domain, approximation qualification and optional coefficients remain independent; compacted render indices do not alter triangle ordinals.
   */
  export type IResult = {
    /** Caller-owned indexed mesh in model metres; unreferenced render vertices may be compacted after streaming ends while triangle order and physical identities are preserved. */
    mesh: IAutoMovieMesh;
    /** Requested [u0,v0,u1,v1,u2,v2] per retained triangle, with patch ownership in primitiveRanges. */
    triangleParameters?: number[];
    /** Requested prepared coefficient grids in mm; only patches with retained triangles are included. */
    patchCoefficients?: NonNullable<
      IAutoMovieBicubicAtlasTessellation64.Summary["patchCoefficients"]
    >;
    /** Whether the retained output covers the generator's patch domain without a budget stop or omitted patch; coarse retention may still be complete. */
    complete: boolean;
    /** Whether the terminal generator met its requested binary64 approximation estimate and the result is complete; independent of source-fit and normal qualifications. */
    approximationQualified: boolean;
    /** Ordered chunk and terminal qualification messages, including explicit resource omissions; no diagnostic invents replacement geometry. */
    diagnostics: string[];
    /** Aggregated work and numerical qualifications from retained chunks, before final removal of unreferenced render vertices. */
    counts: {
      /** Count of retained over-tolerance leaf cells explicitly admitted by the retain-coarse budget policy. */
      retainedCoarseCells: number;
      /** Total proposed faces omitted for zero or nonfinite geometric area in retained chunks. */
      omittedZeroAreaTriangles: number;
      /** Count of newly emitted vertices with unresolved analytic normals, including any later removed as unreferenced. */
      unresolvedVertexNormals: number;
      /** Largest represented cell's binary64 Taylor error estimate, in millimetres despite metre output geometry. */
      maxErrorBoundMm: number;
    };
    /** Patch and parameter-cell ownership of consecutive retained triangles; triangle ordinals remain stable through render-vertex compaction. */
    primitiveRanges: {
      /** Original patch identity owning this triangle range. */
      patch: string;
      /** Zero-based first triangle ordinal in the complete returned mesh, not a chunk-local index. */
      firstTriangle: number;
      /** Number of consecutive retained triangles attributed to this parameter cell. */
      triangleCount: number;
      /** Lower normalized u bound of the owning cell in its original patch chart. */
      u0: number;
      /** Upper normalized u bound of the owning cell in its original patch chart. */
      u1: number;
      /** Lower normalized v bound of the owning cell in its original patch chart. */
      v0: number;
      /** Upper normalized v bound of the owning cell in its original patch chart. */
      v1: number;
      /** Actual cell approximation estimate in millimetres, which may exceed requested tolerance when coarse retention was explicitly selected. */
      approximationBoundMm: number;
    }[];
  };
}
