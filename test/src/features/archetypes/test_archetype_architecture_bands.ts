import {
  ArchetypeFrame,
  createBar,
  createDoor,
  createLadder,
  createRamp,
  createStairs,
  createSwitch,
  createWall,
  createWindow,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The accessibility standard. */
const ADA: string = "2010 ADA Standards";

/** The building code. */
const IBC: string = "IBC 2021";

/** The ladder regulation. */
const OSHA: string = "29 CFR 1910.23";

/**
 * Architectural elements stay inside their code dimensions for every seed, measured where a hand or a foot meets them.
 *
 * Scenarios, each over 200 seeds, inside the band, and spanning at least 80 % of it unless the code gives only a limit:
 * 1. A door: the lever's and the knob's grip 865 to 1220 mm above the floor (ADA 404.2.7), the lever's turn 45 to 78 degrees, the clear opening at least 815 mm wide (ADA 404.2.3) and the leaf 2032 to 2134 mm high; a push plate at 1143 mm and a pull bar at 1067 mm (ANSI/SDI A250.8 Table 5).
 * 2. Stairs: each riser 102 to 178 mm and each tread at least 279 mm (IBC 1011.5.2), measured between successive nosings; over the whole flight no riser or tread differs from the first by more than 9.5 mm (IBC 1011.5.4); the top of each rail 865 to 965 mm vertically above the line of the nosings (ADA 505.4) and 32 to 51 mm across (ADA 505.7.1); the flight 914 to 1118 mm wide (IBC 1011.2); a twenty-riser flight rises no more than 3658 mm (IBC 1011.8).
 * 3. A ramp: its walking surface slopes between 1:20 and 1:12 (ADA 405.2), rises at most 760 mm (ADA 405.6) and is at least 915 mm wide (ADA 405.5).
 * 4. Ladders: rungs 250 to 360 mm apart along the ladder (29 CFR 1910.23(b)(2)), a fixed ladder's at least 410 mm and a leaning one's at least 290 mm wide, and a leaning ladder at 75.5 degrees, its foot a quarter of its length out (29 CFR 1926.1053(b)(5)(i)).
 * 5. Bars: a grab bar's top 840 to 915 mm high and 32 to 51 mm across (ADA 609), a level rail's top 865 to 965 mm (ADA 505.4), a high bar whose collider is 28 mm across with its upper edge at 2.80 to 2.90 m (FIG MAG 6).
 * 6. A window's sill below 914 mm and its handle at most 1220 mm high; a call button 380 to 1220 mm high (ADA 407.2.1.1); a full wall at least 2286 mm high (IBC 1208.2).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each element for 200 seeds and measures frames, declared extents and, for a dimension its source fixes at one value, the collider itself: heights of contacts, differences between successive nosings and rungs, the normal of a ramp's surface, a rail's top above the nosing line. A dimension outside its clause, a flight that is not uniform, a rail measured to its axis instead of its top, or a seed that does not vary a banded dimension is caught.
 * @evidence contracts/development/testing.md#independent-expectations Every band is the clause's own number, written here; the rail's top is found from its axis by the rail's radius over the cosine of the flight's slope, the vertical thickness of a sloping round bar, worked here from the measured riser and tread.
 * @evidence contracts/development/testing.md#distinguishing-cases Banded dimensions are checked for coverage and one-sided code limits only for compliance; lever, knob and plate hardware and both ladder kinds are separate rows because their clauses differ.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_architecture_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
    ...(limit === true ? { limit } : {}),
  });
  const y = (frame: { translation: IAutoMovieVector3 }): number =>
    frame.translation.y;
  const stairs = (seed: number): ReturnType<typeof createStairs> =>
    createStairs({ steps: 9 }, seed);

  /** The rise and the going from one nosing to the next. */
  const step = (
    flight: ReturnType<typeof createStairs>,
    k: number,
  ): IAutoMovieVector3 =>
    Vector3.subtract(
      flight.affordance(`step${k + 1}`).frame.translation,
      flight.affordance(`step${k}`).frame.translation,
    );

  /** The greatest difference of any step's rise or going from the first step's. */
  const uneven = (flight: ReturnType<typeof createStairs>): number => {
    const first: IAutoMovieVector3 = step(flight, 1);
    let worst: number = 0;
    for (let k: number = 2; k < 9; k++)
      worst = Math.max(
        worst,
        Math.abs(step(flight, k).y - first.y),
        k < 8 ? Math.abs(step(flight, k).z - first.z) : 0,
      );
    return worst;
  };

  /** The top of a stair rail above the nosing line, measured vertically at the rail's middle. */
  const rail = (flight: ReturnType<typeof createStairs>): number => {
    const rise: IAutoMovieVector3 = step(flight, 1);
    const nosing: IAutoMovieVector3 =
      flight.affordance("step1").frame.translation;
    const bar: IAutoMovieAffordance = flight.affordance("leftRail");
    const line: number =
      nosing.y + ((bar.frame.translation.z - nosing.z) * rise.y) / rise.z;
    return (
      bar.frame.translation.y +
      ((bar.aperture! / 2) * Math.hypot(rise.y, rise.z)) / rise.z -
      line
    );
  };
  const rungs = (kind: createLadder.Kind, seed: number): IAutoMovieVector3 => {
    const ladder: ReturnType<typeof createLadder> = createLadder(
      { kind },
      seed,
    );
    return Vector3.subtract(
      ladder.affordance("rung2").frame.translation,
      ladder.affordance("rung1").frame.translation,
    );
  };
  TestValidator.equals(
    "architecture stays in its code bands",
    archetypeBandSweep([
      row(
        "lever height",
        0.865,
        1.22,
        `${ADA} 404.2.7`,
        (seed: number): number =>
          y(createDoor({ hardware: "lever" }, seed).affordance("pull").frame),
      ),
      row(
        "knob height",
        0.865,
        1.22,
        `${ADA} 404.2.7`,
        (seed: number): number =>
          y(createDoor({ hardware: "knob" }, seed).affordance("push").frame),
      ),
      row(
        "lever turn",
        45,
        78,
        "Hampton Products",
        (seed: number): number =>
          createDoor({ hardware: "lever" }, seed).affordance("latch").travel!,
      ),
      row(
        "door clear width",
        0.815,
        0.914,
        `${ADA} 404.2.3`,
        (seed: number): number =>
          createDoor({}, seed).affordance("aperture").width!,
        true,
      ),
      row(
        "door height",
        2.032,
        2.134,
        "ANSI/SDI A250.8 Table 1",
        (seed: number): number =>
          createDoor({}, seed).affordance("aperture").height!,
      ),
      row(
        "push plate height",
        1.143,
        1.143,
        "ANSI/SDI A250.8 Table 5",
        (seed: number): number =>
          y(createDoor({ hardware: "plate" }, seed).affordance("push").frame),
      ),
      row(
        "pull bar height",
        1.067,
        1.067,
        "ANSI/SDI A250.8 Table 5",
        (seed: number): number =>
          y(createDoor({ hardware: "plate" }, seed).affordance("pull").frame),
      ),
      row(
        "riser",
        0.102,
        0.178,
        `${IBC} 1011.5.2`,
        (seed: number): number => step(stairs(seed), 3).y,
      ),
      row(
        "first riser from the floor",
        0.102,
        0.178,
        `${IBC} 1011.5.2`,
        (seed: number): number => y(stairs(seed).affordance("step1").frame),
      ),
      row(
        "tread",
        0.279,
        1,
        `${IBC} 1011.5.2`,
        (seed: number): number => step(stairs(seed), 3).z,
        true,
      ),
      row(
        "flight uniformity",
        0,
        0.0095,
        `${IBC} 1011.5.4`,
        (seed: number): number => uneven(stairs(seed)),
        true,
      ),
      row(
        "stair rail height",
        0.865,
        0.965,
        `${ADA} 505.4`,
        (seed: number): number => rail(stairs(seed)),
      ),
      row(
        "stair rail diameter",
        0.032,
        0.051,
        `${ADA} 505.7.1`,
        (seed: number): number =>
          stairs(seed).affordance("rightRail").aperture!,
      ),
      row(
        "stair width",
        0.914,
        1.118,
        `${IBC} 1011.2`,
        (seed: number): number => stairs(seed).affordance("step1").length!,
      ),
      row(
        "tallest flight",
        0,
        3.658,
        `${IBC} 1011.8`,
        (seed: number): number =>
          y(createStairs({ steps: 20 }, seed).affordance("landing").frame),
        true,
      ),
      row(
        "ramp slope",
        1 / 20,
        1 / 12,
        `${ADA} 405.2`,
        (seed: number): number => {
          const normal: IAutoMovieVector3 = ArchetypeFrame.axis(
            createRamp({}, seed).affordance("slope").frame,
            "y",
          );
          return Math.hypot(normal.x, normal.z) / normal.y;
        },
      ),
      row(
        "ramp rise",
        0,
        0.76,
        `${ADA} 405.6`,
        (seed: number): number =>
          y(createRamp({}, seed).affordance("top").frame),
        true,
      ),
      row(
        "ramp width",
        0.915,
        10,
        `${ADA} 405.5`,
        (seed: number): number =>
          createRamp({}, seed).affordance("slope").width!,
        true,
      ),
      row("rung spacing", 0.25, 0.36, `${OSHA}(b)(2)`, (seed: number): number =>
        Vector3.length(rungs("fixed", seed)),
      ),
      row(
        "leaning rung spacing",
        0.25,
        0.36,
        `${OSHA}(b)(2)`,
        (seed: number): number => Vector3.length(rungs("leaning", seed)),
      ),
      row(
        "fixed rung width",
        0.41,
        10,
        `${OSHA}(b)(4)`,
        (seed: number): number =>
          createLadder({ kind: "fixed" }, seed).affordance("rung1").length!,
        true,
      ),
      row(
        "leaning rung width",
        0.29,
        10,
        `${OSHA}(b)(4)`,
        (seed: number): number =>
          createLadder({ kind: "leaning" }, seed).affordance("rung1").length!,
        true,
      ),
      row(
        "leaning ladder foot offset over length",
        0.25,
        0.25,
        "29 CFR 1926.1053(b)(5)(i)",
        (seed: number): number => {
          const along: IAutoMovieVector3 = rungs("leaning", seed);
          return Math.abs(along.z) / Vector3.length(along);
        },
      ),
      row(
        "fixed ladder upright",
        0,
        0,
        `${OSHA}(d)(11)`,
        (seed: number): number => Math.abs(rungs("fixed", seed).z),
      ),
      row(
        "grab bar top",
        0.84,
        0.915,
        `${ADA} 609.4`,
        (seed: number): number => {
          const bar: IAutoMovieAffordance = createBar(
            { kind: "grab" },
            seed,
          ).affordance("bar");
          return y(bar.frame) + bar.aperture! / 2;
        },
      ),
      row(
        "grab bar diameter",
        0.032,
        0.051,
        `${ADA} 609.2.1`,
        (seed: number): number =>
          createBar({ kind: "grab" }, seed).affordance("bar").aperture!,
      ),
      row(
        "level rail top",
        0.865,
        0.965,
        `${ADA} 505.4`,
        (seed: number): number => {
          const bar: IAutoMovieAffordance = createBar(
            { kind: "rail" },
            seed,
          ).affordance("bar");
          return y(bar.frame) + bar.aperture! / 2;
        },
      ),
      row(
        "high bar upper edge",
        2.8,
        2.9,
        "FIG MAG 6",
        (seed: number): number => {
          const bar: IAutoMovieAffordance = createBar(
            { kind: "high" },
            seed,
          ).affordance("bar");
          return y(bar.frame) + bar.aperture! / 2;
        },
      ),
      row(
        "high bar diameter",
        0.028,
        0.028,
        "FIG MAG 6",
        (seed: number): number =>
          archetypeExtent(createBar({ kind: "high" }, seed), "y", ["bar"]).size,
      ),
      row(
        "window sill",
        0,
        0.914,
        `${IBC} 1015.8`,
        (seed: number): number =>
          y(createWindow({ kind: "hung" }, seed).affordance("sill").frame),
        true,
      ),
      row(
        "window handle",
        0.38,
        1.22,
        `${ADA} 309.3`,
        (seed: number): number =>
          y(
            createWindow({ kind: "casement" }, seed).affordance("handle").frame,
          ),
        true,
      ),
      row(
        "call button height",
        0.38,
        1.22,
        `${ADA} 407.2.1.1`,
        (seed: number): number =>
          y(createSwitch({ kind: "button" }, seed).affordance("press").frame),
      ),
      row(
        "wall height",
        2.286,
        10,
        `${IBC} 1208.2`,
        (seed: number): number =>
          y(createWall({ kind: "full" }, seed).affordance("top").frame),
        true,
      ),
    ]),
    [],
  );
}
