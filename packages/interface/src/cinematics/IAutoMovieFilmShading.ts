import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFilmOptics } from "./IAutoMovieFilmOptics";

/**
 * The indirect light of a directly rendered film's beauty pass at one second:
 * how much of the scene's image lighting each point receives, given the
 * geometry around it.
 *
 * A draw scene returns it from `shading` for every second it draws, beside its
 * {@link IAutoMovieFilmOptics}; the computation lives beside the optics' linear
 * target, so a scene with `shading` members supplies `optics` at that second.
 * Direct light and structural passes are never changed. Each frame depends only
 * on its own second: occlusion is measured for every draw, and a probe bake is
 * reused only for a second whose `revision` names the same lit set, which is
 * exactly what a new bake would produce.
 */
export interface IAutoMovieFilmShading {
  /**
   * Ground-truth-based ambient occlusion of the indirect light. Absent,
   * indirect light reaches creases, corners and contact areas as brightly as an
   * open floor.
   */
  occlusion?: IAutoMovieFilmShading.IOcclusion;

  /**
   * One diffuse bounce of the set's own light from irradiance probes baked over
   * a box. Absent, light thrown onto a surface reaches nothing else.
   */
  probes?: IAutoMovieFilmShading.IProbes;
}

/** The occlusion and probe requests the shading states. */
export namespace IAutoMovieFilmShading {
  /**
   * Occlusion of indirect light by geometry near each visible point (Jimenez,
   * Wu, Pesce and Jarabo 2016, "Practical real-time strategies for accurate
   * indirect occlusion", SIGGRAPH course "Physically Based Shading in Theory
   * and Practice").
   *
   * The renderer measures, from a depth and normal prepass at the beauty
   * raster, the cosine-weighted visible fraction of each point's hemisphere
   * along four screen-space slices, eight horizon steps per side within
   * `radius`, and multiplies it into every lit material's indirect diffuse and
   * specular light, together with any occlusion texture of the material.
   */
  export interface IOcclusion {
    /**
     * World radius in metres within which geometry occludes, finite and above
     * zero: about the size of the gaps the film should darken, such as 0.5 for
     * a room's corners and the ground under a figure.
     */
    radius: number;
  }

  /**
   * A grid of irradiance probes baked from the static set (Greger, Shirley,
   * Hubbard and Greenberg 1998, "The irradiance volume", IEEE CG&A 18(2)).
   *
   * When `revision` differs from the last bake, the renderer bakes one probe
   * per grid point from `min` to `max` at `spacing`: a 32-pixel cube of `layer`
   * alone, with its direct light, shadows, emission and image lighting on the
   * surfaces, drawn with no background so the sky, which image lighting already
   * brings to every material, is not counted twice. Each cube is projected onto
   * order-2 spherical harmonics and convolved with the clamped cosine
   * (Ramamoorthi and Hanrahan 2001, "An efficient representation for irradiance
   * environment maps", SIGGRAPH). A probe more than a quarter of whose cube
   * sees back faces sits inside a solid and is invalid.
   *
   * Every lit material then adds the irradiance interpolated trilinearly from
   * the eight surrounding valid probes, weights renormalized over the valid
   * ones, times its diffuse albedo over π; with no valid neighbour it adds
   * nothing, and a point outside the box takes the nearest face's probes.
   * Occlusion, when present, darkens this light too. One bounce only: a bake
   * reads no earlier bake, and moving actors receive the bounce without casting
   * it.
   */
  export interface IProbes {
    /** The box's lowest corner, world metres. */
    min: IAutoMovieVector3;

    /** The box's highest corner, world metres, at least `min` on every axis. */
    max: IAutoMovieVector3;

    /**
     * Probe pitch in metres, finite and above zero; each axis holds `floor((max
     * − min) / spacing) + 1` probes, and the grid at most 2048 in all, the
     * texture rows every WebGL 2 renderer can store.
     */
    spacing: number;

    /**
     * The renderer layer holding the static set and the lights that light it, a
     * safe integer within [1, 31]; the bake draws this layer alone, and a light
     * off the layer does not light the bake.
     */
    layer: number;

    /**
     * Name of the lit state of `layer`: two seconds with equal revisions must
     * have equal static geometry, materials and light, because the bake of one
     * is reused for the other. Change it whenever a light or set piece of the
     * layer changes, so each frame still depends only on its own second.
     */
    revision: string;
  }
}
