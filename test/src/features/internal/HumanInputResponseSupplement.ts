import type { IAutoMovieHumanCurveSupplement } from "../../../../packages/human/src/structures/body/IAutoMovieHumanCurveSupplement";

/**
 * One lesser toe's supplement: order-of-magnitude adult dimensions, not any
 * person's, since the input response asks only whether the figure reads the
 * input at all. Lengths, breadths, thicknesses and retractions are mm and the
 * splay is radians, as the type declares.
 */
const TOE: { lengthMm: number; breadthMm: number; thicknessMm: number; rootRetractionMm: number; splayRad: number } = {
  lengthMm: 30,
  breadthMm: 15,
  thicknessMm: 12,
  rootRetractionMm: 3,
  splayRad: 0.05,
};

/** Both sides of a paired supplement, equal. */
function pair<T>(value: T): { left: T; right: T } {
  return { left: structuredClone(value), right: structuredClone(value) };
}

/**
 * A complete supplement of plausible adult values, every field given: the
 * input response compares f1 with and without it. The values are
 * order-of-magnitude adult dimensions, not f1's, since the test asks only
 * whether the figure reads the input at all.
 */
export const HumanInputResponseSupplement: IAutoMovieHumanCurveSupplement = {
  face: {
    neck: { circumferenceAtMidTubeMm: 320, depthToBreadthRatio: 1, upperCircumferenceMm: 340 },
    jaw: { submentalDropMm: 10, chinBreadthMm: 40, prominenceHeightMm: 30, prominenceForwardMm: 5, sublabialHeightMm: 15, sublabialRecessionMm: 4, cheekRecessionMm: 5 },
    nose: { rootRecessionMm: 8, tipRiseMm: 3, nostrilBreadthMm: 10, nostrilHeightMm: 6, nostrilPlaneDegrees: 20, nostrilRecessionDegrees: 10 },
    mouth: { upperBorderProjectionMm: 2, lowerBorderProjectionMm: 2, cornerRecessionMm: 4, philtrumBreadthMm: 11 },
    eyePair: pair({ canthalSlantDegrees: 4, canthalRecessionMm: 6, marginDepthBulgeMm: 1, foldOffsetMm: 6, rollOffsetMm: 1 }),
    eyeSupportAnteriorRadiusMm: 12,
    earPair: pair({ rotationDegrees: 15, helixBreadthScaleMm: 8, conchaLengthMm: 20, conchaBreadthMm: 16, conchaDepthMm: 12, lobuleLengthMm: 18 }),
  },
  torso: {
    relaxedChestBreadthMm: 280,
    chestHeightMm: 1220,
    underfoldHeightMm: 1150,
    underbustDepthMm: 200,
    chestAnteriorFraction: 0.55,
    waistAnteriorFraction: 0.5,
    chestPeakSeparationMm: 180,
    pairedMassProjectionMm: pair(30),
    spinalGrooveDepthMm: 5,
    deltoidSuperiorThicknessMm: 15,
    clavicularHollowDepthMm: 5,
    posteriorShoulderThicknessMm: 20,
    axillaryFloorDropMm: 60,
    upperArmBreadthDepthRatio: pair(0.9),
    proximalUpperArmCircumferenceMm: pair(280),
  },
  handPair: pair({ palmThicknessMm: 28 }),
  armPair: pair({ upperArmDepthMm: 85, forearmDepthMm: 60, elbowBreadthMm: 65, elbowDepthMm: 60, forearmTwistDegrees: 0 }),
  pelvis: { buttockMaximumHeightMm: 830, buttockAnteriorReachMm: 120, posteriorMedianRecessMm: 10, iliacSkinBreadthMm: 300, perinealCrownHeightMm: 800 },
  legPair: pair({
    thighBreadthOverDepth: 1,
    calfBreadthOverDepth: 1,
    ankleBreadthMm: 65,
    patellaHeightMm: 450,
    kneeCircumferenceMm: 360,
    belowKneeCircumferenceMm: 330,
    calfMaximumHeightAboveAnkleMm: 250,
    ankleMinimumHeightAboveJointMm: 60,
    calfAnteriorReachMm: 50,
    ankleAnteriorReachMm: 30,
  }),
  footPair: pair({
    heelBreadthMm: 62,
    heelBehindAnkleMm: 55,
    heelPadHeightMm: 15,
    ballHeightMm: 20,
    instepHeightMm: 65,
    plantarArchHeightMm: 15,
    toePadHeightMm: 8,
    webGapMm: 2,
    toeSet: { hallux: { ...TOE, lengthMm: 35, breadthMm: 25 }, second: TOE, third: TOE, fourth: TOE, fifth: { ...TOE, lengthMm: 22 } },
  }),
};
