/**
 * Deterministic seeded variation of continuous intent parameters. Every draw
 * is a pure hash of the film seed, a stable key (exchange name, phrase and
 * move position, parameter name) and nothing else, so the same seed always
 * reproduces bit-identical parameters and reordering or editing one exchange
 * never reshuffles another. Discrete screenplay events are never varied.
 */
export namespace BoutVariation {
  /** Film-level variation: the seed and a scale in [0, 1] applied to every domain's spread around its centre. */
  export interface IOptions {
    /** Film seed. */ readonly seed: string;
    /** Spread scale; 0 places every parameter at its domain centre. */ readonly scale?: number;
  }

  /** One uniform draw in [0, 1) for a key, scaled toward 0.5 by `scale`. */
  export function draw(seed: string, key: string, scale: number = 1): number {
    const unit: number = mulberry(hash(`${seed}\u0000${key}`));
    return 0.5 + (unit - 0.5) * Math.max(0, Math.min(1, scale));
  }

  /** A value inside a closed domain. */
  export function within(domain: readonly [number, number], unit: number): number {
    return domain[0] + (domain[1] - domain[0]) * unit;
  }

  /** 32-bit FNV-1a string hash. */
  function hash(text: string): number {
    let value: number = 0x811c9dc5;
    for (let index: number = 0; index < text.length; index++) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 0x01000193) >>> 0;
    }
    return value;
  }

  /** One Mulberry32 output for a 32-bit state, mapped to [0, 1). */
  function mulberry(state: number): number {
    let t: number = (state + 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
