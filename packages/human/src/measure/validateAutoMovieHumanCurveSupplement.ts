import type { IAutoMovieHumanCurveSupplement as S } from "../structures/IAutoMovieHumanCurveSupplement";

/** Admit only the named finite physical channels of this curve-design document.
 * Missing measurements and malformed values have separate findings. Regional
 * combination bounds still run in the actual family; this admission claims no
 * clinical range and never changes the admitted biological identity.
 */
export function validateAutoMovieHumanCurveSupplement(
  input: unknown,
):
  | { success: true; data: S }
  | {
      success: false;
      errors: readonly validateAutoMovieHumanCurveSupplement.Finding[];
    } {
  type Shape = 0 | { readonly [key: string]: Shape };
  const numbers: (keys: string) => Shape = (keys: string): Shape =>
    Object.fromEntries(
      keys.split(" ").map((key: string): [string, 0] => [key, 0]),
    );
  const bilateral: (shape: Shape) => Shape = (shape: Shape): Shape => ({
    left: shape,
    right: shape,
  });
  const toe: Shape = numbers(
    "lengthMm breadthMm thicknessMm rootRetractionMm splayRad",
  );
  const shape: Shape = {
    version: 0,
    face: {
      neck: numbers(
        "circumferenceAtMidTubeMm depthToBreadthRatio upperNeckCircumferenceMm",
      ),
      jaw: numbers(
        "submentalDropMm chinBreadthMm prominenceHeightMm prominenceForwardMm sublabialHeightMm sublabialRecessionMm cheekRecessionMm",
      ),
      nasal: numbers(
        "rootRecessionMm tipRiseMm nostrilBreadthMm nostrilHeightMm nostrilPlaneDegrees nostrilRecessionDegrees",
      ),
      oral: numbers(
        "upperBorderProjectionMm lowerBorderProjectionMm cornerRecessionMm philtrumBreadthMm",
      ),
      eyes: bilateral(
        numbers(
          "canthalSlantDegrees canthalRecessionMm marginDepthBulgeMm foldOffsetMm rollOffsetMm",
        ),
      ),
      eyeSupportAnteriorRadiusMm: 0,
      ears: bilateral(
        numbers(
          "rotationDegrees helixBreadthScaleMm conchaLengthMm conchaBreadthMm conchaDepthMm lobuleLengthMm",
        ),
      ),
    },
    torso: {
      ...(numbers(
        "relaxedChestBreadthMm chestHeightMm underfoldHeightMm underbustDepthMm chestAnteriorFraction waistAnteriorFraction chestPeakSeparationMm spinalGrooveDepthMm deltoidSuperiorThicknessMm clavicularHollowDepthMm posteriorShoulderThicknessMm axillaryFloorDropMm",
      ) as object),
      pairedMassProjectionMm: bilateral(0),
      upperArmBreadthDepthRatio: bilateral(0),
      proximalUpperArmCircumferenceMm: bilateral(0),
    },
    hands: bilateral(numbers("palmThicknessMm")),
    arms: bilateral(
      numbers(
        "upperArmDepthMm forearmDepthMm elbowBreadthMm elbowDepthMm forearmTwistDegrees",
      ),
    ),
    pelvis: numbers(
      "buttockMaximumHeightMm buttockAnteriorReachMm posteriorMedianRecessMm iliacSkinBreadthMm perinealCrownHeightMm leftThighBreadthOverDepth rightThighBreadthOverDepth",
    ),
    legs: bilateral(
      numbers(
        "thighBreadthOverDepth calfBreadthOverDepth ankleBreadthMm patellaHeightMm kneeCircumferenceMm belowKneeCircumferenceMm calfMaximumHeightAboveAnkleMm ankleMinimumHeightAboveJointMm calfAnteriorReachMm ankleAnteriorReachMm",
      ),
    ),
    feet: bilateral({
      ...(numbers(
        "heelBreadthMm heelBehindAnkleMm heelPadHeightMm ballHeightMm instepHeightMm plantarArchHeightMm toePadHeightMm webGapMm",
      ) as object),
      toes: { hallux: toe, second: toe, third: toe, fourth: toe, fifth: toe },
    }),
  };
  const errors: validateAutoMovieHumanCurveSupplement.Finding[] = [];
  const visit: (value: unknown, expected: Shape, path: string) => void = (
    value: unknown,
    expected: Shape,
    path: string,
  ): void => {
    if (value === undefined) {
      errors.push({
        path,
        kind: "missing",
        message: "Named physical measurement required",
      });
      return;
    }
    if (expected === 0) {
      if (typeof value !== "number" || !Number.isFinite(value))
        errors.push({
          path,
          kind: "invalid",
          message: "Finite physical scalar required",
        });
      return;
    }
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    ) {
      errors.push({
        path,
        kind: "invalid",
        message: "Named physical measurement object required",
      });
      return;
    }
    const record: Record<string, unknown> = value as Record<string, unknown>;
    for (const key of Object.keys(record))
      if (!Object.hasOwn(expected, key))
        errors.push({
          path: path + "." + key,
          kind: "invalid",
          message:
            "Unknown measurement channel; placement and geometry are internal outputs",
        });
    for (const [key, child] of Object.entries(expected))
      visit(
        Object.hasOwn(record, key) ? record[key] : undefined,
        child,
        path + "." + key,
      );
  };
  visit(input, shape, "$detailed");
  if (
    input !== null &&
    typeof input === "object" &&
    Object.hasOwn(input, "version") &&
    (input as { version: unknown }).version !== 1
  )
    errors.push({
      path: "$detailed.version",
      kind: "invalid",
      message: "Curve measurement document version must be 1",
    });
  return errors.length === 0
    ? { success: true, data: structuredClone(input) as S }
    : { success: false, errors };
}
/** Field-level findings from the closed physical-document schema. */
export namespace validateAutoMovieHumanCurveSupplement {
  /** One absent measurement or malformed value; no fitted replacement is inferred.
   *
   * @author Samchon
   */
  export interface Finding {
    /** Dot path within the supplied physical document. */
    path: string;

    /** Missing channels require measurements; invalid channels require correction. */
    kind: "missing" | "invalid";

    /** Specific admission condition that the caller must satisfy. */
    message: string;
  }
}
