import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Measures with no survey distribution to band them: the sex itself, the top
 * hip girth and the across back shoulder width, which no survey takes, the
 * relaxed upper arm girth, whose NHANES tables give means only, the
 * natural-waist breadth and depth, which no survey takes at that level, and
 * the chest depth, whose ANSUR II SD is not recorded yet
 * (`test_human_survey_trunk_breadths` prints it). Their place inside their
 * girth's box is `test_human_input_box_consistency`'s.
 */
type Unsurveyed =
  | "sex"
  | "highHipCircumference"
  | "acrossBackShoulderWidth"
  | "upperArmCircumference"
  | "chestDepth"
  | "waistBreadth"
  | "waistDepth";

/** One measure's survey distribution by sex: mean and SD, women then men, mm or percent. */
type Distribution = readonly [readonly [number, number], readonly [number, number]];

/**
 * Survey distributions of every defaulted anatomy measure, as the field
 * documentation of `IAutoMovieHumanBodyAnatomy` quotes them.
 */
const SURVEY: Record<Exclude<keyof IAutoMovieHumanBodyAnatomy, Unsurveyed>, Distribution> = {
  stature: [[1628.5, 64.2], [1756.2, 68.6]],
  chestCircumference: [[907.1, 63.5], [991.4, 69.1]],
  underbustCircumference: [[769.7, 51.0], [926.1, 65.5]],
  waistCircumference: [[725.5, 63.0], [839.9, 74.0]],
  hipCircumference: [[966.9, 60.2], [983.7, 62.2]],
  neckBaseCircumference: [[346.2, 16.3], [408.4, 20.5]],
  neckCircumference: [[329.8, 19.2], [397.6, 25.8]],
  bustPointWidth: [[184.8, 16.2], [215.9, 18.9]],
  backNeckToWaist: [[367.3, 25.0], [412.0, 23.2]],
  sideNeckToBustPoint: [[268.0, 22.3], [272.4, 18.1]],
  upperArmLength: [[311.2, 17.2], [335.2, 17.5]],
  forearmLength: [[241.3, 15.2], [267.9, 15.4]],
  elbowCircumference: [[238.3, 13.4], [277.1, 15.3]],
  forearmCircumference: [[237.6, 16.8], [282.4, 17.8]],
  wristCircumference: [[154.8, 7.8], [175.9, 9.0]],
  handCircumference: [[186.2, 8.5], [213.8, 9.7]],
  inseam: [[710.7, 43.1], [770.1, 44.7]],
  thighCircumference: [[580.3, 45.1], [596.5, 49.3]],
  sideNeckPointHeight: [[1396.5, 58.4], [1509.5, 61.6]],
  suprasternaleHeight: [[1330.3, 56.0], [1438.4, 59.3]],
  kneeCircumference: [[365.2, 23.3], [386.4, 22.1]],
  calfCircumference: [[373.3, 28.5], [392.3, 29.7]],
  biacromialBreadth: [[362.6, 17.4], [397.0, 18.0]],
  acromialHeight: [[1335.1, 58.1], [1440.7, 63.3]],
  cervicaleHeight: [[1395.7, 59.5], [1517.3, 63.3]],
  axillaHeight: [[1239.0, 55.8], [1329.1, 59.5]],
  chestBreadth: [[279.6, 19.7], [321.5, 25.5]],
  hipBreadth: [[353.8, 26.7], [345.7, 24.2]],
  buttockDepth: [[232.9, 24.3], [245.8, 26.5]],
  bideltoidBreadth: [[450.3, 28.7], [510.4, 32.5]],
  bicristalBreadth: [[273.3, 22.3], [275.4, 17.5]],
  elbowBreadth: [[61.9, 4.2], [72.3, 4.4]],
  wristBreadth: [[49.4, 3.3], [56.3, 3.2]],
  kneeBreadth: [[90.5, 6.0], [97.8, 5.4]],
  bimalleolarBreadth: [[64.4, 3.1], [72.8, 3.9]],
  ankleCircumference: [[215.7, 14.9], [229.3, 14.6]],
  heelBreadth: [[63.0, 4.8], [70.1, 5.3]],
  ballOfFootLength: [[182.1, 9.6], [200.9, 10.5]],
  glutealFurrowHeight: [[744.3, 43.0], [814.4, 45.6]],
  thumbBreadth: [[20.7, 1.3], [24.1, 1.4]],
  bodyFatPercentage: [[37, 8], [26, 7]],
};

/**
 * Half-width of the band a default must land in, in its sex's SD: the
 * population ends stand 2.326 SD out on their drivers and a regression adds
 * its residual, so 4 SD admits every end and rejects a default from a wrong
 * table, unit or sex.
 */
const BAND: number = 4;

/**
 * Every person's anatomy measures resolve, each default inside its own sex's
 * survey band, each supplied value kept, and the sex the person's statistics
 * name.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves `AutoMovieHumanBodyAnatomy.resolve` on the public inputs of every person of `HumanPeople.everyone()` (the four references and every population end, 66 people) and reads each banded measure (stature, the trunk, arm and leg tapes and lengths, the skeletal breadths, the landmark heights and the fat percentage) against its sex's survey mean plus and minus 4 SD; resolves f1 and m1 with every tape and length unknown and reads the stature lines' defaults against the same bands; resolves f1 again with every measure supplied as a distinct value and reads each back unchanged; and reads the resolved sex against the sex whose statistics `HumanPeople.sex` says the person satisfies. It fails with every person and measure that misses, a NaN or an infinite value included. It catches a regression coefficient typed in the wrong unit or for the wrong sex, a predictor read from the wrong control, a supplied value the resolver overwrites, and a sex taken from the wrong sign.
 * @evidence contracts/testing.md#independent-expectations The bands are the surveys' own distributions, not the regressions: ANSUR 1988 (the trunk girths and courses, elbow, hand, proximal thigh and knee girths, inseam, side neck point and suprasternale heights, biacromial, chest breadth, bimalleolar, heel, gluteal furrow, thumb), ANSUR II (stature, neck, wrist and calf girths, the arm segments, acromial, cervicale, axilla heights, ankle circumference, ball of foot, hip breadth, buttock depth, bideltoid and bicristal breadths) and Heinz et al. 2003 (forearm girth; elbow, wrist and knee bone breadths, per side); the top hip girth, the across back shoulder width, the relaxed upper arm girth, the natural-waist breadth and depth and the chest depth have no recorded SD and are not banded (the last three are held in their box by `test_human_input_box_consistency`), each recorded in `packages/human/docs/work/parameter-anatomy-survey.md`; body fat percentage takes the NHANES DXA adult range (Kelly et al. 2009) widened to 8 and 7 points SD. No construction constant or generated geometry enters. Oracle limits: the band checks plausibility, not a person's true measure, which only a measurement gives.
 * @evidence contracts/testing.md#distinguishing-cases Women and men at both stature and girth ends exercise both coefficient tables at their extremes; the supplied-value case is the negative case of every default. The test also proves its band rejects the errors it exists for: f1's wrist breadth by the women's line with a ten-fold slope (439.4 mm) and with the girth in centimetres (9.7 mm) both fall outside 49.4 plus and minus 13.2, and f1 declared male resolves the men's elbow breadth (65.4 mm, not 61.8) from the same forearm girth.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_anatomy_defaults`, reading public inputs only, with no generation, renderer, browser or GPU.
 */
export function test_human_input_anatomy_defaults(): void {
  const failed: string[] = [];
  for (const name of HumanPeople.everyone()) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(name);
    const resolved: Required<IAutoMovieHumanBodyAnatomy> = AutoMovieHumanBodyAnatomy.resolve(params);
    const k: 0 | 1 = HumanPeople.sex(name) === "female" ? 0 : 1;
    if (resolved.sex !== HumanPeople.sex(name)) failed.push(`${name} sex: ${resolved.sex} for a ${HumanPeople.sex(name)} person`);
    for (const [field, distribution] of Object.entries(SURVEY) as [keyof typeof SURVEY, Distribution][]) {
      const [mean, sd] = distribution[k];
      const value: number = resolved[field];
      if (!(Math.abs(value - mean) <= BAND * sd))
        failed.push(`${name} ${field}: ${value.toFixed(1)} outside ${(mean - BAND * sd).toFixed(1)} to ${(mean + BAND * sd).toFixed(1)}`);
    }
  }

  // A woman and a man with every tape and length unknown take their survey
  // lines on stature, each inside its band.
  for (const name of ["f1", "m1"]) {
    const own: IAutoMovieHumanParameters = structuredClone(HumanPeople.params(name));
    own.body.anatomy = { sex: AutoMovieHumanBodyAnatomy.sexOf(own) };
    const k: 0 | 1 = HumanPeople.sex(name) === "female" ? 0 : 1;
    const unknown: Required<IAutoMovieHumanBodyAnatomy> = AutoMovieHumanBodyAnatomy.resolve(own);
    for (const [field, distribution] of Object.entries(SURVEY) as [keyof typeof SURVEY, Distribution][]) {
      const [mean, sd] = distribution[k];
      if (!(Math.abs(unknown[field] - mean) <= BAND * sd))
        failed.push(`${name} with every tape unknown, ${field}: ${unknown[field].toFixed(1)} outside ${(mean - BAND * sd).toFixed(1)} to ${(mean + BAND * sd).toFixed(1)}`);
    }
  }

  // Every supplied value is the person's own measure and survives resolution.
  const f1: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const supplied: Required<IAutoMovieHumanBodyAnatomy> = {
    ...AutoMovieHumanBodyAnatomy.resolve(f1),
  };
  let offset: number = 1;
  for (const field of Object.keys(SURVEY) as (keyof typeof SURVEY)[]) supplied[field] += offset++;
  const read: Required<IAutoMovieHumanBodyAnatomy> = AutoMovieHumanBodyAnatomy.resolve({ ...f1, body: { ...f1.body, anatomy: supplied } });
  for (const field of Object.keys(SURVEY) as (keyof typeof SURVEY)[])
    if (read[field] !== supplied[field]) failed.push(`f1 supplied ${field}: ${supplied[field]} read back as ${read[field]}`);

  // The band rejects the errors it exists for: f1's wrist breadth by a slope
  // typed ten times too large, and by the girth read in centimetres.
  const wrist: number = AutoMovieHumanBodyAnatomy.resolve(f1).wristCircumference;
  const line: AutoMovieHumanBodyAnatomy.ILine = AutoMovieHumanBodyAnatomy.WRIST_BREADTH_ON_WRIST[0];
  const [mean, sd] = SURVEY.wristBreadth[0];
  for (const [label, wrong] of [
    ["a ten-fold slope", line.a + 10 * line.b * wrist],
    ["the girth in centimetres", line.a + (line.b * wrist) / 10],
  ] as const)
    if (Math.abs(wrong - mean) <= BAND * sd) failed.push(`the band admits f1's wrist breadth by ${label}: ${wrong.toFixed(1)}`);

  // A supplied sex selects its own table: f1 declared male resolves another
  // elbow breadth from the same forearm girth.
  const male: Required<IAutoMovieHumanBodyAnatomy> = AutoMovieHumanBodyAnatomy.resolve({
    ...f1,
    body: { ...f1.body, anatomy: { ...f1.body.anatomy, sex: AutoMovieHumanSex.Male } },
  });
  if (male.sex !== AutoMovieHumanSex.Male || male.elbowBreadth === AutoMovieHumanBodyAnatomy.resolve(f1).elbowBreadth)
    failed.push(`f1 declared male resolves sex ${male.sex} and elbow breadth ${male.elbowBreadth.toFixed(1)}, the female table's`);
  if (failed.length !== 0) throw new Error(`${failed.length} anatomy measures miss their expectation:\n${failed.join("\n")}`);
}
