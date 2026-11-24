import { AutoMovieArchetypeUnits, createTable } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** NKBA Guideline 9: a 42 in (1067 mm) counter with a 12 in (305 mm) deep knee space; NKBA's 508 to 635 mm deep counter under it. */
const NKBA: Readonly<{
  height: number;
  knee: number;
  counter: readonly [number, number];
}> = {
  height: 1.067,
  knee: 0.305,
  counter: [0.508, 0.635],
};

/**
 * A bar counter stands at the kitchen guideline's raised height, its top reaching the guideline's knee space past its base over the seated side.
 *
 * Scenarios:
 * 1. The top, its `stack` and its `front` edge lie 1067 mm up.
 * 2. The base stands under the top's back, as deep as NKBA's counter range, and the top reaches 305 mm past the base's front on `+Z`, where a seated person's knees go.
 * 3. A service counter's top lies at Delfield's and the ADA's 36 in, 30 in deep; over 200 seeds every counter is one of Delfield's 30, 36 and 50 in lengths exactly, and each is drawn.
 * 4. A workbench's top lies at IKEA RIMFORSA's 90 to 94 cm, 120 x 63.5 cm.
 */
export function test_unit_archetypes_furniture_table_bar(): void {
  const findings: string[] = [];
  for (const seed of [0, 6, 13]) {
    const bar: ReturnType<typeof createTable> = createTable(
      { kind: "bar" },
      seed,
    );
    for (const id of ["top", "stack", "front"] as const)
      if (
        !(Math.abs(bar.affordance(id).frame.translation.y - NKBA.height) <= MM)
      )
        findings.push(`bar ${seed}: ${id} off the guideline's height`);
    const top: { low: number; high: number } = archetypeExtent(bar, "z", [
      "top",
    ]);
    const base: { low: number; high: number } = archetypeExtent(bar, "z", [
      "base",
    ]);
    if (!(Math.abs(top.high - base.high - NKBA.knee) <= MM))
      findings.push(
        `bar ${seed}: the knee space is ${top.high - base.high}, ${NKBA.knee} expected`,
      );
    if (!(Math.abs(top.low - base.low) <= MM))
      findings.push(`bar ${seed}: the base is not flush at the back`);
  }
  findings.push(
    ...archetypeBandSweep([
      {
        name: "bar counter base depth",
        measure: (seed: number): number =>
          archetypeExtent(createTable({ kind: "bar" }, seed), "z", ["base"])
            .size,
        minimum: NKBA.counter[0],
        maximum: NKBA.counter[1],
        source: "NKBA counter depth",
      },
    ]),
  );
  // 3. The service counter.
  const counter: ReturnType<typeof createTable> = createTable(
    { kind: "serviceCounter" },
    5,
  );
  if (!(Math.abs(counter.affordance("top").frame.translation.y - 0.91) <= MM))
    findings.push("the service counter is not 36 in (91 cm) high");
  if (!(Math.abs(archetypeExtent(counter, "z", ["top"]).size - 0.76) <= MM))
    findings.push("the service counter is not 30 in (76 cm) deep");
  // Over 200 seeds every service counter is one of Delfield's three lengths exactly, and each is drawn.
  const lengths: readonly number[] = [30, 36, 50].map(
    (inches: number): number => inches * AutoMovieArchetypeUnits.INCH,
  );
  const drawn: Set<number> = new Set<number>();
  for (let seed: number = 0; seed < 200; seed++) {
    const length: number = archetypeExtent(
      createTable({ kind: "serviceCounter" }, seed),
      "x",
      ["top"],
    ).size;
    const listed: number = lengths.findIndex(
      (read: number): boolean => Math.abs(read - length) <= 1e-9,
    );
    if (listed < 0)
      findings.push(
        `service counter ${seed}: ${length} m is no Delfield length`,
      );
    else drawn.add(listed);
  }
  if (drawn.size !== lengths.length)
    findings.push(`200 seeds drew ${drawn.size} of Delfield's three lengths`);
  // 4. The workbench.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "workbench height",
        measure: (seed: number): number =>
          createTable({ kind: "workbench" }, seed).affordance("top").frame
            .translation.y,
        minimum: 0.9,
        maximum: 0.94,
        source: "IKEA RIMFORSA",
      },
    ]),
  );
  const bench: ReturnType<typeof createTable> = createTable(
    { kind: "workbench" },
    5,
  );
  if (!(Math.abs(archetypeExtent(bench, "x", ["top"]).size - 1.2) <= MM))
    findings.push("the workbench is not 120 cm long");
  if (!(Math.abs(archetypeExtent(bench, "z", ["top"]).size - 0.635) <= MM))
    findings.push("the workbench is not 63.5 cm deep");
  TestValidator.equals(
    "a bar counter stands at the guideline's height with its knee space",
    findings,
    [],
  );
}
