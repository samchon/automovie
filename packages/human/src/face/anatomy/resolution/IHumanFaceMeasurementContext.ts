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
 * @author Samchon
 */
export interface IHumanFaceMeasurementContext {
  /** The compiled basis the build evaluated. */
  basis: IAutoMovieHumanFaceBasis;

  /**
   * One final posed vertex of a basis surface, rounded to Float32.
   */
  point: (surface: string, vertex: number) => IAutoMovieVector3;

  /**
   * One whole final posed basis surface: Float32-rounded XYZ and its triangle indices.
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
