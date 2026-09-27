import type { IAutoMovieHumanBodySimplePosture } from "../structures/IAutoMovieHumanBodySimplePosture";

/**
 * The standing posture a body takes with age.
 *
 * - **Kyphosis.** A young adult's thoracic Cobb angle averages 20 to 29
 *   degrees; after the fourth decade it grows, and adults of 65 and older
 *   average 35 to 38 degrees ([Koelé et al.
 *   2020](https://doi.org/10.3389/fendo.2020.00005), a narrative review).
 *   The source body stands as a young adult, 25 degrees; a body of 72, an
 *   authored stand-in for those older cohorts, stands at their 36.5, the
 *   growth linear from 40 and held past 72. Women's grows faster ([Fon et al.
 *   1980](https://doi.org/10.2214/ajr.134.5.979)), but without a sex split
 *   of the older mean both sexes take the same.
 * - **Carriage.** The added kyphosis is flexion of the two thoracic joints,
 *   half each, and the neck extends by as much, within its range, so the
 *   head keeps its orientation and the gaze stays level while the head is
 *   carried forward.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Holds the age posture the simple tier derives, as numbers a user can audit against their sources.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Fixes the kyphosis by sex and age, the thoracic joints' shares and the compensating neck.
 */
export const HUMAN_BODY_SIMPLE_POSTURE: IAutoMovieHumanBodySimplePosture = {
  kyphosis: {
    youngDegrees: 25,
    oldDegrees: [
      [-1, 36.5],
      [1, 36.5],
    ],
    ageYears: [
      [40, 0],
      [72, 1],
    ],
  },
  thoracic: [
    ["chest", 0.5],
    ["upperChest", 0.5],
  ],
  compensation: "neck",
};
