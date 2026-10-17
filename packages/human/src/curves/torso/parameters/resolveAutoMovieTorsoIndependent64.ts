import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieTorsoIdentity64 as I } from "./IAutoMovieTorsoIdentity64";

/** Resolve physical supplements from one existing 55-bone specimen. Missing values use the disclosed common engineering rules recorded in provenance, including an unvalidated compressed-chest-to-relaxed-breadth proxy. Caller-supplied quantities remain protocol assertions, not certified measurements. Throws for unknown fields, invalid scalar/pair domains, unsupported height order or mass/groove dimensions. */
export function resolveAutoMovieTorsoIndependent64(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  supplied: Partial<I.Independent> = {},
): I.Resolved {
  const body: IAutoMovieHumanMeasurements["identity"]["body"] =
    measurements.identity.body;
  const composition: IAutoMovieHumanMeasurements["identity"]["composition"] =
    measurements.identity.composition;
  const spine: IAutoMovieHumanSkeleton.IJoint | undefined =
    skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === "spine",
    );
  const upper: IAutoMovieHumanSkeleton.IJoint | undefined =
    skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === "upperChest",
    );
  if (skeleton.joints.length !== 55 || !spine || !upper)
    throw new Error("One complete actual 55-bone specimen required");
  const span: number = upper.position.y - body.waistHeight;
  // Circular girth excess is a radius proxy; 1.5 mm per ALMI unit is an uncalibrated projection convention.
  const mass: number =
    (body.chestCircumference - body.underbustCircumference) / (2 * Math.PI) +
    1.5 * composition.appendicularLeanMassIndex;
  const a: number = body.chestBreadth / 2;
  const b: number = body.chestDepth / 2;
  const ellipse: number =
    Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  // Compressed inspiratory caliper breadth and relaxed exterior breadth have different protocols; this proxy is not a measured pose conversion.
  const relaxed: number =
    (body.chestBreadth * body.chestCircumference) / ellipse +
    2 * composition.subcutaneousFat.flank;
  const defaults: I.Independent = {
    relaxedChestBreadthMm: relaxed,
    chestHeightMm: body.waistHeight + 0.65 * span,
    underfoldHeightMm: body.waistHeight + 0.45 * span,
    underbustDepthMm: body.chestDepth - Math.max(0, mass),
    chestAnteriorFraction: 0.55,
    waistAnteriorFraction: 0.55,
    chestPeakSeparationMm: 0.5 * relaxed,
    pairedMassProjectionMm: [Math.max(0, mass), Math.max(0, mass)],
    spinalGrooveDepthMm:
      (0.45 * composition.appendicularLeanMassIndex) /
      (1 + composition.subcutaneousFat.back / 5),
    deltoidSuperiorThicknessMm:
      (body.bideltoidBreadth - body.biacromialBreadth) / 2,
    clavicularHollowDepthMm:
      composition.appendicularLeanMassIndex /
      (1 + composition.subcutaneousFat.chest / 5),
    posteriorShoulderThicknessMm:
      composition.subcutaneousFat.back + composition.appendicularLeanMassIndex,
    axillaryFloorDropMm: body.neckCircumference / (8 * Math.PI),
    upperArmBreadthDepthRatio: [1, 1],
    proximalUpperArmCircumferenceMm: [
      body.leftArm.upperArmCircumference,
      body.rightArm.upperArmCircumference,
    ],
  };
  const rules: Record<keyof I.Independent, string> = {
    relaxedChestBreadthMm:
      "public compressed breadth times girth/equivalent-ellipse-perimeter + twice flank fat; explicit unvalidated relaxed-skin proxy",
    chestHeightMm:
      "waist + 0.65*(actual upperChest joint Y - waist); geometric course fraction, not chest-point norm",
    underfoldHeightMm:
      "waist + 0.45*(actual upperChest joint Y - waist); geometric underfold proxy, not clinical inframammary-fold measurement",
    underbustDepthMm:
      "public chest depth minus nonnegative conventional paired-mass projection",
    chestAnteriorFraction:
      "0.55 of chest depth in front of the actual spine line; allocation convention",
    waistAnteriorFraction:
      "0.55 of waist depth in front of the actual spine line; allocation convention",
    chestPeakSeparationMm:
      "one half of conventional relaxed breadth; symmetric geometric lane placement",
    pairedMassProjectionMm:
      "girth excess/(2*pi) + 1.5 mm per ALMI unit; common geometric projection proxy, not breast volume or measured trunk-muscle regression",
    spinalGrooveDepthMm:
      "0.45 mm per ALMI unit / (1 + back-fat/5 mm); conventional visibility attenuation",
    deltoidSuperiorThicknessMm:
      "half of bideltoid minus biacromial breadth; isotropic soft-thickness convention, not measured superior thickness",
    clavicularHollowDepthMm:
      "1 mm per ALMI unit / (1 + chest-fat/5 mm); conventional hollow attenuation",
    posteriorShoulderThicknessMm:
      "back fat + 1 mm per ALMI unit; conventional soft thickness",
    axillaryFloorDropMm:
      "neck circumference/(8*pi), one quarter equivalent neck radius; geometric branch sag only",
    upperArmBreadthDepthRatio:
      "1: circular proximal tube convention; no measured aspect ratio available",
    proximalUpperArmCircumferenceMm:
      "public relaxed mid-arm circumference held to proximal quarter-arm tube; no measured proximal taper relation available",
  };
  if (
    Object.keys(supplied).some(
      (key: string): boolean => !Object.hasOwn(defaults, key),
    )
  )
    throw new Error("Only declared physical torso supplements are accepted");
  const independent: I.Independent = {
    ...defaults,
    ...structuredClone(supplied),
  };
  const provenance: Record<
    string,
    { grade: "provided-physical" | "engineering-convention"; rule: string }
  > = {};
  for (const key of Object.keys(defaults) as (keyof I.Independent)[]) {
    const value: number | readonly number[] = independent[key];
    const numbers: readonly number[] =
      typeof value === "number" ? [value] : value;
    if (
      !Array.isArray(numbers) ||
      !Array.from(numbers).every(
        (v: number): boolean => typeof v === "number" && Number.isFinite(v),
      ) ||
      numbers.some((v: number): boolean => v < 0)
    )
      throw new Error(
        "Finite nonnegative physical torso quantity required: " + key,
      );
    provenance[key] = {
      grade: Object.hasOwn(supplied, key)
        ? "provided-physical"
        : "engineering-convention",
      rule: Object.hasOwn(supplied, key)
        ? "Explicit additional physical measurement, not a source-gate coefficient"
        : rules[key],
    };
  }
  const d: I.Independent = independent;
  if (
    [
      d.pairedMassProjectionMm,
      d.upperArmBreadthDepthRatio,
      d.proximalUpperArmCircumferenceMm,
    ].some(
      (pair: readonly number[]): boolean =>
        !Array.isArray(pair) || pair.length !== 2,
    )
  )
    throw new Error("Explicit complete left/right physical pairs required");
  if (
    !(
      body.waistHeight < d.underfoldHeightMm &&
      d.underfoldHeightMm < d.chestHeightMm &&
      d.chestHeightMm < upper.position.y &&
      upper.position.y < body.suprasternaleHeight
    )
  )
    throw new Error(
      "Ordered waist/underfold/chest/axilla/suprasternale heights required",
    );
  if (
    d.chestAnteriorFraction <= 0 ||
    d.chestAnteriorFraction >= 1 ||
    d.waistAnteriorFraction <= 0 ||
    d.waistAnteriorFraction >= 1 ||
    d.relaxedChestBreadthMm <= 0 ||
    d.underbustDepthMm <= 0 ||
    d.chestPeakSeparationMm <= 0 ||
    d.chestPeakSeparationMm >= 0.9 * d.relaxedChestBreadthMm ||
    d.upperArmBreadthDepthRatio.some((v: number): boolean => v <= 0) ||
    d.proximalUpperArmCircumferenceMm.some((v: number): boolean => v <= 0)
  )
    throw new Error(
      "Resolved positive dimensions and interior paired lanes required",
    );
  if (
    d.pairedMassProjectionMm.some(
      (v: number): boolean => v >= body.chestDepth * d.chestAnteriorFraction,
    ) ||
    d.spinalGrooveDepthMm >=
      Math.min(
        body.chestDepth * (1 - d.chestAnteriorFraction),
        body.waistDepth * (1 - d.waistAnteriorFraction),
      )
  )
    throw new Error(
      "Mass/groove projection must remain inside independent front/back depth",
    );
  return {
    independent,
    origin: [spine.position.x, spine.position.y, spine.position.z],
    trunkLengthMm: body.suprasternaleHeight - body.waistHeight,
    axillaHeightMm: upper.position.y,
    rootBone: "spine",
    publicMeasurementPaths: [
      "body.chestBreadth",
      "body.chestDepth",
      "body.chestCircumference",
      "body.underbustCircumference",
      "body.waistHeight",
      "body.waistBreadth",
      "body.waistDepth",
      "body.waistCircumference",
      "body.biacromialBreadth",
      "body.bideltoidBreadth",
      "body.leftArm.upperArmCircumference",
      "body.rightArm.upperArmCircumference",
      "composition.appendicularLeanMassIndex",
      "composition.subcutaneousFat",
    ],
    provenance: provenance as I.Resolved["provenance"],
  };
}
