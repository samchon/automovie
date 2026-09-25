import * as THREE from "three";

/**
 * Azimuthal roughness of the fibre scattering model the absorption mapping
 * is fitted for (Chiang, Bitterli, Tappan and Burley, "A Practical and
 * Controllable Hair and Fur Model for Production Path Tracing", Computer
 * Graphics Forum 35(2), 2016; pbrt-v3's default).
 */
const AZIMUTHAL_ROUGHNESS = 0.3;
/** Refractive index of keratin (Marschner et al. 2003; pbrt-v3's default). */
const KERATIN_INDEX = 1.55;
/** Gauss-Legendre nodes and weights on [0, 1] for the impact offset. */
const OFFSETS = [
  [0.5 - 0.5 * 0.8611363116, 0.5 * 0.3478548451],
  [0.5 - 0.5 * 0.3399810436, 0.5 * 0.6521451549],
  [0.5 + 0.5 * 0.3399810436, 0.5 * 0.6521451549],
  [0.5 + 0.5 * 0.8611363116, 0.5 * 0.3478548451],
] as const;
/** Rec. 709 relative luminance of linear RGB. */
const LUMINANCE = [0.2126, 0.7152, 0.0722] as const;

const beta = AZIMUTHAL_ROUGHNESS;
/** Chiang et al.'s eq. 9 denominator at the model's azimuthal roughness. */
const ABSORPTION_SCALE =
  5.969 -
  0.215 * beta +
  2.532 * beta ** 2 -
  10.73 * beta ** 3 +
  5.574 * beta ** 4 +
  0.245 * beta ** 5;
/** Normal-incidence Fresnel reflectance of one keratin surface. */
const SURFACE_REFLECTANCE = ((KERATIN_INDEX - 1) / (KERATIN_INDEX + 1)) ** 2;
/** The colour below which a channel is treated as fully absorbing. */
const DARKEST = 1e-4;

/**
 * The share of the light falling on a hair fibre that the fibre stops: one
 * minus the luminance of what passes straight through it.
 *
 * `albedo` is the linear colour the hair shows, which Chiang et al. map to
 * the fibre's absorption per unit radius, `(ln c / s(beta))^2`. A ray at
 * impact offset `h` crosses the fibre along `2 sqrt(1 - h^2)` radii and two
 * keratin surfaces, so what continues forward is `(1 - f)^2 exp(-2 sigma
 * sqrt(1 - h^2))` averaged over the offsets the fibre's width presents
 * uniformly (four-point Gauss-Legendre). Light hair absorbs little and passes
 * most of the light to the fibres behind it, which is why a white head is
 * bright throughout; dark hair stops most of it. Limits: light the fibre
 * scatters sideways (its reflection and internal reflections) is counted as
 * stopped, and the shadow is grey: the luminance of the per-channel
 * transmittance, since a depth shadow holds no colour.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under orbiting view and shadowed material display.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies device-bounded texture sampling and shadow policy without changing the saved anatomical document.
 */
export function hairFibreShadowOpacity(
  albedo: readonly [number, number, number],
): number {
  if (!albedo.every((value) => Number.isFinite(value) && value >= 0))
    throw new Error("A hair albedo is finite and nonnegative.");
  const passed = albedo.map((value) => {
    const sigma =
      (Math.log(Math.min(1, Math.max(DARKEST, value))) / ABSORPTION_SCALE) ** 2;
    return OFFSETS.reduce(
      (sum, [h, weight]) =>
        sum + weight * Math.exp(-2 * sigma * Math.sqrt(1 - h * h)),
      0,
    );
  });
  return (
    1 -
    (1 - SURFACE_REFLECTANCE) ** 2 *
      passed.reduce((sum, value, c) => sum + LUMINANCE[c]! * value, 0)
  );
}

const glsl = (value: number): string => value.toPrecision(10);

/** `hairFibreShadowOpacity` in GLSL, from the same constants. */
const OPACITY_GLSL = `
float hairFibreShadowOpacity( vec3 albedo ) {
  vec3 sigma = log( clamp( albedo, ${glsl(DARKEST)}, 1.0 ) ) / ${glsl(ABSORPTION_SCALE)};
  sigma *= sigma;
  vec3 passed = vec3( 0.0 );
${OFFSETS.map(
  ([h, weight]) =>
    `  passed += ${glsl(weight)} * exp( -2.0 * sigma * ${glsl(Math.sqrt(1 - h * h))} );`,
).join("\n")}
  return 1.0 - ${glsl((1 - SURFACE_REFLECTANCE) ** 2)} * dot( passed, vec3( ${LUMINANCE.map(glsl).join(", ")} ) );
}
`;

/**
 * The depth material a hair-card mesh casts its shadow with: a fibre stops
 * light in proportion to `hairFibreShadowOpacity` of its own texel colour
 * (the card texture's shade times `color`, the finish's base colour), so the
 * cards' binary shadow map keeps each covered texel with that probability,
 * against interleaved gradient noise on the map's texel grid (Jimenez,
 * "Next Generation Post Processing in Call of Duty: Advanced Warfare",
 * SIGGRAPH 2014), whose thresholds spread evenly over any small neighbourhood
 * so the soft-shadow filter averages them into a partial shadow; stochastic
 * transparency is the standard way to shadow hair through a depth map
 * (Enderton et al. 2010). The renderer assigns the hair material's texture,
 * alpha cutoff and side to it each shadow pass, so the card's own mask still
 * decides where a fibre is.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under orbiting view and shadowed material display.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies device-bounded texture sampling and shadow policy without changing the saved anatomical document.
 */
export function createHairCardShadowMaterial(
  color: THREE.Color,
): THREE.MeshDepthMaterial {
  const material = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  const pigment = { value: color.clone() };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.hairPigment = pigment;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `uniform vec3 hairPigment;\n${OPACITY_GLSL}\nvoid main() {`,
      )
      .replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
  // Interleaved gradient noise on the shadow map's own texel grid.
  float hairThreshold = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  if ( hairFibreShadowOpacity( diffuseColor.rgb * hairPigment ) <= hairThreshold ) discard;`,
      );
  };
  material.customProgramCacheKey = () => "hair-card-shadow";
  return material;
}
