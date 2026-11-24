import { createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ARMOUR_RECORDS } from "../internal/ARMOUR_RECORDS";
import { armourActual } from "../internal/armourActual";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Actual armour walls retain every canonical body fit and literal museum record.
 *
 * Scenarios:
 * 1. Eight kinds fit all fourteen canonical bodies: actual helmet/limb planes
 *    retain their exact inner body/pad boundary and1.5–3mm normal plate gauge;
 *    torso inner breadth/depth and its covered height retain their definitions.
 * 2. All nineteen unfitted records retain their independently written H/W/D,
 *    total mass, original model order and model admission on actual geometry.
 * 3. The unchanged bone mapping handles both sides of every limb piece.
 *
 * Filled primitive-type assertions become actual wall-plane measurements.
 * Polygon corners are not a curved primitive's radius. Mail's positive wall
 * lies outside its exact body boundary; a gauntlet's forearm radius fits its
 * cuff, rather than an unmeasured palm/thumb.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names all original body, record and binding scenarios and the actual-wall representation migration without weakening numerical expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public construction, engine admission and independent actual mesh/hull observations over all original bodies/records; catches wrong padding, normal gauge, torso cavity, length, record envelope/mass/order or bones.
 * @evidence contracts/development/testing.md#independent-expectations Existing1.5/3mm plate and0.75inch pad remain literal; ARMOUR_RECORDS remains the independent museum table and canonical prepared body measures remain the fit inputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight kinds on fourteen bodies, all nineteen records, hollow form families, both limb sides and explicit mail/hand fitting sites.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory production and numerical observations; no renderer or external host.
 */
export function test_archetype_armour_fit(): void {
  const findings: string[] = [];
  const PLATE: readonly [number, number] = [0.0015, 0.003];
  const EPSILON: number = 1e-9;
  for (const name of motionHumanBody.SWEEP) {
    const m: IAutoMovieBodyMeasure = motionHumanBody(name).measure;
    for (const kind of createArmour.KINDS) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        measure: m,
      });
      const gauge: number = armourActual.plate(kind, piece, m);
      const label: string = kind + " on " + name;
      if (
        kind !== "mail" &&
        !(gauge >= PLATE[0] - EPSILON && gauge <= PLATE[1] + EPSILON)
      )
        findings.push(label + ": actual normal plate gauge " + gauge);
      if (kind === "cuirass" || kind === "mail") {
        const side: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece, "side-1");
        const front: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece, "front-body");
        const actual: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece);
        const height: number =
          kind === "mail"
            ? piece.dimensions.height!
            : m.shoulderHeight - m.waistHeight;
        if (
          !(
            Math.abs(2 * side.low.x - m.chestBreadth) <= EPSILON &&
            Math.abs(2 * front.low.z - m.chestDepth) <= EPSILON &&
            Math.abs(actual.high.y - actual.low.y - height) <= EPSILON
          )
        )
          findings.push(
            label +
              ": actual torso inner boundary or length differs from its body",
          );
      } else if (!kind.endsWith("Helmet")) {
        const actual: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece);
        const length: number =
          kind === "greave"
            ? m.shank
            : kind === "vambrace"
              ? m.forearm
              : m.hand;
        if (!(Math.abs(actual.high.y - actual.low.y - length) <= EPSILON))
          findings.push(
            label +
              ": actual length " +
              (actual.high.y - actual.low.y) +
              ", body " +
              length,
          );
      }
    }
  }
  for (const kind of createArmour.KINDS) {
    const records: Readonly<
      Record<string, readonly [number, number, number, number]>
    > = ARMOUR_RECORDS[kind]!;
    const produced: string[] = Object.keys(createArmour.MODELS[kind]);
    if (JSON.stringify(produced) !== JSON.stringify(Object.keys(records)))
      findings.push(kind + ": reads " + produced.join(", "));
    for (const [model, [height, width, depth, grams]] of Object.entries(
      records,
    )) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        model: model as createArmour.Model,
      });
      const actual: ReturnType<typeof armourActual.bounds> =
        armourActual.bounds(piece);
      if (!validateModel({ model: piece }).success)
        findings.push(kind + " " + model + ": not admitted");
      if (
        !(
          Math.abs(actual.high.y - actual.low.y - height / 100) <= EPSILON &&
          Math.abs(actual.high.x - actual.low.x - width / 100) <= EPSILON &&
          Math.abs(actual.high.z - actual.low.z - depth / 100) <= EPSILON &&
          Math.abs(piece.body.mass - grams / 1000) <= EPSILON
        )
      )
        findings.push(
          kind +
            " " +
            model +
            ": actual envelope " +
            JSON.stringify(actual) +
            ", mass " +
            piece.body.mass,
        );
    }
  }
  const bones: Readonly<Record<createArmour.Kind, readonly [string, string]>> =
    {
      openHelmet: ["head", "head"],
      closedHelmet: ["head", "head"],
      brimmedHelmet: ["head", "head"],
      cuirass: ["chest", "chest"],
      mail: ["chest", "chest"],
      gauntlet: ["leftHand", "rightHand"],
      vambrace: ["leftLowerArm", "rightLowerArm"],
      greave: ["leftLowerLeg", "rightLowerLeg"],
    };
  for (const kind of createArmour.KINDS)
    if (
      createArmour.bone(kind, "left") !== bones[kind][0] ||
      createArmour.bone(kind, "right") !== bones[kind][1]
    )
      findings.push(kind + " has the wrong wear bone");
  TestValidator.equals(
    "actual armour retains every source fit and record",
    findings,
    [],
  );
}
