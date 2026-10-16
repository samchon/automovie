import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanAdultLengthSurvey } from "./AutoMovieHumanAdultLengthSurvey";
import { AutoMovieHumanChildLengthSurvey } from "./AutoMovieHumanChildLengthSurvey";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * The last value of a growth curve, its adult hold.
 *
 * @param curve Growth curve
 * @returns Value at the curve's oldest age
 */
function lastValue(curve: IAutoMovieHumanGrowthCurve): number {
  return curve.values[curve.values.length - 1]!;
}

/** Ages over which the child ratios hand over to the adult fits, years. */
const ADULT_FROM: [number, number] = [17.75, 20];

/** Age at which a child's hip breadth takes the adult ratio of hip breadth to bicristal breadth, years. */
const HIP_REFERENCE_AGE: number = 19.5;

/**
 * Lengths, heights and breadths of one person: the skeleton's dimensions and the hip breadth over them.
 *
 * Children take per-subject ratios to stature from the 1977 US child survey, so a child is built from its own age's proportions (sitting height 0.59 of stature at 2 against 0.52 in adults, the legs growing fastest), never from a scaled adult. Adults take our ANSUR II regressions, so taller adults have relatively longer legs (sitting height slope 0.39 against a mean fraction of 0.52). A child's soft-tissue hip breadth follows its pelvis, at the ANSUR II ratio of hip to bicristal breadth for the same BMI at 19.5 years, so it always covers the bony crests. Between 17.75 and 20 years the two hand over linearly, so every age gets one continuous value. Lengths regress on the peak stature, so old age keeps its limbs; the converter subtracts the spinal loss afterwards.
 *
 * Slimness lengthens the legs and arms and shortens the trunk at constant stature, and narrows the bony shoulders and pelvis and the hips over them, one unit being two residual standard deviations of the adult fits. Population is not read: no population-specific body survey was read, so every population gets the same body.
 *
 * Age-dependent coefficients belong to {@link AutoMovieHumanChildLengthSurvey} and adult regression coefficients to {@link AutoMovieHumanAdultLengthSurvey}; this evaluator owns their person-level handover and the conventional slimness mapping. Hand breadth and foot dimensions retain their separate survey estimates while the axial arm and leg lengths take the slimness scale. The converter applies spinal height loss afterwards, preserving these peak-stature limb lengths.
 *
 * @param context Resolved person
 * @param headHeight Head height already estimated, millimetres
 * @returns Body heights and breadths before spinal loss, and the lengths of one arm and one leg
 */
export function estimateAutoMovieHumanLengths(
  context: IAutoMovieHumanConversionContext,
  headHeight: number,
): estimateAutoMovieHumanLengths.IOutput {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const stature: number = context.peakStature;
  const mass: number = (context.bmi * stature * stature) / 1e6;
  const regressionAge: number = Math.min(58, Math.max(17, age));
  const fitAt: (
    regression: Record<
      AutoMovieHumanSex,
      AutoMovieHumanAdultLengthSurvey.IRegression
    >,
    atStature: number,
    atAge: number,
  ) => number = (
    regression: Record<
      AutoMovieHumanSex,
      AutoMovieHumanAdultLengthSurvey.IRegression
    >,
    atStature: number,
    atAge: number,
  ): number => {
    const r: AutoMovieHumanAdultLengthSurvey.IRegression = regression[sex];
    return (
      r.intercept +
      r.stature * atStature +
      (r.mass ?? 0) * mass +
      (r.bmi ?? 0) * context.bmi +
      (r.age ?? 0) * atAge
    );
  };
  const fit: (
    regression: Record<
      AutoMovieHumanSex,
      AutoMovieHumanAdultLengthSurvey.IRegression
    >,
  ) => number = (
    regression: Record<
      AutoMovieHumanSex,
      AutoMovieHumanAdultLengthSurvey.IRegression
    >,
  ): number => fitAt(regression, stature, regressionAge);
  const ratio: (curve: AutoMovieHumanChildLengthSurvey.ISexCurve) => number = (
    curve: AutoMovieHumanChildLengthSurvey.ISexCurve,
  ): number => interpolateAutoMovieHumanGrowthCurve(curve[sex], age);
  const weight: number = Math.min(
    1,
    Math.max(0, (age - ADULT_FROM[0]) / (ADULT_FROM[1] - ADULT_FROM[0])),
  );
  const blend: (child: () => number, adult: () => number) => number = (
    child: () => number,
    adult: () => number,
  ): number =>
    weight === 0
      ? child()
      : weight === 1
        ? adult()
        : (1 - weight) * child() + weight * adult();

  const childSuprasternale: number =
    stature -
    ratio(AutoMovieHumanChildLengthSurvey.SUPRASTERNALE_HEAD_HEIGHTS) *
      headHeight;
  const suprasternaleHeight: number = blend(
    (): number => childSuprasternale,
    (): number =>
      fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.suprasternaleHeight),
  );
  const cervicaleHeight: number = blend(
    (): number =>
      childSuprasternale +
      AutoMovieHumanChildLengthSurvey.ABOVE_SUPRASTERNALE.cervicale[sex] *
        headHeight,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.cervicaleHeight),
  );
  const childHand: number =
    ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977_HAND.handToStature) *
    stature;
  const handLength: number = blend(
    (): number => childHand,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.hand),
  );
  const footLength: number = blend(
    (): number =>
      childHand /
      ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977_HAND.handToFoot),
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.foot),
  );
  const sittingHeight: number = blend(
    (): number =>
      ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.sittingHeight) *
      stature,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.sittingHeight),
  );
  const trochanterion: number = blend(
    (): number =>
      ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.trochanterion) *
      stature,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.trochanterion),
  );
  const tibiale: number = blend(
    (): number =>
      ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.tibiale) * stature,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.tibiale),
  );
  const ankleHeight: number = blend(
    (): number =>
      AutoMovieHumanAdultLengthSurvey.ANSUR_II_RATIOS.ankle[sex] * footLength,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.ankle),
  );
  const acromialHeight: number = blend(
    (): number =>
      childSuprasternale +
      AutoMovieHumanChildLengthSurvey.ABOVE_SUPRASTERNALE.acromion[sex] *
        headHeight,
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.acromialHeight),
  );

  // slimness: a longer subischial leg and longer arms at constant stature
  const slimness: number = context.build.slimness;
  const slimSittingHeight: number =
    sittingHeight -
    AutoMovieHumanAdultLengthSurvey.SLIMNESS.sittingHeight * stature * slimness;
  const limbScale: number =
    (stature - slimSittingHeight) / (stature - sittingHeight);
  const narrowing: number =
    AutoMovieHumanAdultLengthSurvey.SLIMNESS.breadth * stature * slimness;
  const childBicristal: () => number = (): number =>
    ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.bispinous) *
    AutoMovieHumanChildLengthSurvey.BICRISTAL_PER_BISPINOUS[sex] *
    stature;
  const bicristalBreadth: number = blend(childBicristal, (): number =>
    fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.bicristal),
  );
  // a child's soft hip breadth grows with its pelvis at the young adult's ratio for the same BMI
  const referenceStature: number = estimateAutoMovieHumanMedianStature(
    sex,
    HIP_REFERENCE_AGE,
  );
  const hipBreadth: number = blend(
    (): number =>
      (childBicristal() *
        fitAt(
          AutoMovieHumanAdultLengthSurvey.ANSUR_II.hipBreadth,
          referenceStature,
          HIP_REFERENCE_AGE,
        )) /
      fitAt(
        AutoMovieHumanAdultLengthSurvey.ANSUR_II.bicristal,
        referenceStature,
        HIP_REFERENCE_AGE,
      ),
    (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.hipBreadth),
  );
  const biacromialBreadth: number =
    blend(
      (): number =>
        ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.biacromial) * stature,
      (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.biacromial),
    ) - narrowing;
  const upperArmLength: number =
    limbScale *
    blend(
      (): number =>
        ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.upperArm) * stature,
      (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.upperArm),
    );
  const forearmLength: number =
    limbScale *
    blend(
      (): number =>
        ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977.forearm) * stature,
      (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.forearm),
    );
  return {
    sittingHeight: slimSittingHeight,
    cervicaleHeight,
    suprasternaleHeight,
    acromialHeight,
    biacromialBreadth,
    span:
      AutoMovieHumanAdultLengthSurvey.SPAN.calibration[sex] *
      (biacromialBreadth +
        2 *
          (AutoMovieHumanAdultLengthSurvey.SPAN.reach[sex] * upperArmLength +
            forearmLength +
            limbScale * handLength)),
    bicristalBreadth: bicristalBreadth - narrowing,
    hipBreadth: hipBreadth - narrowing,
    arm: {
      upperArmLength,
      forearmLength,
      handLength: limbScale * handLength,
      handBreadth: blend(
        (): number =>
          handLength *
          ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977_HAND.breadthToHand),
        (): number => fit(AutoMovieHumanAdultLengthSurvey.ANSUR_II.handBreadth),
      ),
      // the adult palm share, with the finger beyond it grown along the survey's curve
      palmLength:
        limbScale *
        handLength *
        (1 -
          (1 - AutoMovieHumanAdultLengthSurvey.ANSUR_II_RATIOS.palm[sex]) *
            (ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977_DIGITS.middle) /
              lastValue(
                AutoMovieHumanChildLengthSurvey.SNYDER_1977_DIGITS.middle[sex],
              ))),
      // the adult thumb share, grown along the survey's curve
      thumbLength:
        limbScale *
        handLength *
        AutoMovieHumanAdultLengthSurvey.GREINER_THUMB[sex] *
        (ratio(AutoMovieHumanChildLengthSurvey.SNYDER_1977_DIGITS.thumb) /
          lastValue(
            AutoMovieHumanChildLengthSurvey.SNYDER_1977_DIGITS.thumb[sex],
          )),
    },
    leg: {
      thighLength: limbScale * (trochanterion - tibiale),
      shankLength: limbScale * (tibiale - ankleHeight),
      ankleHeight: limbScale * ankleHeight,
      footLength,
      footBreadth:
        footLength *
        blend(
          (): number =>
            ratio(
              AutoMovieHumanChildLengthSurvey.SNYDER_1977_HAND
                .footBreadthToFoot,
            ),
          (): number =>
            AutoMovieHumanAdultLengthSurvey.ANSUR_II_RATIOS.footBreadth[sex],
        ),
    },
  };
}
/** Output type of {@link estimateAutoMovieHumanLengths}. */
export namespace estimateAutoMovieHumanLengths {
  /**
   * Skeletal dimensions before old-age spinal loss, millimetres.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Sitting height. */
    sittingHeight: number;

    /** Cervicale height. */
    cervicaleHeight: number;

    /** Suprasternale height. */
    suprasternaleHeight: number;

    /** Acromial height. */
    acromialHeight: number;

    /** Biacromial breadth. */
    biacromialBreadth: number;

    /** Span, fingertip to fingertip with the arms outstretched. */
    span: number;

    /** Bicristal breadth. */
    bicristalBreadth: number;

    /** Soft-tissue hip breadth. */
    hipBreadth: number;

    /** Lengths of one arm. */
    arm: Pick<
      IAutoMovieHumanIdentity.IArm,
      | "upperArmLength"
      | "forearmLength"
      | "handLength"
      | "handBreadth"
      | "palmLength"
      | "thumbLength"
    >;

    /** Lengths of one leg. */
    leg: Pick<
      IAutoMovieHumanIdentity.ILeg,
      | "thighLength"
      | "shankLength"
      | "ankleHeight"
      | "footLength"
      | "footBreadth"
    >;
  }
}
