/*
 * The PCG3D integer hash of three unsigned 32-bit words (Jarzynski and Olano
 * 2020, "Hash functions for GPU rendering", JCGT 9(3), section 4).
 *
 * Each word steps a linear congruential generator (multiplier 1664525,
 * increment 1013904223, Numerical Recipes), the words are mixed into each other
 * by products twice, with a shift-xor of the high halves between. Every
 * operation is exact modulo 2³², so this function and the GLSL `uvec3` form the
 * renderer compiles return the same words. Inputs are read as unsigned 32-bit
 * integers (`x >>> 0`), so a negative lattice coordinate hashes as its two's
 * complement, exactly as GLSL's `uint(int)` conversion keeps the bit pattern.
 * Returns: Three words within [0, 2³²).
 */
export function hashPcg3d(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  let a: number = (Math.imul(x >>> 0, 1664525) + 1013904223) >>> 0;
  let b: number = (Math.imul(y >>> 0, 1664525) + 1013904223) >>> 0;
  let c: number = (Math.imul(z >>> 0, 1664525) + 1013904223) >>> 0;
  a = (a + Math.imul(b, c)) >>> 0;
  b = (b + Math.imul(c, a)) >>> 0;
  c = (c + Math.imul(a, b)) >>> 0;
  a = (a ^ (a >>> 16)) >>> 0;
  b = (b ^ (b >>> 16)) >>> 0;
  c = (c ^ (c >>> 16)) >>> 0;
  a = (a + Math.imul(b, c)) >>> 0;
  b = (b + Math.imul(c, a)) >>> 0;
  c = (c + Math.imul(a, b)) >>> 0;
  return [a, b, c];
}
