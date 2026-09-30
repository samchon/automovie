import { TestValidator } from "@nestia/e2e";

import {
  faceSkinAlbedoNorms,
  faceSkinSiteNorms,
} from "../../../scripts/face-review/faceSkinNormGroups";
import type { IFaceSkinReading } from "../../../scripts/face-review/readFaceSkinReadings";
import { summarizeColourSample } from "../../../scripts/face-review/summarizeColourSample";
import { nclose, throwsError } from "../internal/predicates";

const reading = (
  ethnicity: string,
  sex: string | null,
  subject: string,
  site: number,
  value: number,
): IFaceSkinReading => ({
  ethnicity,
  sex,
  subject,
  site,
  rgb: [value, value, value],
});
const READINGS: IFaceSkinReading[] = [
  reading("CA", "F", "a", 2, 0.4),
  reading("CA", "F", "a", 2, 0.6),
  reading("CA", "F", "a", 6, 0.25),
  reading("CA", "M", "b", 2, 0.3),
  reading("CA", "M", "b", 6, 0.33),
  reading("CA", null, "c", 2, 0.1),
  reading("JP", "F", "d", 4, 0.9),
  reading("JP", "F", "e", 2, 0.2),
  reading("JP", "F", "e", 9, 0.1),
];

/**
 * The norm groups pool per subject and per ethnic group.
 *
 * Scenarios:
 * 1. Cheek albedo: subject a's two readings average to 0.5 first (counted
 *    once). Group CA has 3 subjects (0.5, 0.3, 0.1): mean 0.3, deviation 0.2; a
 *    sex with one subject reports a mean and `null` spread; a subject with no
 *    recorded sex is in the group and in neither sex. JP has only e (subject d
 *    has no cheek reading).
 * 2. Site ratios are paired within the subject: the forehead over the cheek is
 *    0.25 / 0.5 = 0.5 for a and 0.33 / 0.3 = 1.1 for b, so CA's forehead has
 *    mean 0.8 and deviation 0.4243 over 2 subjects; the sexes have one each.
 *    A subject without a cheek (d) contributes nothing, a site not asked for
 *    (code 9) is ignored, and a group with no asked site is absent.
 * 3. A colour summary of no subject refuses, and one subject has a mean without
 *    a spread.
 */
export const test_subject_face_skin_norm_groups = (): void => {
  const albedo = faceSkinAlbedoNorms(READINGS);
  TestValidator.equals("groups", Object.keys(albedo), ["CA", "JP"]);
  TestValidator.equals("keys", Object.keys(albedo.CA!), ["F", "M", "all"]);
  TestValidator.predicate(
    "pooled",
    albedo.CA!.all!.subjects === 3 &&
      nclose(albedo.CA!.all!.mean[0], 0.3, 1e-12) &&
      nclose(albedo.CA!.all!.sd[0]!, 0.2, 1e-12) &&
      albedo.CA!.F!.subjects === 1 &&
      albedo.CA!.F!.sd[0] === null &&
      nclose(albedo.CA!.F!.mean[0], 0.5, 1e-12) &&
      albedo.JP!.all!.subjects === 1,
  );
  const sites = faceSkinSiteNorms(READINGS, { 6: "forehead" });
  TestValidator.equals("site groups", Object.keys(sites), ["CA"]);
  const forehead = sites.CA!.forehead!;
  TestValidator.predicate(
    "paired ratio",
    forehead.all!.subjects === 2 &&
      nclose(forehead.all!.mean[0], 0.8, 1e-12) &&
      nclose(forehead.all!.sd[0]!, 0.4243, 1e-12) &&
      nclose(forehead.F!.mean[0], 0.5, 1e-12) &&
      nclose(forehead.M!.mean[0], 1.1, 1e-12) &&
      forehead.M!.sd[0] === null,
  );
  TestValidator.predicate(
    "summary bounds",
    throwsError(() => summarizeColourSample([]), "needs a subject") &&
      summarizeColourSample([[0.1, 0.2, 0.3]]).sd[1] === null,
  );
};
