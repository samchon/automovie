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
 *
 * @evidence contracts/common.md#principled-implementation An integer test and a closed interval test on one number are the whole rule; because one strand is rooted per counted lash, the strand count equals the quantity the source counts. `Number.isInteger` refuses NaN, infinities and fractions before the comparison.
 * @evidence contracts/common.md#clear-and-simple-design One guard owning the one bound, called by the eye input admission, so no second copy of the limit exists and the function has no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ceiling is a published anatomical count and not a value chosen for a fixture, a photograph or a test.
 * @evidence contracts/common.md#meaningful-documentation The comment states the interval, the source and what it counts, why the count equals the strand count, why the lower end is not enforced, that the limit is not a rendering budget and how a refusal reports.
 * @evidence contracts/anatomy.md#anatomical-source The 160 is the upper end of the counts Aumond and Bitton (2018) report for one upper eyelid (90 to 160 in five to six rows), as stated in the text of that review; the review pools clinical descriptions and does not restrict by sex or age, and the ceiling is applied to every eye. The review counts lashes per lid and gives no per-row density, so the limit is applied to the lid total only. The value is a measured range end and not a fitted or conventional one.
 * @evidence contracts/anatomy.md#permitted-range Counts from one strand up to the reported anatomical total of one upper lid are admitted and every other value refuses, at and beyond the bound alike; it is a single-value test, so the combination with lash length or radius is judged by the lash profile admission, and no dependent quantity moves this bound.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function validates a count and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function bounds one input and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it bounds the population that the eye builder emits one strand per lash from.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The value is a dimensionless count.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts and defines no input; the count it tests is a named anatomical quantity of the lid.
 */
export function assertPortraitUpperLashCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 160)
    throw new Error(
      `An upper lid carries from 1 to 160 lashes as an integer; ${count} requested.`,
    );
}
