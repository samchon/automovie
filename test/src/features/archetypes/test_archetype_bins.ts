import { AutoMovieArchetypeUnits, createBin } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** SULO's 240 and 360 L bins: width, bin depth, bin height, total height, total depth and handle width, metres. */
const SULO: Readonly<
  Record<
    "240L" | "360L",
    readonly [number, number, number, number, number, number]
  >
> = {
  "240L": [0.585, 0.66, 0.99, 1.06, 0.73, 0.4],
  "360L": [0.68, 0.77, 1.028, 1.1, 0.848, 0.52],
};

/** Wastequip's 2 and 3 yd containers: length, depth at the lid and at the base, metres. */
const WASTEQUIP: Readonly<
  Record<"2yd" | "3yd", readonly [number, number, number]>
> = {
  "2yd": [
    (81 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
    (39 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
    34 * AutoMovieArchetypeUnits.INCH,
  ],
  "3yd": [
    (82 + 7 / 16) * AutoMovieArchetypeUnits.INCH,
    (46 + 3 / 4) * AutoMovieArchetypeUnits.INCH,
    42 * AutoMovieArchetypeUnits.INCH,
  ],
};

/**
 * Wheeled bins and dumpsters are their makers' models read, each whole.
 *
 * Scenarios:
 * 1. A wheeled bin given as SULO's 240 L or 360 L is that bin: body width, depth and height, height with the lid, the handle the total depth behind the front at the bin's height, the handle's width.
 * 2. A dumpster given as Wastequip's 2 yd or 3 yd is that container: length, depth at the lid and at the base.
 * 3. Over 200 seeds every container drawn is one of its kind's two models exactly, its width and depth together, and both are drawn; a model of the other kind is refused; both lids state no travel, so opening one is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts for each model and over seeds, and tries the lids; a container off its maker's model, one between two models, a model never drawn or a lid opening without a source is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the makers' restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Each model given, then the seeds' draws, both kinds, and a model named for the wrong kind.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_bins(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The wheeled bins.
  for (const model of ["240L", "360L"] as const) {
    const [width, depth, height, top, reach, handle]: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
    ] = SULO[model];
    const bin: ReturnType<typeof createBin> = createBin({
      kind: "wheelieBin",
      model,
    });
    const body: { low: number; high: number; size: number } = archetypeExtent(
      bin,
      "z",
      ["body"],
    );
    near(`${model}: width`, archetypeExtent(bin, "x", ["body"]).size, width);
    near(`${model}: depth`, body.size, depth);
    near(`${model}: height`, archetypeExtent(bin, "y", ["body"]).high, height);
    near(
      `${model}: with the lid`,
      archetypeExtent(bin, "y", ["lid"]).high,
      top,
    );
    const grip: IAutoMovieAffordance = bin.affordance("handle");
    near(
      `${model}: the handle behind the front`,
      body.high - grip.frame.translation.z,
      reach,
    );
    near(`${model}: the handle's height`, grip.frame.translation.y, height);
    near(`${model}: the handle's width`, grip.length!, handle);
  }

  // 2. The dumpsters.
  for (const model of ["2yd", "3yd"] as const) {
    const [length, depth, base]: readonly [number, number, number] =
      WASTEQUIP[model];
    const dumpster: ReturnType<typeof createBin> = createBin({
      kind: "dumpster",
      model,
    });
    near(`${model}: length`, archetypeExtent(dumpster, "x").size, length);
    near(
      `${model}: depth at the lid`,
      archetypeExtent(dumpster, "z", ["lid"]).size,
      depth,
    );
    near(
      `${model}: depth at the base`,
      archetypeExtent(dumpster, "z", ["body"]).size,
      base,
    );
  }

  // 3. The seeds' draws, a model of the wrong kind, and the lids.
  const read: Readonly<
    Record<createBin.Kind, readonly (readonly [number, number])[]>
  > = {
    wheelieBin: Object.values(SULO).map(
      (row: readonly number[]): readonly [number, number] => [row[0]!, row[1]!],
    ),
    dumpster: Object.values(WASTEQUIP).map(
      (row: readonly number[]): readonly [number, number] => [row[0]!, row[1]!],
    ),
  };
  for (const kind of createBin.KINDS) {
    const drawn: Set<number> = new Set();
    for (let seed: number = 0; seed < 200; seed++) {
      const model: ReturnType<typeof createBin> = createBin({ kind }, seed);
      const width: number = archetypeExtent(model, "x", ["body"]).size;
      const depth: number = archetypeExtent(model, "z", ["lid"]).size;
      const index: number = read[kind].findIndex(
        ([w, d]: readonly [number, number]): boolean =>
          Math.abs(w - width) <= 1e-9 && Math.abs(d - depth) <= 1e-9,
      );
      if (index < 0)
        findings.push(
          `${kind} ${seed}: ${width} by ${depth} m is no read model`,
        );
      else drawn.add(index);
      if (seed < 3)
        try {
          model.articulate({ lid: 30 });
          findings.push(`${kind} ${seed}: the lid opened without a source`);
        } catch {
          // Refused, as a lid that states no travel is.
        }
    }
    if (drawn.size !== read[kind].length)
      findings.push(`${kind}: 200 seeds drew ${drawn.size} of its models`);
  }
  try {
    createBin({ kind: "dumpster", model: "240L" });
    findings.push("a dumpster was built as a 240 L wheeled bin");
  } catch {
    // Refused: a model of the other kind.
  }
  TestValidator.equals(
    "bins and dumpsters are their makers' models",
    findings,
    [],
  );
}
