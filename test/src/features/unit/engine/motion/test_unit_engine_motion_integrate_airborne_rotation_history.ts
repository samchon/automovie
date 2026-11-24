import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qunit } from "../../../internal/qunit";

/** The identity orientation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** The centre of mass at rest, and the hip's place. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The span of the flight, in seconds. */
const SPAN: { from: number; to: number } = { from: 0.5, to: 1 };

/** A unit-mass point of moment 2 on a bone. */
const segment: (
  bone: AutoMovieHumanoidBone,
) => IAutoMovieResolveCenterOfMass.ISegment = (
  bone: AutoMovieHumanoidBone,
): IAutoMovieResolveCenterOfMass.ISegment => ({
  bone,
  mass: 1,
  point: ORIGIN,
  inertia: { x: 2, y: 2, z: 2 },
  axes: IDENTITY,
});

/** The two-mass model: a hip at rest and a head at (0, 1, t^3). */
const MODEL: IAutoMovieResolveCenterOfMass.IModel = {
  mass: 2,
  segments: [segment("hips"), segment("head")],
};

/** The posed bones at a time, the head's z a cube of it. */
const bones: (
  t: number,
) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
  t: number,
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
  new Map(
    MODEL.segments.map(
      (
        part: IAutoMovieResolveCenterOfMass.ISegment,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
        part.bone,
        {
          bone: part.bone,
          localRotation: IDENTITY,
          worldRotation: IDENTITY,
          worldPosition:
            part.bone === "hips" ? ORIGIN : { x: 0, y: 1, z: t * t * t },
        },
      ],
    ),
  );

/** The ten numbers of an instant: moments, frame and relative momentum. */
const values: (
  value: IAutoMovieIntegrateAirborneRotation.IInstant,
) => readonly number[] = (
  value: IAutoMovieIntegrateAirborneRotation.IInstant,
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

/**
 * `integrateAirborneRotation.history` reads a shape history from posed bones:
 * the body's inertia and its relative angular momentum at any time.
 *
 * Two unit masses, a hip at rest and a head at (0, 1, t^3), have relative
 * angular momentum (3 t^2 / 2, 0, 0): the hip has zero speed, the y offsets are
 * exactly 0.5 from the centre, and the head moves along z at 3 t^2.
 *
 * Scenarios:
 *
 * 1. On the span [0.5, 1] the read at the ends and one DELTA inside them is (1.5
 *    t^2, 0, 0) within DELTA^2 plus rounding (the second order of the stencil),
 *    the transverse components zero within rounding.
 * 2. The read is continuous at the boundary stencil: either side of one DELTA from
 *    each end it differs by at most the analytic rate 6 t times the time
 *    separation, plus rounding.
 * 3. Two thin rings of mass 1 and intrinsic moments (2, 1, 1) at x = -1 and +1,
 *    both turned about X at 0.25 rad/s, have at t = 0.5 the composite moments
 *    (4, 4, 4) (parallel axes add (0, 2, 2)), a unit frame and relative
 *    momentum (1, 0, 0) (2 x 2 x 0.25).
 * 4. After the history is cleared, a read at the same time recomputes the same ten
 *    numbers exactly, as a new record.
 */
export function test_unit_engine_motion_integrate_airborne_rotation_history(): void {
  rings();
  const history: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.history(MODEL, bones, SPAN);
  const delta: number = integrateAirborneRotation.DELTA;
  const epsilon: number = Number.EPSILON;
  const gamma2: number = (2 * epsilon) / (1 - 2 * epsilon);
  // Rounding of three weighted moments of cubes (see the stencil's error
  // analysis): each is below 2, with relative error 4 gamma2 / delta + 2 eps.
  const rounding: number =
    3 * ((4 * gamma2) / delta + 2 * epsilon) + (4 + 2 + 16) * epsilon;
  const eta: number = delta ** 3;
  try {
    let atEnds: boolean = true;
    for (const t of [SPAN.from, SPAN.from + delta, SPAN.to - delta, SPAN.to]) {
      const value: IAutoMovieVector3 = history(t).relative;
      atEnds &&=
        Math.abs(value.x - 1.5 * t * t) <= delta * delta + rounding &&
        Math.hypot(value.y, value.z) <= rounding;
    }
    TestValidator.predicate("the cubic head's momentum", atEnds);
    let continuous: boolean = true;
    for (const t of [SPAN.from + delta, SPAN.to - delta])
      continuous &&=
        Vector3.length(
          Vector3.subtract(
            history(t + eta).relative,
            history(t - eta).relative,
          ),
        ) <=
        6 * SPAN.to * eta + rounding;
    TestValidator.predicate("continuity at the boundary stencil", continuous);
    const query: number = SPAN.from + delta / 4;
    const first: IAutoMovieIntegrateAirborneRotation.IInstant = history(query);
    const before: readonly number[] = values(first);
    history.clear();
    const renewed: IAutoMovieIntegrateAirborneRotation.IInstant =
      history(query);
    TestValidator.predicate(
      "a cleared history recomputes the same numbers",
      renewed !== first &&
        values(renewed).every((value: number, index: number): boolean =>
          nclose(value, before[index]!, 0),
        ),
    );
  } finally {
    history.clear();
  }
}

/** The ring pair of scenario 4. */
function rings(): void {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: (["hips", "head"] as const).map(
      (bone: "hips" | "head"): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone,
        mass: 1,
        point: ORIGIN,
        inertia: { x: 2, y: 1, z: 1 },
        axes: IDENTITY,
      }),
    ),
  };
  const posed: (
    t: number,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    t: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      (0.25 * t * 180) / Math.PI,
    );
    return new Map(
      model.segments.map(
        (
          part: IAutoMovieResolveCenterOfMass.ISegment,
          index: number,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: rotation,
            worldRotation: rotation,
            worldPosition: { x: index === 0 ? -1 : 1, y: 0, z: 0 },
          },
        ],
      ),
    );
  };
  const history: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.history(model, posed, { from: 0, to: 1 });
  try {
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.5);
    TestValidator.predicate(
      "the ring pair's composite moments and momentum",
      Vector3.length(
        Vector3.subtract(instant.inertia.moments, { x: 4, y: 4, z: 4 }),
      ) <= 1e-12 &&
        qunit(instant.inertia.rotation) &&
        Vector3.length(
          Vector3.subtract(instant.relative, { x: 1, y: 0, z: 0 }),
        ) <= 1e-9,
    );
  } finally {
    history.clear();
  }
}
