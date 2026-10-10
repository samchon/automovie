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
 * @author Samchon
 */
export const HUMAN_BODY_EXTERIOR_GAPS: readonly IAutoMovieHumanBodyExteriorGap[] =
  [
    // trunk (#2717)
    {
      path: "surface.trunk.ribIliacMidpointWaistGirth",
      reason: "missing-landmark",
      detail:
        "The lowest palpable rib and the iliac crest that place this waist are not registered on the source skin.",
    },
    ...(["left", "right"] as const).flatMap(
      (side): IAutoMovieHumanBodyExteriorGap[] => [
        {
          path: `surface.trunk.${side}SubscapularSkinfold`,
          reason: "missing-tissue-boundary",
          detail:
            "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
        },
        {
          path: `surface.trunk.${side}SuprailiacSkinfold`,
          reason: "missing-tissue-boundary",
          detail:
            "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
        },
      ],
    ),
    // upper limb (#2718, #2710)
    ...(["left", "right"] as const).flatMap(
      (side): IAutoMovieHumanBodyExteriorGap[] => [
        {
          path: `surface.${side}UpperLimb.upperArm.tricepsSkinfold`,
          reason: "missing-tissue-boundary",
          detail:
            "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
        },
      ],
    ),
    // lower limb (#2716, #2714)
    ...(["left", "right"] as const).flatMap(
      (side): IAutoMovieHumanBodyExteriorGap[] => [
        {
          path: `surface.${side}LowerLimb.thigh.hipToKneeLength`,
          reason: "missing-landmark",
          detail: `Missing landmarks: trochanterion-${side} and the lateral knee joint line, the ends of a surface thigh length; the hip and knee joint centres are not skin points.`,
        },
        {
          path: `surface.${side}LowerLimb.thigh.anteriorSkinfold`,
          reason: "missing-tissue-boundary",
          detail:
            "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
        },
        {
          path: `surface.${side}LowerLimb.leg.medialCalfSkinfold`,
          reason: "missing-tissue-boundary",
          detail:
            "A skinfold is a subcutaneous fat thickness; the one connected skin has no fat layer to pinch.",
        },
        {
          path: `surface.${side}LowerLimb.leg.kneeToAnkleLength`,
          reason: "missing-landmark",
          detail: `Missing landmarks: the lateral knee joint line and sphyrion-${side}, the ends of a surface shank length; the knee and ankle joint centres are not skin points.`,
        },
      ],
    ),
  ];
