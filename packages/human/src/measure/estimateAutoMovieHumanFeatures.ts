import { AutoMovieHumanPopulation } from "../structures/AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/** The face's feature measurements, the keys of {@link IAutoMovieHumanIdentity.IFeatures}. */
type Feature = keyof IAutoMovieHumanIdentity.IFeatures;

/**
 * Adult means of the eyes, nose and mouth by population and sex, millimetres, `[male, female]`. Grade: measured; protocols differ between sources (3D surface, 3D photographs, caliper), so compare within a source before across.
 *
 * - European: the 3D Facial Norms adults of European ancestry aged 20 to 40 (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197), with the fissure height of the Caucasian group of Gao et al. (2025, 147 young adults in Cologne, 3D photographs).
 * - East Asian: the Chinese group of Gao et al. 2025 for the eyes; nose width, protrusion and mouth width from Chinese workers by caliper (Du et al. 2008, Ann Occup Hyg 52(8):773-782). Du measures nasal height from sellion, not nasion, and no lip heights, so those keep the European means.
 * - African: Kenyan adults by caliper (Virdi et al. 2019) for the eyes' widths, nose width and height, mouth width and both vermilion heights. No fissure height was read, so it keeps the European mean; protrusion is the European mean less the 2.3 mm by which African-American noses project less than the Caucasian baseline at equal stature in the NIOSH regression (Zhuang et al. 2010, Ann Occup Hyg 54(4):391-402).
 */
const ADULT: Record<
  AutoMovieHumanPopulation,
  Record<Feature, [number, number]>
> = {
  european: {
    intercanthalWidth: [32.7, 31.3],
    palpebralFissureLength: [28.8, 27.8],
    palpebralFissureHeight: [11.61, 11.63],
    noseWidth: [36.1, 32.6],
    noseHeight: [56.6, 54.7],
    noseProtrusion: [21.0, 20.2],
    mouthWidth: [50.9, 48.1],
    upperVermilionHeight: [7.5, 7.4],
    lowerVermilionHeight: [8.7, 8.5],
  },
  eastAsian: {
    intercanthalWidth: [37.28, 36.06],
    palpebralFissureLength: [30.24, 28.63],
    palpebralFissureHeight: [10.73, 11.52],
    noseWidth: [39.2, 36.1],
    noseHeight: [56.6, 54.7],
    noseProtrusion: [18.9, 17.7],
    mouthWidth: [52.2, 49.8],
    upperVermilionHeight: [7.5, 7.4],
    lowerVermilionHeight: [8.7, 8.5],
  },
  african: {
    intercanthalWidth: [32.2, 32.1],
    palpebralFissureLength: [34.0, 33.7],
    palpebralFissureHeight: [11.61, 11.63],
    noseWidth: [43.2, 40.7],
    noseHeight: [51.0, 47.6],
    noseProtrusion: [18.7, 17.9],
    mouthWidth: [55.9, 52.0],
    upperVermilionHeight: [13.7, 13.4],
    lowerVermilionHeight: [13.8, 13.6],
  },
};

/**
 * Each feature at an age over its young adult size, from the 3D Facial Norms age-group means (Weinberg et al. 2016) at 3 to 4 years and, where published, 10 to 11, over the 20-to-40 means; held at one from 20. Fissure height has no growth means and follows fissure length; the vermilion heights' girls' means were not read and follow the boys'. Grade: measured.
 */
const GROWTH: Record<
  Feature,
  Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>
> = {
  intercanthalWidth: {
    male: { ages: [3.5, 20], values: [27.9 / 32.7, 1] },
    female: { ages: [3.5, 20], values: [28.2 / 31.3, 1] },
  },
  palpebralFissureLength: {
    male: { ages: [3.5, 20], values: [23.8 / 28.8, 1] },
    female: { ages: [3.5, 20], values: [24.2 / 27.8, 1] },
  },
  palpebralFissureHeight: {
    male: { ages: [3.5, 20], values: [23.8 / 28.8, 1] },
    female: { ages: [3.5, 20], values: [24.2 / 27.8, 1] },
  },
  noseWidth: {
    male: { ages: [3.5, 10.5, 20], values: [27.2 / 36.1, 30.9 / 36.1, 1] },
    female: { ages: [3.5, 10.5, 20], values: [26.9 / 32.6, 30.8 / 32.6, 1] },
  },
  noseHeight: {
    male: { ages: [3.5, 20], values: [40.9 / 56.6, 1] },
    female: { ages: [3.5, 20], values: [40.7 / 54.7, 1] },
  },
  noseProtrusion: {
    male: { ages: [3.5, 20], values: [13.8 / 21.0, 1] },
    female: { ages: [3.5, 20], values: [14.1 / 20.2, 1] },
  },
  mouthWidth: {
    male: { ages: [3.5, 10.5, 20], values: [36.2 / 50.9, 42.9 / 50.9, 1] },
    female: { ages: [3.5, 10.5, 20], values: [34.3 / 48.1, 42.5 / 48.1, 1] },
  },
  upperVermilionHeight: {
    male: { ages: [3.5, 20], values: [6.7 / 7.5, 1] },
    female: { ages: [3.5, 20], values: [6.7 / 7.5, 1] },
  },
  lowerVermilionHeight: {
    male: { ages: [3.5, 20], values: [7.3 / 8.7, 1] },
    female: { ages: [3.5, 20], values: [7.3 / 8.7, 1] },
  },
};

/**
 * The eyes', nose's and mouth's measurements of one person.
 *
 * Each is the population's adult mean for the sex times its growth fraction for the age, times the face's own size factor: the same factor the converter applies to the face width for the person's stature against the median, and below 3.5 years the head height's growth, so an infant's features shrink with the face where no norm was read.
 *
 * @param context Resolved person
 * @param scale The face's size factor, from the head estimator
 * @returns The feature measurements
 */
export function estimateAutoMovieHumanFeatures(
  context: IAutoMovieHumanConversionContext,
  scale: number,
): IAutoMovieHumanIdentity.IFeatures {
  const index: number = context.sex === "male" ? 0 : 1;
  const value = (feature: Feature): number =>
    ADULT[context.population][feature][index] *
    interpolateAutoMovieHumanGrowthCurve(
      GROWTH[feature][context.sex],
      context.age,
    ) *
    scale;
  return {
    intercanthalWidth: value("intercanthalWidth"),
    palpebralFissureLength: value("palpebralFissureLength"),
    palpebralFissureHeight: value("palpebralFissureHeight"),
    noseWidth: value("noseWidth"),
    noseHeight: value("noseHeight"),
    noseProtrusion: value("noseProtrusion"),
    mouthWidth: value("mouthWidth"),
    upperVermilionHeight: value("upperVermilionHeight"),
    lowerVermilionHeight: value("lowerVermilionHeight"),
  };
}
