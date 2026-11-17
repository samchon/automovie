import type { IAutoMovieIntegrateAirborneRotation, IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass, IAutoMovieResolveMomentum, IAutoMovieResolvedBone, IAutoMovieSolveAirborneTakeoff, AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion, Vector3, integrateAirborneRotation, resolveAutoMovieCenterOfMass, resolveAutoMovieMomentum, resolvePose, solveAirborneTakeoff } from "@automovie/engine";


import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A body in flight turns by its conserved angular momentum and its changing
 * shape (#3426): `integrateAirborneRotation` and `solveAirborneTakeoff`.
 *
 * Scenarios:
 * 1. Rigid, L along a principal axis: the average man's rest shape with its
 *    momentum along each principal axis turns about that axis at the constant
 *    rate L / I (torque-free rotation about a principal axis, closed form),
 *    within 1e-6 rad at 21 instants of a 1 s flight.
 * 2. Tuck at mid-flight: a three-mass primitive whose two end masses move
 *    from 0.6 m to 0.25 m from the centre over [0.4, 0.6] s by a minimum-jerk
 *    profile turns, after the change, at its rate before the change times
 *    `I_layout / I_tuck` about the somersault axis within 1e-4 relative
 *    (conservation of angular momentum).
 * 3. Read-back: with the average man's arms and legs swinging through the
 *    flight, the angular momentum read from the displayed bones (the shape
 *    turned by the integrated orientation) by `resolveAutoMovieMomentum`
 *    equals the take-off momentum within 1e-3 relative at 20 instants.
 * 4. The intermediate axis: a rigid body with principal moments 1, 2 and
 *    3 kg m², its momentum 0.01 rad off the intermediate axis, departs from it
 *    by more than 90 degrees before `2 ln(4 / ε) / λ`, with `λ = w
 *    sqrt((I2 - I1)(I3 - I2) / (I1 I3))` the linearized growth rate of
 *    Euler's equations about that axis, then returns within 20 degrees of it
 *    in the flight (the periodic flip of torque-free rotation, Yeadon 1993
 *    Part I); the momentum read back in the world stays within 1e-3 relative.
 * 5. Asymmetric arm action: raising one arm of the average man 60 degrees
 *    sideways from a layout during a pure somersault produces a tilt and a
 *    twist of more than a degree each, and raising the other arm instead
 *    gives the mirrored tilt and twist (equal and opposite within a
 *    thousandth of their size, the body's own symmetry amplified by the
 *    flight), the metamorphic relation of a sagittally symmetric body
 *    (Yeadon 1993 Part III: twist from asymmetric arm action). The arms'
 *    abduction signs that lower a hand and mirror an arm are read from the
 *    posed hands, not assumed.
 * 6. `solveAirborneTakeoff` in the average man's layout (arms lowered to the
 *    sides from the rig's T-pose) for one
 *    somersault with 0, 1 and 2 twists over a 1 s flight lands within 0.02
 *    revolution of each request on every axis; with the momentum bounded by
 *    1.5 times the plain somersault's, a flight of a third of that time is a
 *    miss (it needs about three times the momentum).
 * 7. A tuck between laid-out ends: scenario 2's three masses folding from
 *    0.6 m to 0.25 m over [0.05, 0.15] s and back over [0.51, 0.61] s of a
 *    0.66 s flight are solved for one somersault at the planar closed form
 *    `L = 2π / ∫ dt / I(t)`, the integral taken independently by the
 *    midpoint rule, with no momentum off the somersault axis; their masses
 *    move radially, so no relative momentum enters. The somersault angle
 *    `L ∫ dt / I` is linear in L, so the solver's residual tolerance, a
 *    hundredth of a turn of the one requested, bounds L's relative error
 *    by a hundredth.
 * 8. The flight's span: a head moving only before take-off, or only after
 *    touchdown, reads no relative momentum at that end given the span and
 *    a non-zero one across it without; a head moving as `sin t` reads
 *    one-sided as central within `DELTA²` relative: its momentum is a
 *    cosine, `|L''| = |L|`, and each read errs by under `L'' DELTA² / 4`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Integrates flights through the public functions and reads the orientation back; an inverse inertia applied in the wrong frame, a relative momentum with the wrong sign, a lost momentum, a rigid model missing the intermediate-axis flip, or a solver that clamps instead of missing fails.
 * @evidence contracts/development/testing.md#independent-expectations Closed forms of torque-free rotation (constant rate about a principal axis, the linearized growth about the intermediate axis, the planar somersault's `2π / ∫ dt / I`), conservation of angular momentum through a shape change, mirror symmetry, and the read-back through the momentum function of #3422, independent of the integrator.
 * @evidence contracts/development/testing.md#distinguishing-cases Rigid and changing shapes, principal, intermediate and off-axis momentum, a symmetric and two mirrored asymmetric arm actions, three twist requests, a refused short flight, a tuck between laid-out ends, and a push-off, a landing and a smooth motion at the span's ends; the flight pass over a composed performance belongs to `test_human_motion_core_flight`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure engine functions on in-memory models and a prepared body, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight scenarios with their bounds and their bases.
 */
export function test_engine_airborne_rotation(): void {
  type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const STILL: IAutoMovieQuaternion = Quaternion.identity();
  const DEG: number = 180 / Math.PI;

  // Bones turned by q about the origin.
  const turned = (bones: Bones, q: IAutoMovieQuaternion): Bones =>
    new Map(
      [...bones].map(
        ([bone, r]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          bone,
          {
            ...r,
            worldPosition: Quaternion.rotateVector(q, r.worldPosition),
            worldRotation: Quaternion.multiply(q, r.worldRotation),
          },
        ],
      ),
    );
  const posed = (body: IAutoMovieMotionHumanBody, joints: IAutoMovieJointPose[]): Bones =>
    new Map(
      resolvePose(
        { skeleton: body.skeleton.id, root: null, joints },
        body.skeleton,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  // A primitive body: point-like segments with given moments riding bones at given places.
  const primitive = (
    parts: {
      bone: AutoMovieHumanoidBone;
      mass: number;
      inertia: IAutoMovieVector3;
    }[],
  ): IAutoMovieResolveCenterOfMass.IModel => ({
    mass: parts.reduce(
      (s: number, p: { mass: number }): number => s + p.mass,
      0,
    ),
    segments: parts.map(
      (p: {
        bone: AutoMovieHumanoidBone;
        mass: number;
        inertia: IAutoMovieVector3;
      }): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone: p.bone,
        mass: p.mass,
        point: ORIGIN,
        inertia: p.inertia,
        axes: STILL,
      }),
    ),
  });
  const placed = (at: Record<string, IAutoMovieVector3>): Bones =>
    new Map(
      Object.entries(at).map(
        ([bone, p]: [string, IAutoMovieVector3]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          bone as AutoMovieHumanoidBone,
          {
            bone: bone as AutoMovieHumanoidBone,
            localRotation: STILL,
            worldPosition: p,
            worldRotation: STILL,
          },
        ],
      ),
    );
  const rateAt = (
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    t: number,
    dt: number,
  ): IAutoMovieVector3 => {
    const a: IAutoMovieQuaternion = flight.orientation(t - dt);
    const b: IAutoMovieQuaternion = flight.orientation(t + dt);
    const relative: IAutoMovieQuaternion = Quaternion.multiply(
      b,
      Quaternion.inverse(a),
    );
    const sine: number = Math.hypot(relative.x, relative.y, relative.z);
    const angle: number = 2 * Math.atan2(sine, Math.abs(relative.w));
    const sign: number = relative.w < 0 ? -1 : 1;
    return sine === 0
      ? ORIGIN
      : Vector3.scale(
          { x: relative.x, y: relative.y, z: relative.z },
          (sign * angle) / sine / (2 * dt),
        );
  };

  const man: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(man.skeleton, man.profile);
  const rest: Bones = posed(man, []);

  // The rig's rest is the VRM T-pose. The upper arm's abduction sign that
  // lowers the left hand, and the right arm's sign that mirrors the left arm
  // across the sagittal plane, are read from the posed hands rather than
  // assumed, so the shapes below do not rest on a sign convention.
  const arm = (left: number, right: number): IAutoMovieJointPose[] => [
    { bone: "leftUpperArm", flexion: 0, abduction: left, twist: 0 },
    { bone: "rightUpperArm", flexion: 0, abduction: right, twist: 0 },
  ];
  const hand = (bones: Bones, side: "left" | "right"): IAutoMovieVector3 =>
    bones.get(`${side}Hand`)!.worldPosition;
  const lower: number =
    hand(posed(man, arm(80, 0)), "left").y <
    hand(posed(man, arm(-80, 0)), "left").y
      ? 1
      : -1;
  const mirror: number = [1, -1].reduce((best: number, m: number): number => {
    const left: IAutoMovieVector3 = hand(
      posed(man, arm(lower * 40, 0)),
      "left",
    );
    const miss = (s: number): number => {
      const right: IAutoMovieVector3 = hand(
        posed(man, arm(0, s * lower * 40)),
        "right",
      );
      return Vector3.length(
        Vector3.subtract(right, { x: -left.x, y: left.y, z: left.z }),
      );
    };
    return miss(m) < miss(best) ? m : best;
  }, 1);
  // The straight body of a layout: both arms lowered 80 degrees from the T-pose to the sides.
  const layout = (left: number = 0, right: number = 0): Bones =>
    posed(man, arm(lower * (80 - left), mirror * lower * (80 - right)));
  const layoutShape: Bones = layout();

  // 1. Rigid, momentum along each principal axis: constant rate L / I.
  const principal: IAutoMovieResolveMomentum.IPrincipal =
    resolveAutoMovieMomentum.principal(
      resolveAutoMovieMomentum.inertia(model, rest),
    );
  const restHistory: IAutoMovieIntegrateAirborneRotation.IHistory =
    integrateAirborneRotation.history(model, (): Bones => rest);
  (["x", "y", "z"] as const).forEach((key: "x" | "y" | "z"): void => {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      principal.rotation,
      {
        x: key === "x" ? 1 : 0,
        y: key === "y" ? 1 : 0,
        z: key === "z" ? 1 : 0,
      },
    );
    const L: number = 40;
    const rate: number = L / principal.moments[key];
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation(
      {
        history: restHistory,
        t0: 0,
        t1: 1,
        q0: STILL,
        momentum: Vector3.scale(axis, L),
      },
    );
    for (let k: number = 0; k <= 20; k++) {
      const t: number = k / 20;
      const expected: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        axis,
        rate * t * DEG,
      );
      const miss: number = Quaternion.angle(flight.orientation(t), expected);
      if (!(miss <= 1e-6))
        findings.push(
          `principal ${key}: misses the closed form by ${miss.toExponential(2)} rad at ${t} s`,
        );
    }
  });

  // 2. A tuck at mid-flight raises the rate by I_layout / I_tuck.
  const ends: number = 5;
  const core: IAutoMovieResolveCenterOfMass.IModel = primitive([
    { bone: "hips", mass: 30, inertia: { x: 1.2, y: 0.4, z: 1.1 } },
    { bone: "head", mass: ends, inertia: { x: 0.02, y: 0.02, z: 0.02 } },
    { bone: "leftFoot", mass: ends, inertia: { x: 0.02, y: 0.02, z: 0.02 } },
  ]);
  const reach = (t: number): number => {
    const u: number = Math.max(0, Math.min(1, (t - 0.4) / 0.2));
    return 0.6 + (0.25 - 0.6) * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
  };
  const tuck: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation({
    history: integrateAirborneRotation.history(
      core,
      (t: number): Bones =>
        placed({
          hips: ORIGIN,
          head: { x: 0, y: reach(t), z: 0 },
          leftFoot: { x: 0, y: -reach(t), z: 0 },
        }),
    ),
    t0: 0,
    t1: 1,
    q0: STILL,
    momentum: { x: 20, y: 0, z: 0 },
    h: 1 / 120,
  });
  const iLayout: number = 1.2 + 2 * (0.02 + ends * 0.6 * 0.6);
  const iTuck: number = 1.2 + 2 * (0.02 + ends * 0.25 * 0.25);
  const before: number = Vector3.length(rateAt(tuck, 0.2, 0.01));
  const after: number = Vector3.length(rateAt(tuck, 0.8, 0.01));
  const ratio: number = after / before / (iLayout / iTuck);
  if (!(Math.abs(ratio - 1) <= 1e-4))
    findings.push(
      `tuck: the rate rises by ${(after / before).toFixed(5)}, I_layout / I_tuck ${(iLayout / iTuck).toFixed(5)}`,
    );

  // 3. Read-back of the momentum from the displayed bones of a moving shape.
  const swinging = (t: number, arm: number = 1): Bones =>
    posed(man, [
      {
        bone: "leftUpperArm",
        flexion: 60 * Math.sin(2 * Math.PI * t),
        abduction: 30 * arm,
        twist: 0,
      },
      {
        bone: "rightUpperArm",
        flexion: -40 * Math.sin(2 * Math.PI * t),
        abduction: 30,
        twist: 0,
      },
      {
        bone: "leftUpperLeg",
        flexion: 45 * Math.sin(Math.PI * t),
        abduction: 0,
        twist: 0,
      },
      {
        bone: "rightUpperLeg",
        flexion: 20 + 30 * Math.sin(Math.PI * t),
        abduction: 0,
        twist: 0,
      },
    ]);
  const L3: IAutoMovieVector3 = { x: 35, y: 6, z: -4 };
  const moving: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation({
    history: integrateAirborneRotation.history(model, swinging),
    t0: 0,
    t1: 1,
    q0: STILL,
    momentum: L3,
  });
  for (let k: number = 1; k <= 20; k++) {
    const t: number = k / 21;
    const d: number = 1e-3;
    const read: IAutoMovieVector3 = resolveAutoMovieMomentum(
      model,
      turned(swinging(t - d), moving.orientation(t - d)),
      turned(swinging(t + d), moving.orientation(t + d)),
      2 * d,
    ).angular;
    const error: number =
      Vector3.length(Vector3.subtract(read, L3)) / Vector3.length(L3);
    if (!(error <= 1e-3))
      findings.push(
        `read-back at ${t.toFixed(3)} s: ${error.toExponential(2)} relative`,
      );
  }

  // 4. The intermediate axis flips and returns; the momentum stays.
  const top: IAutoMovieResolveCenterOfMass.IModel = primitive([
    { bone: "hips", mass: 1, inertia: { x: 1, y: 2, z: 3 } },
  ]);
  const epsilon: number = 0.01;
  const w: number = 2 * Math.PI;
  const L4: IAutoMovieVector3 = Vector3.scale(
    { x: Math.sin(epsilon), y: Math.cos(epsilon), z: 0 },
    2 * w,
  );
  const lambda: number = w * Math.sqrt(((2 - 1) * (3 - 2)) / (1 * 3));
  const bound: number = (2 * Math.log(4 / epsilon)) / lambda;
  const spinning: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation(
    {
      history: integrateAirborneRotation.history(
        top,
        (): Bones => placed({ hips: ORIGIN }),
      ),
      t0: 0,
      t1: 3 * bound,
      q0: STILL,
      momentum: L4,
      h: 1 / 240,
    },
  );
  let flipped: number | null = null;
  let returned: boolean = false;
  let drift: number = 0;
  for (let t: number = 0.02; t <= 3 * bound - 0.02; t += 0.01) {
    const q: IAutoMovieQuaternion = spinning.orientation(t);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: 0,
      y: 1,
      z: 0,
    });
    const away: number = Math.acos(Math.max(-1, Math.min(1, axis.y))) * DEG;
    if (flipped === null && away > 90) flipped = t;
    if (flipped !== null && t > flipped && away < 20) returned = true;
    // The world momentum: R I_b w_b, with w_b the body-frame rate read from the orientation.
    const wb: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(q),
      rateAt(spinning, t, 1e-3),
    );
    const Lw: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: 1 * wb.x,
      y: 2 * wb.y,
      z: 3 * wb.z,
    });
    drift = Math.max(
      drift,
      Vector3.length(Vector3.subtract(Lw, L4)) / Vector3.length(L4),
    );
  }
  if (flipped === null || flipped > bound)
    findings.push(
      `intermediate axis: no flip past 90 degrees before ${bound.toFixed(2)} s (first at ${flipped})`,
    );
  if (!returned)
    findings.push("intermediate axis: never returns within 20 degrees");
  if (!(drift <= 1e-3))
    findings.push(
      `intermediate axis: momentum drifts ${drift.toExponential(2)} relative`,
    );

  // 5. Raising one arm sideways tilts and twists a pure somersault; the other arm mirrors it.
  const raising =
    (side: "left" | "right"): ((t: number) => Bones) =>
    (t: number): Bones => {
      const u: number = Math.max(0, Math.min(1, (t - 0.1) / 0.3));
      const up: number = 60 * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
      return side === "left" ? layout(up, 0) : layout(0, up);
    };
  const attitude = (side: "left" | "right"): IAutoMovieSolveAirborneTakeoff.IAngles =>
    solveAirborneTakeoff.unwrapped(
      integrateAirborneRotation({
        history: integrateAirborneRotation.history(model, raising(side)),
        t0: 0,
        t1: 1,
        q0: STILL,
        momentum: { x: 50, y: 0, z: 0 },
      }),
      STILL,
    );
  const left: IAutoMovieSolveAirborneTakeoff.IAngles = attitude("left");
  const right: IAutoMovieSolveAirborneTakeoff.IAngles = attitude("right");
  if (!(Math.abs(left.tilt) > 1 / DEG && Math.abs(left.twist) > 1 / DEG))
    findings.push(
      `arm action: tilt ${(left.tilt * DEG).toFixed(2)} and twist ${(left.twist * DEG).toFixed(2)} degrees, not both above one`,
    );
  if (
    !(
      Math.abs(left.tilt + right.tilt) <= 1e-3 * Math.abs(left.tilt) &&
      Math.abs(left.twist + right.twist) <= 1e-3 * Math.abs(left.twist) &&
      Math.abs(left.somersault - right.somersault) <=
        1e-3 * Math.abs(left.somersault)
    )
  )
    findings.push(
      `arm action: the mirrored arm gives tilt ${right.tilt} and twist ${right.twist} for ${left.tilt} and ${left.twist}`,
    );

  // 6. The take-off solver meets 1 somersault with 0, 1 and 2 twists, and misses a short flight.
  let plain: number = 0;
  const layoutHistory: IAutoMovieIntegrateAirborneRotation.IHistory =
    integrateAirborneRotation.history(model, (): Bones => layoutShape);
  for (const twist of [0, 1, 2]) {
    const solved: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
      history: layoutHistory,
      t0: 0,
      t1: 1,
      q0: STILL,
      somersault: 1,
      twist,
    });
    if (twist === 0) plain = Vector3.length(solved.momentum);
    const worst: number = Math.max(
      Math.abs(solved.residual.somersault),
      Math.abs(solved.residual.tilt),
      Math.abs(solved.residual.twist),
    );
    if (!(solved.met && worst <= 0.02))
      findings.push(
        `take-off for 1 somersault and ${twist} twist(s): residual ${JSON.stringify(solved.residual)}, met ${solved.met}`,
      );
  }
  const short: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
    history: layoutHistory,
    t0: 0,
    t1: 1 / 3,
    q0: STILL,
    somersault: 1,
    twist: 0,
    maximum: 1.5 * plain,
  });
  if (short.met)
    findings.push(
      `a third of the flight is met with ${Vector3.length(short.momentum).toFixed(1)} kg m²/s under ${(1.5 * plain).toFixed(1)}`,
    );

  // 7. A tuck between laid-out ends: the planar somersault's closed form.
  const folding = (t: number): number => {
    const smooth = (u: number): number => {
      const c: number = Math.max(0, Math.min(1, u));
      return 10 * c ** 3 - 15 * c ** 4 + 6 * c ** 5;
    };
    return 0.6 - 0.35 * (smooth((t - 0.05) / 0.1) - smooth((t - 0.51) / 0.1));
  };
  const folded = (t: number): Bones =>
    placed({
      hips: ORIGIN,
      head: { x: 0, y: folding(t), z: 0 },
      leftFoot: { x: 0, y: -folding(t), z: 0 },
    });
  const iOf = (t: number): number => 1.2 + 2 * (0.02 + ends * folding(t) ** 2);
  let inverse: number = 0;
  for (let k: number = 0; k < 20000; k++)
    inverse += 0.66 / 20000 / iOf((0.66 * (k + 0.5)) / 20000);
  const planar: number = (2 * Math.PI) / inverse;
  const tucked: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff({
    history: integrateAirborneRotation.history(core, folded),
    t0: 0,
    t1: 0.66,
    q0: STILL,
    somersault: 1,
    twist: 0,
  });
  // The somersault angle is `L ∫ dt / I`, linear in L, so a residual within
  // the solver's tolerance bounds L's relative error by that many turns.
  const within: number = solveAirborneTakeoff.TOLERANCE / (2 * Math.PI);
  if (
    !tucked.met ||
    Math.abs(tucked.momentum.x - planar) > within * planar ||
    Math.hypot(tucked.momentum.y, tucked.momentum.z) > within * planar
  )
    findings.push(
      `a tuck between laid-out ends: ${JSON.stringify(tucked.momentum)}, planar ${planar.toFixed(4)}, met ${tucked.met}`,
    );

  // 8. The flight's span: the shape is differenced inside it at its ends.
  const nodding =
    (z: (t: number) => number): ((t: number) => Bones) =>
    (t: number): Bones =>
      placed({
        hips: ORIGIN,
        head: { x: 0, y: 0.6, z: z(t) },
        leftFoot: { x: 0, y: -0.6, z: 0 },
      });
  const span: { from: number; to: number } = { from: 0.5, to: 1 };
  const pushed: (t: number) => Bones = nodding(
    (t: number): number => 0.3 * Math.min(0, t - 0.5),
  );
  const landed: (t: number) => Bones = nodding(
    (t: number): number => 0.3 * Math.max(0, t - 1),
  );
  const lag = (
    shape: (t: number) => Bones,
    at: number,
    sides?: { from: number; to: number },
  ): IAutoMovieVector3 =>
    integrateAirborneRotation.history(core, shape, sides)(at).relative;
  const across: number = Vector3.length(lag(pushed, 0.5));
  const inside: number = Vector3.length(lag(pushed, 0.5, span));
  const landing: number = Vector3.length(lag(landed, 1, span));
  if (!(across > 0.1) || inside !== 0 || landing !== 0)
    findings.push(
      `span: a push-off before take-off reads ${across} across and ${inside} inside, a landing after touchdown ${landing}`,
    );
  const smooth: (t: number) => Bones = nodding(
    (t: number): number => 0.3 * Math.sin(t),
  );
  for (const at of [0.5, 1]) {
    const central: IAutoMovieVector3 = lag(smooth, at);
    const sided: IAutoMovieVector3 = lag(smooth, at, span);
    if (
      !(
        Vector3.length(Vector3.subtract(sided, central)) <=
        integrateAirborneRotation.DELTA ** 2 * Vector3.length(central)
      )
    )
      findings.push(
        `span: a smooth motion reads ${JSON.stringify(sided)} one-sided at ${at} s, ${JSON.stringify(central)} central`,
      );
  }

  TestValidator.predicate(
    `airborne rotation: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
