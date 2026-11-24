import { AutoMoviePhysicalBalance } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";

/** Gravity, metres per second squared. */
const G: number = 9.81;

/** The centre of mass's height over the floor, metres. */
const HEIGHT: number = 0.9;

/**
 * The stance's centre-of-pressure inset, metres
 * (`physicalStanceBalance.MARGIN`).
 */
const INSET: number = 0.02;

/** The capture point's accepted excursion past the shrunken support, metres. */
const MARGIN: number = 0.01;

/**
 * The swing's unloading ramp, seconds, peak acceleration, m/s^2, and clearance,
 * metres.
 */
const SWING: { ramp: number; acceleration: number; height: number } = {
  ramp: 0.05,
  acceleration: 30,
  height: 0.05,
};

/** The longest step, metres. */
const REACH: number = 0.5;

/**
 * The recovery step is chosen as the capture-point rules state, checked against
 * their closed forms without a simulation:
 *
 * 1. Trigger (Koolen et al., Corollary 3): a capture point inside the support but
 *    past its outline shrunk by the stance's inset, by more than the margin,
 *    asks for a step; one within the margin of the shrunken outline does not.
 * 2. Place and time together (Khadiv et al. 2017, Section III-B): the step lands
 *    where the capture point will be when the leg can land, xi_T = u0
 *
 *    - (xi - u0) e^(omega T), u0 the remaining foot's shrunken outline's point
 *         nearest xi, T = ramp + sqrt(max(5.77 d, 24 h) / a) for the step's
 *         distance d: within reach the foot's middle lands on it, inside the
 *         new support shrunk by the inset (Koolen et al., Section II-G; Pratt
 *         et al., M2V2, Section VII-E1); the foot keeps its own side, at least
 *         as wide as it stands, and never crosses toward the other (Section
 *         IX-G).
 * 3. Reach and one-step capture (Koolen et al., Eq. 25): a capture point past the
 *    reach clamps the step to the reach; one past the one-step bound is still
 *    stepped to, clamped and marked not viable (Khadiv et al. 2017, Section
 *    III-B: viability is soft). 3b-d. After a diagonal step the limb keeps the
 *    body's side; a capture point behind the feet is stepped back to; a step
 *    shorter than the margin is no step (Pratt et al., M2V2, Section VII-E1:
 *    stop in double support).
 * 4. A four-support body steps a front foot, and after a landing the other front
 *    foot before the one that just landed.
 * 5. Among capturing steps, the limb whose remaining supports already hold the
 *    commanded centre of pressure steps first (Pratt et al., M2V2, Section
 *    VII-A: the leg is unloaded before it swings).
 * 6. A swing under way is re-aimed by the same rules with its elapsed time spent:
 *    it keeps its own side and lands sooner than a fresh swing.
 * 7. Unloading ranks capturing steps only: past every step's reach a front foot
 *    of a four-support body steps, not a rear one the centre of pressure has
 *    already left.
 * 8. A request whose limb has begun unloading keeps that limb even when
 *    another limb's step captures and its own does not, and is kept as it is
 *    when its own limb has no step; before unloading it moves to the capturing
 *    step (design-4017-landing, decision 2: commit at the trigger).
 * 9. A four-support body none of whose capturing steps can be unloaded at once
 *    steps the chosen front foot with the rear foot across from it, both moved
 *    by one displacement (Chen et al. 2022, Section 2.1, Example 1); a single
 *    step that captures and can be unloaded wins over the pair, and a pair
 *    under way is planned again as that pair.
 * 10. A pair's two steps share a start and count as one landed swing phase; a
 *    step armed before the phase ahead of it resolved overlaps it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMoviePhysicalBalance.assess` on rectangular foot patches and reads its state, step target and timing.
 * @evidence contracts/development/testing.md#independent-expectations The capture point at landing follows the closed form with the remaining foot's shrunken rectangle clamped by hand, and the new support is a hand-built convex hull, not the implementation's polygon routines.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a trigger on the full outline from one on the shrunken outline, a crossover step from one on its own side, a landing that leaves the capture point outside the new support from one that captures it, an unclamped step from a clamped one, a repeated front foot from the other, an unloading request from one not yet unloading, a pair from an unloadable single step, and a pair's shared start from an overlapping step.
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
      heading: { x: 0, y: 0, z: 1 },
      ...(recent ? { recent } : {}),
    });

  // The quickest swing: the minimum-jerk transfer's time or the clearance's,
  // whose peak accelerations are 5.77 d / T^2 and 24 h / T^2, and no shorter
  // than Khadiv's 0.3 s.
  const swing = (d: number): number =>
    Math.max(
      0.3,
      Math.sqrt(Math.max(5.77 * d, 24 * SWING.height) / SWING.acceleration),
    );

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
    // Within reach the foot's middle lands on the capture point at landing,
    // on its own side: not the shortest step that just brings it inside.
    const width: number = Math.abs(moving.position.x - staying.position.x);
    const aimed: number =
      staying.position.x +
      side * Math.max(side * (landing.x - staying.position.x), width);
    if (
      !(Math.abs(step.target.z - landing.z) < 1e-3) ||
      !(Math.abs(step.target.x - aimed) < 1e-3)
    )
      failures.push(
        `step target ${JSON.stringify(step.target)} is not the capture point at landing ${JSON.stringify(landing)} on its side`,
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
    if (!(Math.abs(d - REACH) < 1e-3))
      failures.push(`a far step travels ${d} m, not the reach ${REACH} m`);
  }
  // Past the one-step bound a step is still taken, clamped to the reach and
  // marked not viable: the body steps again or falls by its physics.
  const hopeless = assess(biped, { x: 0, y: 0, z: 3 }).step;
  if (!hopeless)
    failures.push("a capture point past the one-step bound chose no step");
  else {
    const moving = biped.find((support) => support.bone === hopeless.bone)!;
    const d: number = Math.hypot(
      hopeless.target.x - moving.position.x,
      hopeless.target.z - moving.position.z,
    );
    if (hopeless.viable !== false || !(Math.abs(d - REACH) < 1e-9))
      failures.push(
        `a step past the one-step bound is viable ${hopeless.viable} over ${d} m`,
      );
  }
  // 3b. After a diagonal first step the side a limb keeps is the body's,
  // across its heading: the left foot, behind and to the left of the right
  // foot that stepped ahead and out, steps without crossing it.
  const diagonal: IAutoMoviePhysicalSupportPatch[] = [
    foot("left", 0.05, 0.15, 0, 0.2),
    foot("right", -0.28, -0.18, 0.6, 0.8),
  ];
  const crossing = AutoMoviePhysicalBalance.assess({
    center: { x: -0.11, y: HEIGHT, z: 0.5 },
    velocity: { x: -0.1, y: 0, z: 0.4 },
    gravity: G,
    floor: 0,
    supports: diagonal,
    pattern: pattern(["left", "right"]),
    maximumStep: REACH,
    margin: MARGIN,
    unavailable: ["right"],
    swing: SWING,
    inset: INSET,
    heading: { x: 0, y: 0, z: 1 },
    force: true,
  }).step;
  if (!crossing || crossing.bone !== "left")
    failures.push(
      `after a diagonal step the left foot did not step (${crossing?.bone})`,
    );
  else if (!(crossing.target.x > -0.23 + 0.1 - 1e-9))
    failures.push(
      `the left foot crosses toward the right foot: target x ${crossing.target.x}`,
    );

  const four: IAutoMoviePhysicalSupportPatch[] = [
    foot("frontLeft", 0.2, 0.3, 0.3, 0.4),
    foot("frontRight", -0.3, -0.2, 0.3, 0.4),
    foot("backLeft", 0.2, 0.3, -0.4, -0.3),
    foot("backRight", -0.3, -0.2, -0.4, -0.3),
  ];
  // 3c. A capture point behind the feet is stepped back to: back steps are
  // allowed, only crossover is not.
  const back = assess(biped, { x: 0.02, y: 0, z: -0.12 }).step;
  if (!back) failures.push("a capture point behind the feet chose no step");
  else {
    const moving = biped.find((support) => support.bone === back.bone)!;
    if (!(back.target.z < moving.position.z))
      failures.push(
        `a backward capture point stepped to z ${back.target.z}, not back`,
      );
  }
  // 3d. A step the support already captures, shorter than the margin, is
  // no step: the body holds, as a four-support body asked to step with its
  // capture point at its centre does.
  const hold = AutoMoviePhysicalBalance.assess({
    center: { x: 0, y: HEIGHT, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    gravity: G,
    floor: 0,
    supports: four,
    pattern: pattern(four.map((support) => support.bone)),
    maximumStep: REACH,
    margin: MARGIN,
    unavailable: [],
    swing: SWING,
    inset: INSET,
    heading: { x: 0, y: 0, z: 1 },
    force: true,
  });
  if (hold.state !== "supported" || hold.step)
    failures.push(
      `a sub-margin step was taken: ${hold.state} ${hold.step?.bone}`,
    );
  // 4. Four supports: a front foot steps, and after it landed the other one.
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
  // 5. Among capturing steps, a limb whose remaining foot already holds the
  // commanded centre of pressure steps first: it can be unloaded at once.
  for (const [pressure, expected] of [
    [{ x: 0.1, y: 0, z: 0.1 }, "right"],
    [{ x: -0.1, y: 0, z: 0.1 }, "left"],
  ] as const) {
    const chosen = AutoMoviePhysicalBalance.assess({
      center: { x: 0.02, y: HEIGHT, z: 0.3 },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: G,
      floor: 0,
      supports: biped,
      pattern: pattern(["left", "right"]),
      maximumStep: REACH,
      margin: MARGIN,
      unavailable: [],
      swing: SWING,
      inset: INSET,
      heading: { x: 0, y: 0, z: 1 },
      pressure,
    }).step;
    if (chosen?.bone !== expected)
      failures.push(
        `with the centre of pressure on the ${expected === "right" ? "left" : "right"} foot, ${chosen?.bone} stepped`,
      );
  }

  // 6. A swing under way is aimed by the same rules with its elapsed time
  // spent: the right foot, lifted 0.1 s ago, keeps its side however far
  // left the capture point lies, and lands sooner than a fresh swing would.
  const inFlight = (elapsed: number, x: number) =>
    AutoMoviePhysicalBalance.assess({
      center: { x, y: HEIGHT, z: 0.3 },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: G,
      floor: 0,
      supports: biped,
      pattern: pattern(["left", "right"]),
      maximumStep: REACH,
      margin: MARGIN,
      unavailable: ["left"],
      swing: { ...SWING, ramp: 0, elapsed },
      inset: INSET,
      heading: { x: 0, y: 0, z: 1 },
      force: true,
    }).step;
  const kept = inFlight(0.1, 0.3);
  if (!kept || kept.bone !== "right" || !(kept.target.x <= -0.1 + 1e-9))
    failures.push(
      `an in-flight right step crosses to x ${kept?.target.x} (${kept?.bone})`,
    );
  const fresh = inFlight(0, 0.02);
  const late = inFlight(0.1, 0.02);
  if (
    !fresh ||
    !late ||
    !(
      Math.hypot(late.target.x + 0.1, late.target.z - 0.1) <
      Math.hypot(fresh.target.x + 0.1, fresh.target.z - 0.1)
    )
  )
    failures.push(
      `an in-flight step lands at ${JSON.stringify(late?.target)}, no sooner than a fresh one at ${JSON.stringify(fresh?.target)}`,
    );

  // 7. A step that cannot capture is not chosen for being unloadable: under
  // a forward push past every step's reach, a front foot steps, not a rear
  // one whose remaining supports hold the centre of pressure on the front
  // edge.
  const beyond = AutoMoviePhysicalBalance.assess({
    center: { x: 0, y: HEIGHT, z: 3 },
    velocity: { x: 0, y: 0, z: 0 },
    gravity: G,
    floor: 0,
    supports: four,
    pattern: pattern(four.map((support) => support.bone)),
    maximumStep: REACH,
    margin: MARGIN,
    unavailable: [],
    swing: SWING,
    inset: INSET,
    heading: { x: 0, y: 0, z: 1 },
    pressure: { x: 0, y: 0, z: 0.38 },
  }).step;
  if (!beyond || beyond.viable !== false || !beyond.bone.startsWith("front"))
    failures.push(`past every reach, ${beyond?.bone} stepped (viable ${beyond?.viable})`);

  // 8. A request keeps its limb once that limb has begun unloading.
  const own: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]> = {
    bone: "front-right",
    target: { x: -0.4, y: 0, z: 0.8 },
    seconds: 0.3,
    viable: false,
  };
  const better: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]> = {
    bone: "front-left",
    target: { x: 0.4, y: 0, z: 0.8 },
    seconds: 0.3,
    viable: true,
  };
  const committed: IAutoMoviePhysicalBalance.IResult["step"] =
    AutoMoviePhysicalBalance.retarget({
      unloading: true,
      own,
      best: better,
    });
  if (committed?.bone !== own.bone)
    failures.push(`an unloading request moved to ${committed?.bone}`);
  if (
    AutoMoviePhysicalBalance.retarget({ unloading: true, best: better }) !==
    undefined
  )
    failures.push("an unloading request without a step of its own moved");
  if (
    AutoMoviePhysicalBalance.retarget({ unloading: false, own, best: better })
      ?.bone !== better.bone
  )
    failures.push("a request not yet unloading kept a step that does not capture");

  // 9. A diagonal pair: under a forward push a little to the left with the
  // centre of pressure on the front edge, both front feet capture but bear
  // it, and the rear feet cannot capture, so the front foot a single step
  // would take steps with the rear foot across from it, both moved by one
  // displacement, the other diagonal holding. With the capture point left of
  // the centre, the right front foot's step is the shorter: the supports it
  // leaves hold the capture point nearer.
  const forward = (
    pressure: IAutoMovieVector3,
    extra?: Partial<IAutoMoviePhysicalBalance.IAssessInput>,
  ): IAutoMoviePhysicalBalance.IResult["step"] =>
    AutoMoviePhysicalBalance.assess({
      center: { x: 0.02, y: HEIGHT, z: 0.45 },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: G,
      floor: 0,
      supports: four,
      pattern: pattern(four.map((support) => support.bone)),
      maximumStep: REACH,
      margin: MARGIN,
      unavailable: [],
      swing: SWING,
      inset: INSET,
      heading: { x: 0, y: 0, z: 1 },
      pressure,
      ...extra,
    }).step;
  const displacement = (
    bone: string,
    target: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const support = four.find((candidate) => candidate.bone === bone)!;
    return {
      x: target.x - support.position.x,
      y: 0,
      z: target.z - support.position.z,
    };
  };
  const paired = forward({ x: 0, y: 0, z: 0.38 });
  if (
    paired?.bone !== "frontRight" ||
    paired.pair?.bone !== "backLeft" ||
    paired.viable !== true
  )
    failures.push(
      `a forward push bearing on the front edge stepped ${paired?.bone}+${paired?.pair?.bone} (viable ${paired?.viable}), not frontRight+backLeft`,
    );
  else {
    const lead: IAutoMovieVector3 = displacement(paired.bone, paired.target);
    const partner: IAutoMovieVector3 = displacement(
      paired.pair!.bone,
      paired.pair!.target,
    );
    if (
      !(Math.hypot(lead.x - partner.x, lead.z - partner.z) < 1e-12) ||
      !(lead.z > 0)
    )
      failures.push(
        `the pair's feet move by ${JSON.stringify(lead)} and ${JSON.stringify(partner)}, not one forward displacement`,
      );
  }
  // A single step that both captures and can be unloaded at once wins: the
  // centre of pressure inside the three feet the front-left foot leaves.
  const single = forward({ x: -0.1, y: 0, z: 0.1 });
  if (single?.bone !== "frontLeft" || single.pair !== undefined)
    failures.push(
      `with the centre of pressure off the front-left foot, ${single?.bone}+${single?.pair?.bone} stepped, not frontLeft alone`,
    );
  // A pair under way is planned again as that pair, even where a single
  // step could now be unloaded.
  const flying = forward(
    { x: -0.1, y: 0, z: 0.1 },
    {
      pair: ["frontLeft", "backRight"],
      unavailable: ["frontRight", "backLeft"],
      swing: { ...SWING, ramp: 0, elapsed: 0.1 },
      force: true,
    },
  );
  if (flying?.bone !== "frontLeft" || flying.pair?.bone !== "backRight")
    failures.push(
      `a pair under way was planned again as ${flying?.bone}+${flying?.pair?.bone}`,
    );

  // 10. Swing phases: the two feet of a pair share one start and count as
  // one landed phase; a step armed before the phase ahead of it resolved
  // overlaps it, as one starting apart from it does.
  const swung = (
    bone: string,
    start: number,
    resolved?: number,
  ): IAutoMoviePhysicalRecoveryState["steps"][number] => ({
    bone,
    kind: "swing",
    start,
    end: start + 0.3,
    from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
    to: { point: [0, 0.3], yaw: 0, pitch: 0, clearance: 0 },
    ...(resolved !== undefined
      ? { resolved: { seconds: resolved, status: "landed" as const } }
      : {}),
  });
  const pair = [swung("frontLeft", 1, 1.3), swung("backRight", 1, 1.35)];
  if (
    PhysicalDisturbance.phases(pair).length !== 1 ||
    PhysicalDisturbance.landed(pair) !== 1 ||
    PhysicalDisturbance.overlaps(pair).length !== 0
  )
    failures.push("a diagonal pair did not count as one landed swing phase");
  const early = [...pair, swung("frontRight", 1.32, 1.6)];
  if (
    PhysicalDisturbance.overlaps(early).join() !== "1" ||
    PhysicalDisturbance.landed(early) !== 2
  )
    failures.push(
      "a step armed before the pair ahead of it resolved was not an overlap",
    );
  if (
    PhysicalDisturbance.overlaps([...pair, swung("frontRight", 1.35, 1.6)])
      .length !== 0
  )
    failures.push("a step armed once the pair ahead resolved overlapped it");

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

/**
 * A convex hull of floor points, counter-clockwise seen from above (monotone
 * chain).
 */
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

/**
 * How deep a point lies inside a counter-clockwise convex polygon, metres: its
 * least distance to an edge, negative outside.
 */
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
