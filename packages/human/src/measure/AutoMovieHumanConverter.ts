import { AutoMovieHumanHairColor } from "../structures/AutoMovieHumanHairColor";
import { AutoMovieHumanPopulation } from "../structures/AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanConverter } from "./IAutoMovieHumanConverter";
import { estimateAutoMovieHumanBideltoidBreadth } from "./estimateAutoMovieHumanBideltoidBreadth";
import { estimateAutoMovieHumanCarryingAngle } from "./estimateAutoMovieHumanCarryingAngle";
import { estimateAutoMovieHumanComposition } from "./estimateAutoMovieHumanComposition";
import { estimateAutoMovieHumanDorsalHandFat } from "./estimateAutoMovieHumanDorsalHandFat";
import { estimateAutoMovieHumanGirths } from "./estimateAutoMovieHumanGirths";
import { estimateAutoMovieHumanHead } from "./estimateAutoMovieHumanHead";
import { estimateAutoMovieHumanLengths } from "./estimateAutoMovieHumanLengths";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { estimateAutoMovieHumanMobility } from "./estimateAutoMovieHumanMobility";
import { estimateAutoMovieHumanNavicularHeight } from "./estimateAutoMovieHumanNavicularHeight";
import { estimateAutoMovieHumanPosture } from "./estimateAutoMovieHumanPosture";
import { estimateAutoMovieHumanSpinalLoss } from "./estimateAutoMovieHumanSpinalLoss";
import { estimateAutoMovieHumanThyroidAngle } from "./estimateAutoMovieHumanThyroidAngle";
import { estimateAutoMovieHumanTrunkSections } from "./estimateAutoMovieHumanTrunkSections";
import { estimateAutoMovieHumanWaistHeight } from "./estimateAutoMovieHumanWaistHeight";

/**
 * Mean body mass index of the ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007), kilograms per square metre: 25.5 for women and 27.7 for men. The adult regressions were fitted around it, so the converter's mean person sits at the centre of their sample. Grade: measured.
 */
const REFERENCE_BMI: Record<AutoMovieHumanSex, number> = {
  female: 25.5,
  male: 27.7,
};

/**
 * The default converter: deterministic regressions from published public-domain anthropometry, for every age and both sexes.
 *
 * Order of resolution:
 *
 * 1. Stature. With no stature given, the WHO median for age (to 19 years, then the 19-year median) minus the spinal height lost after 40, fitted to the NHANES 2015-2018 adult tables. A given stature is the stature now; the stature at the end of growth is it plus that loss, because old age shortens the spine and not the bones.
 * 2. Composition and BMI: body fat and the appendicular lean mass index from the DXA references by sex and age, adiposity and muscularity each two of their reference's standard deviations per unit, and the BMI they imply around the ANSUR II mean of the sex. See {@link estimateAutoMovieHumanComposition}.
 * 3. Head, from its own growth curve (1977 US child survey heads per stature, 3D Facial Norms growth fractions, WHO head circumference in infancy) and the population's adult means. See {@link estimateAutoMovieHumanHead}.
 * 4. Lengths and bony breadths: 1977 child survey ratios for children, ANSUR II regressions on peak stature for adults, with slimness. See {@link estimateAutoMovieHumanLengths}.
 * 5. Girths: ANSUR II regressions on stature, BMI and age, NHANES growth and ageing of the waist and upper arm. See {@link estimateAutoMovieHumanGirths}.
 * 6. Trunk sections: breadth and depth of the chest, natural waist and buttock from their girths in ANSUR II proportions, and the underbust from the bust (see {@link estimateAutoMovieHumanTrunkSections}); the natural waist's height on the trunk (see {@link estimateAutoMovieHumanWaistHeight}) and the bideltoid breadth over the shoulders (see {@link estimateAutoMovieHumanBideltoidBreadth}).
 * 7. Mobility from the CDC normal joint range of motion study by age and sex, the carrying angle by age and sex (see {@link estimateAutoMovieHumanCarryingAngle}), standing posture from radiographic and photographic norms by age and sex (see {@link estimateAutoMovieHumanPosture}), navicular height from foot length by age (see {@link estimateAutoMovieHumanNavicularHeight}).
 * 8. Spinal loss subtracted from stature, sitting height, cervicale, suprasternale and acromial height; every limb keeps its peak length.
 *
 * Age is unrestricted. Beyond the oldest sample of a source the converter holds that sample's value, and below its youngest it holds or, where a source states the trend, extends it; each estimator says which. Both arms and both legs get the same values. Population reaches only the head and face, the only measurements read by population; cuteness is not read yet. Pigmentation follows the population as a conventional choice inside the measured melanosome volume fractions of Jacques (1998, "Skin Optics", Oregon Medical Laser Center News): melanin 0.04 for a European population within the lightly pigmented 0.013 to 0.063, 0.10 for an East Asian population between the lightly and the moderately pigmented ranges, and 0.30 for an African population within the darkly pigmented 0.18 to 0.43; the eumelanin share is the 0.7 Donner and Jensen illustrate (2006, Eurographics Symposium on Rendering, pp. 409-417) and the dermal haemoglobin their 0.005; the iris is brown.
 *
 * @author Samchon
 */
export class AutoMovieHumanConverter implements IAutoMovieHumanConverter {
  /**
   * Expand traits into a detailed identity by the steps listed on the class.
   *
   * @param traits Admitted traits
   * @returns Identity at the traits' age, sex, stature and build
   */
  public toIdentity(traits: IAutoMovieHumanTraits): IAutoMovieHumanIdentity {
    const { sex, age }: IAutoMovieHumanTraits = traits;
    const medianStature: number = estimateAutoMovieHumanMedianStature(sex, age);
    const spinalLoss: number = estimateAutoMovieHumanSpinalLoss(sex, age);
    const peakStature: number =
      traits.stature === null ? medianStature : traits.stature + spinalLoss;
    const resolved: estimateAutoMovieHumanComposition.IOutput =
      estimateAutoMovieHumanComposition({
        sex,
        age,
        adiposity: traits.build.adiposity,
        muscularity: traits.build.muscularity,
        referenceBmi: REFERENCE_BMI[sex],
      });
    const composition: IAutoMovieHumanIdentity.IComposition =
      resolved.composition;
    const context: IAutoMovieHumanConversionContext = {
      sex,
      age,
      population: traits.population,
      build: traits.build,
      stature: peakStature - spinalLoss,
      peakStature,
      medianStature,
      spinalLoss,
      bmi: resolved.bmi,
      bmiOffset: resolved.bmi - REFERENCE_BMI[sex],
      fatIndexOffset: resolved.fatIndexOffset,
      leanIndexOffset: resolved.leanIndexOffset,
    };

    const head: IAutoMovieHumanIdentity.IHead =
      estimateAutoMovieHumanHead(context);
    const lengths: estimateAutoMovieHumanLengths.IOutput =
      estimateAutoMovieHumanLengths(context, head.headHeight);
    const girths: estimateAutoMovieHumanGirths.IOutput =
      estimateAutoMovieHumanGirths(context);
    const mobility: estimateAutoMovieHumanMobility.IOutput =
      estimateAutoMovieHumanMobility(sex, age);
    const arm: IAutoMovieHumanIdentity.IArm = {
      ...lengths.arm,
      ...girths.arm,
      ...mobility.arm,
      carryingAngle: estimateAutoMovieHumanCarryingAngle(sex, age),
      dorsalHandFat: estimateAutoMovieHumanDorsalHandFat(age),
    };
    const leg: IAutoMovieHumanIdentity.ILeg = {
      ...lengths.leg,
      ...girths.leg,
      ...mobility.leg,
      navicularHeight: estimateAutoMovieHumanNavicularHeight(
        age,
        lengths.leg.footLength,
      ),
    };
    return {
      version: 1,
      body: {
        stature: context.stature,
        sittingHeight: lengths.sittingHeight - spinalLoss,
        cervicaleHeight: lengths.cervicaleHeight - spinalLoss,
        suprasternaleHeight: lengths.suprasternaleHeight - spinalLoss,
        acromialHeight: lengths.acromialHeight - spinalLoss,
        biacromialBreadth: lengths.biacromialBreadth,
        bideltoidBreadth: estimateAutoMovieHumanBideltoidBreadth(
          context,
          lengths.biacromialBreadth,
        ),
        span: lengths.span,
        bicristalBreadth: lengths.bicristalBreadth,
        hipBreadth: lengths.hipBreadth,
        neckCircumference: girths.neckCircumference,
        thyroidAngle: estimateAutoMovieHumanThyroidAngle(sex, age),
        chestCircumference: girths.chestCircumference,
        waistCircumference: girths.waistCircumference,
        waistHeight: estimateAutoMovieHumanWaistHeight(
          sex,
          leg.thighLength + leg.shankLength + leg.ankleHeight,
          lengths.cervicaleHeight - spinalLoss,
        ),
        buttockCircumference: girths.buttockCircumference,
        ...estimateAutoMovieHumanTrunkSections(context, {
          chestCircumference: girths.chestCircumference,
          waistCircumference: girths.waistCircumference,
          buttockCircumference: girths.buttockCircumference,
          hipBreadth: lengths.hipBreadth,
        }),
        posture: estimateAutoMovieHumanPosture(sex, age),
        leftArm: { ...arm },
        rightArm: { ...arm },
        leftLeg: { ...leg },
        rightLeg: { ...leg },
      },
      head,
      composition,
      pigmentation: {
        melanin: MELANIN[traits.population],
        eumelaninShare: 0.7,
        haemoglobin: 0.005,
        iris: "brown",
      },
    };
  }

  /**
   * Default appearance, by sex, age and population. Grade: conventional defaults, not population statistics.
   *
   * - Hair: a short cut for a boy or man, with temples receding from 30 years; a bob for a girl or woman; a crop under three years. Black, straight hair for an East Asian population, black coiled hair for an African one, brown and gently waved for a European one; grey from 60 years.
   * - Brows and lashes take the natural hair colour, grey from 70 years; lashes 10 mm long for a woman, 9 for a man and 8 for a child, below the 12 mm natural lashes rarely exceed.
   * - Mid-range skin oil, and fine wrinkles that deepen linearly from 25 to 75 years; underwear by sex (briefs for a male person, briefs and a bra for a female person) in white.
   */
  public toAppearance(traits: IAutoMovieHumanTraits): IAutoMovieHumanAppearance {
    const female: boolean = traits.sex === "female";
    const natural: AutoMovieHumanHairColor =
      traits.population === "european" ? "brown" : "black";
    const style: IAutoMovieHumanAppearance.IHair["style"] =
      traits.age < 3 ? "crop" : female ? "bob" : "short";
    return {
      version: 1,
      skin: {
        oiliness: 0.5,
        wrinkles: Math.min(1, Math.max(0, (traits.age - 25) / 50)),
      },
      hair: {
        style,
        color: traits.age >= 60 ? "gray" : natural,
        length: style === "crop" ? 15 : style === "bob" ? (traits.age < 12 ? 170 : 210) : traits.age < 12 ? 40 : 55,
        curl:
          traits.population === "african" ? "VI" : traits.population === "eastAsian" ? "I" : "II",
        hairline: !female && traits.age >= 30 ? "mShaped" : "round",
      },
      brows: { color: traits.age >= 70 ? "gray" : natural },
      lashes: {
        color: traits.age >= 70 ? "gray" : natural,
        length: traits.age < 12 ? 8 : female ? 10 : 9,
      },
      underwear: {
        bottom: "briefs",
        top: female ? "bra" : "none",
        color: "#FFFFFF",
      },
    };
  }
}

/** Default melanin volume fraction by population; see {@link AutoMovieHumanConverter}. */
const MELANIN: Record<AutoMovieHumanPopulation, number> = {
  european: 0.04,
  eastAsian: 0.1,
  african: 0.3,
};
