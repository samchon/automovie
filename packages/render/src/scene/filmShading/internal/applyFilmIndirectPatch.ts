import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import type { IMaterialShaderSource } from "../../IMaterialShaderSource.js";
import { AutoMovieRenderMaterial } from "../../AutoMovieRenderMaterial.js";

/*
 * Give one lit material the film's indirect shading: the probes' one-bounce
 * irradiance at the fragment's world position and normal, times its diffuse
 * albedo over ? (`BRDF_Lambert`), is added to its indirect diffuse light, and
 * then its indirect diffuse and indirect specular light are multiplied by the
 * occlusion visibility the film stage measured for the fragment's own pixel,
 * after any occlusion texture of the material has applied, so the two multiply
 * and occlusion darkens the bounce too.
 *
 * The patch reads the stage's shared uniform objects, so one compiled program
 * serves every frame: `uFilmProbesOn` and `uFilmOcclusionOn` are zero outside
 * the stage's beauty draw, which leaves the material's light exactly as before.
 * The probe term mirrors `sampleAutoMovieIrradianceVolume` over a float texture
 * of nine coefficient texels per probe row, validity in the first texel's
 * alpha; the world position comes from the view position by the inverse of the
 * rigid view matrix. The visibility texture is read at `gl_FragCoord.xy /
 * uFilmResolution`, the pixel of the raster the stage measured. Direct light is
 * never touched.
 *
 * Lit materials are three's standard, physical, Lambert, Phong and toon
 * materials, whose fragment programs carry the `aomap_fragment` chunk and
 * indirect light. A material is patched once; a material whose compile hook was
 * set outside `AutoMovieRenderMaterial.addShaderPatch` is refused with an error naming it,
 * because the shared seam would replace that hook.
 * Returns: Whether the material is lit and now carries the patch.
 */
export function applyFilmIndirectPatch(
  material: THREE.Material,
  uniforms: Record<string, THREE.IUniform>,
): boolean {
  if (
    !(
      AutoMovieThreeKind.isMeshStandardMaterial(material) ||
      AutoMovieThreeKind.isMeshLambertMaterial(material) ||
      AutoMovieThreeKind.isMeshPhongMaterial(material) ||
      AutoMovieThreeKind.isMeshToonMaterial(material)
    )
  )
    return false;
  if (material.userData.autoMovieFilmIndirect === true) return true;
  if (
    material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile &&
    material.userData.shaderPatches === undefined
  )
    throw new Error(
      `Film shading cannot patch material "${material.name}": its compile hook was set outside AutoMovieRenderMaterial.addShaderPatch`,
    );
  material.userData.autoMovieFilmIndirect = true;
  AutoMovieRenderMaterial.addShaderPatch(material, {
    key: "automovie-film-indirect",
    apply: (shader: IMaterialShaderSource): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          [
            "#include <common>",
            "uniform sampler2D uFilmOcclusion;",
            "uniform float uFilmOcclusionOn;",
            "uniform vec2 uFilmResolution;",
            "uniform highp sampler2D uFilmProbes;",
            "uniform float uFilmProbesOn;",
            "uniform vec3 uFilmProbeMin;",
            "uniform float uFilmProbeSpacing;",
            "uniform vec3 uFilmProbeCounts;",
            // One probe's irradiance at a world normal, as autoMovieIrradianceOf.
            "vec3 autoMovieProbeAt( int index, vec3 n ) {",
            "\tfloat basis[ 9 ] = float[ 9 ]( 0.282095, 0.488603 * n.y, 0.488603 * n.z, 0.488603 * n.x, 1.092548 * n.x * n.y, 1.092548 * n.y * n.z, 0.315392 * ( 3.0 * n.z * n.z - 1.0 ), 1.092548 * n.x * n.z, 0.546274 * ( n.x * n.x - n.y * n.y ) );",
            "\tvec3 e = vec3( 0.0 );",
            "\tfor ( int k = 0; k < 9; ++ k ) e += texelFetch( uFilmProbes, ivec2( k, index ), 0 ).rgb * basis[ k ];",
            "\treturn e;",
            "}",
            // Trilinear over the eight valid neighbours, as sampleAutoMovieIrradianceVolume.
            "vec3 autoMovieProbeIrradiance( vec3 p, vec3 n ) {",
            "\tvec3 g = clamp( ( p - uFilmProbeMin ) / uFilmProbeSpacing, vec3( 0.0 ), uFilmProbeCounts - 1.0 );",
            "\tvec3 low = min( floor( g ), max( uFilmProbeCounts - 2.0, vec3( 0.0 ) ) );",
            "\tvec3 high = min( low + 1.0, uFilmProbeCounts - 1.0 );",
            "\tvec3 f = g - low;",
            "\tvec3 sum = vec3( 0.0 );",
            "\tfloat total = 0.0;",
            "\tfor ( int c = 0; c < 8; ++ c ) {",
            "\t\tvec3 pick = vec3( ( c & 1 ) != 0, ( c & 2 ) != 0, ( c & 4 ) != 0 );",
            "\t\tvec3 cell = mix( low, high, pick );",
            "\t\tvec3 w3 = mix( 1.0 - f, f, pick );",
            "\t\tfloat w = w3.x * w3.y * w3.z;",
            "\t\tint index = int( cell.x + uFilmProbeCounts.x * ( cell.y + uFilmProbeCounts.y * cell.z ) + 0.5 );",
            "\t\tif ( w > 0.0 && texelFetch( uFilmProbes, ivec2( 0, index ), 0 ).a > 0.5 ) {",
            "\t\t\tsum += w * autoMovieProbeAt( index, n );",
            "\t\t\ttotal += w;",
            "\t\t}",
            "\t}",
            "\treturn total > 0.0 ? sum / total : vec3( 0.0 );",
            "}",
          ].join("\n"),
        )
        .replace(
          "#include <aomap_fragment>",
          [
            "if ( uFilmProbesOn > 0.5 ) {",
            "\tvec3 autoMovieWorldNormal = inverseTransformDirection( normal, viewMatrix );",
            "\tvec3 autoMovieWorldPosition = transpose( mat3( viewMatrix ) ) * ( - vViewPosition - viewMatrix[ 3 ].xyz );",
            "\treflectedLight.indirectDiffuse += autoMovieProbeIrradiance( autoMovieWorldPosition, autoMovieWorldNormal ) * BRDF_Lambert( material.diffuseColor );",
            "}",
            "#include <aomap_fragment>",
            "if ( uFilmOcclusionOn > 0.5 ) {",
            "\tfloat autoMovieFilmVisibility = texture2D( uFilmOcclusion, gl_FragCoord.xy / uFilmResolution ).r;",
            "\treflectedLight.indirectDiffuse *= autoMovieFilmVisibility;",
            "\treflectedLight.indirectSpecular *= autoMovieFilmVisibility;",
            "}",
          ].join("\n\t"),
        );
    },
  });
  material.needsUpdate = true;
  return true;
}
