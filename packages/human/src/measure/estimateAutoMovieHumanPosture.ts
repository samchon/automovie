import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/** A curve for each sex. */
type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

/**
 * Ages the sagittal parameters are sampled at, years: the two child groups of Mac-Thiong, Labelle and Roussouly (2011, Eur Spine J 20(Suppl 5):586-590), 3 to 10 and 10 to 18 years, at their centres, and the five age groups of the Wakayama Spine Study (Asai et al. 2017, PLoS ONE 12(6):e0178697), under 50, the 50s, 60s and 70s and 80 and over, at 40, 55, 65, 75 and 85. Between 14 and 40 the values move on the straight line joining the oldest child group and the youngest adult group; beyond the ends they hold.
 */
const AGES: number[] = [6.5, 14, 40, 55, 65, 75, 85];

/**
 * Pelvic tilt, sacral slope and thoracic kyphosis, degrees, standing lateral radiographs with hips and knees extended. Children: means of 646 children reported by Mac-Thiong, Labelle and Roussouly (2011), sexes pooled (tilt 5.5 and 7.7, slope 38.2 and 39.1, kyphosis 42.0 and 45.8 at 3 to 10 and 10 to 18 years). Adults: the Wakayama Spine Study's community sample of 466 men and 995 women (Asai et al. 2017, Tables 2 and 3), kyphosis the Cobb angle from T2 to T12, sacral slope its pelvic incidence less its pelvic tilt. With age the pelvis tilts back (tilt 11.5 to 19.7 in men, 14.5 to 25.2 in women), the sacrum flattens and the thoracic curve deepens, most after 70. The adult sample is Japanese; no European sample with age groups was read, so every population takes it. Grade: measured.
 */
const SAGITTAL: Record<
  "pelvicTilt" | "sacralSlope" | "thoracicKyphosis",
  ISexCurve
> = {
  pelvicTilt: {
    male: { ages: AGES, values: [5.5, 7.7, 11.5, 14.4, 15.5, 16.0, 19.7] },
    female: { ages: AGES, values: [5.5, 7.7, 14.5, 15.8, 18.1, 23.0, 25.2] },
  },
  sacralSlope: {
    male: { ages: AGES, values: [38.2, 39.1, 34.5, 33.3, 32.8, 31.5, 28.4] },
    female: { ages: AGES, values: [38.2, 39.1, 36.5, 34.0, 32.5, 29.7, 26.4] },
  },
  thoracicKyphosis: {
    male: { ages: AGES, values: [42.0, 45.8, 33.5, 36.0, 37.8, 41.6, 40.3] },
    female: { ages: AGES, values: [42.0, 45.8, 33.1, 34.2, 36.2, 38.9, 44.2] },
  },
};

/**
 * Sagittal vertical axis, millimetres: the horizontal distance from the plumb line through the centre of the seventh cervical vertebral body to the posterior superior corner of the sacral plate, positive in front. Children: Cil et al. (2005, Spine 30(1):93-100) as reported by Mac-Thiong, Labelle and Roussouly (2011), +25, +7, -1 and -9 mm at 3 to 6, 7 to 9, 10 to 12 and 13 to 15 years; the young child stands with the neck ahead of the sacrum, the adolescent behind it. Adults: Asai et al. (2017, Table 2), men -11.0 under 50 rising to +39.1 at 80 and over, women -18.8 to +51.6; the old stand bent forward over the pelvis. Grade: measured.
 */
const SAGITTAL_VERTICAL_AXIS: ISexCurve = {
  male: {
    ages: [4.5, 8, 11, 14, 40, 55, 65, 75, 85],
    values: [25, 7, -1, -9, -11.0, 4.7, 8.2, 13.9, 39.1],
  },
  female: {
    ages: [4.5, 8, 11, 14, 40, 55, 65, 75, 85],
    values: [25, 7, -1, -9, -18.8, -8.2, 1.8, 24.2, 51.6],
  },
};

/**
 * Craniovertebral angle, degrees: the angle above the horizontal of the line from the seventh cervical spinous process to the tragus, photographed standing; a smaller angle is a head carried further forward. Zárate-Tejero et al. (2024, Appl Sci 14:8639) measured 61 men and 61 women aged 18 to 75 (mean 45.2): 47.46 in men and 50.07 in women, falling 1.6 degrees a decade after adjusting for sex. The angle is read at the person's age within 18 to 75 and held outside it, since no child or older sample was read. Grade: measured, then population-fitted.
 */
const CRANIOVERTEBRAL: Record<AutoMovieHumanSex, number> & {
  meanAge: number;
  perYear: number;
  ages: [number, number];
} = {
  male: 47.46,
  female: 50.07,
  meanAge: 45.16,
  perYear: -0.16,
  ages: [18, 75],
};

/**
 * The standing sagittal posture of a person of a sex and age: how the pelvis tilts, how deep the thoracic curve is, where the neck stands over the sacrum and how far forward the head is carried.
 *
 * Lumbar lordosis is not estimated: the skeleton solves it as the curve that stands the seventh cervical vertebra at the sagittal vertical axis over the sacrum, so the stated balance holds whatever the other angles. Below 3 years no standing radiographs were read; the youngest group's values hold, although the lumbar curve only forms when walking begins at 12 to 18 months (Gray 1918, "Anatomy of the Human Body").
 *
 * @param sex Sex whose norms are read
 * @param age Age in years
 * @returns The posture group of the identity
 */
export function estimateAutoMovieHumanPosture(
  sex: AutoMovieHumanSex,
  age: number,
): IAutoMovieHumanIdentity.IPosture {
  const read: (curve: ISexCurve) => number = (curve: ISexCurve): number =>
    interpolateAutoMovieHumanGrowthCurve(curve[sex], age);
  const cvaAge: number = Math.min(
    CRANIOVERTEBRAL.ages[1],
    Math.max(CRANIOVERTEBRAL.ages[0], age),
  );
  return {
    pelvicTilt: read(SAGITTAL.pelvicTilt),
    sacralSlope: read(SAGITTAL.sacralSlope),
    thoracicKyphosis: read(SAGITTAL.thoracicKyphosis),
    sagittalVerticalAxis: read(SAGITTAL_VERTICAL_AXIS),
    craniovertebralAngle:
      CRANIOVERTEBRAL[sex] +
      CRANIOVERTEBRAL.perYear * (cvaAge - CRANIOVERTEBRAL.meanAge),
  };
}
