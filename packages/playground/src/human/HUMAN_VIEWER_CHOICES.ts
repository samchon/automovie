import {
  AutoMovieHumanActionUnit,
  AutoMovieHumanHairColor,
  AutoMovieHumanIrisColor,
  AutoMovieHumanPopulation,
  AutoMovieHumanSex,
  IAutoMovieHumanAppearance,
} from "@automovie/human";

/** Keys of a record the compiler checks to hold every member of a union. */
const all = <T extends string>(record: Record<T, true>): T[] =>
  Object.keys(record) as T[];

/**
 * The closed sets the Human page offers, one list per union of `@automovie/human`.
 *
 * Each list is the key set of a record typed `Record<Union, true>`, so the compiler refuses a list that misses or invents a member when the package's union changes. Underwear is absent: the page offers its style as combinations of a lower and an upper garment, never `none` for both.
 *
 * @author Samchon
 */
export const HUMAN_VIEWER_CHOICES: {
  sex: AutoMovieHumanSex[];
  population: AutoMovieHumanPopulation[];
  iris: AutoMovieHumanIrisColor[];
  hairColor: AutoMovieHumanHairColor[];
  hairStyle: IAutoMovieHumanAppearance.IHair["style"][];
  curl: IAutoMovieHumanAppearance.IHair["curl"][];
  hairline: IAutoMovieHumanAppearance.IHair["hairline"][];
  actionUnits: AutoMovieHumanActionUnit[];
} = {
  sex: all<AutoMovieHumanSex>({ female: true, male: true }),
  population: all<AutoMovieHumanPopulation>({
    european: true,
    eastAsian: true,
    african: true,
  }),
  iris: all<AutoMovieHumanIrisColor>({
    blue: true,
    gray: true,
    green: true,
    hazel: true,
    lightBrown: true,
    brown: true,
    darkBrown: true,
  }),
  hairColor: all<AutoMovieHumanHairColor>({
    black: true,
    darkBrown: true,
    brown: true,
    lightBrown: true,
    blond: true,
    auburn: true,
    red: true,
    gray: true,
    white: true,
  }),
  hairStyle: all<IAutoMovieHumanAppearance.IHair["style"]>({
    crop: true,
    short: true,
    bob: true,
  }),
  curl: all<IAutoMovieHumanAppearance.IHair["curl"]>({
    I: true,
    II: true,
    III: true,
    IV: true,
    V: true,
    VI: true,
    VII: true,
    VIII: true,
  }),
  hairline: all<IAutoMovieHumanAppearance.IHair["hairline"]>({
    round: true,
    mShaped: true,
    rectangular: true,
    bellShaped: true,
    triangular: true,
  }),
  actionUnits: all<AutoMovieHumanActionUnit>({
    innerBrowRaiser: true,
    outerBrowRaiser: true,
    browLowerer: true,
    upperLidRaiser: true,
    cheekRaiser: true,
    lidTightener: true,
    noseWrinkler: true,
    upperLipRaiser: true,
    nasolabialDeepener: true,
    lipCornerPuller: true,
    sharpLipPuller: true,
    dimpler: true,
    lipCornerDepressor: true,
    lowerLipDepressor: true,
    chinRaiser: true,
    lipPucker: true,
    lipStretcher: true,
    neckTightener: true,
    lipFunneler: true,
    lipTightener: true,
    lipPressor: true,
    lipsPart: true,
    jawDrop: true,
    mouthStretch: true,
    lipSuck: true,
    nostrilDilator: true,
    nostrilCompressor: true,
    lidDroop: true,
    eyesClosed: true,
  }),
};
