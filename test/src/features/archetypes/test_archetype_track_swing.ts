import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeTrack,
  createDoor,
} from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A body released on its hinge swings as a rigid pendulum: at the small-angle period for a small release, at the exact period for a large one, and the same release always swings the same.
 *
 * Scenarios, for a rod with a bob hung on a level hinge (the whole body swings), released 1 s into the film:
 * 1. Released at the closed form's reach (`AutoMovieArchetypeTrack.SMALL`) from where it hangs, its period, read from the times the travel crosses rest, is within 0.5 % of `2 pi sqrt(I / (m g d))` for the body's own moment `I` about the hinge (`AutoMovieArchetype.moment`), its mass and its centre of mass's distance `d` below the hinge (#3476).
 * 2. Released level with its hinge, 90 degrees, past the closed form's reach, its period is within 0.5 % of the exact period, the small-angle one over the arithmetic-geometric mean of 1 and `cos(θ0 / 2)` (Carvalhaes and Suppes 2008), and through three swings it never reaches past its release by more than 1e-6 degrees, as a swing without friction conserves its energy.
 * 3. Two tracks of the same release give bit-identical travels at every second read; before the release the travel holds the release.
 * 4. Released level with its hinge with a launch at rest, the launch comes a quarter of the exact period after the release, within 0.5 %, at the rate energy gives at the bottom, `ω sqrt(2)`, from `sqrt(2 ω^2 (1 - cos θ0))` at 90 degrees, within 1e-6 of it.
 * 4b. Released at the closed form's reach with a launch at rest, the launch comes exactly a quarter of the small-angle period after the release, the closed form's first crossing.
 * 5. A door's upright hinge, which gravity cannot turn, a release the hinge's range cannot hold, and a launch the swing never passes are refused at their fields.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a hinged body and swings it, reading travel through seconds with finite-safe bounded checks; a wrong frequency, a closed form used past its reach, a swing that gains or loses energy, a launch at the wrong instant or rate, or a body gravity cannot turn given a period is caught.
 * @evidence contracts/development/testing.md#independent-expectations The small-angle period is the textbook physical pendulum's from the body's own moment and centre of mass, computed here; the large-angle period is Gauss's arithmetic-geometric mean, iterated here; the launch's rate is energy conservation.
 * @evidence contracts/development/testing.md#distinguishing-cases A small and a large release, a launch, a repeat, and three refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_track_swing(): void {
  const findings: string[] = [];
  const v: typeof Vector3.create = Vector3.create;
  const pivot: IAutoMovieVector3 = v(0, 1, 0);
  const body: AutoMovieArchetype<"hinge", never> =
    new AutoMovieArchetypeBuilder<"hinge", never>({
      material: "steel",
      name: "pendulum",
      draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
    })
      .rod("rod", 0.01, pivot, v(0, 0.2, 0))
      .box("bob", v(0.1, 0.1, 0.1), v(0, 0.15, 0))
      .affordance({
        id: "hinge",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(pivot, v(1, 0, 0), v(0, 0, 1)),
        extent: null,
        travel: 179,
        reverse: 179,
        parts: ["rod", "bob"],
      })
      .build(2);
  const START: number = 1;
  const g: number = AutoMovieGravity.STANDARD;
  const d: number = pivot.y - body.properties.centerOfMass.y;
  const omega: number = Math.sqrt(
    (body.properties.mass * g * d) / body.moment(pivot, v(1, 0, 0)),
  );
  const small: number = (2 * Math.PI) / omega;
  const mean: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    for (let k: number = 0; k < 64 && a !== b; k++)
      [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
    return a;
  };
  const exact: (release: number) => number = (release: number): number =>
    small / mean(1, Math.cos((release * Math.PI) / 180 / 2));

  // The period: twice the mean time between successive crossings of rest.
  const period: (track: AutoMovieArchetypeTrack.ITrack<"hinge">) => number = (
    track: AutoMovieArchetypeTrack.ITrack<"hinge">,
  ): number => {
    const crossings: number[] = [];
    const step: number = 1e-3;
    for (let t: number = track.start; t + step <= track.end; t += step) {
      const a: number = track.travel(t);
      const b: number = track.travel(t + step);
      if (a === 0 || Math.sign(a) !== Math.sign(b))
        crossings.push(t + (step * a) / (a - b));
    }
    return (
      (2 * (crossings[crossings.length - 1]! - crossings[0]!)) /
      (crossings.length - 1)
    );
  };

  // 1. A small release.
  const gentle: AutoMovieArchetypeTrack.ITrack<"hinge"> =
    AutoMovieArchetypeTrack.swing(body, "hinge", {
      start: START,
      release: AutoMovieArchetypeTrack.SMALL * (180 / Math.PI),
      seconds: 4 * small,
    });
  if (!(Math.abs(period(gentle) / small - 1) <= 0.005))
    findings.push(
      `released at the closed form's reach it swings at ${period(gentle)} s, ${small} s expected`,
    );

  // 2. A large release.
  const wide: AutoMovieArchetypeTrack.ITrack<"hinge"> =
    AutoMovieArchetypeTrack.swing(body, "hinge", {
      start: START,
      release: 90,
      seconds: 3 * exact(90),
    });
  if (!(Math.abs(period(wide) / exact(90) - 1) <= 0.005))
    findings.push(
      `released 90 degrees it swings at ${period(wide)} s, ${exact(90)} s expected`,
    );
  let reach: number = 0;
  for (let t: number = wide.start; t <= wide.end; t += 1e-3)
    reach = Math.max(reach, Math.abs(wide.travel(t)));
  if (!(reach <= 90 + 1e-6))
    findings.push(`released 90 degrees it reaches ${reach} degrees`);

  // 3. The same release swings the same, and holds before it.
  const twin: AutoMovieArchetypeTrack.ITrack<"hinge"> =
    AutoMovieArchetypeTrack.swing(body, "hinge", {
      start: START,
      release: 90,
      seconds: 3 * exact(90),
    });
  for (let t: number = 0; t <= wide.end + 1; t += 0.137)
    if (twin.travel(t) !== wide.travel(t))
      findings.push(`two tracks of one release differ at ${t} s`);
  if (wide.travel(0) !== 90)
    findings.push(
      `before its release the hinge is at ${wide.travel(0)} degrees`,
    );

  // 4. A launch at the bottom.
  const thrown: AutoMovieArchetypeTrack.ITrack<"hinge"> =
    AutoMovieArchetypeTrack.swing(body, "hinge", {
      start: START,
      release: 90,
      seconds: exact(90),
      launch: 0,
    });
  const bottom: number =
    (Math.sqrt(2 * omega * omega * (1 - Math.cos(Math.PI / 2))) * 180) /
    Math.PI;
  if (
    thrown.launch === null ||
    !(
      Math.abs((thrown.launch.seconds - START) / (exact(90) / 4) - 1) <= 0.005
    ) ||
    !(Math.abs(Math.abs(thrown.launch.rate) / bottom - 1) <= 1e-6)
  )
    findings.push(
      `the launch is ${JSON.stringify(thrown.launch)}, a quarter period ${exact(90) / 4} s after the release at ${bottom} degrees a second expected`,
    );

  // 4b. The closed form's launch: released at its reach, the bottom comes a quarter of the small-angle period after.
  const tossed: AutoMovieArchetypeTrack.ITrack<"hinge"> =
    AutoMovieArchetypeTrack.swing(body, "hinge", {
      start: START,
      release: AutoMovieArchetypeTrack.SMALL * (180 / Math.PI),
      seconds: small,
      launch: 0,
    });
  if (
    tossed.launch === null ||
    !(Math.abs(tossed.launch.seconds - START - small / 4) <= 1e-9)
  )
    findings.push(
      `the closed form's launch is ${JSON.stringify(tossed.launch)}, ${small / 4} s after the release expected`,
    );

  // 5. Refusals.
  for (const [field, make] of [
    [
      "hinge",
      (): unknown =>
        AutoMovieArchetypeTrack.swing(createDoor({ kind: "hinged" }), "hinge", {
          start: 0,
          release: 30,
          seconds: 1,
        }),
    ],
    [
      "release",
      (): unknown =>
        AutoMovieArchetypeTrack.swing(body, "hinge", {
          start: 0,
          release: 180,
          seconds: 1,
        }),
    ],
    [
      "launch",
      (): unknown =>
        AutoMovieArchetypeTrack.swing(body, "hinge", {
          start: 0,
          release: AutoMovieArchetypeTrack.SMALL * (180 / Math.PI),
          seconds: 1,
          launch: 90,
        }),
    ],
  ] as const) {
    let refused: string | null = null;
    try {
      make();
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== field)
      findings.push(`a bad ${field} was refused at ${refused}`);
  }
  TestValidator.equals("a released body swings as a pendulum", findings, []);
}
