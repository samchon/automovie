import * as THREE from "three";

/** The 4 × 4 ordered-dither matrix of Bayer (1973), row by row. */
const BAYER: readonly number[] = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
];

/**
 * A CPU reference of the participating medium's march for one pixel, step for
 * step as `buildAutoMovieMediumShader` states it, reading the uniform values
 * the medium pass handed its program.
 *
 * The pixel's view ray runs from the eye, or the near plane for an orthographic
 * camera, to the point the depth texel reconstructs through the camera's
 * inverse projection and world matrix, in 64 equal steps, the first offset by
 * the pixel's Bayer cell shifted by `uShift`. Each step adds `exp(−σt s) × σs ×
 * Δs × Σ visible × p(θ) × E` over the lights, with the Henyey-Greenstein `p` of
 * `uAnisotropy`, a point or spot light's `E` its intensity over the squared
 * distance (at least 0.01 m²) times its range window, a spot's zero outside its
 * cone, a directional light's its illuminance and a panel's its luminance times
 * its projected solid angle. The surface texel keeps `exp(−σt × distance)`, and
 * the result is composited as the program writes it: colour `T × colour + L`
 * and alpha `1 − T (1 − a)`, or, with `uMatte`, colour `T × colour + a × L` and
 * alpha `a`.
 *
 * It is the method under the GPU program, not the program: a test that reads it
 * with the pass's recorded uniforms checks the pass's light, camera and medium
 * values and the march's method against a closed form, and a capture checks the
 * program's pixels.
 *
 * @param props The recorded uniforms, the light kinds in uniform order, the
 *   pixel's coordinates, its depth and colour texels, and the shadow test of a
 *   light that casts one.
 * @returns The linear colour and alpha the program writes for the pixel.
 * @evidence contracts/development/common.md#meaningful-documentation States the ray, the steps, each light kind's illuminance, the compositing and what a test reading it checks.
 * @evidence contracts/development/implementation.md#principled-implementation Single scattering after Max 1995 with the Henyey-Greenstein phase function, the same sums and constants the program evaluates, in binary64.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reference shared by the transmittance, in-scatter and shadow tests, which state only their scene and expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes no expected value; the tests derive theirs from closed forms.
 * @evidence contracts/development/implementation.md#efficient-algorithms 64 steps times the light count per pixel.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is one pixel.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function marchFilmMediumPixel(props: {
  /** The march program's uniform values, as the recording renderer read them. */
  program: Record<string, unknown>;

  /** Each light's kind, in the order of its uniforms. */
  kinds: readonly ("directional" | "point" | "spot" | "area")[];

  /** The pixel centre's texture coordinate, origin at the bottom left. */
  uv: { x: number; y: number };

  /** The pixel's integer coordinates, as `gl_FragCoord.xy` floors them. */
  pixel: { x: number; y: number };

  /** The depth texel in [0, 1]; 1 where no surface was drawn. */
  depth: number;

  /** The linear colour and alpha texel. */
  color: readonly [number, number, number, number];

  /** A shadow-casting light's visibility at a world point; absent is 1. */
  shadow?: (light: number, point: THREE.Vector3) => number;
}): [number, number, number, number] {
  const u: Record<string, unknown> = props.program;
  const vector: (name: string) => THREE.Vector3 = (
    name: string,
  ): THREE.Vector3 => new THREE.Vector3().fromArray(u[name] as number[]);
  const inverse: THREE.Matrix4 = new THREE.Matrix4().fromArray(
    u.uProjectionInverse as number[],
  );
  const cameraWorld: THREE.Matrix4 = new THREE.Matrix4().fromArray(
    u.uCameraWorld as number[],
  );
  const world: (depth: number) => THREE.Vector3 = (
    depth: number,
  ): THREE.Vector3 => {
    const view: THREE.Vector4 = new THREE.Vector4(
      props.uv.x * 2 - 1,
      props.uv.y * 2 - 1,
      depth * 2 - 1,
      1,
    ).applyMatrix4(inverse);
    return new THREE.Vector3(
      view.x / view.w,
      view.y / view.w,
      view.z / view.w,
    ).applyMatrix4(cameraWorld);
  };
  const scattering: number = u.uScattering as number;
  const extinction: number = u.uExtinction as number;
  const g: number = u.uAnisotropy as number;
  const phase: (cosine: number) => number = (cosine: number): number => {
    const denominator: number = 1 + g * g - 2 * g * cosine;
    return (1 - g * g) / (4 * Math.PI * denominator * Math.sqrt(denominator));
  };
  const window: (d: number, r: number) => number = (
    d: number,
    r: number,
  ): number => {
    if (r <= 0) return 1;
    const fade: number = Math.min(1, Math.max(0, 1 - (d / r) ** 4));
    return fade * fade;
  };

  const end: THREE.Vector3 = world(Math.min(props.depth, 1));
  const origin: THREE.Vector3 =
    u.uOrthographic === 1 ? world(0) : vector("uEye");
  const path: THREE.Vector3 = end.clone().sub(origin);
  const distance: number = path.length();
  const ray: THREE.Vector3 = path.divideScalar(Math.max(distance, 1e-12));
  const cell: number = (props.pixel.y % 4) * 4 + (props.pixel.x % 4);
  const raw: number = (BAYER[cell]! + 0.5) / 16 + (u.uShift as number);
  const jitter: number = raw - Math.floor(raw);
  const step: number = distance / 64;

  const inscatter: THREE.Vector3 = new THREE.Vector3();
  for (let n: number = 0; n < 64; ++n) {
    const s: number = (n + jitter) * step;
    const x: THREE.Vector3 = origin.clone().addScaledVector(ray, s);
    const light: THREE.Vector3 = new THREE.Vector3();
    props.kinds.forEach(
      (kind: "directional" | "point" | "spot" | "area", i: number): void => {
        const color: THREE.Vector3 = vector(`uColor${i}`);
        const position: THREE.Vector3 = vector(`uPosition${i}`);
        const direction: THREE.Vector3 = vector(`uDirection${i}`);
        let toward: THREE.Vector3;
        let e: THREE.Vector3;
        if (kind === "directional") {
          toward = direction.clone().negate();
          e = color;
        } else if (kind === "area") {
          toward = position.clone().sub(x).normalize();
          e = color
            .clone()
            .multiplyScalar(
              panel(
                x,
                position,
                vector(`uAcross${i}`),
                vector(`uUp${i}`),
                direction,
              ),
            );
        } else {
          const offset: THREE.Vector3 = position.clone().sub(x);
          const d2: number = offset.lengthSq();
          toward = offset.divideScalar(Math.sqrt(Math.max(d2, 1e-12)));
          e = color
            .clone()
            .multiplyScalar(
              window(Math.sqrt(d2), u[`uRange${i}`] as number) /
                Math.max(d2, 0.01),
            );
          if (
            kind === "spot" &&
            !(
              toward.clone().negate().dot(direction) >
              (u[`uCone${i}`] as number)
            )
          )
            e = new THREE.Vector3();
        }
        const visible: number = props.shadow?.(i, x) ?? 1;
        light.addScaledVector(
          e,
          visible * phase(toward.clone().negate().dot(ray.clone().negate())),
        );
      },
    );
    inscatter.addScaledVector(
      light,
      Math.exp(-extinction * s) * scattering * step,
    );
  }

  const transmittance: number = Math.exp(-extinction * distance);
  const [r, gr, b, a]: readonly [number, number, number, number] = props.color;
  if (u.uMatte === 1)
    return [
      r * transmittance + a * inscatter.x,
      gr * transmittance + a * inscatter.y,
      b * transmittance + a * inscatter.z,
      a,
    ];
  return [
    r * transmittance + inscatter.x,
    gr * transmittance + inscatter.y,
    b * transmittance + inscatter.z,
    1 - (1 - a) * transmittance,
  ];
}

/**
 * A panel's projected solid angle from `x`, as the program's `panel` sums it
 * over the four edges: zero behind the panel's front.
 */
function panel(
  x: THREE.Vector3,
  centre: THREE.Vector3,
  across: THREE.Vector3,
  up: THREE.Vector3,
  front: THREE.Vector3,
): number {
  if (x.clone().sub(centre).dot(front) <= 0) return 0;
  const normal: THREE.Vector3 = centre.clone().sub(x).normalize();
  const corners: THREE.Vector3[] = [
    centre.clone().sub(across).sub(up),
    centre.clone().add(across).sub(up),
    centre.clone().add(across).add(up),
    centre.clone().sub(across).add(up),
  ];
  let sum: number = 0;
  for (let k: number = 0; k < 4; ++k) {
    const a: THREE.Vector3 = corners[k]!.clone().sub(x);
    const b: THREE.Vector3 = corners[(k + 1) % 4]!.clone().sub(x);
    const c: THREE.Vector3 = a.clone().cross(b);
    const sine: number = c.length();
    if (sine > 0) sum += (Math.atan2(sine, a.dot(b)) * c.dot(normal)) / sine;
  }
  return Math.abs(sum) * 0.5;
}
