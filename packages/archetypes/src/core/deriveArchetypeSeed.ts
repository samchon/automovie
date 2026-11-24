import { deriveAutoMovieSeed } from "@automovie/engine";

/**
 * The seed of a part drawn under a parent seed: an environment occurrence under
 * its recipe, a building leaf under its occurrence, a furnishing piece under
 * its kit.
 *
 * It is the top 52 bits of the 64-bit FNV-1a hash that `deriveAutoMovieSeed`
 * takes of the parent seed's decimal text and the part's ids, read as an
 * integer. Fifty-two bits is the widest integer a double holds exactly below
 * `Number.MAX_SAFE_INTEGER` in whole hexadecimal digits, so the derived seed is
 * itself a valid archetype seed and is drawn from as any authored one is.
 *
 * @param seed The parent seed.
 * @param ids Stable ids of the part, outermost first; they name the part, never
 *   an ordinal, so adding a sibling leaves every other part's seed unchanged.
 * @returns The part's seed, an integer in [0, 2^52).
 */
export function deriveArchetypeSeed(seed: number, ...ids: string[]): number {
  return Number.parseInt(
    deriveAutoMovieSeed(String(seed), ...ids).slice(0, 13),
    16,
  );
}
