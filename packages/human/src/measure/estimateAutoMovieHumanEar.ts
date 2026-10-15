import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Adult ear length by age, millimetres: the left-ear means of 631 Korean adults on facial 3D CT for the 20-29 and the 70-and-over decades (Cho et al. 2025, J Korean Med Sci 40(22):e107), men 63.9 and 69.5, women 60.1 and 68.1, placed at 25 and 75 years. Every length of the auricle correlated positively with age while breadth and protrusion stayed nearly constant. Ear height was identical to North American whites in 99.7 percent of the comparisons of an international anthropometric study (Farkas et al. 2005, J Craniofac Surg 16(4):615-646), so one curve serves every population. Grade: measured.
 */
const ADULT_LENGTH: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: { ages: [25, 75], values: [63.9, 69.5] },
  female: { ages: [25, 75], values: [60.1, 68.1] },
};

/**
 * Adult ear breadth (otobasion superius to the most posterior point of the helix) and protrusion of the helix from the scalp at the tragal level, millimetres, the same survey's means with both sides averaged: breadth 29.05 and 27.4, protrusion 19.5 and 17.3, men and women. Grade: measured.
 */
const ADULT: Record<AutoMovieHumanSex, { breadth: number; protrusion: number }> = {
  male: { breadth: 29.05, protrusion: 19.5 },
  female: { breadth: 27.4, protrusion: 17.3 },
};

/**
 * Child ear length over the young adult's, by age. At term the ear is 36 mm long and 21 mm broad (104 Singaporean newborns, Lian et al. 2008, Ann Acad Med Singap 37(5):383-389), 0.58 of the young adult length and 0.59 of the adult breadth of the next study. Among 1,590 North American children (Farkas et al. 1992, Cleft Palate Craniofac J 29(4):324-329) length reaches 76.4 percent of its 18-year size at 1 year and 86.6 at 5, and matures at 13 years in boys and 12 in girls about 1.2 mm, 0.02, short of the 18-year size. Grade: measured, birth fractions derived.
 */
const CHILD_LENGTH: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: { ages: [0, 1, 5, 13, 18], values: [0.58, 0.764, 0.866, 0.98, 1] },
  female: { ages: [0, 1, 5, 12, 18], values: [0.58, 0.764, 0.866, 0.98, 1] },
};

/**
 * Child ear breadth over the adult's, by age, from the same two studies: 0.59 at term, 93.5 percent at 1 year, 96.7 at 5, mature at 7 years in boys and 6 in girls (Farkas et al. 1992). Protrusion follows it, because the helix-to-mastoid distances at both levels are almost complete at 6 years like breadth (1,552 Turkish children, Kalcioglu et al. 2003, Int J Pediatr Otorhinolaryngol 67(11):1169-1177). Grade: measured, birth fraction and protrusion derived.
 */
const CHILD_BREADTH: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: { ages: [0, 1, 5, 7], values: [0.59, 0.935, 0.967, 1] },
  female: { ages: [0, 1, 5, 6], values: [0.59, 0.935, 0.967, 1] },
};

/**
 * The auricle of one person, the same on both sides.
 *
 * Adults take the survey's sex means, length rising with age from 25 to 75 years and held beyond; a child takes the young adult values times the growth fractions for its age, so the ear is relatively large in infancy and its breadth matures years before its length. Stature and population are not read: no relation of ear size to stature was read, and ear height barely differs between populations.
 *
 * @param context Resolved person
 * @returns One ear's measurements
 */
export function estimateAutoMovieHumanEar(
  context: IAutoMovieHumanConversionContext,
): IAutoMovieHumanIdentity.IEar {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const adult: { breadth: number; protrusion: number } = ADULT[sex];
  const breadth: number = interpolateAutoMovieHumanGrowthCurve(
    CHILD_BREADTH[sex],
    age,
  );
  return {
    earLength:
      interpolateAutoMovieHumanGrowthCurve(ADULT_LENGTH[sex], age) *
      interpolateAutoMovieHumanGrowthCurve(CHILD_LENGTH[sex], age),
    earBreadth: adult.breadth * breadth,
    earProtrusion: adult.protrusion * breadth,
  };
}
