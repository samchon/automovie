import type { IAutoMovieHumanBodyExteriorGap } from "./IAutoMovieHumanBodyExteriorGap";

/**
 * Surface targets of the numerical body request the exterior cannot answer
 * yet, each with the dependency it lacks.
 *
 * Each region owner appends its own gaps; a path bound in
 * `HUMAN_BODY_EXTERIOR_TARGETS` never appears here. A gap closes when its
 * landmark is registered on the source or its rule is written, and the path
 * then moves to the binding table.
 *
 * @evidence contracts/common.md#principled-implementation An unbound path is named with its missing dependency rather than approximated or hidden.
 * @evidence contracts/common.md#clear-and-simple-design Data only, one entry per path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry carries a stand-in instrument.
 * @evidence contracts/common.md#meaningful-documentation States ownership, exclusivity with the binding table and how a gap closes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The table defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It binds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor owns display.
 * @evidence contracts/anatomy.md#anatomical-source Each detail cites the survey landmark or tissue the source lacks.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export const HUMAN_BODY_EXTERIOR_GAPS: readonly IAutoMovieHumanBodyExteriorGap[] = [
  // trunk (#2717)
  {
    path: "surface.trunk.ribIliacMidpointWaistGirth",
    reason: "missing-landmark",
    detail: "The lowest palpable rib and the iliac crest that place this waist are not registered on the source skin.",
  },
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorGap[] => [
    {
      path: `surface.trunk.${side}SubscapularSkinfold`,
      reason: "missing-tissue-boundary",
      detail: "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
    },
    {
      path: `surface.trunk.${side}SuprailiacSkinfold`,
      reason: "missing-tissue-boundary",
      detail: "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
    },
  ]),
  // upper limb (#2718, #2710, #2719)
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorGap[] => [
    {
      path: `surface.${side}UpperLimb.upperArm.tricepsSkinfold`,
      reason: "missing-tissue-boundary",
      detail: "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
    },
    {
      path: `surface.${side}UpperLimb.hand.length`,
      reason: "missing-landmark",
      detail: `Missing landmark: stylion-${side}, the radial styloid point ANSUR II hand length starts at (Hotzman et al. 2011, 5.2.36 and 6.4.45); the end, dactylion III, is an extreme a rule finds on each shape.`,
    },
    {
      path: `surface.${side}UpperLimb.hand.breadth`,
      reason: "missing-landmark",
      detail: `Missing landmarks: metacarpale-ii-${side} and metacarpale-v-${side}, the most lateral point of metacarpophalangeal joint II and the most medial of joint V, the ends of ANSUR II hand breadth (Hotzman et al. 2011, 5.2.24, 5.2.25 and 6.4.43).`,
    },
  ]),
  // lower limb (#2716, #2714)
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorGap[] => [
    {
      path: `surface.${side}LowerLimb.thigh.hipToKneeLength`,
      reason: "missing-landmark",
      detail: `Missing landmarks: trochanterion-${side} and the lateral knee joint line, the ends of a surface thigh length; the hip and knee joint centres are not skin points.`,
    },
    {
      path: `surface.${side}LowerLimb.thigh.anteriorSkinfold`,
      reason: "missing-tissue-boundary",
      detail: "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
    },
    {
      path: `surface.${side}LowerLimb.leg.medialCalfSkinfold`,
      reason: "missing-tissue-boundary",
      detail: "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
    },
    {
      path: `surface.${side}LowerLimb.leg.kneeToAnkleLength`,
      reason: "missing-landmark",
      detail: `Missing landmarks: the lateral knee joint line and sphyrion-${side}, the ends of a surface shank length; the knee and ankle joint centres are not skin points.`,
    },
  ]),
];
