/**
 * Deterministic integer hashing and lattice value noise for procedural
 * appearance fields: iris stroma, hair strand images and skin detail.
 *
 * Every random choice in Human appearance comes from {@link hash} of
 * integer keys (a stream seed and lattice or element indices), never from
 * `Math.random`, vertex indices or part names, so a field is a pure
 * function of its keys and its continuous coordinates. The integer mixer is
 * Chris Wellons' "lowbias32" (hash-prospector, 2020), built only from
 * 32-bit `Math.imul`, xor and shifts, which ECMAScript defines exactly, so
 * hashes are bit-identical on every engine. Noise interpolation then uses
 * ordinary binary64 arithmetic (see `docs/techniques/determinism.md` for its
 * limits).
 *
 * Value noise (random values on an integer lattice, blended with the
 * quintic fade `6t^5 - 15t^4 + 10t^3` of Perlin 2002, whose first and second
 * derivatives vanish at lattice points) is chosen over gradient noise
 * because the fields here only need band-limited variation of a known
 * period, not isotropic gradients; its output range is exactly the lattice
 * value range `[0, 1)`.
 */
export namespace AutoMovieHumanAppearanceNoise {
  /**
   * Uniform value in `[0, 1)` from integer keys.
   *
   * Keys are folded in order, so `hash(a, b)` and `hash(b, a)` differ.
   * Non-integer keys are truncated toward zero by the `| 0` conversion;
   * callers pass lattice indices and stream seeds.
   *
   * @param keys Stream seed followed by lattice or element indices
   * @returns Pseudo-random value in `[0, 1)` with 32-bit resolution
   */
  export function hash(...keys: number[]): number {
    // Golden-ratio offset so an all-zero key list does not hash to zero.
    let h: number = 0x9e3779b9;
    for (const key of keys) h = mix((h ^ (key | 0)) >>> 0);
    return h / 4294967296;
  }

  /**
   * One-dimensional value noise that repeats every `period` lattice cells,
   * used around a circle (iris angle) or along a closed contour.
   *
   * @param seed Stream seed separating independent fields
   * @param x Coordinate in lattice cells; any real value
   * @param period Positive integer period in cells
   * @returns Smooth value in `[0, 1)`
   */
  export function periodic1(seed: number, x: number, period: number): number {
    const i: number = Math.floor(x);
    const t: number = fade(x - i);
    const a: number = hash(seed, wrap(i, period));
    const b: number = hash(seed, wrap(i + 1, period));
    return a + (b - a) * t;
  }

  /**
   * Two-dimensional value noise, optionally periodic in `x`.
   *
   * @param seed Stream seed separating independent fields
   * @param x First coordinate in lattice cells
   * @param y Second coordinate in lattice cells
   * @param period Positive integer period of `x` in cells, or zero for none
   * @returns Smooth value in `[0, 1)`
   */
  export function value2(
    seed: number,
    x: number,
    y: number,
    period: number,
  ): number {
    const i: number = Math.floor(x);
    const j: number = Math.floor(y);
    const tx: number = fade(x - i);
    const ty: number = fade(y - j);

    // Lattice corners; the x index wraps when a period is requested so the
    // field closes seamlessly around an angle.
    const i0: number = period > 0 ? wrap(i, period) : i;
    const i1: number = period > 0 ? wrap(i + 1, period) : i + 1;
    const a: number = hash(seed, i0, j);
    const b: number = hash(seed, i1, j);
    const c: number = hash(seed, i0, j + 1);
    const d: number = hash(seed, i1, j + 1);

    const lower: number = a + (b - a) * tx;
    const upper: number = c + (d - c) * tx;
    return lower + (upper - lower) * ty;
  }

  /**
   * Two-dimensional value noise that repeats every `period` cells in both
   * coordinates, for images that tile a surface.
   *
   * @param seed Stream seed separating independent fields
   * @param x First coordinate in lattice cells
   * @param y Second coordinate in lattice cells
   * @param period Positive integer period of both coordinates in cells
   * @returns Smooth value in `[0, 1)`
   */
  export function tile2(
    seed: number,
    x: number,
    y: number,
    period: number,
  ): number {
    const i: number = Math.floor(x);
    const j: number = Math.floor(y);
    const tx: number = fade(x - i);
    const ty: number = fade(y - j);
    const i0: number = wrap(i, period);
    const i1: number = wrap(i + 1, period);
    const j0: number = wrap(j, period);
    const j1: number = wrap(j + 1, period);
    const a: number = hash(seed, i0, j0);
    const b: number = hash(seed, i1, j0);
    const c: number = hash(seed, i0, j1);
    const d: number = hash(seed, i1, j1);
    const lower: number = a + (b - a) * tx;
    const upper: number = c + (d - c) * tx;
    return lower + (upper - lower) * ty;
  }

  /**
   * Three-dimensional value noise, for solid fields evaluated at surface
   * positions so that a field has no chart seams.
   *
   * @param seed Stream seed separating independent fields
   * @param x First coordinate in lattice cells
   * @param y Second coordinate in lattice cells
   * @param z Third coordinate in lattice cells
   * @returns Smooth value in `[0, 1)`
   */
  export function value3(
    seed: number,
    x: number,
    y: number,
    z: number,
  ): number {
    const i: number = Math.floor(x);
    const j: number = Math.floor(y);
    const k: number = Math.floor(z);
    const tx: number = fade(x - i);
    const ty: number = fade(y - j);
    const tz: number = fade(z - k);
    const layer: (kk: number) => number = (kk: number): number => {
      const a: number = hash(seed, i, j, kk);
      const b: number = hash(seed, i + 1, j, kk);
      const c: number = hash(seed, i, j + 1, kk);
      const d: number = hash(seed, i + 1, j + 1, kk);
      const lower: number = a + (b - a) * tx;
      const upper: number = c + (d - c) * tx;
      return lower + (upper - lower) * ty;
    };
    const near: number = layer(k);
    return near + (layer(k + 1) - near) * tz;
  }

  /**
   * Fractal sum of {@link value3} octaves, each doubling frequency and
   * halving amplitude, normalised back to `[0, 1)`.
   *
   * @param seed Stream seed; each octave uses `seed + octave`
   * @param x First coordinate in base lattice cells
   * @param y Second coordinate in base lattice cells
   * @param z Third coordinate in base lattice cells
   * @param octaves Number of octaves, at least one
   * @returns Smooth value in `[0, 1)`
   */
  export function fractal3(
    seed: number,
    x: number,
    y: number,
    z: number,
    octaves: number,
  ): number {
    let sum: number = 0;
    let weight: number = 0;
    let amplitude: number = 1;
    let frequency: number = 1;
    for (let o: number = 0; o < octaves; ++o) {
      sum +=
        amplitude *
        value3(seed + o, x * frequency, y * frequency, z * frequency);
      weight += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / weight;
  }

  /**
   * Fractal sum of {@link value2} octaves, each doubling frequency and
   * halving amplitude, normalised back to `[0, 1)`.
   *
   * @param seed Stream seed; each octave uses `seed + octave`
   * @param x First coordinate in base lattice cells
   * @param y Second coordinate in base lattice cells
   * @param period Base integer period of `x`, doubled per octave, or zero
   * @param octaves Number of octaves, at least one
   * @returns Smooth value in `[0, 1)`
   */
  export function fractal2(
    seed: number,
    x: number,
    y: number,
    period: number,
    octaves: number,
  ): number {
    let sum: number = 0;
    let weight: number = 0;
    let amplitude: number = 1;
    let frequency: number = 1;
    for (let o: number = 0; o < octaves; ++o) {
      sum +=
        amplitude *
        value2(seed + o, x * frequency, y * frequency, period * frequency);
      weight += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / weight;
  }

  /**
   * Hermite step from 0 at `edge0` to 1 at `edge1`, clamped outside,
   * as GLSL `smoothstep`.
   *
   * @param edge0 Input where the result starts rising
   * @param edge1 Input where the result reaches one; may be below `edge0`
   * @param x Input
   * @returns Value in `[0, 1]`
   */
  export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t: number = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
}

/**
 * Lowbias32 integer finaliser (Wellons, hash-prospector): two
 * multiply-xorshift rounds with bias about 0.17 on the avalanche measure.
 *
 * @param x Unsigned 32-bit input
 * @returns Unsigned 32-bit output
 */
function mix(x: number): number {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/**
 * Quintic fade of Perlin's improved noise.
 *
 * @param t Fraction in `[0, 1]`
 * @returns Eased fraction with zero first and second derivatives at the ends
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Non-negative remainder.
 *
 * @param i Integer
 * @param n Positive integer modulus
 * @returns `i mod n` in `[0, n)`
 */
function wrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}
