import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { AutoMovieHumanFaceOpticalSurface } from "../eye/AutoMovieHumanFaceOpticalSurface";
import type { IHumanFaceMeasurementSurface } from "./IHumanFaceMeasurementSurface";

/**
 * What a face measurement reader reads: the compiled basis and the final posed surface of one build.
 *
 * `point` returns one resident vertex of a basis surface after articulation, closure and contact, each coordinate rounded to Float32, the precision the static asset carries, in the basis head frame (metres, +Y up, +Z anterior, +X the face's left). It refuses an unknown surface or vertex by name. `apertureUp` is the unit opening direction the contact frame uses (the basis vertical made perpendicular to the mandibular axis), or null when the basis declares no articulation.
 *
 * @evidence contracts/common.md#principled-implementation One build's current source surfaces, optional generated meshes and same-identity reference form the measurement instrument input.
 * @evidence contracts/common.md#clear-and-simple-design Source-context construction and actual-Person acquisition implement the same head-frame reader seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Float32 source acquisition is not GPU appearance proof; replaced brows and absent crowns refuse stale native reads rather than fabricated coordinates.
 * @evidence contracts/common.md#meaningful-documentation Head metres use +X left/+Y up/+Z anterior and omitted generated/reference readers produce explicit gaps in their consumers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Point rounding, surface copies and optional mesh reads execute in context/acquisition producers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registered basis and current build arrays are shared across instruments; mesh/source reads may allocate new rounded copies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context retains its entire borrowed basis/posed/options until released; readonly signatures are not deep runtime freezing.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementContext {
  /** The compiled basis the build evaluated. */
  basis: IAutoMovieHumanFaceBasis;

  /**
   * One final posed vertex of a basis surface, rounded to Float32.
   *
   * @evidence contracts/common.md#principled-implementation One registered source vertex is read in current head-frame publication precision.
   * @evidence contracts/common.md#clear-and-simple-design Source-context and actual-Person acquisition provide the same vertex-reader seam.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/replaced native ids and absent crowns refuse instead of substituting rest coordinates; Float32 reads are not GPU observation.
   * @evidence contracts/common.md#meaningful-documentation Coordinates are head metres with +X left/+Y up/+Z anterior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Rounding or actual-point reconstruction executes in the concrete context/acquisition owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current build's registered arrays/aliases are reused, rather than rebuilding geometry for one vertex.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context retains borrowed build inputs and each returned point belongs to its caller.
   */
  point: (surface: string, vertex: number) => IAutoMovieVector3;

  /**
   * One whole final posed basis surface: Float32-rounded XYZ and its triangle indices.
   *
   * @evidence contracts/common.md#principled-implementation A complete current source surface exposes Float32 head coordinates and original incidence.
   * @evidence contracts/common.md#clear-and-simple-design Whole-surface instruments consume this source seam separately from generated composite meshes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Replaced brow/oral surfaces refuse stale source acquisition; readonly arrays do not establish deep freezing.
   * @evidence contracts/common.md#meaningful-documentation XYZ values are head metres in original resident order before render material/UV splitting.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Full-buffer rounding/copying executes in the context implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original basis incidence is borrowed while rounded current positions are created for the read; no surface memoization is promised.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source variant transfers owned positions and borrowed indices, while actual-Person reconstruction may own both arrays.
   */
  surface: (surface: string) => IHumanFaceMeasurementSurface;

  /** The contact frame's unit opening direction, or null without articulation. */
  apertureUp: IAutoMovieVector3 | null;

  /**
   * Optional final generated optical mesh at Float32 precision in this same frame. Null means this build emits no independent surface of that role. Person readers undo the common head carry after reading the actual asset.
   *
   * @evidence contracts/common.md#principled-implementation Optional actual generated iris/cornea/sclera geometry supplies the final optical instrument.
   * @evidence contracts/common.md#clear-and-simple-design Source builds expose evaluated optical parts and Person adapters read emitted parts in the common head frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null means no independent role and never authorizes a fabricated cornea or refracted clinical diameter.
   * @evidence contracts/common.md#meaningful-documentation Returned coordinates are Float32 publication geometry and any common head carry is undone by the actual-Person adapter.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Mesh lookup/copying executes in the concrete context and optical metric owns subsequent geometric traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current generated assembly is reused rather than a source eye-proxy stand-in.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context retains its geometry options; returned coordinate copies belong to readers and other topology may remain borrowed.
   */
  opticalMesh?: (
    side: "left" | "right",
    role: AutoMovieHumanFaceOpticalSurface,
  ) => IAutoMovieMesh | null;

  /**
   * Optional homologous source shape-only reference point, in the same frame and Float32 precision as point. Omission is a named reference gap; consumers must not use neutral basis positions in its place.
   */
  referencePoint?:
    | ((surface: string, vertex: number) => IAutoMovieVector3)
    | null;

  /**
   * Final generated shaft row at Float32 precision in this same frame. An empty mesh means an explicitly emitted zero population; null means this build retains source cards without an individual shaft instrument.
   *
   * @evidence contracts/common.md#principled-implementation Actual generated shaft-row geometry supplies count and sampled-centreline instruments.
   * @evidence contracts/common.md#clear-and-simple-design A deliberate empty emitted row is distinguished from no individual-shaft instrument.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained source cards do not supply a biological shaft count or fabricated regular tube mesh.
   * @evidence contracts/common.md#meaningful-documentation Head-frame Float32 geometry preserves the producer's tube representation; null is absent and empty mesh is explicit zero.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Row lookup/copying executes in the context owner and connectivity/length work in readHumanFaceLashGeometry.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The existing generated row or actual emitted part is reused instead of rerunning shaft generation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Context options retain row inputs while returned rounded coordinate arrays belong to the measurement reader.
   */
  lashMesh?: (
    side: "left" | "right",
    row: "upper" | "lower",
  ) => IAutoMovieMesh | null;
}
