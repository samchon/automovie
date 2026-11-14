import { ArchetypeCourse } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The courses the ride tests drove before speed marks, grades, reversing and start seconds existed. */
const COURSES: readonly (readonly [string, ArchetypeCourse.ICourse])[] = [
  [
    "the ride test's left turn",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 20 },
        { kind: "turn", radius: 10, angle: 90 },
        { kind: "straight", length: 15 },
      ],
      cruise: 6,
      acceleration: 2,
      deceleration: 3,
    },
  ],
  [
    "a course too short to cruise",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 6 }],
      cruise: 6,
      acceleration: 2,
      deceleration: 3,
    },
  ],
  [
    "the ride test's right turn",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 5 },
        { kind: "turn", radius: 10, angle: -90 },
      ],
      cruise: 6,
      acceleration: 2,
      deceleration: 3,
    },
  ],
  [
    "the carried rider's drive",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 10 },
        { kind: "turn", radius: 8, angle: 90 },
      ],
      cruise: 6,
      acceleration: 2,
      deceleration: 3,
    },
  ],
  [
    "an offset start",
    {
      start: { x: 3, z: -2, heading: 30 },
      legs: [
        { kind: "turn", radius: 15, angle: 45 },
        { kind: "straight", length: 40 },
        { kind: "turn", radius: 6, angle: -120 },
      ],
      cruise: 9,
      acceleration: 1.5,
      deceleration: 2.5,
    },
  ],
];

/**
 * A course written without the members #3493 added plans to the same instants and states, bit for bit, as the trapezoid from rest to rest the course planned before them.
 *
 * Scenarios, for the courses the ride tests drove and one with an offset, turned start and three legs:
 * 1. Length, running time and peak speed are identical to the trapezoid's, compared with `===`.
 * 2. The instants carry identical labels at identical seconds.
 * 3. At 400 seconds across and beyond the running time, distance, speed, curvature and every component of the placement's translation and rotation are identical.
 * 4. At 400 distances across and beyond the path, the second each is reached is identical.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans each course and compares every number it publishes with the closed form; a reordered operation, an extra scaling or a different root that moves any result by one unit in the last place is caught.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the trapezoid of `ArchetypeCourse` before #3493, worked in this file as its closed form: a constant acceleration from rest to the peak (the cruise, or the square root of 2 L a b over (a + b) when shorter), the cruise, and a constant braking to rest, with each leg advanced along its line or about its centre. The promise is #3493's "a course written today plans to the same instants and states bit for bit".
 * @evidence contracts/development/testing.md#distinguishing-cases A course that cruises and one too short to, left and right turns, and a start away from the origin and turned; courses using the new members belong to their own tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory plans, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_ride_course_unchanged(): void {
  const findings: string[] = [];
  for (const [name, course] of COURSES) {
    const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", course);
    const expected: ITrapezoid = trapezoid(course);
    if (
      plan.length !== expected.length ||
      plan.duration !== expected.duration ||
      plan.peak !== expected.peak
    )
      findings.push(`${name}: length, running time or peak`);
    if (JSON.stringify(plan.instants) !== JSON.stringify(expected.instants))
      findings.push(`${name}: instants ${JSON.stringify(plan.instants)}`);
    for (let k: number = 0; k < 400; k++) {
      const seconds: number = ((k - 10) / 380) * expected.duration;
      const got: ArchetypeCourse.IState = plan.at(seconds);
      const want: IExpectedState = expected.at(seconds);
      const r: IAutoMovieQuaternion = got.placement.rotation;
      if (
        got.distance !== want.distance ||
        got.speed !== want.speed ||
        got.curvature !== want.curvature ||
        got.placement.translation.x !== want.x ||
        got.placement.translation.y !== 0 ||
        got.placement.translation.z !== want.z ||
        r.x !== want.rotation.x ||
        r.y !== want.rotation.y ||
        r.z !== want.rotation.z ||
        r.w !== want.rotation.w
      ) {
        findings.push(`${name}: the state at ${seconds} s`);
        break;
      }
      const distance: number = ((k - 10) / 380) * expected.length;
      if (plan.when(distance) !== expected.when(distance)) {
        findings.push(`${name}: the second ${distance} m is reached`);
        break;
      }
    }
  }
  TestValidator.equals("an unmarked course plans as it did", findings, []);
}

/** The closed form a course planned to before #3493. */
interface ITrapezoid {
  /** The path's length, metres. */
  length: number;

  /** The running time, seconds. */
  duration: number;

  /** The peak speed, metres per second. */
  peak: number;

  /** The labelled instants. */
  instants: { seconds: number; label: string }[];

  /** The state at a second. */
  at: (seconds: number) => IExpectedState;

  /** The second a distance is reached. */
  when: (distance: number) => number;
}

/** A state of the closed form. */
interface IExpectedState {
  /** Distance, metres. */
  distance: number;

  /** Speed, metres per second. */
  speed: number;

  /** Curvature, one over metres. */
  curvature: number;

  /** The root's X, metres. */
  x: number;

  /** The root's Z, metres. */
  z: number;

  /** The root's heading as a rotation about +Y. */
  rotation: IAutoMovieQuaternion;
}

/** One leg and where it starts. */
interface IRow {
  /** The leg. */
  leg: ArchetypeCourse.Leg;

  /** Its start along the path, metres. */
  from: number;

  /** Its length, metres. */
  span: number;

  /** Its start X, metres. */
  x: number;

  /** Its start Z, metres. */
  z: number;

  /** Its start heading, degrees. */
  heading: number;
}

/**
 * A course's trapezoid from rest to rest, with each leg advanced along its line or arc.
 *
 * @param course The course, with none of the members #3493 added.
 * @returns Its closed form.
 */
function trapezoid(course: ArchetypeCourse.ICourse): ITrapezoid {
  const rows: IRow[] = [];
  let x: number = course.start.x;
  let z: number = course.start.z;
  let heading: number = course.start.heading;
  let length: number = 0;
  for (const leg of course.legs) {
    const span: number =
      leg.kind === "straight"
        ? leg.length
        : (leg.radius * Math.abs(leg.angle) * Math.PI) / 180;
    const row: IRow = { leg, from: length, span, x, z, heading };
    rows.push(row);
    const end: { x: number; z: number; heading: number } = advance(row, span);
    x = end.x;
    z = end.z;
    heading = end.heading;
    length += span;
  }
  const a: number = course.acceleration;
  const b: number = course.deceleration;
  const peak: number = Math.min(
    course.cruise,
    Math.sqrt((2 * length * a * b) / (a + b)),
  );
  const up: number = peak / a;
  const down: number = peak / b;
  const upDistance: number = (peak * up) / 2;
  const downDistance: number = (peak * down) / 2;
  const level: number = (length - upDistance - downDistance) / peak;
  const duration: number = up + level + down;
  const travelled = (seconds: number): { distance: number; speed: number } => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t <= up) return { distance: (a * t * t) / 2, speed: a * t };
    if (t <= up + level)
      return { distance: upDistance + peak * (t - up), speed: peak };
    const left: number = duration - t;
    return { distance: length - (b * left * left) / 2, speed: b * left };
  };
  const when = (distance: number): number => {
    const s: number = Math.max(0, Math.min(length, distance));
    if (s <= upDistance) return Math.sqrt((2 * s) / a);
    if (s <= length - downDistance) return up + (s - upDistance) / peak;
    return duration - Math.sqrt((2 * (length - s)) / b);
  };
  const instants: { seconds: number; label: string }[] = [
    { seconds: 0, label: "depart" },
  ];
  if (level > 1e-9) instants.push({ seconds: up, label: "cruise" });
  instants.push({ seconds: up + Math.max(0, level), label: "brake" });
  rows.forEach((row: IRow, index: number): void => {
    if (row.leg.kind !== "turn") return;
    instants.push({ seconds: when(row.from), label: `turn${index + 1}Start` });
    instants.push({
      seconds: when(row.from + row.span),
      label: `turn${index + 1}End`,
    });
  });
  instants.push({ seconds: duration, label: "stop" });
  instants.sort(
    (p: { seconds: number }, q: { seconds: number }): number =>
      p.seconds - q.seconds,
  );
  return {
    length,
    duration,
    peak,
    instants,
    when,
    at: (seconds: number): IExpectedState => {
      const { distance, speed }: { distance: number; speed: number } =
        travelled(seconds);
      let row: IRow = rows[0]!;
      for (const candidate of rows) if (distance >= candidate.from) row = candidate;
      const pose: { x: number; z: number; heading: number } = advance(
        row,
        Math.min(row.span, distance - row.from),
      );
      return {
        distance,
        speed,
        curvature:
          row.leg.kind === "turn" ? Math.sign(row.leg.angle) / row.leg.radius : 0,
        x: pose.x,
        z: pose.z,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, pose.heading),
      };
    },
  };
}

/**
 * Where a leg has taken the root after a distance along it.
 *
 * @param row The leg and its start.
 * @param distance Distance along the leg, metres.
 * @returns The root's place and heading.
 */
function advance(
  row: IRow,
  distance: number,
): { x: number; z: number; heading: number } {
  const h: number = (row.heading * Math.PI) / 180;
  if (row.leg.kind === "straight")
    return {
      x: row.x + distance * Math.sin(h),
      z: row.z + distance * Math.cos(h),
      heading: row.heading,
    };
  const side: number = Math.sign(row.leg.angle);
  const swept: number = (side * distance) / row.leg.radius;
  const cx: number = row.x + side * row.leg.radius * Math.cos(h);
  const cz: number = row.z - side * row.leg.radius * Math.sin(h);
  return {
    x: cx - side * row.leg.radius * Math.cos(h + swept),
    z: cz + side * row.leg.radius * Math.sin(h + swept),
    heading: row.heading + (swept * 180) / Math.PI,
  };
}
