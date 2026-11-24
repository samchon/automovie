import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
} from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type {
  AutoMovieHumanSide,
  AutoMovieVector3Tuple,
} from "@automovie/interface";

import { FamilyConicNeutralCases as Cases } from "../../../reference-conics/FamilyConicNeutralCases";

/**
 * The exact neutral cases exercise the current body law's own numerical inputs
 * before any shell is built. A changed bone cannot be replaced by a skin-site
 * height change.
 *
 * Scenarios:
 *
 * 1. Twenty distinct length identifiers, a neutral and two tissue variants use
 *    their prescribed scales.
 * 2. The actual humerus, forearm, femur and tibia move by the declared ratio. The
 *    neighbouring span and floor-relative ankle stay fixed.
 * 3. Both hands and feet retain independent declared dimensions. The affected
 *    breadth or length moves without changing the orthogonal dimension.
 * 4. Every native finger and toe phalanx changes by the exact ratio around its
 *    held root. The thumb's metacarpal is outside the request.
 * 5. The tissue cases change only body-fat input, preserving skeletal and
 *    surface-dimension inputs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves each case through the production source and canonical limb-rest requests, measuring actual spans from the resulting coordinate records.
 * @evidence contracts/development/testing.md#independent-expectations Euclidean distance defines each bone. The explicit case ratio determines the expected length, and the unchanged dimension equals the baseline.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes both directions, independent and grouped long bones, sole-relative ankle, per-digit rows and measured surface dimensions.
 * @evidence contracts/development/testing.md#execution-ownership One lightweight prepared source context per case. No realized surface, render or asset enters.
 * @evidence contracts/development/common.md#meaningful-documentation States the case count, held landmarks and source-only scope.
 */
export function test_human_neutral_lengths(): void {
  const base = AutoMovieHumanNeutralParameters;
  const reference = AutoMovieHumanBodyLaw.prepareSources(base);
  const fixed = reference.limbRest();
  const fat: number = AutoMovieHumanBodyAnatomy.resolve(base).bodyFatPercentage;
  const change: ReturnType<typeof Cases.prepare> = Cases.prepare(base);
  const findings: string[] = [];

  // Subtracting whole-body coordinate components can lose several ulps. A
  // nanometre is far larger than that error at the represented stature.
  const tolerance: number = 1e-6;
  const check = (
    caseId: string,
    field: string,
    actual: number,
    expected: number,
  ): void => {
    if (!(Math.abs(actual - expected) <= tolerance))
      findings.push(`${caseId} ${field}: got ${actual}, expected ${expected}`);
  };
  if (
    Cases.CASES.length !== 23 ||
    new Set(Cases.CASES.map((row): string => row.id)).size !== 23
  )
    findings.push(
      "the neutral round does not contain the 20 distinct length cases, two tissue cases and baseline",
    );

  for (const row of Cases.CASES) {
    const parameters = change(row);
    const source = AutoMovieHumanBodyLaw.prepareSources(parameters);
    const rest = source.limbRest();
    const ratio = (field: string): number =>
      row.field === field ? row.ratio : 1;
    const long = (field: string): number =>
      row.field === field || row.field === "limbs" ? row.ratio : 1;
    const size = (name: string, actual: number, original: number): void =>
      check(row.id, name, actual, original * ratio(name));
    const length = (name: string, actual: number, original: number): void =>
      check(row.id, name, actual, original * long(name));

    for (const side of [
      "left",
      "right",
    ] as const satisfies readonly AutoMovieHumanSide[]) {
      const beforeArm = fixed.arm(side);
      const afterArm = rest.arm(side);
      const beforeLeg = fixed.leg(side);
      const afterLeg = rest.leg(side);
      const dist: typeof Cases.distance = Cases.distance;
      length(
        "upperArm",
        dist(afterArm.bones.shoulder, afterArm.bones.elbow),
        dist(beforeArm.bones.shoulder, beforeArm.bones.elbow),
      );
      length(
        "forearm",
        dist(afterArm.bones.elbow, afterArm.bones.wrist),
        dist(beforeArm.bones.elbow, beforeArm.bones.wrist),
      );
      length(
        "thigh",
        dist(afterLeg.hip, afterLeg.knee),
        dist(beforeLeg.hip, beforeLeg.knee),
      );
      length(
        "shank",
        dist(afterLeg.knee, afterLeg.ankle),
        dist(beforeLeg.knee, beforeLeg.ankle),
      );
      check(
        row.id,
        "ankle height on standing floor",
        afterLeg.ankle[1],
        beforeLeg.ankle[1],
      );
      check(
        row.id,
        "local foot ankle datum",
        afterLeg.foot.ankle[1],
        beforeLeg.foot.ankle[1],
      );
      size(
        "handLength",
        source.limbs.arms[side].length,
        reference.limbs.arms[side].length,
      );
      size(
        "handBreadth",
        source.limbs.arms[side].breadth,
        reference.limbs.arms[side].breadth,
      );
      size(
        "footLength",
        source.limbs.feet[side].length,
        reference.limbs.feet[side].length,
      );
      size(
        "footBreadth",
        source.limbs.feet[side].breadth,
        reference.limbs.feet[side].breadth,
      );

      if (row.field === "phalanges") {
        const digit = (
          name: string,
          before: readonly AutoMovieVector3Tuple[],
          after: readonly AutoMovieVector3Tuple[],
          start: number,
        ): void => {
          check(row.id, name + " root", dist(after[start]!, before[start]!), 0);
          for (let bone: number = start; bone + 1 < before.length; bone++)
            check(
              row.id,
              name + " phalanx",
              dist(after[bone]!, after[bone + 1]!),
              row.ratio * dist(before[bone]!, before[bone + 1]!),
            );
        };
        for (const finger of ["Index", "Middle", "Ring", "Little"] as const)
          digit(
            finger,
            beforeArm.hand.fingers[finger].centres,
            afterArm.hand.fingers[finger].centres,
            0,
          );
        digit(
          "thumb",
          beforeArm.hand.thumb.centres,
          afterArm.hand.thumb.centres,
          1,
        );
        check(
          row.id,
          "thumb metacarpal",
          dist(
            afterArm.hand.thumb.centres[0]!,
            beforeArm.hand.thumb.centres[0]!,
          ),
          0,
        );
        for (const [toe, original] of beforeLeg.foot.toes.entries())
          digit("toe " + toe, original, afterLeg.foot.toes[toe]!, 0);
      }
    }
    check(
      row.id,
      "body fat percentage",
      AutoMovieHumanBodyAnatomy.resolve(parameters).bodyFatPercentage,
      ratio("tissue") * fat,
    );
  }

  if (findings.length !== 0) throw new Error(findings.join("\n"));
}
