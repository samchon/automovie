import type { collectAutoMovieMediumLights } from "./collectAutoMovieMediumLights.js";

/**
 * The GLSL ES 3.00 fragment program that marches a participating medium over
 * the linear beauty target, written for one list of light kinds and shadow
 * kinds.
 *
 * GLSL ES 3.00 indexes sampler arrays only with constant expressions, so each
 * light gets its own uniforms, suffixed by its index, and its own unrolled
 * term; the stage caches one program per light signature.
 *
 * Each pixel's view ray runs from the eye (or, for an orthographic camera, the
 * near plane) to the surface the depth target holds, or to the far plane where
 * no surface was drawn, in 64 equal steps. The first step is offset by a fixed
 * fraction from the 4 × 4 ordered-dither matrix of Bayer (1973, "An optimum
 * method for two-level rendition of continuous-tone pictures", IEEE
 * International Conference on Communications), shifted by `uShift`, the
 * accumulation sample's golden-ratio offset. Single scattering (Max 1995):
 *
 * - The surface keeps `exp(−σt × s)` of its radiance, `s` its distance;
 * - Each step adds `exp(−σt × s) × σs × Δs × Σ p(θ) × E`, with `E` the light's
 *   illuminance on a surface facing it, as `meterAutoMovieIlluminance` computes
 *   it, `p` the Henyey-Greenstein phase function and `θ` the scattering angle
 *   between the light's direction of travel and the direction toward the
 *   camera; a shadow-casting light is tested against its shadow map at the
 *   step.
 *
 * A panel's `E` faces its centre and is not clipped to a horizon, since a plane
 * facing the panel's centre sees all of it unless it stands within the panel's
 * own extent.
 *
 * The linear colour is associated with its alpha `a`. With `T = exp(−σt × s)`
 * the ray's transmittance and `L` its in-scattered light, the medium is a layer
 * in front of the picture whose associated colour is `L` and whose alpha is `1
 * − T`, the opacity of an emitting and absorbing segment (Max 1995), put over
 * the picture by Porter and Duff's `over` (1984, "Compositing Digital Images",
 * SIGGRAPH). That gives colour `T × colour + L` and alpha `1 − T × (1 − a)`, so
 * in linear light compositing a transparent picture over any backdrop equals
 * the opaque picture of that backdrop, and an opaque picture keeps alpha 1.
 * With `uMatte` one, for the graphics plate, whose alpha is its graphics'
 * coverage by contract, the medium dims and lights only what the picture
 * covers: colour `T × colour + a × L` and alpha `a`, which at full coverage
 * equals the beauty pass's pixel.
 */
export function buildAutoMovieMediumShader(
  lights: readonly Pick<
    collectAutoMovieMediumLights.ILight,
    "kind" | "shadow"
  >[],
): string {
  const uniforms: string[] = [];
  const terms: string[] = [];
  lights.forEach(
    (
      light: Pick<collectAutoMovieMediumLights.ILight, "kind" | "shadow">,
      i: number,
    ): void => {
      uniforms.push(
        `uniform vec3 uColor${i};`,
        `uniform vec3 uPosition${i};`,
        `uniform vec3 uDirection${i};`,
        `uniform float uRange${i};`,
        `uniform float uCone${i};`,
        `uniform vec3 uAcross${i};`,
        `uniform vec3 uUp${i};`,
      );
      const shadow: string = shadowTest(light, i, uniforms);
      const irradiance: string =
        light.kind === "directional"
          ? `vec3 toward = -uDirection${i}; vec3 e = uColor${i};`
          : light.kind === "area"
            ? `vec3 toward = normalize(uPosition${i} - x); vec3 e = uColor${i} * panel(x, uPosition${i}, uAcross${i}, uUp${i}, uDirection${i});`
            : `vec3 offset = uPosition${i} - x; float d2 = dot(offset, offset); vec3 toward = offset * inversesqrt(max(d2, 1e-12));` +
              ` vec3 e = uColor${i} * window(sqrt(d2), uRange${i}) / max(d2, 0.01);` +
              (light.kind === "spot"
                ? ` if (!(dot(-toward, uDirection${i}) > uCone${i})) e = vec3(0.0);`
                : "");
      terms.push(
        `  { ${irradiance} float visible = ${shadow}; light += visible * phase(dot(-toward, -rayDir)) * e; }`,
      );
    },
  );
  return /* glsl */ `
precision highp float;
precision highp sampler2DShadow;
precision highp samplerCubeShadow;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform mat4 uProjectionInverse;
uniform mat4 uCameraWorld;
uniform vec3 uEye;
uniform int uOrthographic;
uniform float uScattering;
uniform float uExtinction;
uniform float uAnisotropy;
uniform float uShift;
uniform int uMatte;
${uniforms.join("\n")}
in vec2 vUv;
out vec4 outColor;

const float PI = 3.141592653589793;
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);

float phase(float cosTheta) {
  float g = uAnisotropy;
  float denominator = 1.0 + g * g - 2.0 * g * cosTheta;
  return (1.0 - g * g) / (4.0 * PI * denominator * sqrt(denominator));
}

float window(float d, float r) {
  if (r <= 0.0) return 1.0;
  float ratio = d / r;
  float fade = clamp(1.0 - ratio * ratio * ratio * ratio, 0.0, 1.0);
  return fade * fade;
}

float panel(vec3 x, vec3 centre, vec3 across, vec3 up, vec3 front) {
  if (dot(x - centre, front) <= 0.0) return 0.0;
  vec3 normal = normalize(centre - x);
  vec3 corners[4] = vec3[4](centre - across - up, centre + across - up, centre + across + up, centre - across + up);
  float sum = 0.0;
  for (int k = 0; k < 4; ++k) {
    vec3 a = corners[k] - x;
    vec3 b = corners[(k + 1) % 4] - x;
    vec3 c = cross(a, b);
    float sine = length(c);
    if (sine > 0.0) sum += atan(sine, dot(a, b)) * dot(c, normal) / sine;
  }
  return abs(sum) * 0.5;
}

vec3 world(vec2 uv, float depth) {
  vec4 view = uProjectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  return (uCameraWorld * vec4(view.xyz / view.w, 1.0)).xyz;
}

void main() {
  float depth = texture(tDepth, vUv).r;
  vec3 end = world(vUv, min(depth, 1.0));
  vec3 origin = uOrthographic == 1 ? world(vUv, 0.0) : uEye;
  vec3 path = end - origin;
  float dist = length(path);
  vec3 rayDir = path / max(dist, 1e-12);
  ivec2 cell = ivec2(gl_FragCoord.xy) % 4;
  float jitter = fract((BAYER[cell.y * 4 + cell.x] + 0.5) / 16.0 + uShift);
  float ds = dist / 64.0;
  vec3 inscatter = vec3(0.0);
  for (int n = 0; n < 64; ++n) {
    float s = (float(n) + jitter) * ds;
    vec3 x = origin + rayDir * s;
    vec3 light = vec3(0.0);
${terms.join("\n")}
    inscatter += exp(-uExtinction * s) * uScattering * ds * light;
  }
  vec4 texel = texture(tColor, vUv);
  vec3 surface = texel.rgb * exp(-uExtinction * dist);
  float transmittance = exp(-uExtinction * dist);
  if (uMatte == 1) outColor = vec4(surface + texel.a * inscatter, texel.a);
  else outColor = vec4(surface + inscatter, 1.0 - (1.0 - texel.a) * transmittance);
}
`;
}

/**
 * The GLSL expression for light `i`'s shadow visibility at step point `x`,
 * declaring the uniforms it reads; 1 for a light without a drawn shadow.
 */
function shadowTest(
  light: Pick<collectAutoMovieMediumLights.ILight, "kind" | "shadow">,
  i: number,
  uniforms: string[],
): string {
  const shadow: collectAutoMovieMediumLights.IShadow | null = light.shadow;
  if (shadow === null) return "1.0";
  uniforms.push(`uniform float uBias${i};`);
  if (shadow.kind === "point") {
    uniforms.push(
      `uniform samplerCubeShadow uShadow${i};`,
      `uniform vec2 uNearFar${i};`,
    );
    // The cube stores each face's perspective depth along its view axis, the
    // largest component of the light-to-point vector, as the renderer's own
    // point shadow lookup reads it.
    registerPoint(i, uniforms);
    return `pointShadow${i}(x)`;
  }
  uniforms.push(`uniform mat4 uShadowMatrix${i};`);
  if (shadow.kind === "pcf") {
    uniforms.push(`uniform sampler2DShadow uShadow${i};`);
    uniforms.push(
      `float flatShadow${i}(vec3 x) { vec4 c = uShadowMatrix${i} * vec4(x, 1.0); c.xyz /= c.w; c.z += uBias${i};` +
        ` if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;` +
        ` return texture(uShadow${i}, c.xyz); }`,
    );
  } else if (shadow.kind === "vsm") {
    uniforms.push(`uniform sampler2D uShadow${i};`);
    uniforms.push(
      `float flatShadow${i}(vec3 x) { vec4 c = uShadowMatrix${i} * vec4(x, 1.0); c.xyz /= c.w; c.z += uBias${i};` +
        ` if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;` +
        ` vec2 m = texture(uShadow${i}, c.xy).rg; if (c.z <= m.x) return 1.0;` +
        ` float variance = max(m.y * m.y, 1e-7); float d = c.z - m.x; return clamp(variance / (variance + d * d), 0.0, 1.0); }`,
    );
  } else {
    uniforms.push(`uniform sampler2D uShadow${i};`);
    uniforms.push(
      `float flatShadow${i}(vec3 x) { vec4 c = uShadowMatrix${i} * vec4(x, 1.0); c.xyz /= c.w; c.z += uBias${i};` +
        ` if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;` +
        ` return c.z <= texture(uShadow${i}, c.xy).r ? 1.0 : 0.0; }`,
    );
  }
  return `flatShadow${i}(x)`;
}

/** Declare light `i`'s point shadow lookup. */
function registerPoint(i: number, uniforms: string[]): void {
  uniforms.push(
    `float pointShadow${i}(vec3 x) { vec3 v = x - uPosition${i}; vec3 a = abs(v); float z = max(max(a.x, a.y), a.z);` +
      ` float near = uNearFar${i}.x; float far = uNearFar${i}.y; if (z < near || z > far) return 1.0;` +
      ` float dp = far * (z - near) / (z * (far - near)) + uBias${i};` +
      ` return texture(uShadow${i}, vec4(normalize(v), dp)); }`,
  );
}
