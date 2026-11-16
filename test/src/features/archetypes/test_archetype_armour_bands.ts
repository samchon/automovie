import { ArchetypeRefusal, createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieBodyMeasure,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ARMOUR_RECORDS } from "../internal/ARMOUR_RECORDS";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Each piece of armour's plate and padding sit at their band ends and are refused past them, its read pieces are drawn whole, and it carries its record's mass and its `wear` place.
 *
 * Scenarios:
 * 1. Every plated kind, fitted to the sweep's first body with its plate fixed at 1.5 mm and at 3 mm, the ends of Williams's breastplate band, clears its body part by exactly that plate (twice it across a cuirass); fixed 1 µm thinner or thicker it is refused on `thickness`.
 * 2. A helmet's padding fixed at ¾ in, the only value of its band, is admitted; ½ in is refused on `pad`. A cuirass, which has no padding, refuses a padding; a mail shirt, which has no plate band, refuses a plate.
 * 3. A read piece of another kind is refused on `model`; a mass or a height, which every record gives, is refused on that dimension.
 * 4. Seedless, each kind is its first record, its plate the band's middle, 2.25 mm; over 200 seeds every record of every kind is drawn and every plate stays in its band.
 * 5. Fitted or not, every piece weighs its record, and its `wear` place is the origin, upright.
 * 6. A brimmed helmet's brim is a disc as wide as its record's depth and as thick as its plate, for both read pieces.
 * 7. Every plate piece's body glances a projectile struck beyond 60 degrees from its normal, Jones's bodkin test on 1.5 mm plate as Hardy's Longbow quotes it; a mail shirt declares no glance; a cuirass with it is admitted, and a glance of -1, 91 or NaN degrees is refused by `validateModel`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real pieces at and past their band ends and reads the produced parts' shapes, the refusals' axes, the drawn records and the `wear` frame; a plate clamped instead of refused, a band end off by a step, a record never drawn or a brim of the wrong width is caught.
 * @evidence contracts/development/testing.md#independent-expectations The band ends are Williams's 1.5 and 3 mm and the US Army's ¾ in pad, written here; the masses, depths and the records' order the Metropolitan Museum's records, written in `ARMOUR_RECORDS`, not read from the producer.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends of every plated kind and a step past each, a pad off its value, four kinds of misplaced parameter, the seedless and seeded draws, fitted and unfitted, and both brimmed records.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man of the sweep and builds the pieces in memory; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios and what each pins.
 */
export function test_archetype_armour_bands(): void {
  const findings: string[] = [];
  const PLATE: readonly [number, number] = [0.0015, 0.003];
  const PAD: number = 0.75 * 0.0254;
  const STEP: number = 1e-6;
  const EPSILON: number = 1e-12;
  const m: IAutoMovieBodyMeasure = motionHumanBody(
    motionHumanBody.SWEEP[0]!,
  ).measure;
  const part = (
    piece: ReturnType<typeof createArmour>,
    id: string,
  ): AutoMoviePrimitiveShape | undefined => {
    const found: IAutoMovieModelPart | undefined = piece.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === id,
    );
    return found?.geometry.type === "primitive"
      ? found.geometry.shape
      : undefined;
  };
  const refusal = (build: () => unknown): string | null => {
    try {
      build();
    } catch (thrown) {
      return thrown instanceof ArchetypeRefusal
        ? thrown.axis
        : "a non-refusal error";
    }
    return null;
  };

  // 1. The plate at both ends of its band, and a step past each.
  const clearance = (
    kind: createArmour.Kind,
    s: AutoMoviePrimitiveShape | undefined,
  ): number | null => {
    if (s === undefined) return null;
    if (
      kind === "openHelmet" ||
      kind === "closedHelmet" ||
      kind === "brimmedHelmet"
    )
      return s.type === "sphere" ? s.radius - m.headRadius - PAD : null;
    if (kind === "cuirass")
      return s.type === "box" ? (s.width - m.chestBreadth) / 2 : null;
    if (kind === "greave")
      return s.type === "cylinder" ? s.radius - m.shankRadius : null;
    return s.type === "cylinder" ? s.radius - m.forearmRadius : null;
  };
  for (const kind of createArmour.KINDS) {
    if (kind === "mail") continue;
    for (const thickness of PLATE) {
      const got: number | null = clearance(
        kind,
        part(createArmour({ kind, measure: m, thickness }), "piece"),
      );
      if (got === null || Math.abs(got - thickness) > EPSILON)
        findings.push(
          `${kind} with a ${thickness} m plate clears its body part by ${got} m`,
        );
    }
    for (const thickness of [PLATE[0] - STEP, PLATE[1] + STEP]) {
      const axis: string | null = refusal(() =>
        createArmour({ kind, measure: m, thickness }),
      );
      if (axis !== "thickness")
        findings.push(
          `${kind} with a ${thickness} m plate: refused on ${axis}`,
        );
    }
  }

  // 2. The padding, and dimensions a kind does not have.
  for (const kind of ["openHelmet", "closedHelmet", "brimmedHelmet"] as const) {
    const s: AutoMoviePrimitiveShape | undefined = part(
      createArmour({ kind, measure: m, pad: PAD }),
      "piece",
    );
    if (
      s?.type !== "sphere" ||
      s.radius - m.headRadius - PAD < PLATE[0] - EPSILON
    )
      findings.push(`${kind} with a ¾ in pad: ${JSON.stringify(s)}`);
    const axis: string | null = refusal(() =>
      createArmour({ kind, measure: m, pad: 0.5 * 0.0254 }),
    );
    if (axis !== "pad")
      findings.push(`${kind} with a ½ in pad: refused on ${axis}`);
  }
  for (const [kind, params, expected] of [
    ["cuirass", { pad: PAD }, "pad"],
    ["mail", { thickness: PLATE[0] }, "thickness"],
  ] as const) {
    const axis: string | null = refusal(() =>
      createArmour({ kind, ...params }),
    );
    if (axis !== expected)
      findings.push(
        `${kind} given ${JSON.stringify(params)}: refused on ${axis}`,
      );
  }

  // 3. Another kind's record, and a figure every record gives.
  for (const [label, build, expected] of [
    [
      "a helmet given a gauntlet's record",
      () => createArmour({ kind: "openHelmet", model: "met23255" }),
      "model",
    ],
    [
      "a greave given a cuirass's record",
      () => createArmour({ kind: "greave", model: "met22359" }),
      "model",
    ],
    [
      "a cuirass given a mass",
      () => createArmour({ kind: "cuirass", mass: 4 }),
      "mass",
    ],
    [
      "a mail shirt given a length",
      () => createArmour({ kind: "mail", height: 0.9 }),
      "height",
    ],
  ] as const) {
    const axis: string | null = refusal(build);
    if (axis !== expected) findings.push(`${label}: refused on ${axis}`);
  }

  // 4. Seedless and seeded draws.
  const grams = (kind: createArmour.Kind, record: string): number =>
    ARMOUR_RECORDS[kind]![record]![3] / 1000;
  for (const kind of createArmour.KINDS) {
    const records: string[] = Object.keys(ARMOUR_RECORDS[kind]!);
    const seedless: ReturnType<typeof createArmour> = createArmour({ kind });
    if (Math.abs(seedless.body.mass - grams(kind, records[0]!)) > EPSILON)
      findings.push(
        `${kind} seedless weighs ${seedless.body.mass} kg, not its first record's ${grams(kind, records[0]!)} kg`,
      );
    if (
      kind !== "mail" &&
      Math.abs(seedless.dimensions.thickness! - (PLATE[0] + PLATE[1]) / 2) >
        EPSILON
    )
      findings.push(
        `${kind} seedless has a ${seedless.dimensions.thickness} m plate`,
      );
    const drawn: Set<number> = new Set();
    for (let seed: number = 0; seed < 200; ++seed) {
      const piece: ReturnType<typeof createArmour> = createArmour(
        { kind },
        seed,
      );
      drawn.add(piece.body.mass);
      const t: number | undefined = piece.dimensions.thickness;
      if (kind !== "mail" && (t === undefined || t < PLATE[0] || t > PLATE[1]))
        findings.push(`${kind} seed ${seed} has a ${t} m plate`);
    }
    for (const record of records) {
      const mass: number = grams(kind, record);
      if (
        ![...drawn].some((d: number): boolean => Math.abs(d - mass) <= EPSILON)
      )
        findings.push(`${kind} ${record} is never drawn over 200 seeds`);
    }
  }

  // 5. The record's mass and the `wear` place, fitted or not.
  for (const kind of createArmour.KINDS)
    for (const record of Object.keys(ARMOUR_RECORDS[kind]!))
      for (const measure of [undefined, m]) {
        const piece: ReturnType<typeof createArmour> = createArmour({
          kind,
          model: record as createArmour.Model,
          measure,
        });
        const label: string = `${kind} ${record} ${measure === undefined ? "unfitted" : "fitted"}`;
        if (Math.abs(piece.body.mass - grams(kind, record)) > EPSILON)
          findings.push(
            `${label} weighs ${piece.body.mass} kg, its record ${grams(kind, record)} kg`,
          );
        const wear = piece.affordances.find(
          (a: { id: string }): boolean => a.id === "wear",
        );
        if (
          wear === undefined ||
          JSON.stringify(wear.frame.translation) !==
            JSON.stringify({ x: 0, y: 0, z: 0 }) ||
          JSON.stringify(wear.frame.rotation) !==
            JSON.stringify({ x: 0, y: 0, z: 0, w: 1 })
        )
          findings.push(`${label}: wear ${JSON.stringify(wear?.frame)}`);
      }

  // 6. The brim.
  for (const record of ["met26512", "met21972"] as const) {
    for (const thickness of PLATE) {
      const brim: AutoMoviePrimitiveShape | undefined = part(
        createArmour({
          kind: "brimmedHelmet",
          model: record,
          measure: m,
          thickness,
        }),
        "brim",
      );
      const depth: number = ARMOUR_RECORDS.brimmedHelmet![record]![2] / 100;
      if (
        brim?.type !== "cylinder" ||
        Math.abs(2 * brim.radius - depth) > EPSILON ||
        Math.abs(brim.height - thickness) > EPSILON
      )
        findings.push(
          `a brimmed helmet ${record} with a ${thickness} m plate: brim ${JSON.stringify(brim)}, ${depth} m deep`,
        );
    }
  }
  // 7. A plate glances a projectile struck beyond 60 degrees from its normal (Jones's bodkin on 1.5 mm plate, quoted in Hardy's Longbow); mail declares no glance; the engine admits the angle only from 0 to 90 degrees.
  for (const kind of createArmour.KINDS) {
    const piece: ReturnType<typeof createArmour> = createArmour({ kind });
    const glance: number | undefined = piece.body.contact?.glance;
    if (kind === "mail" ? glance !== undefined : glance !== 60)
      findings.push(`${kind} glances at ${glance} degrees`);
  }
  const cuirass: IAutoMovieModel = JSON.parse(
    JSON.stringify(createArmour({ kind: "cuirass" })),
  ) as IAutoMovieModel;
  if (!validateModel({ model: cuirass }).success)
    findings.push("a cuirass with its glance is not admitted");
  for (const bad of [-1, 91, Number.NaN]) {
    const model: IAutoMovieModel = {
      ...cuirass,
      body: {
        ...cuirass.body!,
        contact: { ...cuirass.body!.contact, glance: bad },
      },
    };
    if (validateModel({ model }).success)
      findings.push(`a glance of ${bad} degrees is admitted`);
  }
  TestValidator.equals(
    "armour stays in its bands and is drawn whole",
    findings,
    [],
  );
}
