import { createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieBodyMeasure,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ARMOUR_RECORDS } from "../internal/ARMOUR_RECORDS";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Each piece of armour fits every body of the sweep around the part it covers, and is its museum record unfitted.
 *
 * Scenarios:
 * 1. Every kind, fitted to each of the 14 bodies of the sweep (their `measure`), encloses its body part with a clearance inside its fit band: a helmet's ball is the head's radius plus the padding plus a plate of 1.5 to 3 mm (Williams); a cuirass's box is the chest's breadth and depth plus a plate on each side, from the waist to the shoulders; a mail shirt's is the chest's breadth and depth over its record's length; a gauntlet's, a vambrace's and a greave's bar is the hand's, the forearm's or the shank's length around the forearm's or the shank's radius plus a plate.
 * 2. Every read piece of every kind, unfitted, is its Metropolitan Museum record's box and mass (`ARMOUR_RECORDS`, written from the museum's records), and passes `validateModel`; the producer reads exactly the museum's pieces, in that order.
 * 3. Each kind rides its bone: a helmet the head, a cuirass and mail the chest, a gauntlet a hand, a vambrace a lower arm and a greave a lower leg, on the side given.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fits every kind to real bodies and reads the produced part's own shape against each body's measure, and every record unfitted; a piece sized by a guess, a plate outside its band, or a piece on the wrong bone is caught.
 * @evidence contracts/development/testing.md#independent-expectations The clearances are the cited bands, written here, and the records' figures the museum's, written in `ARMOUR_RECORDS`, not read from the producer; the body's measure is the prepared polygon man's.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight kinds on fourteen bodies, every read piece, both sides of a limb piece.
 * @evidence contracts/development/testing.md#execution-ownership Prepares the fourteen polygon men of the sweep and builds the pieces in memory; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_armour_fit(): void {
  const findings: string[] = [];
  const PLATE: readonly [number, number] = [0.0015, 0.003];
  const PAD: number = 0.75 * 0.0254;
  const EPSILON: number = 1e-9;
  const shape = (
    piece: ReturnType<typeof createArmour>,
  ): AutoMoviePrimitiveShape => {
    const part: IAutoMovieModelPart = piece.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === "piece",
    )!;
    if (part.geometry.type !== "primitive")
      throw new Error("an armour piece is not a primitive");
    return part.geometry.shape;
  };
  const inside = (value: number, low: number, high: number): boolean =>
    value >= low - EPSILON && value <= high + EPSILON;

  // 1. Fitted to every body.
  for (const name of motionHumanBody.SWEEP) {
    const m: IAutoMovieBodyMeasure = motionHumanBody(name).measure;
    for (const kind of createArmour.KINDS) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        measure: m,
      });
      const s: AutoMoviePrimitiveShape = shape(piece);
      const label: string = `${kind} on ${name}`;
      if (
        kind === "openHelmet" ||
        kind === "closedHelmet" ||
        kind === "brimmedHelmet"
      ) {
        if (
          s.type !== "sphere" ||
          !inside(s.radius - m.headRadius, PAD + PLATE[0], PAD + PLATE[1])
        )
          findings.push(
            `${label}: ${JSON.stringify(s)} round a head of ${m.headRadius} m`,
          );
      } else if (kind === "cuirass" || kind === "mail") {
        const plate: readonly [number, number] =
          kind === "mail" ? [0, 0] : PLATE;
        const height: number =
          kind === "mail"
            ? piece.dimensions.height!
            : m.shoulderHeight - m.waistHeight;
        if (
          s.type !== "box" ||
          !inside(s.width - m.chestBreadth, 2 * plate[0], 2 * plate[1]) ||
          !inside(s.depth - m.chestDepth, 2 * plate[0], 2 * plate[1]) ||
          Math.abs(s.height - height) > EPSILON
        )
          findings.push(
            `${label}: ${JSON.stringify(s)} round a chest ${m.chestBreadth} by ${m.chestDepth} m`,
          );
      } else {
        const radius: number =
          kind === "greave" ? m.shankRadius : m.forearmRadius;
        const length: number =
          kind === "greave"
            ? m.shank
            : kind === "vambrace"
              ? m.forearm
              : m.hand;
        if (
          s.type !== "cylinder" ||
          !inside(s.radius - radius, PLATE[0], PLATE[1]) ||
          Math.abs(s.height - length) > EPSILON
        )
          findings.push(
            `${label}: ${JSON.stringify(s)} round a limb of ${radius} m over ${length} m`,
          );
      }
    }
  }

  // 2. Every read piece unfitted: the museum's record's box and mass, and no piece the museum's list lacks.
  for (const kind of createArmour.KINDS) {
    const records: Readonly<
      Record<string, readonly [number, number, number, number]>
    > = ARMOUR_RECORDS[kind]!;
    const produced: string[] = Object.keys(createArmour.MODELS[kind]);
    if (JSON.stringify(produced) !== JSON.stringify(Object.keys(records)))
      findings.push(`${kind}: reads ${produced.join(", ")}`);
    for (const [model, [h, w, dp, g]] of Object.entries(records)) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        model: model as createArmour.Model,
      });
      const s: AutoMoviePrimitiveShape = shape(piece);
      if (!validateModel({ model: piece }).success)
        findings.push(`${kind} ${model}: not admitted`);
      if (
        s.type !== "box" ||
        Math.abs(s.height - h / 100) > EPSILON ||
        Math.abs(s.width - w / 100) > EPSILON ||
        Math.abs(s.depth - dp / 100) > EPSILON ||
        Math.abs(piece.body.mass - g / 1000) > EPSILON
      )
        findings.push(
          `${kind} ${model}: ${JSON.stringify(s)}, ${piece.body.mass} kg`,
        );
    }
  }

  // 3. The bones.
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
      findings.push(
        `${kind} rides ${createArmour.bone(kind, "left")} and ${createArmour.bone(kind, "right")}`,
      );
  TestValidator.equals(
    "armour fits every body and is its record unfitted",
    findings,
    [],
  );
}
