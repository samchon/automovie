import { AutoMovieArchetypeUnits, AutoMovieArchetypeBall } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Cricket and bowling balls, rugby balls, American footballs and pucks are their rules' sizes, and each is taken at its middle with its height as the aperture.
 *
 * Scenarios:
 * 1. A cricket ball is the MCC's 22.4 to 22.9 cm round; a bowling ball the USBC's 8.500 to 8.595 in across.
 * 2. A rugby ball is World Rugby's 280 to 300 mm long and 580 to 620 mm round its width; an American football the NFL's 11 to 11 1/4 in long and 21 to 21 1/4 in round; each lies with its long axis along `X`.
 * 3. A puck is the IIHF's 7.6 cm across and 2.5 cm thick, lying flat.
 * 4. Each new kind's `grip` lies at its middle with its height as the aperture, and its `top` on its top.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists spherical, oval and flat kinds with regulation sizes, rest positions and central grip and top contacts.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each selected ball or puck through the public factory and measures its extents and contact frames. The oval bodies must lie along X and the puck must lie flat.
 * @evidence contracts/development/testing.md#independent-expectations Uses the stated MCC, USBC, World Rugby, NFL and IIHF dimensions. Dividing circumference by pi supplies the diameter checks, while measured height fixes the grip aperture and top.
 */
export function test_archetype_ball_kinds(): void {
  const findings: string[] = [];
  const size = (
    kind: AutoMovieArchetypeBall.Kind,
    axis: "x" | "y" | "z",
    minimum: number,
    maximum: number,
    source: string,
  ): archetypeBandSweep.IRow => ({
    name: `${kind} along ${axis}`,
    measure: (seed: number): number =>
      archetypeExtent(AutoMovieArchetypeBall.create({ kind }, seed), axis).size,
    minimum,
    maximum,
    source,
  });

  // 1. to 3. The sizes.
  findings.push(
    ...archetypeBandSweep([
      size("cricket", "x", 0.224 / Math.PI, 0.229 / Math.PI, "MCC Law 4"),
      size(
        "bowling",
        "y",
        8.5 * AutoMovieArchetypeUnits.INCH,
        8.595 * AutoMovieArchetypeUnits.INCH,
        "USBC",
      ),
      size("rugby", "x", 0.28, 0.3, "World Rugby Law 2"),
      size("rugby", "z", 0.58 / Math.PI, 0.62 / Math.PI, "World Rugby Law 2"),
      size(
        "americanFootball",
        "x",
        11 * AutoMovieArchetypeUnits.INCH,
        11.25 * AutoMovieArchetypeUnits.INCH,
        "NFL Rule 2",
      ),
      size(
        "americanFootball",
        "y",
        (21 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        (21.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        "NFL Rule 2",
      ),
    ]),
  );
  const puck: ReturnType<typeof AutoMovieArchetypeBall.create> = AutoMovieArchetypeBall.create({ kind: "puck" }, 3);
  if (!(Math.abs(archetypeExtent(puck, "x").size - 0.076) <= MM))
    findings.push("the puck is not 7.6 cm across");
  if (!(Math.abs(archetypeExtent(puck, "y").size - 0.025) <= MM))
    findings.push("the puck is not 2.5 cm thick and flat");

  // 4. The contacts.
  for (const kind of [
    "cricket",
    "bowling",
    "rugby",
    "americanFootball",
    "puck",
  ] as const)
    for (const seed of [0, 12]) {
      const ball: ReturnType<typeof AutoMovieArchetypeBall.create> = AutoMovieArchetypeBall.create({ kind }, seed);
      const y: { low: number; high: number; size: number } = archetypeExtent(
        ball,
        "y",
      );
      const grip: IAutoMovieAffordance = ball.affordance("grip");
      if (
        !(
          Math.abs(grip.frame.translation.y - (y.low + y.high) / 2) <= MM &&
          Math.abs(grip.aperture! - y.size) <= MM &&
          Math.abs(y.low) <= MM &&
          Math.abs(ball.affordance("top").frame.translation.y - y.high) <= MM
        )
      )
        findings.push(`${kind} ${seed}: its grip or top is off the ball`);
    }
  TestValidator.equals("the new balls are their rules' sizes", findings, []);
}
