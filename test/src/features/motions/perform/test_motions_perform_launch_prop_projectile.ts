import type {
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, launchPropProjectile } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a launched centre or velocity may stand from its closed form: a few
 * sums and products of metre and second values, far above their rounding.
 */
const LAUNCH: number = 1e-12;

/** The standard gravity, m/s². */
const G: number = 9.80665;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** A quarter turn about `+Y`, taking `+X` to `-Z`. */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * `launchPropProjectile` makes a released prop's engine projectile: from its
 * displayed origin, or a sphere's turned centre, at the published velocity or
 * the one that reaches an aimed point in the aimed time, under standard
 * gravity, with the attitude the release declares.
 *
 * Scenarios, for a prop released at (0, 1, 0) turned a quarter about `+Y`:
 *
 * 1. A plain release flies from the origin at the published velocity, fixed at
 *    the displayed turn, under (0, -9.80665, 0), without drag or a flight.
 * 2. A sphere centred 0.1 m along the prop's `+X` flies from (0, 1, -0.1).
 * 3. An aim at (3, 1, 4) in 0.5 s launches at (6, 2.4516625, 8), and the flight
 *    then meets the point: `centre + v t + g t² / 2`.
 * 4. A velocity attitude is kept as given; a spin takes the displayed turn.
 * 5. A dragged prop carries its drag and its solved flight.
 * 6. Refused: a sphere of no radius, of negative friction, or turning with its
 *    velocity; an aim with drag or in no time.
 */
export function test_motions_perform_launch_prop_projectile(): void {
  const origin: IAutoMovieVector3 = P(0, 1, 0);
  const launch: IAutoMovieMotionPropLaunch = {
    prop: "ball",
    seconds: 1,
    point: origin,
    velocity: P(1, 2, 3),
  };
  const fly = (
    changes: Partial<IAutoMovieMotionPropLaunch>,
    drag?: IAutoMovieProjectile.IDrag,
  ): IAutoMovieProjectile =>
    launchPropProjectile({ ...launch, ...changes }, origin, QUARTER, drag);

  // 1. Plain.
  const plain: IAutoMovieProjectile = fly({});
  TestValidator.predicate(
    "a plain release",
    near(plain.origin, origin) &&
      near(plain.velocity, P(1, 2, 3)) &&
      near(plain.gravity, P(0, -G, 0)) &&
      plain.attitude?.kind === "fixed" &&
      plain.attitude.rotation === QUARTER &&
      plain.drag === undefined &&
      plain.flight === undefined,
  );

  // 2. A sphere.
  TestValidator.predicate(
    "a sphere flies by its turned centre",
    near(
      fly({ sphere: { radius: 0.1, centre: P(0.1, 0, 0) } }).origin,
      P(0, 1, -0.1),
    ),
  );

  // 3. An aim.
  const aimed: IAutoMovieProjectile = fly({
    aim: { point: P(3, 1, 4), seconds: 0.5 },
  });
  const t: number = 0.5;
  TestValidator.predicate(
    "an aimed launch meets its point in its time",
    near(aimed.velocity, P(6, 2.4516625, 8)) &&
      near(
        P(
          aimed.origin.x + aimed.velocity.x * t,
          aimed.origin.y + aimed.velocity.y * t - (G * t * t) / 2,
          aimed.origin.z + aimed.velocity.z * t,
        ),
        P(3, 1, 4),
      ),
  );

  // 4. Attitudes.
  const along: IAutoMovieProjectile = fly({ attitude: { kind: "velocity" } });
  const spun: IAutoMovieProjectile = fly({
    attitude: { kind: "spin", axis: P(0, 1, 0), rate: 3 },
  });
  TestValidator.predicate(
    "declared attitudes",
    along.attitude?.kind === "velocity" &&
      spun.attitude?.kind === "spin" &&
      spun.attitude.rate === 3 &&
      spun.attitude.rotation === QUARTER,
  );

  // 5. Drag.
  const drag: IAutoMovieProjectile.IDrag = {
    coefficient: 0.47,
    area: 0.0038,
    mass: 0.057,
  };
  const dragged: IAutoMovieProjectile = fly({}, drag);
  TestValidator.predicate(
    "a dragged prop carries its flight",
    dragged.drag === drag && dragged.flight !== undefined,
  );

  // 6. Refusals.
  const refusals: [string, () => unknown, string][] = [
    ["no radius", () => fly({ sphere: { radius: 0, centre: origin } }), "sphere"],
    [
      "negative friction",
      () =>
        fly({
          sphere: { radius: 0.1, centre: origin, tangentialFriction: -1 },
        }),
      "sphere",
    ],
    [
      "a sphere turning with its velocity",
      () =>
        fly({
          sphere: { radius: 0.1, centre: origin },
          attitude: { kind: "velocity" },
        }),
      "sphere",
    ],
    [
      "an aim with drag",
      () => fly({ aim: { point: origin, seconds: 1 } }, drag),
      "aim",
    ],
    ["an aim in no time", () => fly({ aim: { point: origin, seconds: 0 } }), "aim"],
  ];
  for (const [title, task, axis] of refusals)
    TestValidator.predicate(`refused: ${title}`, refused(task, axis));
  TestValidator.predicate(
    "a sphere of zero friction is admitted",
    fly({ sphere: { radius: 0.1, centre: origin, tangentialFriction: 0 } })
      .origin !== undefined,
  );
}

/** Whether two points agree within the launch bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= LAUNCH &&
    Math.abs(a.y - b.y) <= LAUNCH &&
    Math.abs(a.z - b.z) <= LAUNCH
  );
}

/** Whether a task throws a refusal on the axis. */
function refused(task: () => unknown, axis: string): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof AutoMovieMotionHumanRefusal && error.axis === axis;
  }
}
