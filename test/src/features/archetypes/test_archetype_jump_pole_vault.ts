import { createHighJump } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The World Athletics rules. */
const WA: string = "World Athletics Technical Rules 2020";

/**
 * The pole vault kind of the jump apparatus has its box sunk where the rules put it, its crossbar on pegs the rules' span apart, and its standards clear of the bar; the high jump kind stays as it was.
 *
 * Scenarios:
 * 1. Over 200 seeds: the crossbar 4.48 to 4.52 m long (TR 26.7) and its top 2 to 6.3 m high (a setting); the arms' tips, the pegs, 4.28 to 4.37 m apart (TR 28.10); the bar 0 to 0.8 m beyond the zero line (Figure (c) TR28).
 * 2. The box's socket lies 0.20 m below the runway (TR 28.8), and the stop board from it to the zero line is 0.224 m long within a millimetre, the length Figure (a) TR28 prints, which follows only if the floor's 1.00 m and the runway's 1.08 m are both kept.
 * 3. Each standard's inner face stands beyond the bar's end, and each standard's foot is on the runway, within a millimetre.
 * 4. The pole vault declares `bar` and `box`; the high jump, made with no kind, declares only `bar` and has no part below the floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces both kinds and measures colliders and contacts; a bar off the rule's length, pegs off their span, a box at the wrong depth or of the wrong shape, a standard through the bar, or a high jump that grew a box fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the rules' numbers written here; the stop board's 0.224 m is the figure's own printed length, not computed by the producer.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds, the default kind unchanged; the high jump's bands and placement belong to `test_archetype_jump_placed`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_jump_pole_vault(): void {
  const vault = (seed: number): ReturnType<typeof createHighJump> =>
    createHighJump({ kind: "poleVault" }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });

  // 1. The bands.
  const findings: string[] = archetypeBandSweep([
    row("crossbar length", 4.48, 4.52, `${WA} 26.7`, (s: number): number =>
      archetypeExtent(vault(s), "x", ["crossbar"]).size,
    ),
    row("crossbar height", 2, 6.3, "a setting", (s: number): number =>
      archetypeExtent(vault(s), "y", ["crossbar"]).high,
    ),
    row("peg span", 4.28, 4.37, `${WA} 28.10`, (s: number): number => {
      const v: ReturnType<typeof createHighJump> = vault(s);
      return (
        archetypeExtent(v, "x", ["arm-left"]).low -
        archetypeExtent(v, "x", ["arm-right"]).high
      );
    }),
    row(
      "bar beyond the zero line",
      0,
      0.8,
      `${WA} Figure (c) TR28`,
      (s: number): number => vault(s).affordance("bar").frame.translation.z,
    ),
  ]);

  // 2. The box.
  const v: ReturnType<typeof createHighJump> = vault(3);
  const socket: IAutoMovieVector3 = v.affordance("box").frame.translation;
  if (Math.abs(socket.y + 0.2) > 1e-9)
    findings.push(`the box's socket stands ${socket.y} m, -0.2 m expected`);
  const board: number = Math.hypot(socket.y, socket.z);
  if (Math.abs(board - 0.224) > 1e-3)
    findings.push(`the stop board runs ${board} m, 0.224 m expected`);

  // 3. The standards.
  const bar: { low: number; high: number } = archetypeExtent(v, "x", [
    "crossbar",
  ]);
  if (
    !(
      archetypeExtent(v, "x", ["upright-left"]).low > bar.high &&
      archetypeExtent(v, "x", ["upright-right"]).high < bar.low
    )
  )
    findings.push("a standard stands through the bar's end");
  for (const id of ["upright-left", "upright-right"])
    if (Math.abs(archetypeExtent(v, "y", [id]).low) > 1e-3)
      findings.push(`the ${id}'s foot is off the runway`);

  // 4. The contacts, and the high jump unchanged.
  const ids = (archetype: ReturnType<typeof createHighJump>): string =>
    archetype.affordances
      .map((a: IAutoMovieAffordance): string => `${a.id}:${a.kind}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
  if (ids(v) !== "bar:bar,box:socket")
    findings.push(`the pole vault declares ${ids(v)}`);
  const high: ReturnType<typeof createHighJump> = createHighJump({}, 3);
  if (ids(high) !== "bar:bar")
    findings.push(`the high jump declares ${ids(high)}`);
  if (archetypeExtent(high, "y").low < -1e-9)
    findings.push("the high jump has a part below the floor");
  TestValidator.equals(
    "the pole vault's box, bar and standards follow the rules",
    findings,
    [],
  );
}
