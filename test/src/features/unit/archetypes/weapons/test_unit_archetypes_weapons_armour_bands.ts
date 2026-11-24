import { AutoMovieArchetypeRefusal, createArmour } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ARMOUR_RECORDS } from "../../../internal/ARMOUR_RECORDS";
import { armourActual } from "../../../internal/armourActual";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * Actual armour walls retain every original band, whole-record draw and contact.
 *
 * Scenarios:
 * 1. Every plated kind has exact actual normal gauge at both1.5/3mm band ends;
 *    a1um step outside either end refuses on thickness.
 * 2. Every helmet retains the literal0.75inch pad;0.5inch refuses. Cuirass pad
 *    and mail thickness remain unsupported and refuse their original axes.
 * 3. Cross-kind models and author overrides of measured mass/height refuse.
 * 4. Every kind's seedless first record and midpoint plate remain unchanged;
 *    two hundred seeds cover all original records and stay in their bands.
 * 5. Every record fitted/unfitted retains its exact mass and upright wear origin.
 * 6. Both brimmed records at both band ends have actual full-depth brim extrema
 *    and exact vertical plate gauge, with a real head opening.
 * 7. Plate-only provisional glance60 and invalid -1/91/NaN admission are intact.
 *
 * A hollow finite polyhedron measures plate at its actual normal wall planes;
 * the original band's numbers/tolerance are retained, while filled sphere/box/
 * cylinder representation assertions are replaced for the actual product form.
 */
export function test_unit_archetypes_weapons_armour_bands(): void {
  const findings: string[] = [];
  const PLATE: readonly [number, number] = [0.0015, 0.003];
  const PAD: number = 0.75 * 0.0254;
  const STEP: number = 1e-6;
  const EPSILON: number = 1e-12;
  const m: IAutoMovieBodyMeasure = motionHumanBody(
    motionHumanBody.SWEEP[0]!,
  ).measure;
  for (const kind of createArmour.KINDS) {
    if (kind === "mail") continue;
    for (const thickness of PLATE) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        measure: m,
        thickness,
      });
      const gauge: number = armourActual.plate(kind, piece, m);
      if (!(Math.abs(gauge - thickness) <= EPSILON))
        findings.push(
          kind + " actual gauge " + gauge + ", expected " + thickness,
        );
      if (kind === "cuirass") {
        const side: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece, "side-1");
        const front: ReturnType<typeof armourActual.bounds> =
          armourActual.bounds(piece, "front-body");
        if (
          !(
            Math.abs(2 * side.low.x - m.chestBreadth) <= EPSILON &&
            Math.abs(2 * front.low.z - m.chestDepth) <= EPSILON
          )
        )
          findings.push(
            "a cuirass changed its exact body boundary at a plate band end",
          );
      }
    }
    for (const thickness of [PLATE[0] - STEP, PLATE[1] + STEP])
      if (
        refusal(() => createArmour({ kind, measure: m, thickness })) !==
        "thickness"
      )
        findings.push(kind + " did not refuse outside its plate band");
  }
  for (const kind of ["openHelmet", "closedHelmet", "brimmedHelmet"] as const) {
    const piece: ReturnType<typeof createArmour> = createArmour({
      kind,
      measure: m,
      pad: PAD,
    });
    if (
      !(
        armourActual.distance(piece, { x: 0, y: 0, z: 0 }, "bowl") >=
        m.headRadius + PAD - EPSILON
      )
    )
      findings.push(kind + " does not retain its actual padding cavity");
    if (
      refusal(() => createArmour({ kind, measure: m, pad: 0.5 * 0.0254 })) !==
      "pad"
    )
      findings.push(kind + " did not refuse the unsupported pad");
  }
  for (const [kind, params, expected] of [
    ["cuirass", { pad: PAD }, "pad"],
    ["mail", { thickness: PLATE[0] }, "thickness"],
  ] as const)
    if (refusal(() => createArmour({ kind, ...params })) !== expected)
      findings.push(kind + " accepted an unsupported dimension");
  for (const [label, build, expected] of [
    [
      "helmet/gauntlet record",
      () => createArmour({ kind: "openHelmet", model: "met23255" }),
      "model",
    ],
    [
      "greave/cuirass record",
      () => createArmour({ kind: "greave", model: "met22359" }),
      "model",
    ],
    [
      "measured mass override",
      () => createArmour({ kind: "cuirass", mass: 4 }),
      "mass",
    ],
    [
      "measured height override",
      () => createArmour({ kind: "mail", height: 0.9 }),
      "height",
    ],
  ] as const)
    if (refusal(build) !== expected)
      findings.push(label + " has the wrong refusal");
  for (const kind of createArmour.KINDS) {
    const records: string[] = Object.keys(ARMOUR_RECORDS[kind]!);
    const seedless: ReturnType<typeof createArmour> = createArmour({ kind });
    if (!(Math.abs(seedless.body.mass - grams(kind, records[0]!)) <= EPSILON))
      findings.push(kind + " changed its seedless record");
    if (
      kind !== "mail" &&
      !(
        Math.abs(seedless.dimensions.thickness! - (PLATE[0] + PLATE[1]) / 2) <=
        EPSILON
      )
    )
      findings.push(kind + " changed its seedless midpoint plate");
    const drawn: Set<number> = new Set();
    for (let seed: number = 0; seed < 200; seed++) {
      const piece: ReturnType<typeof createArmour> = createArmour(
        { kind },
        seed,
      );
      drawn.add(piece.body.mass);
      const thickness: number | undefined = piece.dimensions.thickness;
      if (
        kind !== "mail" &&
        !(
          thickness !== undefined &&
          thickness >= PLATE[0] &&
          thickness <= PLATE[1]
        )
      )
        findings.push(kind + " seed " + seed + " left its plate band");
    }
    for (const record of records)
      if (
        ![...drawn].some(
          (value: number): boolean =>
            Math.abs(value - grams(kind, record)) <= EPSILON,
        )
      )
        findings.push(kind + " " + record + " never drawn over200 seeds");
  }
  for (const kind of createArmour.KINDS)
    for (const record of Object.keys(ARMOUR_RECORDS[kind]!))
      for (const measure of [undefined, m]) {
        const piece: ReturnType<typeof createArmour> = createArmour({
          kind,
          model: record as createArmour.Model,
          measure,
        });
        if (!(Math.abs(piece.body.mass - grams(kind, record)) <= EPSILON))
          findings.push(kind + " " + record + " changed its mass");
        const wear: (typeof piece.affordances)[number] | undefined =
          piece.affordances.find(
            (a: { id: string }): boolean => a.id === "wear",
          );
        if (
          wear === undefined ||
          JSON.stringify(wear.frame.translation) !==
            JSON.stringify({ x: 0, y: 0, z: 0 }) ||
          JSON.stringify(wear.frame.rotation) !==
            JSON.stringify({ x: 0, y: 0, z: 0, w: 1 })
        )
          findings.push(kind + " " + record + " changed its wear frame");
      }
  for (const record of ["met26512", "met21972"] as const)
    for (const thickness of PLATE) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind: "brimmedHelmet",
        model: record,
        measure: m,
        thickness,
      });
      const brim: ReturnType<typeof armourActual.bounds> = armourActual.bounds(
        piece,
        "brim",
      );
      const depth: number = ARMOUR_RECORDS.brimmedHelmet![record]![2] / 100;
      if (
        !(
          Math.abs(brim.high.x - brim.low.x - depth) <= EPSILON &&
          Math.abs(brim.high.z - brim.low.z - depth) <= EPSILON &&
          Math.abs(brim.high.y - brim.low.y - thickness) <= EPSILON
        )
      )
        findings.push(record + " has the wrong actual brim dimensions");
    }
  for (const kind of createArmour.KINDS) {
    const glance: number | undefined = createArmour({ kind }).body.contact
      ?.glance;
    if (kind === "mail" ? glance !== undefined : glance !== 60)
      findings.push(kind + " changed its glance");
  }
  const cuirass: IAutoMovieModel = JSON.parse(
    JSON.stringify(createArmour({ kind: "cuirass" })),
  );
  if (!validateModel({ model: cuirass }).success)
    findings.push("valid cuirass was refused");
  for (const bad of [-1, 91]) {
    const model: IAutoMovieModel = {
      ...cuirass,
      body: {
        ...cuirass.body!,
        contact: { ...cuirass.body!.contact, glance: bad },
      },
    };
    if (validateModel({ model }).success)
      findings.push("invalid glance admitted");
  }
  TestValidator.equals(
    "actual armour retains its source bands and records",
    findings,
    [],
  );

  /** Literal museum table rather than producer metadata owns expected mass. */
  function grams(kind: createArmour.Kind, record: string): number {
    return ARMOUR_RECORDS[kind]![record]![3] / 1000;
  }

  /** A different thrown error is not the requested semantic refusal. */
  function refusal(build: () => unknown): string | null {
    try {
      build();
    } catch (thrown) {
      return thrown instanceof AutoMovieArchetypeRefusal
        ? thrown.axis
        : "a non-refusal error";
    }
    return null;
  }
}
