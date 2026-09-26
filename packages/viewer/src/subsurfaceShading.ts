import * as THREE from "three";

/** Texels of the pre-integrated table along the cosine and along the blur. */
const COSINES = 64;
const BLURS = 32;

/**
 * The pre-integrated diffuse response of a translucent surface, as a
 * single-channel table: at `u = (cos θ + 1) / 2` and `v = s / π`, the
 * clamped cosine `max(0, cos)` averaged over angles around θ with a
 * Gaussian of standard deviation `s` radians, wrapped around the circle so
 * its mean over θ stays the Lambertian mean, `1 / π`. Light that travels a
 * distance σ under a surface of curvature κ reaches an angle σκ around it,
 * so `s = σκ` (Penner and Borshukov 2011, with a Gaussian standing in for
 * the diffusion profile). The table is built once and shared.
 */
export const subsurfaceTable = (): number[][] => {
  const table: number[][] = [];
  const steps = 720;
  for (let j = 0; j < BLURS; j++) {
    const s = (j / (BLURS - 1)) * Math.PI;
    const row: number[] = [];
    for (let i = 0; i < COSINES; i++) {
      const theta = Math.acos((i / (COSINES - 1)) * 2 - 1);
      if (s === 0) {
        row.push(Math.max(0, Math.cos(theta)));
        continue;
      }
      let sum = 0;
      let weight = 0;
      for (let k = 0; k < steps; k++) {
        const x = -Math.PI + ((k + 0.5) / steps) * 2 * Math.PI;
        // the Gaussian wrapped around the circle
        let w = 0;
        for (let wrap = -2; wrap <= 2; wrap++) {
          const d = x + wrap * 2 * Math.PI;
          w += Math.exp(-0.5 * (d / s) ** 2);
        }
        sum += w * Math.max(0, Math.cos(theta + x));
        weight += w;
      }
      row.push(sum / weight);
    }
    table.push(row);
  }
  return table;
};

let shared: THREE.DataTexture | null = null;
const subsurfaceTexture = (): THREE.DataTexture => {
  if (shared !== null) return shared;
  const table = subsurfaceTable();
  const data = new Uint16Array(COSINES * BLURS);
  table.forEach((row, j) =>
    row.forEach((value, i) => {
      data[j * COSINES + i] = THREE.DataUtils.toHalfFloat(value);
    }),
  );
  const texture = new THREE.DataTexture(
    data,
    COSINES,
    BLURS,
    THREE.RedFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  shared = texture;
  return texture;
};

/** The direct diffuse line of three's physical lighting model this replaces. */
export const SUBSURFACE_TARGET =
  "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );";

/**
 * Give a physical material the diffuse response of a translucent surface:
 * each primary's direct diffuse term reads the pre-integrated table at the
 * cosine of the light and at the blur its mean free path reaches on the
 * surface's curvature, estimated per fragment from the screen-space change
 * of the interpolated normal over the change of the view position. A flat
 * surface keeps the clamped cosine; a curved one bleeds soft and red past
 * the terminator. Specular, clearcoat and indirect light are untouched.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a material's subsurface radius into the declared render material's diffuse response.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the subsurface diffuse response at the render boundary.
 */
export const applySubsurfaceShading = (
  material: THREE.MeshPhysicalMaterial,
  radius: { r: number; g: number; b: number },
): void => {
  const radiusUniform = {
    value: new THREE.Vector3(radius.r, radius.g, radius.b),
  };
  const tableUniform = { value: subsurfaceTexture() };
  material.userData.subsurfaceRadius = { ...radius };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.subsurfaceRadius = radiusUniform;
    shader.uniforms.subsurfaceTable = tableUniform;
    shader.fragmentShader = subsurfaceFragment(shader.fragmentShader);
  };
  material.customProgramCacheKey = () => "automovie-subsurface";
};

/** The physical fragment shader with the subsurface diffuse spliced in. */
export const subsurfaceFragment = (fragmentShader: string): string => {
  const pars = THREE.ShaderChunk.lights_physical_pars_fragment;
  if (!pars.includes(SUBSURFACE_TARGET))
    throw new Error(
      "The physical lighting chunk no longer has the direct diffuse line subsurface shading replaces.",
    );
  const patched =
    `uniform vec3 subsurfaceRadius;
uniform sampler2D subsurfaceTable;
float subsurfaceCurvature;
vec3 subsurfaceDiffuse( const in float dotNL ) {
	// texel centres of the ${COSINES} x ${BLURS} table
	vec3 s = ( clamp( subsurfaceRadius * subsurfaceCurvature / PI, 0.0, 1.0 ) * ${BLURS - 1}.0 + 0.5 ) / ${BLURS}.0;
	float u = ( ( dotNL * 0.5 + 0.5 ) * ${COSINES - 1}.0 + 0.5 ) / ${COSINES}.0;
	return vec3(
		texture2D( subsurfaceTable, vec2( u, s.r ) ).r,
		texture2D( subsurfaceTable, vec2( u, s.g ) ).r,
		texture2D( subsurfaceTable, vec2( u, s.b ) ).r
	);
}
` +
    pars.replace(
      SUBSURFACE_TARGET,
      "reflectedLight.directDiffuse += directLight.color * subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) ) * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );",
    );
  return fragmentShader
    .replace("#include <lights_physical_pars_fragment>", patched)
    .replace(
      "#include <lights_fragment_begin>",
      `#ifndef FLAT_SHADED
	subsurfaceCurvature = length( fwidth( normalize( vNormal ) ) ) / max( length( fwidth( vViewPosition ) ), 1e-6 );
#else
	subsurfaceCurvature = 0.0;
#endif
#include <lights_fragment_begin>`,
    );
};
