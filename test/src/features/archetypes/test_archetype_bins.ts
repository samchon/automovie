import { ArchetypeUnits, createBin } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** SULO's 240 and 360 L bins: width, bin depth, bin height, total height, total depth and handle width, metres. */
const SULO: readonly (readonly [number, number, number, number, number, number])[] =
  [
    [0.585, 0.66, 0.99, 1.06, 0.73, 0.4],
    [0.68, 0.77, 1.028, 1.1, 0.848, 0.52],
  ];

/** Wastequip's 2 and 3 yd containers: length, depth at the lid and at the base, metres. */
const WASTEQUIP: readonly (readonly [number, number, number])[] = [
  [(81 + 7 / 8) * ArchetypeUnits.INCH, (39 + 3 / 4) * ArchetypeUnits.INCH, 34 * ArchetypeUnits.INCH],
  [(82 + 7 / 16) * ArchetypeUnits.INCH, (46 + 3 / 4) * ArchetypeUnits.INCH, 42 * ArchetypeUnits.INCH],
];

/**
 * Wheeled bins and dumpsters are their makers' two models at the ends of their size, and every size between is one coherent container.
 *
 * Scenarios:
 * 1. A wheeled bin at size 0 is SULO's 240 L and at size 1 its 360 L: body width, depth and height, height with the lid, handle the total depth behind the front at the bin's height, the handle's width.
 * 2. A dumpster at size 0 is Wastequip's 2 yd and at size 1 its 3 yd: length, depth at the lid and at the base.
 * 3. At any drawn size the bin's handle stands behind its body, and both lids state no travel, so opening one is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts at both ends and over seeds, and tries the lids; a container off its maker's model, a handle inside its body or a lid opening without a source is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the makers' restated here; the coherence check needs only the order of body and handle.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends and drawn sizes between, both kinds.
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
  for (const size of [0, 1]) {
    const [width, depth, height, top, reach, handle]: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
    ] = SULO[size]!;
    const bin: ReturnType<typeof createBin> = createBin({
      kind: "wheelieBin",
      size,
    });
    const body: { low: number; high: number; size: number } =
      archetypeExtent(bin, "z", ["body"]);
    near(`bin ${size}: width`, archetypeExtent(bin, "x", ["body"]).size, width);
    near(`bin ${size}: depth`, body.size, depth);
    near(`bin ${size}: height`, archetypeExtent(bin, "y", ["body"]).high, height);
    near(`bin ${size}: with the lid`, archetypeExtent(bin, "y", ["lid"]).high, top);
    const grip: IAutoMovieAffordance = bin.affordance("handle");
    near(
      `bin ${size}: the handle behind the front`,
      body.high - grip.frame.translation.z,
      reach,
    );
    near(`bin ${size}: the handle's height`, grip.frame.translation.y, height);
    near(`bin ${size}: the handle's width`, grip.length!, handle);
  }

  // 2. The dumpsters.
  for (const size of [0, 1]) {
    const [length, depth, base]: readonly [number, number, number] =
      WASTEQUIP[size]!;
    const dumpster: ReturnType<typeof createBin> = createBin({
      kind: "dumpster",
      size,
    });
    near(`dumpster ${size}: length`, archetypeExtent(dumpster, "x").size, length);
    near(
      `dumpster ${size}: depth at the lid`,
      archetypeExtent(dumpster, "z", ["lid"]).size,
      depth,
    );
    near(
      `dumpster ${size}: depth at the base`,
      archetypeExtent(dumpster, "z", ["body"]).size,
      base,
    );
  }

  // 3. Coherence and lids.
  for (const seed of [0, 4, 17]) {
    const bin: ReturnType<typeof createBin> = createBin(
      { kind: "wheelieBin" },
      seed,
    );
    if (
      !(
        bin.affordance("handle").frame.translation.z <
        archetypeExtent(bin, "z", ["body"]).low
      )
    )
      findings.push(`bin ${seed}: the handle is inside the body`);
    for (const kind of createBin.KINDS) {
      const model: ReturnType<typeof createBin> = createBin({ kind }, seed);
      try {
        model.articulate({ lid: 30 });
        findings.push(`${kind} ${seed}: the lid opened without a source`);
      } catch {
        // Refused, as a lid that states no travel is.
      }
    }
  }
  TestValidator.equals(
    "bins and dumpsters are their makers' models",
    findings,
    [],
  );
}
