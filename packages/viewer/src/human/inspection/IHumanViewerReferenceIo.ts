/**
 * What the reference resolver may ask of the local reference folder.
 *
 * @evidence contracts/common.md#principled-implementation Reference enumeration and parsed metadata lookup are borrowed local reads with explicit missing-resource behavior.
 * @evidence contracts/common.md#clear-and-simple-design Two read operations cover image names and poses, landmarks or manifest metadata without owning a filesystem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported resource discriminants name real reference formats; the port provides no image write or geometry-fitting operation.
 * @evidence contracts/common.md#meaningful-documentation An absent folder lists no names, and absent JSON remains undefined instead of a fabricated reference record.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Reference enumeration and parsed metadata lookup are borrowed local reads with explicit missing-resource behavior.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Supported resource discriminants name real reference formats; the port provides no image write or geometry-fitting operation.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceIo {
  /**
   * File names in `references` (`""`) or `references/body` (`"body"`), empty when absent.
   *
   * @evidence contracts/common.md#principled-implementation The host enumerates actual local photograph names in the selected supported reference folder.
   * @evidence contracts/common.md#clear-and-simple-design One read operation owns folder lookup while the resolver owns matching.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent directories do not create a guessed reference photograph.
   * @evidence contracts/common.md#meaningful-documentation An absent folder returns an empty list; folder is references or references/body.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The host enumerates actual local photograph names in the selected supported reference folder.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach An absent folder returns an empty list; folder is references or references/body.
   */
  list(folder: "" | "body"): string[];

  /**
   * A parsed JSON resource, or undefined when it is absent.
   *
   * @evidence contracts/common.md#principled-implementation The host supplies the actual parsed poses, landmarks or manifest resource.
   * @evidence contracts/common.md#clear-and-simple-design The resource discriminator is kept at the read boundary rather than repeated path logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing metadata remains absent instead of becoming invented acquisition evidence.
   * @evidence contracts/common.md#meaningful-documentation Undefined means the selected JSON resource is not available.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The host supplies the actual parsed poses, landmarks or manifest resource.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Undefined means the selected JSON resource is not available.
   */
  readJson(name: "poses" | "landmarks" | "manifest"): unknown;
}
