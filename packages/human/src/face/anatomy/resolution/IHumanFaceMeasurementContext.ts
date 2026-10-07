import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { AutoMovieHumanFaceOpticalSurface } from "../eye/AutoMovieHumanFaceOpticalSurface";
import type { IHumanFaceMeasurementSurface } from "./IHumanFaceMeasurementSurface";

/**
 * What a face measurement reader reads: the compiled basis and the final
 * posed surface of one build.
 *
 * `point` returns one resident vertex of a basis surface after articulation,
 * closure and contact, each coordinate rounded to Float32, the precision the
 * static asset carries, in the basis head frame (metres, +Y up, +Z anterior,
 * +X the face's left). It refuses an unknown surface or vertex by name.
 * `apertureUp` is the unit opening direction the contact frame uses (the basis
 * vertical made perpendicular to the mandibular axis), or null when the basis
 * declares no articulation.
 *
 * @evidence contracts/common.md#principled-implementation Readers measure the same final surface the editor shows and the asset carries, at its exported precision.
 * @evidence contracts/common.md#clear-and-simple-design One context gives every reader the basis, a point lookup and the shared opening direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readers never see pre-contact or rest positions as if they were final.
 * @evidence contracts/common.md#meaningful-documentation States the stage, precision, frame and refusal of the lookup.
 * @evidence contracts/modeling.md#spatial-conventions Points are metres in the basis head frame, rounded to Float32.
 * @evidence contracts/modeling.md#rendered-observation The points are the displayed and exported final surface.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The context names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The context is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The context emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The context builds no boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The context carries geometry, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The context bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The context is not an input.
 * @author Samchon
 */
export interface IHumanFaceMeasurementContext {
  /** The compiled basis the build evaluated. */
  basis: IAutoMovieHumanFaceBasis;

  /**
   * One final posed vertex of a basis surface, rounded to Float32.
   *
   * @evidence contracts/common.md#principled-implementation The vertex is read after articulation, closure and contact, as emitted.
   * @evidence contracts/common.md#clear-and-simple-design One vertex per call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown surface or vertex refuses by name.
   * @evidence contracts/common.md#meaningful-documentation States the stage and precision of the point.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The callback emits no geometry.
   * @evidence contracts/modeling.md#spatial-conventions Metres in the basis head frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The callback builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The callback owns nothing a viewer displays.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement or caller states the protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback is a reader, not a caller input.
   */
  point: (surface: string, vertex: number) => IAutoMovieVector3;

  /**
   * One whole final posed basis surface: Float32-rounded XYZ and its triangle indices.
   *
   * @evidence contracts/common.md#principled-implementation The surface is the emitted final shape with the basis triangles.
   * @evidence contracts/common.md#clear-and-simple-design One surface per call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown surface refuses by name.
   * @evidence contracts/common.md#meaningful-documentation States the stage, precision and contents.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The callback emits no geometry.
   * @evidence contracts/modeling.md#spatial-conventions Metres in the basis head frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The callback builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The callback owns nothing a viewer displays.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement or caller states the protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback is a reader, not a caller input.
   */
  surface: (surface: string) => IHumanFaceMeasurementSurface;

  /** The contact frame's unit opening direction, or null without articulation. */
  apertureUp: IAutoMovieVector3 | null;

  /**
   * Optional final generated optical mesh at Float32 precision in this same
   * frame. Null means this build emits no independent surface of that role.
   * Person readers undo the common head carry after reading the actual asset.
   */
  opticalMesh?: (
    side: "left" | "right",
    role: AutoMovieHumanFaceOpticalSurface,
  ) => IAutoMovieMesh | null;

  /**
   * Optional homologous source shape-only reference point, in the same frame
   * and Float32 precision as point. Omission is a named reference gap;
   * consumers must not use neutral basis positions in its place.
   */
  referencePoint?:
    | ((surface: string, vertex: number) => IAutoMovieVector3)
    | null;

  /**
   * Final generated shaft row at Float32 precision in this same frame.
   * An empty mesh means an explicitly emitted zero population; null means
   * this build retains source cards without an individual shaft instrument.
   */
  lashMesh?: (
    side: "left" | "right",
    row: "upper" | "lower",
  ) => IAutoMovieMesh | null;
}
