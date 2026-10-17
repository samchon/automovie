import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import { measureAutoMovieHumanSkeleton } from "../../../skeleton/measureAutoMovieHumanSkeleton";
import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import { ArmIdentityRules as G } from "./ArmIdentityRules";

/** Resolve physical arm inputs from one existing admitted measurement/skeleton pair.
 *
 * Public palpable lengths must reproduce the supplied skeleton measurements within 1e-7 mm; modelling lengths are then measured between its actual joint centres.
 *
 * Missing section dimensions use common rules: the elbow-girth ratio and forearm principal aspect summarize two reference skin courses, while their axis assignment and pose transfer remain conventions. The default forearm depth preserves its public cubic circumference rather than replacing its shape with a circle. Supplied extras retain caller provenance. Invalid names, lengths, diameters or twist throw without regenerating or changing the specimen.
 */
export function resolveArmIdentityPhysical(
  specimen: IAutoMovieHumanCurveSpecimen,
  additional: resolveArmIdentityPhysical.Options = {},
): resolveArmIdentityPhysical.Resolved {
  if (
    Object.keys(additional).some(
      (key: string): boolean => key !== "left" && key !== "right",
    )
  )
    throw new Error("Unknown arm side in physical extras");
  if (specimen.skeleton.joints.length !== 55 || specimen.frames.length !== 55)
    throw new Error("One complete shared 55-bone specimen required");
  const measured: ReturnType<typeof measureAutoMovieHumanSkeleton> =
    measureAutoMovieHumanSkeleton(specimen.skeleton);
  const sides: Partial<resolveArmIdentityPhysical.Resolved["sides"]> = {};
  for (const side of ["left", "right"] as const) {
    const bodyKey: "leftArm" | "rightArm" =
      side === "left" ? "leftArm" : "rightArm";
    const arm: typeof specimen.measurements.identity.body.leftArm =
      specimen.measurements.identity.body[bodyKey];
    for (const key of ["upperArmLength", "forearmLength"] as const)
      if (Math.abs(measured.body[bodyKey][key] - arm[key]) > 1e-7)
        throw new Error(
          "Public lengths and the supplied actual skeleton do not match: " +
            bodyKey +
            "." +
            key,
        );
    const joint: (stem: string) => IAutoMovieHumanSkeleton.IJoint = (
      stem: string,
    ): IAutoMovieHumanSkeleton.IJoint => {
      const j: IAutoMovieHumanSkeleton.IJoint | undefined =
        specimen.skeleton.joints.find(
          (value: IAutoMovieHumanSkeleton.IJoint): boolean =>
            value.bone === side + stem,
        );
      if (!j) throw new Error("Missing actual arm bone");
      return j;
    };
    const distance: (
      a: IAutoMovieHumanSkeleton.IJoint,
      b: IAutoMovieHumanSkeleton.IJoint,
    ) => number = (
      a: IAutoMovieHumanSkeleton.IJoint,
      b: IAutoMovieHumanSkeleton.IJoint,
    ): number =>
      Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y,
        a.position.z - b.position.z,
      );
    const upper: number = distance(joint("UpperArm"), joint("LowerArm")),
      fore: number = distance(joint("LowerArm"), joint("Hand"));
    // A wrist-girth-only elbow became an artificial waist as forearm mass grew. Size the default elbow's whole cubic from the common reference-derived girth ratio; its aspect and native-to-T transfer remain conventional. Overrides stay independent.
    const elbowBreadth: number =
      (G.elbowGirthPerForearmGirth * arm.forearmCircumference) /
      G.perimeter(1, G.elbowDepthPerBreadth);
    const defaults: resolveArmIdentityPhysical.Extras = {
      upperArmDepthMm: G.equivalentDiameter(arm.upperArmCircumference),
      forearmDepthMm: G.defaultForearmDepth(arm.forearmCircumference),
      elbowBreadthMm: elbowBreadth,
      elbowDepthMm: G.elbowDepthPerBreadth * elbowBreadth,
      forearmTwistDegrees: 0,
    };
    if (
      Object.keys(additional[side] ?? {}).some(
        (key: string): boolean => !Object.hasOwn(defaults, key),
      )
    )
      throw new Error("Unknown independent physical arm measurement");
    const extras: resolveArmIdentityPhysical.Extras = {
      ...defaults,
      ...additional[side],
    };
    for (const [key, value] of Object.entries(extras))
      if (
        !Number.isFinite(value) ||
        (key === "forearmTwistDegrees" ? Math.abs(value) > 45 : value <= 0)
      )
        throw new Error("Invalid physical arm extra: " + key);
    if (
      ![
        upper,
        fore,
        arm.upperArmCircumference,
        arm.forearmCircumference,
        arm.wristCircumference,
      ].every((v: number): boolean => Number.isFinite(v) && v > 0)
    )
      throw new Error(
        "Positive finite actual segment lengths and relaxed girths required",
      );
    G.otherDiameter(arm.upperArmCircumference, extras.upperArmDepthMm);
    G.otherDiameter(arm.forearmCircumference, extras.forearmDepthMm);
    if (
      extras.elbowBreadthMm / extras.elbowDepthMm < 0.25 ||
      extras.elbowBreadthMm / extras.elbowDepthMm > 4
    )
      throw new Error("Elbow aspect outside declared numerical range");
    sides[side] = {
      upperArmLengthMm: upper,
      forearmLengthMm: fore,
      upperArmCircumferenceMm: arm.upperArmCircumference,
      forearmCircumferenceMm: arm.forearmCircumference,
      extras,
      provenance: Object.fromEntries(
        Object.keys(extras).map((key: string): [string, string] => [
          key,
          Object.hasOwn(additional[side] ?? {}, key)
            ? "provided-physical: caller measurement in declared neutral-T section protocol"
            : key.startsWith("elbow")
              ? "two-reference skin-course girth ratio; conventional aspect and native-A-to-neutral-T transfer, not population validated"
              : key === "forearmDepthMm"
                ? "two-reference Forearm principal aspect 0.82; conventional dorsal/palmar short-axis assignment and native-A-to-neutral-T transfer, not population validated"
                : "engineering-convention: explicit unvalidated common rule",
        ]),
      ),
      palpableLengthDiagnostics: {
        upperArmMm: arm.upperArmLength,
        forearmMm: arm.forearmLength,
        upperMechanicalMinusPalpableMm: upper - arm.upperArmLength,
        foreMechanicalMinusPalpableMm: fore - arm.forearmLength,
      },
    };
  }
  return {
    sides: sides as resolveArmIdentityPhysical.Resolved["sides"],
    state:
      "neutral T, straight elbow, palm down; no contraction or pose-dependent flesh",
    populationQualification:
      "Dimensional construction only; four central lean20 diagnostic identities do not validate a population law",
  };
}
/** Independent section inputs and the diagnostics retained by the public-identity conversion. */
export namespace resolveArmIdentityPhysical {
  /** Physical section dimensions or explicitly conventional replacements; no clinical range is inferred.
   *
   * @author Samchon
   */
  export interface Extras {
    /** Full V diameter of the relaxed upper-arm midcourse in millimetres; the other diameter solves its public circumference. */
    upperArmDepthMm: number;

    /** Full dorsal/palmar U diameter at the declared forearm maximum course in millimetres. */
    forearmDepthMm: number;

    /** Full U diameter of the elbow joint course in millimetres. */
    elbowBreadthMm: number;

    /** Full V diameter of the elbow joint course in millimetres, independent of the breadth override. */
    elbowDepthMm: number;

    /** Additional interior forearm roll in degrees, numerically admitted within [-45,45]; its sine envelope is zero at the declared maximum and nominal wrist ends. */
    forearmTwistDegrees: number;
  }

  /** Optional subject-side overrides; absent fields use ArmIdentityRules, while unknown keys are rejected. */
  export type Options = Partial<Record<"left" | "right", Partial<Extras>>>;

  /** Lengths, girths and independent section inputs consumed by one side's converter.
   *
   * @author Samchon
   */
  export interface Side {
    /** Actual shoulder-to-elbow joint-centre distance in millimetres. */
    upperArmLengthMm: number;

    /** Actual elbow-to-Hand joint-centre distance in millimetres. */
    forearmLengthMm: number;

    /** Admitted public relaxed upper-arm circumference in millimetres, assigned to the conventional midcourse. */
    upperArmCircumferenceMm: number;

    /** Admitted public forearm circumference in millimetres, assigned to the conventional quarter-segment maximum course. */
    forearmCircumferenceMm: number;

    /** Five resolved independent section inputs; values have not been calibrated against a population. */
    extras: Extras;

    /** Per-extra label distinguishing a caller-provided physical value from an engineering default; a label does not verify the caller's measurement protocol. */
    provenance: Record<string, string>;

    /** Palpable lengths and their difference from mechanical lengths; diagnostics never replace the actual joint chain. */
    palpableLengthDiagnostics: PalpableLengthDiagnostics;
  }

  /** Millimetre diagnostics distinguishing public anthropometry from model joint distances.
   *
   * @author Samchon
   */
  export interface PalpableLengthDiagnostics {
    /** Public upper-arm length reproduced by measureAutoMovieHumanSkeleton. */
    upperArmMm: number;

    /** Public forearm length reproduced by measureAutoMovieHumanSkeleton. */
    forearmMm: number;

    /** Shoulder-elbow joint distance minus public upper-arm length, in millimetres. */
    upperMechanicalMinusPalpableMm: number;

    /** Elbow-Hand joint distance minus public forearm length, in millimetres. */
    foreMechanicalMinusPalpableMm: number;
  }

  /** Resolved conversion state; it does not contain saved curves or a regenerated skeleton.
   *
   * @author Samchon
   */
  export interface Resolved {
    /** Separate subject-left and subject-right inputs, resolved from the same specimen. */
    sides: Record<"left" | "right", Side>;

    /** Declared neutral-T construction state; downstream parent-chain checks still have to establish that state. */
    state: string;

    /** Explicit limit on interpreting the dimensional construction as a population law. */
    populationQualification: string;
  }
}
