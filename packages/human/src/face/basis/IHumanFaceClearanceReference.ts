import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One reference surface as the clearance instrument holds it between
 * readings: its placed local-Float32 copy and the signed queries compiled from it, one per
 * boundary mode. Holding it changes no reading; it only avoids compiling the
 * same reference again for every subject.
 *
 * @evidence contracts/common.md#principled-implementation A compiled query is a pure function of the rounded mesh, actual publication TRS and boundary mode; reuse includes all three.
 * @evidence contracts/common.md#clear-and-simple-design A mesh and a small map keyed by boundary mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keyed by the mesh object and its actual TRS, never by a part identity.
 * @evidence contracts/common.md#meaningful-documentation States what is held and that readings are unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Holds a reference surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The instrument that owns it states the frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Measuring transport.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measuring transport.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 *
 * @author Samchon
 */
export interface IHumanFaceClearanceReference {
  /** Reference reconstructed in the head frame from actual local Float32 and publication TRS. */
  mesh: IAutoMovieMesh;

  /** Exact serialized publication TRS of this rounded reference. */
  transform: string;

  /** Compiled signed queries by boundary mode. */
  queries: Map<
    "closed" | "open",
    ReturnType<typeof createAutoMovieSignedMeshQuery>
  >;
}
