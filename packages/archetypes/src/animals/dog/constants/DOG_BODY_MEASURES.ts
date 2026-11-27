import type { IDogBodyMeasures } from "../structures/IDogBodyMeasures";
import type { DogCohort } from "../typings/DogCohort";

/*
 * Table 1 cohort means, without the standard deviations being treated as
 * independent trait bands.
 */
export const DOG_BODY_MEASURES: Readonly<
  Record<DogCohort, Readonly<IDogBodyMeasures>>
> = {
  pet: {
    eyes: 4.45,
    snout: 9.45,
    ear: 8.79,
    chestWidth: 13.94,
    neck: 35.99,
    girth: 67.23,
    withers: 56.92,
    tailBase: 55.32,
    body: 61.85,
    tail: 35.71,
    upperFore: 20.04,
    lowerFore: 21.41,
    foreFoot: 13.56,
    foreCircumference: 9.91,
    upperHind: 30.51,
    lowerHind: 24.21,
    hindFoot: 21.23,
  },
  show: {
    eyes: 4.42,
    snout: 9.19,
    ear: 8.43,
    chestWidth: 12.29,
    neck: 37.41,
    girth: 62.56,
    withers: 56.85,
    tailBase: 54.03,
    body: 54.69,
    tail: 35.84,
    upperFore: 19.1,
    lowerFore: 20.93,
    foreFoot: 12.5,
    foreCircumference: 10.24,
    upperHind: 27.3,
    lowerHind: 23.6,
    hindFoot: 20.8,
  },
  sled: {
    eyes: 4.11,
    snout: 9.42,
    ear: 8.38,
    chestWidth: 12.65,
    neck: 36.42,
    girth: 64.85,
    withers: 60.22,
    tailBase: 58.37,
    body: 57.68,
    tail: 34.42,
    upperFore: 17.83,
    lowerFore: 21.29,
    foreFoot: 12.83,
    foreCircumference: 10.13,
    upperHind: 30.15,
    lowerHind: 22.0,
    hindFoot: 20.24,
  },
};
