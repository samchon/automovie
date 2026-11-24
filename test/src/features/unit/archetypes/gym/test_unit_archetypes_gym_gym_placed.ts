import {
  AutoMovieArchetypeUnits,
  createBalanceBeam,
  createExerciseBike,
  createExerciseMat,
  createJumpRope,
  createRhythmicBall,
  createRing,
  createRowingMachine,
  createSled,
  createStillRings,
  createUnevenBars,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../../internal/archetypeModelSweep";
import { archetypePlaced } from "../../../internal/archetypePlaced";

/**
 * The gym additions are placed where the scene puts them. Their measured support dimensions stay inside the source bounds for every seed.
 *
 * Scenarios:
 * 1. The sled, the rowing machine, the exercise bike, both exercise mats, the skipping rope and the ring, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds the balance beam top and section match WAG 3. The ring's canvas is 1 m high and its top rope 1.3 m above it (the AIBA guide); and each of these is exactly one read model, every model drawn: the rowing machine's seat top and mass, Concept2's standard legs' 14 in and 57 lb or tall legs' 20 in and 68 lb; the skipping rope's cable, Rogue's 120 in or 11 ft, with its handle, the SR-1S's 5.25, SR-1's 6.75 or SR-1L's 7.5 in; the sled's base length and width, handle height and mass, Rogue's Slice or Echo Dog; a yoga mat's length and mass, Manduka's 71 in at 3.4 kg or 85 in at 4.3 kg.
 * 3. The still rings have the competition bore, grip thickness, suspension span and spacing. Their grips follow the physical ring cells when only one suspension turns and when the two turn in different directions.
 * 4. Both uneven bars match the selected competition diagonal and their distinct standard heights. The rhythmic ball centre and palm contact match the sphere, including both ends of the competition diameter band.
 */
export function test_unit_archetypes_gym_gym_placed(): void {
  const findings: string[] = archetypePlaced([
    { name: "sled", archetype: createSled(), yaw: 0 },
    { name: "rowingMachine", archetype: createRowingMachine(), yaw: 45 },
    { name: "exerciseBike", archetype: createExerciseBike(), yaw: 90 },
    ...createExerciseMat.KINDS.map(
      (kind: createExerciseMat.Kind): archetypePlaced.IRow => ({
        name: `exerciseMat-${kind}`,
        archetype: createExerciseMat({ kind }),
        yaw: 135,
      }),
    ),
    { name: "jumpRope", archetype: createJumpRope(), yaw: 180 },
    { name: "ring", archetype: createRing(), yaw: 225 },
    { name: "balanceBeam", archetype: createBalanceBeam(), yaw: 270 },
    { name: "stillRings", archetype: createStillRings(), yaw: 315 },
    { name: "unevenBars", archetype: createUnevenBars(), yaw: 40 },
    { name: "rhythmicBall", archetype: createRhythmicBall(), yaw: 140 },
  ]);
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
  findings.push(
    ...archetypeBandSweep([
      row(
        "beam bearing height",
        1.24,
        1.26,
        "World Gymnastics WAG 3 §2.1.3",
        (seed: number): number =>
          archetypeExtent(createBalanceBeam({}, seed), "y", ["beam"]).high,
      ),
      row(
        "beam full length",
        4.99,
        5.01,
        "World Gymnastics WAG 3 §2.1.1",
        (seed: number): number =>
          archetypeExtent(createBalanceBeam({}, seed), "z", ["beam"]).size,
      ),
      row(
        "beam flat bearing width",
        0.095,
        0.105,
        "World Gymnastics WAG 3 §2.1.2.1",
        (seed: number): number => {
          const beam: ReturnType<typeof createBalanceBeam> = createBalanceBeam(
            {},
            seed,
          );
          const shape: IAutoMoviePhysicalShape | undefined = beam
            .shapes()
            .find(
              (item: IAutoMoviePhysicalShape): boolean => item.id === "beam",
            );
          const surface = beam.affordance("surface");
          if (
            shape?.kind !== "hull" ||
            surface.kind !== "surface" ||
            surface.width === undefined
          )
            return NaN;
          const x: number[] = shape.points
            .map(
              (point: IAutoMovieVector3): IAutoMovieVector3 =>
                Vector3.add(
                  shape.transform.position,
                  Quaternion.rotateVector(shape.transform.rotation, point),
                ),
            )
            .filter(
              (point: IAutoMovieVector3): boolean =>
                Math.abs(point.y - surface.frame.translation.y) <= 1e-9,
            )
            .map((point: IAutoMovieVector3): number => point.x);
          const width: number = Math.max(...x) - Math.min(...x);
          return Math.abs(surface.width - width) <= 1e-9 ? width : NaN;
        },
      ),
      row(
        "beam widest section",
        0.125,
        0.135,
        "World Gymnastics WAG 3 §2.1.2.2",
        (seed: number): number =>
          archetypeExtent(createBalanceBeam({}, seed), "x", ["beam"]).size,
      ),
      row(
        "ring canvas height",
        1,
        1,
        "the AIBA guide, 230 cm poles 130 cm above the canvas",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["platform"]).high,
      ),
      row(
        "ring top rope",
        1.3,
        1.3,
        "the AIBA guide, the top rope 130 cm above the canvas",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["northRope4"]).high -
          createRing({}, seed).dimensions.platform! -
          createRing.ROPE / 2,
      ),
    ]),
  );
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const pound: number = AutoMovieArchetypeUnits.POUND;
  findings.push(
    ...archetypeModelSweep([
      {
        name: "rowing seat height and mass",
        measure: (seed: number): readonly number[] => {
          const rower: ReturnType<typeof createRowingMachine> =
            createRowingMachine({}, seed);
          return [archetypeExtent(rower, "y", ["seat"]).high, rower.body.mass];
        },
        models: [
          [14 * inch, 57 * pound],
          [20 * inch, 68 * pound],
        ],
        source: "Concept2, the standard and tall legs",
      },
      {
        name: "skipping rope cable and handle",
        measure: (seed: number): readonly number[] => {
          const rope: ReturnType<typeof createJumpRope> = createJumpRope(
            {},
            seed,
          );
          return [
            archetypeExtent(rope, "x", ["cord"]).size,
            archetypeExtent(rope, "x", ["leftHandle"]).size,
          ];
        },
        models: [120 * inch, 132 * inch].flatMap((cable: number): number[][] =>
          [5.25 * inch, 6.75 * inch, 7.5 * inch].map(
            (handle: number): number[] => [cable, handle],
          ),
        ),
        source: "Rogue SR-1, its cables and handles",
      },
      {
        name: "sled base, handle height and mass",
        measure: (seed: number): readonly number[] => {
          const sled: ReturnType<typeof createSled> = createSled({}, seed);
          return [
            archetypeExtent(sled, "z", ["base"]).size,
            archetypeExtent(sled, "x", ["base"]).size,
            archetypeExtent(sled, "y", ["leftPole"]).high,
            sled.body.mass,
          ];
        },
        models: [
          [27.5 * inch, 22.75 * inch, 37.25 * inch, 65 * pound],
          [36.5 * inch, 25 * inch, 37.5 * inch, 87 * pound],
        ],
        source: "Rogue's Slice and Echo Dog sleds",
      },
      {
        name: "yoga mat length and mass",
        measure: (seed: number): readonly number[] => {
          const mat: ReturnType<typeof createExerciseMat> = createExerciseMat(
            { kind: "yoga" },
            seed,
          );
          return [archetypeExtent(mat, "z").size, mat.body.mass];
        },
        models: [
          [71 * inch, 3.4],
          [85 * inch, 4.3],
        ],
        source: "Manduka PRO 6 mm",
      },
    ]),
  );
  const rings: ReturnType<typeof createStillRings> = createStillRings();
  const lower = archetypeExtent(rings, "y", ["left-ring-0"]);
  const upper = archetypeExtent(rings, "y", ["left-ring-6"]);
  const close = (label: string, value: number, expected: number): void => {
    if (!(Math.abs(value - expected) <= 1e-9))
      findings.push(`${label}: ${value}, expected ${expected}`);
  };
  close("ring opening", upper.low - lower.high, 0.18);
  close("ring bottom wall diameter", lower.size, 0.028);
  close("ring lower inner edge height", lower.high, 2.9);
  close(
    "ring cable suspension",
    rings.affordance("leftPivot").frame.translation.y - lower.high,
    3,
  );
  close(
    "ring pivot spacing",
    rings.affordance("leftPivot").frame.translation.x -
      rings.affordance("rightPivot").frame.translation.x,
    0.5,
  );
  for (const [left, right] of [
    [20, 0],
    [-15, 30],
  ] as const) {
    const posed = rings.articulate({ leftPivot: left, rightPivot: right });
    for (const [side, angle] of [
      ["left", left],
      ["right", right],
    ] as const) {
      const grip = posed.affordance(`${side}Grip`).frame.translation;
      const pivot = rings.affordance(`${side}Pivot`).frame.translation;
      const rad: number = (angle * Math.PI) / 180;
      const span: number = 5.9 - 2.886;
      close(
        `${side} grip span at ${angle}°`,
        grip.y,
        pivot.y - span * Math.cos(rad),
      );
      close(`${side} grip arc at ${angle}°`, grip.z, -span * Math.sin(rad));
      const parts: string[] = [`${side}-ring-0`];
      const y = archetypeExtent(posed, "y", parts);
      const z = archetypeExtent(posed, "z", parts);
      close(
        `${side} grip and collider height at ${angle}°`,
        (y.low + y.high) / 2,
        grip.y,
      );
      close(
        `${side} grip and collider depth at ${angle}°`,
        (z.low + z.high) / 2,
        grip.z,
      );
    }
  }
  for (const diagonal of [1.3, 1.81]) {
    const bars = createUnevenBars({ diagonal, diameter: 0.04 });
    const low = bars.affordance("lowBar");
    const high = bars.affordance("highBar");
    close(
      `uneven bars inner diagonal at ${diagonal} m`,
      Vector3.length(
        Vector3.subtract(high.frame.translation, low.frame.translation),
      ) - 0.04,
      diagonal,
    );
    for (const [rail, height] of [
      [low, 1.75],
      [high, 2.55],
    ] as const) {
      const vertical = archetypeExtent(bars, "y", [rail.id]);
      const depth = archetypeExtent(bars, "z", [rail.id]);
      close(`${rail.id} upper edge`, vertical.high, height);
      close(
        `${rail.id} rail length`,
        archetypeExtent(bars, "x", [rail.id]).size,
        2.4,
      );
      close(
        `${rail.id} grip height`,
        rail.frame.translation.y,
        (vertical.low + vertical.high) / 2,
      );
      close(
        `${rail.id} grip depth`,
        rail.frame.translation.z,
        (depth.low + depth.high) / 2,
      );
      for (const end of ["left", "right"])
        close(
          `${rail.id} ${end} collar reaches the rail axis`,
          archetypeExtent(bars, "y", [`${rail.id}-post-${end}`]).high,
          rail.frame.translation.y,
        );
    }
  }
  for (const diameter of [0.18, 0.2]) {
    const ball = createRhythmicBall({ diameter, mass: 0.4 });
    const extent = archetypeExtent(ball, "y");
    close(`rhythmic ball diameter at ${diameter} m`, extent.size, diameter);
    close(
      `rhythmic ball centre at ${diameter} m`,
      ball.affordance("grip").frame.translation.y,
      diameter / 2,
    );
    close(
      `rhythmic ball palm contact at ${diameter} m`,
      ball.affordance("palm").frame.translation.y,
      extent.low,
    );
    close(`rhythmic ball minimum mass at ${diameter} m`, ball.body.mass, 0.4);
  }
  TestValidator.equals("the gym additions are placed and sized", findings, []);
}
