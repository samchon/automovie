/**
 * The GLSL ES 3.00 programs of the film response stage: one full-frame vertex
 * shader and the downsample, blur and final fragment shaders.
 *
 * Every program draws one full-frame quad whose fragments each read the texel
 * or texels at their own centre, so a fragment depends only on its pixel and
 * the stage's uniforms, never on an earlier frame. The final shader mirrors
 * `respondAutoMovieFilmColor`, the engine's CPU reference of the same response,
 * step for step.
 */
export const AUTOMOVIE_FILM_RESPONSE_SHADERS: {
  /**
   * Full-frame quad: a plane of side two in clip space, with its texture
   * coordinates passed on.
   */
  readonly vertex: string;

  /**
   * One pyramid step: sampling the level above at this level's texel centre
   * with linear filtering is the mean of the 2 × 2 texels it covers when the
   * level halves exactly.
   */
  readonly downsample: string;

  /**
   * One separable Gaussian pass along `uStep`, with `uWeights[0]` at the centre
   * and `uRadius` taps on each side.
   */
  readonly blur: string;

  /**
   * The final pass: glare, exposure and white balance, tone curve, clamp, sRGB
   * encoding and grade, with the linear frame's depth written so display
   * overlays drawn afterwards are occluded by the scene.
   */
  readonly final: string;

  /**
   * One accumulation step: the running sum `tSum`, or zero when `uFirst` is
   * one, plus the sample `tSample`, times `uScale`. Summing at unit scale and
   * scaling once at the end keeps the sum of equal samples exact.
   */
  readonly accumulate: string;
} = {
  vertex: /* glsl */ `
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
  downsample: /* glsl */ `
precision highp float;
uniform sampler2D tSource;
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = vec4(texture(tSource, vUv).rgb, 1.0);
}
`,
  blur: /* glsl */ `
precision highp float;
uniform sampler2D tSource;
uniform vec2 uStep;
uniform float uWeights[32];
uniform int uRadius;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 sum = uWeights[0] * texture(tSource, vUv).rgb;
  for (int k = 1; k < 32; ++k) {
    if (k > uRadius) break;
    vec2 offset = float(k) * uStep;
    sum += uWeights[k] * (texture(tSource, vUv + offset).rgb + texture(tSource, vUv - offset).rgb);
  }
  outColor = vec4(sum, 1.0);
}
`,
  final: /* glsl */ `
precision highp float;
uniform sampler2D tLinear;
uniform sampler2D tDepth;
uniform sampler2D tGlare0;
uniform sampler2D tGlare1;
uniform sampler2D tGlare2;
uniform vec3 uGlareWeights;
uniform float uGlareStrength;
uniform mat3 uResponse;
uniform int uCurve;
uniform int uGrade;
uniform vec3 uSlope;
uniform vec3 uOffset;
uniform vec3 uPower;
uniform float uSaturation;
in vec2 vUv;
out vec4 outColor;

vec3 acesFilmic(vec3 color) {
  const mat3 inputMatrix = mat3(
    vec3(0.59719, 0.07600, 0.02840),
    vec3(0.35458, 0.90834, 0.13383),
    vec3(0.04823, 0.01566, 0.83777)
  );
  const mat3 outputMatrix = mat3(
    vec3(1.60475, -0.10208, -0.00327),
    vec3(-0.53108, 1.10813, -0.07276),
    vec3(-0.07367, -0.00605, 1.07602)
  );
  vec3 v = inputMatrix * (color / 0.6);
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(outputMatrix * (a / b), 0.0, 1.0);
}

vec3 encodeSrgb(vec3 c) {
  vec3 low = 12.92 * c;
  vec3 high = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(high, low, vec3(lessThanEqual(c, vec3(0.0031308))));
}

void main() {
  vec3 c = texture(tLinear, vUv).rgb;
  if (uGlareStrength > 0.0) {
    vec3 spread = uGlareWeights.x * texture(tGlare0, vUv).rgb
      + uGlareWeights.y * texture(tGlare1, vUv).rgb
      + uGlareWeights.z * texture(tGlare2, vUv).rgb;
    c = (1.0 - uGlareStrength) * c + uGlareStrength * spread;
  }
  c = uResponse * c;
  if (uCurve == 1) c = acesFilmic(c);
  c = encodeSrgb(clamp(c, 0.0, 1.0));
  if (uGrade == 1) {
    vec3 graded = pow(clamp(c * uSlope + uOffset, 0.0, 1.0), uPower);
    float luma = dot(graded, vec3(0.2126, 0.7152, 0.0722));
    c = vec3(luma) + uSaturation * (graded - vec3(luma));
  }
  outColor = vec4(c, 1.0);
  gl_FragDepth = texture(tDepth, vUv).r;
}
`,
  accumulate: /* glsl */ `
precision highp float;
uniform sampler2D tSum;
uniform sampler2D tSample;
uniform int uFirst;
uniform float uScale;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 sum = uFirst == 1 ? vec3(0.0) : texture(tSum, vUv).rgb;
  outColor = vec4(uScale * (sum + texture(tSample, vUv).rgb), 1.0);
}
`,
};
