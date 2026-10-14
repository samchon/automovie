import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The plain default underwear a body document may wear.
 *
 * The builder cuts the final posed skin inside its rest coverage and lifts
 * the resulting independent fabric along the posed normals. Source skin
 * remains intact for anatomy and contact. This blocking costume follows
 * shape and pose without cloth dynamics or crease fitting.
 * Actual source topology, normals and final mesh admission remain applicable. The garment's
 * regions are rules on the body's joint landmarks and named skin points,
 * never vertex lists for one person or one basis (`HUMAN_BODY_UNDERWEAR`).
 *
 * @evidence contracts/common.md#principled-implementation A closed style choice and optional linear fabric colour select landmark-based coverage on the shaped rest body.
 * @evidence contracts/common.md#clear-and-simple-design The document chooses costume appearance while the separate table owns coverage rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-person garment vertices or raw clothing mesh are carried by this authoring record.
 * @evidence contracts/common.md#meaningful-documentation The prose states intact source-skin ownership, final normal lift and the absence of cloth dynamics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The underwear authoring choice is a schema and selects no executable traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The underwear authoring choice defines no cache or request-level reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The underwear authoring choice declares no runtime resource owner.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwear {
  /**
   * `boxer-briefs`: fitted shorts from below the navel to a third of the
   * way down the thigh. `bra-and-briefs`: a sports bra with shoulder straps
   * and briefs cut high over the hip.
   */
  style: "boxer-briefs" | "bra-and-briefs";

  /** Optional linear RGB, each channel in [0,1]; omission is the table's colour. */
  color?: IAutoMovieHumanBodyLinearRgb;
}
