import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The history fed to a shooting solve is continuous at a boundary stencil,
 * and the flight carries the derivative of its attitude with its momentum.
 *
 * Scenarios:
 * 1. Two unit masses, one stationary and one at (0, 1, t^3), have relative
 *    angular momentum (3 t^2 / 2, 0, 0). On [0.5, 1] the boundary stencil
 *    remains second order within DELTA^2 plus roundoff, and its read either
 *    side of one DELTA from each end differs by at most the analytic rate
 *    3t times that time separation plus finite-difference roundoff.
 * 2. An isotropic rigid body of moment 2 kg m² with L = (3,0,0) turns at
 *    1.5 rad/s. Its body-frame sensitivities to world momentum are the
 *    integral of R^T / 2, checked in closed form at eleven instants within
 *    1e-6 rad per kg m²/s, the trajectory suite's fixed-step accuracy.
 * 3. The same L=3 model under adaptive control with a 1e-10 relative
 *    precision request and zero absolute floor retains that independent
 *    1e-6 analytic check. Rotate the world, mix the orthogonal momentum
 *    basis, and scale inertia and momentum together by 1e-3, 1 and 1e3:
 *    orientation is unchanged and sensitivities scale inversely.
 *    The existing identity-world/basis/unit-scale cell obtains its same
 *    spherical tensor through actual F.fixed construction. Its unvaried
 *    flight may be exact, but requesting all three original columns must
 *    retain numerical fallback and every analytic tangent. Raw constant
 *    callbacks in the other cells have no constructor constancy proof.
 * 4. Exact query times reuse I/h, fixed boundary stencils reuse their
 *    geometry's moments, and clear releases the memo without making an
 *    already completed flight read shape again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two physical models, their independent formulas and numerical bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public history, fixed/adaptive momentum tangents and completed playback; a stencil jump, wrong sensitivity sign/frame/unit scaling, lost exact reuse or shape access after release fails. One existing spherical cell uses actual F.fixed public FK construction; its primal may dispatch exactly while all three requested nonzero-momentum columns retain numerical evaluation.
 * @evidence contracts/development/testing.md#independent-expectations Orbital momentum of two equal masses gives z'/2; an isotropic body's rotation is exp(t L / 2), whose body sensitivity is the time integral of its inverse rotation divided by two.
 * @evidence contracts/development/testing.md#distinguishing-cases Both boundary stencils, fixed/adaptive integration, all three directions, mixed orthogonal bases, world rotations, three common inertia/momentum scales and eleven times. The certified identity/unit cell contrasts unvaried exact dispatch with numerical three-column fallback; other raw constant-looking callbacks must still perform actual stage work. No original cell, analytic column or tolerance is dropped. Clear/recompute and post-clear playback retain lifetime coverage; asymmetric shooting is separately owned.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable unit test of in-memory mass models and public engine functions; it starts no host.
 */
export function test_engine_airborne_variation(): void {
  const findings: string[] = [];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const segment = (
    bone: AutoMovieHumanoidBone,
  ): resolveAutoMovieCenterOfMass.ISegment => ({
    bone,
    mass: 1,
    point: origin,
    inertia: { x: 2, y: 2, z: 2 },
    axes: identity,
  });
  const model: resolveAutoMovieCenterOfMass.IModel = {
    mass: 2,
    segments: [segment("hips"), segment("head")],
  };
  const bones = (
    t: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      model.segments.map(
        (
          part: resolveAutoMovieCenterOfMass.ISegment,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: identity,
            worldRotation: identity,
            worldPosition:
              part.bone === "hips" ? origin : { x: 0, y: 1, z: t * t * t },
          },
        ],
      ),
    );
  const span: { from: number; to: number } = { from: 0.5, to: 1 };
  const history: integrateAirborneRotation.IHistory =
    integrateAirborneRotation.history(model, bones, span);
  const delta: number = integrateAirborneRotation.DELTA;
  // For this unit-mass/identity-frame model the momentum's x is exactly
  // 0.5 (z(b)-z(a))/(b-a): the hip has zero speed, y offsets are exactly
  // 0.5, and spin is zero. Each cube has two products, gamma_2 relative
  // error, with magnitude at most 1. Adjacent positive differences are exact
  // by Sterbenz; their width is at least delta/2. The half-scaled difference
  // contributes at most 2 gamma_2/delta, and its reciprocal and product at
  // most 4 epsilon. This is below 4 gamma_2/delta + 2 epsilon here because
  // gamma_2/delta >= epsilon. Each moment's value is below 2.
  // Three momenta have weights of absolute value <=1; the ratio and final
  // addition contribute <=(4+2)epsilon. For exact cubic data their stencil
  // is H=.5(a²+ab+b²)+(t-s)(a+b+s), whose a,b,s derivatives are bounded by
  // 2,2,4 on this span. Node errors <=2epsilon therefore add <=16epsilon.
  const epsilon: number = Number.EPSILON;
  const gamma2: number = (2 * epsilon) / (1 - 2 * epsilon);
  const rounding: number =
    3 * ((4 * gamma2) / delta + 2 * epsilon) + (4 + 2 + 16) * epsilon;
  const eta: number = delta ** 3;

  // 1. The orbital momentum and its continuity under a moving stencil.
  for (const t of [span.from, span.from + delta, span.to - delta, span.to]) {
    const value: IAutoMovieVector3 = history(t).relative;
    if (
      !(Math.abs(value.x - 1.5 * t * t) <= delta * delta + rounding) ||
      !(Math.hypot(value.y, value.z) <= rounding)
    )
      findings.push(
        `cubic history at ${t}: ${JSON.stringify(value)}, expected ${1.5 * t * t}`,
      );
  }
  for (const t of [span.from + delta, span.to - delta]) {
    const change: number = Vector3.length(
      Vector3.subtract(history(t + eta).relative, history(t - eta).relative),
    );
    const bound: number = 6 * span.to * eta + rounding;
    if (!(change <= bound))
      findings.push(`history jumps ${change} at ${t}, smooth bound ${bound}`);
  }

  // 2. A rigid isotropic body's exact forward sensitivities.
  const rigid: integrateAirborneRotation.IFlight = integrateAirborneRotation({
    history: (): integrateAirborneRotation.IInstant => ({
      inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
      relative: origin,
    }),
    t0: 0,
    t1: 1,
    q0: identity,
    momentum: { x: 3, y: 0, z: 0 },
    variations: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
  });
  for (let k: number = 0; k <= 10; k++) {
    const t: number = k / 10;
    const angle: number = 1.5 * t;
    const expected: IAutoMovieVector3[] = [
      { x: t / 2, y: 0, z: 0 },
      { x: 0, y: Math.sin(angle) / 3, z: -(1 - Math.cos(angle)) / 3 },
      { x: 0, y: (1 - Math.cos(angle)) / 3, z: Math.sin(angle) / 3 },
    ];
    const rigidTangents: readonly IAutoMovieVector3[] = rigid.variations(t);
    if (rigidTangents.length !== expected.length)
      findings.push(
        `rigid flight has ${rigidTangents.length} sensitivity columns at ${t}, expected ${expected.length}`,
      );
    rigidTangents.forEach((value: IAutoMovieVector3, i: number): void => {
      if (expected[i] === undefined) return;
      const error: number = Vector3.length(
        Vector3.subtract(value, expected[i]!),
      );
      if (!(error <= 1e-6))
        findings.push(
          `momentum direction ${i} at ${t}: ${error} sensitivity error`,
        );
    });
  }

  // 3. Keep the original high-rate model. A tight request exercises the
  // adaptive sensitivity path; local control alone is no global certificate.
  const units: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const turnedWorld: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 2, z: 3 },
    97,
  );
  const mixedBasis: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 2, y: -1, z: 1 },
    53,
  );
  for (const world of [identity, turnedWorld])
    for (const basis of [identity, mixedBasis])
      for (const scale of [1e-3, 1, 1e3]) {
        const nativeCase: boolean = world === identity && basis === identity && scale === 1;
        const fixed: integrateAirborneRotation.ICachedHistory | undefined = nativeCase ? sphericalHistory() : undefined;
        if (nativeCase && fixed === undefined) findings.push("the actual spherical fixed-history input was not admitted");
        let historyReads: number = 0;
        try {
        const columns: IAutoMovieVector3[] = units.map(
          (unit: IAutoMovieVector3): IAutoMovieVector3 =>
            Quaternion.rotateVector(basis, unit),
        );
        const props: integrateAirborneRotation.IProps = {
          history: fixed ?? ((): integrateAirborneRotation.IInstant => {
            historyReads++;
            return { inertia: {
              moments: { x: 2 * scale, y: 2 * scale, z: 2 * scale },
              rotation: identity,
            },
            relative: origin };
          }),
          t0: 0,
          t1: 1,
          q0: world,
          momentum: Quaternion.rotateVector(world, {
            x: 3 * scale,
            y: 0,
            z: 0,
          }),
          tolerance: { relative: 1e-10, absolute: 0 },
        };
        const primal: integrateAirborneRotation.IFlight =
          integrateAirborneRotation(props);
        const primalReads: number = historyReads;
        const varied: integrateAirborneRotation.IFlight =
          integrateAirborneRotation({
            ...props,
            variations: columns.map(
              (column: IAutoMovieVector3): IAutoMovieVector3 =>
                Quaternion.rotateVector(world, column),
            ),
          });
        if (nativeCase ? primal.knots !== 2 || !(varied.knots > 2)
          : !(primal.knots > 2 && primalReads > 1))
          findings.push(`constant provenance/requested directions selected wrong public solver route at scale${scale}`);
        for (let k: number = 0; k <= 10; k++) {
          const t: number = k / 10;
          const angle: number = 1.5 * t;
          const expected: IAutoMovieVector3[] = [
            { x: t / 2, y: 0, z: 0 },
            { x: 0, y: Math.sin(angle) / 3, z: -(1 - Math.cos(angle)) / 3 },
            { x: 0, y: (1 - Math.cos(angle)) / 3, z: Math.sin(angle) / 3 },
          ];
          const attitude: IAutoMovieQuaternion = Quaternion.multiply(
            world,
            Quaternion.fromAxisAngle(units[0]!, (angle * 180) / Math.PI),
          );
          if (
            !(Quaternion.angle(primal.orientation(t), attitude) <= 1e-6) ||
            !(Quaternion.angle(varied.orientation(t), attitude) <= 1e-6)
          )
            findings.push(
              `adaptive physical orientation at ${t}, mass-unit scale ${scale}`,
            );
          const adaptiveTangents: readonly IAutoMovieVector3[] =
            varied.variations(t);
          if (adaptiveTangents.length !== columns.length)
            findings.push(
              `adaptive flight has ${adaptiveTangents.length} sensitivity columns at ${t}, expected ${columns.length}`,
            );
          adaptiveTangents.forEach(
            (value: IAutoMovieVector3, j: number): void => {
              if (columns[j] === undefined) return;
              const column: IAutoMovieVector3 = columns[j]!;
              const target: IAutoMovieVector3 = Vector3.add(
                Vector3.add(
                  Vector3.scale(expected[0]!, column.x),
                  Vector3.scale(expected[1]!, column.y),
                ),
                Vector3.scale(expected[2]!, column.z),
              );
              const error: number = Vector3.length(
                Vector3.subtract(Vector3.scale(value, scale), target),
              );
              if (!(error <= 1e-6))
                findings.push(
                  `adaptive sensitivity column ${j} at ${t}, mass-unit scale ${scale}: ${error}`,
                );
            },
          );
        }
        } finally {
          fixed?.clear();
        }
      }

  // 4. The cache owns numeric sufficient statistics, and playback owns no
  // evaluation callback. This checks release semantics, not GC or byte usage.
  const reads: Map<number, number> = new Map();
  const cached: ReturnType<typeof integrateAirborneRotation.history> =
    integrateAirborneRotation.history(
      model,
      (
        t: number,
      ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        reads.set(t, (reads.get(t) ?? 0) + 1);
        return bones(t);
      },
      span,
    );
  const query: number = span.from + delta / 4;
  const first: integrateAirborneRotation.IInstant = cached(query);
  const instantValues: (
    value: integrateAirborneRotation.IInstant,
  ) => readonly number[] = (
    value: integrateAirborneRotation.IInstant,
  ): readonly number[] => [
    value.inertia.moments.x,
    value.inertia.moments.y,
    value.inertia.moments.z,
    value.inertia.rotation.x,
    value.inertia.rotation.y,
    value.inertia.rotation.z,
    value.inertia.rotation.w,
    value.relative.x,
    value.relative.y,
    value.relative.z,
  ];
  const firstValues: readonly number[] = instantValues(first);
  const count: () => number = (): number =>
    [...reads.values()].reduce((sum: number, n: number): number => sum + n, 0);
  const before: number = count();
  if (cached(query) !== first || count() !== before)
    findings.push("an exact query did not reuse its numeric instant");
  cached(span.from + delta / 2);
  if (
    reads.size !== 5 ||
    [...reads.values()].some((n: number): boolean => n !== 1)
  )
    findings.push(
      "the two boundary queries did not share their fixed stencil moments",
    );
  const playback: integrateAirborneRotation.IFlight = integrateAirborneRotation(
    {
      history: cached,
      t0: span.from,
      t1: span.to,
      q0: identity,
      momentum: { x: 3, y: 0, z: 0 },
      variations: units,
    },
  );
  const completedReads: number = count();
  cached.clear();
  for (const t of [span.from, (span.from + span.to) / 2, span.to]) {
    playback.orientation(t);
    playback.variations(t);
  }
  if (count() !== completedReads)
    findings.push("completed flight playback read its released shape history");
  const renewed: integrateAirborneRotation.IInstant = cached(query);
  if (
    renewed === first ||
    instantValues(renewed).some(
      (value: number, i: number): boolean => !nclose(value, firstValues[i]!, 0),
    ) ||
    count() <= completedReads
  )
    findings.push(
      "clearing the history failed to release and exactly recompute its memo",
    );
  cached.clear();
  TestValidator.predicate(
    `airborne history and sensitivity: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}

/** Manufacture the existing moment-two spherical fixture through copied public native FK. */
function sphericalHistory(): integrateAirborneRotation.ICachedHistory | undefined {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const skeleton: IAutoMovieSkeleton = { id: "airborne-spherical-invariant", bones: [{
    bone: "hips", parent: null, constraint: null,
    rest: { translation: { x: 0, y: 0, z: 0 }, rotation: identity, scale: { x: 1, y: 1, z: 1 } },
  }] };
  const model: resolveAutoMovieCenterOfMass.IModel = { mass: 1,
    segments: [{ bone: "hips", mass: 1, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 2, y: 2, z: 2 }, axes: identity }],
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolvePose({ skeleton: skeleton.id, root: null, joints: [] }, skeleton))
    bones.set(bone.bone, bone);
  return integrateAirborneRotation.fixed(model, skeleton, bones, { from: 0, to: 1 });
}
