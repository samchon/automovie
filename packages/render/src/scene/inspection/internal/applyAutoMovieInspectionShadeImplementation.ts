import type { AutoMovieInspectionShade } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../../IAutoMovieRenderModeHandle.js";
import { applyRenderMode } from "../../internal/applyRenderMode.js";
import { overrideAutoMovieRenderModeMaterials } from "../../internal/overrideAutoMovieRenderModeMaterials.js";
import { AUTO_MOVIE_INSPECTION_PALETTE } from "../AUTO_MOVIE_INSPECTION_PALETTE.js";

/**
 * Vertex stage of the faces shade: three.js's own deformation, projection and
 * clipping chunks, with no lighting.
 */
const VERTEX: string = `
#include <common>
#include <batching_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
  #include <morphinstance_vertex>
  #include <batching_vertex>
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  #include <clipping_planes_vertex>
}
`;

/**
 * Fragment stage of the faces shade: one of two colours by the side of the
 * triangle seen.
 */
const FRAGMENT: string = `
uniform vec3 frontColor;
uniform vec3 backColor;
#include <common>
#include <clipping_planes_pars_fragment>
void main() {
  #include <clipping_planes_fragment>
  gl_FragColor = vec4( gl_FrontFacing ? frontColor : backColor, 1.0 );
  #include <colorspace_fragment>
}
`;

/**
 * Colour every surface of a scene by an inspection shade, and return the call
 * that brings the shade to the scene's current pose and the call that puts the
 * scene's own materials back.
 *
 * A guide pass is applied as `applyRenderMode` applies it. `clay` gives every
 * mesh one grey, two-sided and lit by the scene's lights, so form reads without
 * the film's colours. `faces` gives every mesh one unlit colour by the side
 * seen, grey from the front and maroon from the back, so an inverted, open or
 * inside-out surface shows where it is. Both inspection shades keep each mesh's
 * skinning, morphing, instancing and formation cycle, and take section planes.
 *
 * A shade made of swapped materials follows the scene by itself, so its
 * `update` does nothing. The `outline` and `pose` passes hold shells and
 * segments of their own, and their `update` is the pass's.
 */
export function applyAutoMovieInspectionShadeImplementation(
  scene: THREE.Scene,
  shade: AutoMovieInspectionShade,
): {
  /**
   * Bring the shade to the scene as it stands now; call it after every change
   * of the scene and before drawing.
   */
  update: () => void;

  /** Put the scene's own materials back and release the shade. */
  restore: () => void;
} {
  const pass: IAutoMovieRenderModeHandle =
    shade === "clay"
      ? overrideAutoMovieRenderModeMaterials(
          scene,
          "beauty",
          (): THREE.Material =>
            new THREE.MeshLambertMaterial({
              color: AUTO_MOVIE_INSPECTION_PALETTE.clay,
              side: THREE.DoubleSide,
              fog: false,
            }),
        )
      : shade === "faces"
        ? overrideAutoMovieRenderModeMaterials(
            scene,
            "beauty",
            (): THREE.Material =>
              new THREE.ShaderMaterial({
                uniforms: {
                  frontColor: {
                    value: new THREE.Color(AUTO_MOVIE_INSPECTION_PALETTE.front),
                  },
                  backColor: {
                    value: new THREE.Color(AUTO_MOVIE_INSPECTION_PALETTE.back),
                  },
                },
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                side: THREE.DoubleSide,
                clipping: true,
              }),
          )
        : applyRenderMode(scene, shade);
  return {
    update: pass.update ?? ((): void => {}),
    restore: pass.restore,
  };
}
