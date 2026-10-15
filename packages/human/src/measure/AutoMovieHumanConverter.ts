import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanConverter } from "./IAutoMovieHumanConverter";
import { estimateAutoMovieHumanComposition } from "./estimateAutoMovieHumanComposition";
import { estimateAutoMovieHumanGirths } from "./estimateAutoMovieHumanGirths";
import { estimateAutoMovieHumanHead } from "./estimateAutoMovieHumanHead";
import { estimateAutoMovieHumanLengths } from "./estimateAutoMovieHumanLengths";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { estimateAutoMovieHumanMobility } from "./estimateAutoMovieHumanMobility";
import { estimateAutoMovieHumanNavicularHeight } from "./estimateAutoMovieHumanNavicularHeight";
import { estimateAutoMovieHumanPosture } from "./estimateAutoMovieHumanPosture";
import { estimateAutoMovieHumanSpinalLoss } from "./estimateAutoMovieHumanSpinalLoss";
import { estimateAutoMovieHumanTrunkSections } from "./estimateAutoMovieHumanTrunkSections";

/**
 * Mean body mass index of the ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007), kilograms per square metre: 25.5 for women and 27.7 for men. The adult regressions were fitted around it, so the converter's mean person sits at the centre of their sample. Grade: measured.
 */
const REFERENCE_BMI: Record<AutoMovieHumanSex, number> = {
  female: 25.5,
  male: 27.7,
};

/**
 * BMI units of one unit of adiposity: two standard deviations of BMI in the ANSUR II working databases (3.5 for women, 4.0 for men), so plus or minus one reaches about the 2nd and 98th percentiles of a sample whose fitness standards already narrow the tails. Grade: conventional mapping onto a measured spread.
 */
const ADIPOSITY_BMI: Record<AutoMovieHumanSex, number> = {
  female: 7.0,
  male: 8.0,
};

/**
 * Share of the appendicular lean mass index that one unit of muscularity adds or removes. No source for the spread of lean mass at a given age was read, so a quarter is a conventional bound that keeps every muscularity inside the identity's admitted lean index. The lean mass it adds also adds to BMI, counting the limbs' lean mass only. Grade: conventional.
 */
const MUSCULARITY_LEAN_SHARE: number = 0.25;

/**
 * The default converter: deterministic regressions from published public-domain anthropometry, for every age and both sexes.
 *
 * Order of resolution:
 *
 * 1. Stature. With no stature given, the WHO median for age (to 19 years, then the 19-year median) minus the spinal height lost after 40, fitted to the NHANES 2015-2018 adult tables. A given stature is the stature now; the stature at the end of growth is it plus that loss, because old age shortens the spine and not the bones.
 * 2. BMI, from the ANSUR II mean of the sex, adiposity (two standard deviations per unit) and the lean mass muscularity adds.
 * 3. Head, from its own growth curve (1977 US child survey heads per stature, 3D Facial Norms growth fractions, WHO head circumference in infancy) and the population's adult means. See {@link estimateAutoMovieHumanHead}.
 * 4. Lengths and bony breadths: 1977 child survey ratios for children, ANSUR II regressions on peak stature for adults, with slimness. See {@link estimateAutoMovieHumanLengths}.
 * 5. Girths: ANSUR II regressions on stature, BMI and age, NHANES growth and ageing of the waist and upper arm. See {@link estimateAutoMovieHumanGirths}.
 * 6. Trunk sections: breadth and depth of the chest, natural waist and buttock from their girths in ANSUR II proportions, and the underbust from the bust. See {@link estimateAutoMovieHumanTrunkSections}.
 * 7. Mobility from the CDC normal joint range of motion study by age and sex, composition from the NHANES DXA reference, standing posture from radiographic and photographic norms by age and sex (see {@link estimateAutoMovieHumanPosture}), navicular height from foot length by age (see {@link estimateAutoMovieHumanNavicularHeight}).
 * 8. Spinal loss subtracted from stature, sitting height, cervicale, suprasternale and acromial height; every limb keeps its peak length.
 *
 * Age is unrestricted. Beyond the oldest sample of a source the converter holds that sample's value, and below its youngest it holds or, where a source states the trend, extends it; each estimator says which. Both arms and both legs get the same values. Population reaches only the head and face, the only measurements read by population; cuteness is not read yet. Pigmentation is a conventional moderate default until the skin stage reads pigmentation surveys: melanin 0.12 within the moderately pigmented range of Jacques (1998, "Skin Optics", Oregon Medical Laser Center News), the eumelanin share 0.7 Donner and Jensen illustrate (2006, Eurographics Symposium on Rendering, pp. 409-417), haemoglobin 0.05 and a brown iris.
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
    const adiposityBmi: number = ADIPOSITY_BMI[sex] * traits.build.adiposity;
    const leanScale: number =
      1 + MUSCULARITY_LEAN_SHARE * traits.build.muscularity;

    const draft: IAutoMovieHumanConversionContext = {
      sex,
      age,
      population: traits.population,
      build: traits.build,
      stature: peakStature - spinalLoss,
      peakStature,
      medianStature,
      spinalLoss,
      bmi: REFERENCE_BMI[sex],
      bmiOffset: 0,
    };
    const composition: IAutoMovieHumanIdentity.IComposition =
      estimateAutoMovieHumanComposition(draft, adiposityBmi, leanScale);
    const leanBmi: number =
      composition.appendicularLeanMassIndex * (1 - 1 / leanScale);
    const context: IAutoMovieHumanConversionContext = {
      ...draft,
      bmi: REFERENCE_BMI[sex] + adiposityBmi + leanBmi,
      bmiOffset: adiposityBmi + leanBmi,
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
        bicristalBreadth: lengths.bicristalBreadth,
        hipBreadth: lengths.hipBreadth,
        neckCircumference: girths.neckCircumference,
        chestCircumference: girths.chestCircumference,
        waistCircumference: girths.waistCircumference,
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
        melanin: 0.12,
        eumelaninShare: 0.7,
        haemoglobin: 0.05,
        iris: "brown",
      },
    };
  }

  /**
   * Default appearance: underwear by sex (briefs for a male person, briefs and a bra for a female person) in white, dark brown hair, brows and lashes, a lash length below the 12 mm natural lashes rarely exceed, mid-range skin oil, and a round hairline with a gently waved curl. Hair length is a short cut for a male person and shoulder length for a female person. Grade: conventional defaults, not population statistics.
   */
  public toAppearance(traits: IAutoMovieHumanTraits): IAutoMovieHumanAppearance {
    const female: boolean = traits.sex === "female";
    return {
      version: 1,
      skin: { oiliness: 0.5 },
      hair: {
        color: "darkBrown",
        length: female ? 400 : 40,
        curl: "II",
        hairline: "round",
      },
      brows: { color: "darkBrown" },
      lashes: { color: "darkBrown", length: 10 },
      underwear: {
        bottom: "briefs",
        top: female ? "bra" : "none",
        color: "#FFFFFF",
      },
    };
  }
}
