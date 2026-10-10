/**
 * Refuse an upper-lash count that no living upper lid can carry, before an eye
 * allocates its strands.
 *
 * The count must be an integer from 1 to 160. Aumond and Bitton (J Optom
 * 2018;11:210-222), a review of eyelash follicle features whose text was read,
 * give 90 to 160 lashes on one upper lid, spread over five to six rows. The
 * eye builder roots exactly one strand at each of its stations along the lid
 * margin, so the strand count is the lash count the review counts, and a count
 * above 160 exceeds the anatomical total of the whole lid. The lower end is a
 * positive count only, because the review's 90 describes a typical lid while a
 * sparse or partly absent lash line is a living lid that fewer strands
 * express. The ceiling is a population limit and not a rendering budget; a
 * caller wanting fewer, thicker strands lowers the count and raises the
 * profile radius. A refusal names the requested count and leaves it unchanged.
 */
export function assertPortraitUpperLashCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 160)
    throw new Error(
      `An upper lid carries from 1 to 160 lashes as an integer; ${count} requested.`,
    );
}
