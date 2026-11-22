import { AutoMoviePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Gravity, metres per second squared. */
const G: number = 9.81;

/** The centre of mass's height over the floor, metres. */
const HEIGHT: number = 0.9;

/** The stance's centre-of-pressure inset, metres (`physicalStanceBalance.MARGIN`). */
const INSET: number = 0.02;

/** The capture point's accepted excursion past the shrunken support, metres. */
const MARGIN: number = 0.01;

/** The swing's unloading ramp, seconds, peak acceleration, m/s^2, and clearance, metres. */
const SWING: { ramp: number; acceleration: number; height: number } = {
  ramp: 0.05,
  acceleration: 30,
  height: 0.05,
};

/** The longest step, metres. */
const REACH: number = 0.5;

/**
 * The recovery step is chosen as the capture-point rules state, checked
 * against their closed forms without a simulation:
 *
 * 1. Trigger (Koolen et al., Corollary 3): a capture point inside the
 *    support but past its outline shrunk by the stance's inset, by more than
 *    the margin, asks for a step; one within the margin of the shrunken
 *    outline does not.
 * 2. Place and time together (Khadiv et al. 2017, Section III-B): the step
 *    lands where the capture point will be when the leg can land, xi_T = u0
 *    + (xi - u0) e^(omega T), u0 the remaining foot's shrunken outline's
 *    point nearest xi, T = ramp + sqrt(max(5.77 d, 24 h) / a) for the step's
 *    distance d, inside the new support shrunk by the inset (Pratt et al.,
 *    M2V2, Section VII-E1); the foot keeps its own side, at least as wide
 *    as it stands, and never crosses toward the other (Section IX-G).
 * 3. Reach and viability (Khadiv et al. 2017, Eq. 9): a capture point past
 *    the reach clamps the step to the reach while the capture point left
 *    beyond the new foot stays within l / (e^(omega T) - 1); past that bound
 *    the stance is unrecoverable.
 * 4. A four-support body steps a front foot, and after a landing the other
 *    front foot before the one that just landed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMoviePhysicalBalance.assess` on rectangular foot patches and reads its state, step target and timing.
 * @evidence contracts/development/testing.md#independent-expectations The capture point at landing follows the closed form with the remaining foot's shrunken rectangle clamped by hand, and the new support is a hand-built convex hull, not the implementation's polygon routines.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a trigger on the full outline from one on the shrunken outline, a crossover step from one on its own side, a landing that leaves the capture point outside the new support from one that captures it, an unclamped step from a clamped one, and a repeated front foot from the other.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_balance_step_choice(): void {
  const failures: string[] = [];
  const omega: number = Math.sqrt(G / HEIGHT);

  // A biped's two feet, each 0.1 m wide and 0.2 m long.
  const biped: IAutoMoviePhysicalSupportPatch[] = [
    foot("left", 0.05, 0.15, 0, 0.2),
    foot("right", -0.15, -0.05, 0, 0.2),
  ];
  const assess = (
    supports: IAutoMoviePhysicalSupportPatch[],
    capture: IAutoMovieVector3,
    recent?: string,
  ): IAutoMoviePhysicalBalance.IResult =>
    AutoMoviePhysicalBalance.assess({
      center: { x: capture.x, y: HEIGHT, z: capture.z },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: G,
      floor: 0,
      supports,
      pattern: pattern(supports.map((support) => support.bone)),
      maximumStep: REACH,
      margin: MARGIN,
      unavailable: [],
      swing: SWING,
      inset: INSET,
      ...(recent ? { recent } : {}),
    });

  // The quickest swing: the minimum-jerk transfer's time or the clearance's,
  // whose peak accelerations are 5.77 d / T^2 and 24 h / T^2.
  const swing = (d: number): number =>
    Math.sqrt(Math.max(5.77 * d, 24 * SWING.height) / SWING.acceleration);

  // 1. The trigger reads the shrunken outline: its front edge is at 0.18 m.
  if (assess(biped, { x: 0, y: 0, z: 0.18 + 0.005 }).state !== "supported")
    failures.push(
      "a capture point within the margin of the shrunken support stepped",
    );
  const short = assess(biped, { x: 0, y: 0, z: 0.18 + 0.015 });
  if (short.step) {
    const moving = biped.find((support) => support.bone === short.step!.bone)!;
    const d: number = Math.hypot(
      short.step.target.x - moving.position.x,
      short.step.target.z - moving.position.z,
    );
    if (!(Math.abs((short.step.seconds ?? NaN) - swing(d)) < 1e-3))
      failures.push(
        `a short step's time ${short.step.seconds} is not ${swing(d)} for d ${d}`,
      );
  }
  // Its distance outside the support stays the real support's: inside it.
  if (short.outside !== 0)
    failures.push(
      `a capture point inside the support is ${short.outside} m outside it`,
    );
  if (short.state !== "recovery")
    failures.push(
      "a capture point past the shrunken support by more than the margin did not step",
    );

  // 2. Place and time together for a forward capture point.
  const capture: IAutoMovieVector3 = { x: 0.02, y: 0, z: 0.3 };
  const result: IAutoMoviePhysicalBalance.IResult = assess(biped, capture);
  const step = result.step;
  if (!step) failures.push("a forward capture point chose no step");
  else {
    const moving: IAutoMoviePhysicalSupportPatch = biped.find(
      (support) => support.bone === step.bone,
    )!;
    const staying: IAutoMoviePhysicalSupportPatch = biped.find(
      (support) => support.bone !== step.bone,
    )!;
    const xs: number[] = staying.points.map((p) => p.x);
    const zs: number[] = staying.points.map((p) => p.z);
    const u0: IAutoMovieVector3 = {
      x: clamp(capture.x, Math.min(...xs) + INSET, Math.max(...xs) - INSET),
      y: 0,
      z: clamp(capture.z, Math.min(...zs) + INSET, Math.max(...zs) - INSET),
    };
    const d: number = Math.hypot(
      step.target.x - moving.position.x,
      step.target.z - moving.position.z,
    );
    const growth: number = Math.exp(omega * (SWING.ramp + swing(d)));
    const landing: IAutoMovieVector3 = {
      x: u0.x + (capture.x - u0.x) * growth,
      y: 0,
      z: u0.z + (capture.z - u0.z) * growth,
    };
    // No crossover: the limb keeps its own side, at least as wide as it
    // stands.
    const side: number = Math.sign(moving.position.x - staying.position.x);
    if (
      !(
        side * (step.target.x - staying.position.x) >=
        Math.abs(moving.position.x - staying.position.x) - 1e-9
      )
    )
      failures.push(
        `step target x ${step.target.x} crosses toward the other foot at ${staying.position.x}`,
      );
    if (!(step.target.z > moving.position.z))
      failures.push(
        `step target z ${step.target.z} is not ahead of the foot's start`,
      );
    // The capture point at landing lies inside the new support, shrunk by
    // the inset.
    const moved: IAutoMovieVector3[] = moving.points.map((p) => ({
      x: p.x - moving.position.x + step.target.x,
      y: 0,
      z: p.z - moving.position.z + step.target.z,
    }));
    const depth: number = inside(hull([...staying.points, ...moved]), landing);
    if (!(depth >= INSET - 1e-3))
      failures.push(
        `the capture point at landing ${JSON.stringify(landing)} lies ${depth} m inside the new support, under the inset`,
      );
    if (!(Math.abs((step.seconds ?? NaN) - swing(d)) < 1e-3))
      failures.push(
        `swing time ${step.seconds} is not sqrt(max(5.77 d, 24 h) / a) for d ${d}`,
      );
  }
  // 3. A capture point past the reach but within the viability bound clamps
  //    the step to the reach; one past the bound is unrecoverable.
  const far = assess(biped, { x: 0.02, y: 0, z: 0.34 }).step;
  if (!far) failures.push("a capture point past the reach chose no step");
  else {
    const moving = biped.find((support) => support.bone === far.bone)!;
    const d: number = Math.hypot(
      far.target.x - moving.position.x,
      far.target.z - moving.position.z,
    );
    if (!(Math.abs(d - REACH) < 1e-9))
      failures.push(`a far step travels ${d} m, not the reach ${REACH} m`);
  }
  const hopeless = assess(biped, { x: 0, y: 0, z: 3 });
  if (hopeless.state !== "unrecoverable")
    failures.push(
      `a capture point past the viability bound is ${hopeless.state}`,
    );

  // 4. Four supports: a front foot steps, and after it landed the other one.
  const four: IAutoMoviePhysicalSupportPatch[] = [
    foot("frontLeft", 0.2, 0.3, 0.3, 0.4),
    foot("frontRight", -0.3, -0.2, 0.3, 0.4),
    foot("backLeft", 0.2, 0.3, -0.4, -0.3),
    foot("backRight", -0.3, -0.2, -0.4, -0.3),
  ];
  const ahead: IAutoMovieVector3 = { x: 0, y: 0, z: 0.45 };
  const first = assess(four, ahead).step;
  if (!first || !first.bone.startsWith("front"))
    failures.push(
      `a forward capture point stepped ${first?.bone}, not a front foot`,
    );
  else {
    const next = assess(four, ahead, first.bone).step;
    if (!next || !next.bone.startsWith("front") || next.bone === first.bone)
      failures.push(
        `after ${first.bone} landed the next step was ${next?.bone}, not the other front foot`,
      );
  }
  TestValidator.equals("recovery step choice", failures, []);
}

/** A rectangular foot patch on the floor. */
function foot(
  bone: string,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
): IAutoMoviePhysicalSupportPatch {
  return {
    bone,
    points: [
      { x: x0, y: 0, z: z0 },
      { x: x1, y: 0, z: z0 },
      { x: x1, y: 0, z: z1 },
      { x: x0, y: 0, z: z1 },
    ],
    position: { x: (x0 + x1) / 2, y: 0, z: (z0 + z1) / 2 },
  };
}

/** A footfall pattern naming the given limbs, one support required to stay. */
function pattern(bones: string[]): IAutoMovieFootfallPattern {
  return {
    id: "test",
    limbs: bones.map((bone: string, index: number) => ({
      bone,
      chain: [bone],
      phase: index / bones.length,
      duty: 0.5,
      offset: { forward: 0, left: 0 },
      stride: [{ speed: 0, length: 0 }],
    })),
    minimumSupports: 1,
  };
}

/** Clamp a value to a range. */
function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

/** A convex hull of floor points, counter-clockwise seen from above (monotone chain). */
function hull(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
  const sorted: IAutoMovieVector3[] = [...points].sort(
    (a, b) => a.x - b.x || a.z - b.z,
  );
  const cross = (
    o: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const half = (list: IAutoMovieVector3[]): IAutoMovieVector3[] => {
    const out: IAutoMovieVector3[] = [];
    for (const p of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
      )
        out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/** How deep a point lies inside a counter-clockwise convex polygon, metres: its least distance to an edge, negative outside. */
function inside(
  polygon: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
): number {
  return Math.min(
    ...polygon.map((a: IAutoMovieVector3, i: number): number => {
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      return (
        ((b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x)) /
        Math.hypot(b.x - a.x, b.z - a.z)
      );
    }),
  );
}
