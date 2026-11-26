import { type resolveAutoMovieBoneRates, resolveAutoMovieMomentum, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * Instantaneous centroidal momentum from explicit SI bone-origin derivatives.
 *
 * Scenarios:
 *
 * 1. One 2 kg part at local x=1 m, with bone-origin v=(7,0,0) m/s, omega=(0,0,5)
 *    rad/s and principal inertia (2,3,4) kg m squared, has COM velocity
 *    (7,5,0), P=(14,10,0) and H=(0,0,20).
 * 2. Two 3 kg point masses at x=+-2 m, moving at v_y=+-4 m/s, have P=0 and H_z=48
 *    kg m squared/s. A common position shift (13,17,-19) m and velocity
 *    (5,-7,11) m/s preserve H and give P=(30,-42,66), distinguishing frame
 *    translation from orbital motion. Applying the same shifts to the spinning
 *    single part gives P=(24,-4,22), H_z=20 and COM=(14,17,-19), so an absolute
 *    part position cannot substitute for its offset from the translated bone
 *    origin.
 * 3. Halving every supplied rate halves P and H; multiplying both mass and
 *    principal inertia by four multiplies P and H by four while leaving the COM
 *    and its velocity unchanged.
 * 4. Turning the anisotropic part's local principal frame 90 degrees about z makes
 *    common-frame omega=(1,0,0) produce H=(3,0,0), with no linear motion.
 *    Turning its bone instead gives the same spin; its now y-directed COM
 *    offset gives COM velocity z=1 m/s and P_z=2 kg m/s.
 * 5. An additional zero-mass part with I_z=2 and omega_z=3 contributes spin H_z=6
 *    without changing the existing mass, COM or P.
 * 6. Missing bones/rates, nonfinite rates/COM, nonpositive total mass,
 *    inconsistent part counts/masses/total and finite-input overflow throw.
 */
export function test_engine_kinematics_resolve_momentum_rates(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const frame: IAutoMovieResolvedBone = {
    bone: "hips",
    localRotation: identity,
    worldPosition: zero,
    worldRotation: identity,
  };
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: [
      {
        bone: "hips",
        mass: 2,
        point: { x: 1, y: 0, z: 0 },
        inertia: { x: 2, y: 3, z: 4 },
        axes: identity,
      },
    ],
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
    ["hips", frame],
  ]);
  const rate: resolveAutoMovieBoneRates.IRate = {
    linear: { x: 7, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 5 },
  };
  const rates: Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> =
    new Map([["hips", rate]]);
  const posed: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(
    model,
    bones,
  );
  const single: IAutoMovieBodyMomentum = AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
    model,
    posed,
    bones,
    rates,
  );
  expectMomentum("off-centre spin", single, {
    centre: { x: 1, y: 0, z: 0 },
    velocity: { x: 7, y: 5, z: 0 },
    linear: { x: 14, y: 10, z: 0 },
    angular: { x: 0, y: 0, z: 20 },
  });

  // This result is independent of both the posed centre and current rates.
  single.centre.x = -100;
  single.angular.z = -100;
  TestValidator.predicate(
    "fresh output owns its centre and angular vector",
    vclose(posed.centre, { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(rate.angular, { x: 0, y: 0, z: 5 }, 1e-12),
  );
  TestValidator.predicate(
    "an edited result cannot change the next momentum",
    vclose(
      AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(model, posed, bones, rates).angular,
      { x: 0, y: 0, z: 20 },
      1e-12,
    ),
  );

  const pair: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 6,
    segments: [
      { bone: "hips", mass: 3, point: zero, inertia: zero, axes: identity },
      { bone: "spine", mass: 3, point: zero, inertia: zero, axes: identity },
    ],
  };
  const pairBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    [
      ["hips", { ...frame, worldPosition: { x: -2, y: 0, z: 0 } }],
      [
        "spine",
        { ...frame, bone: "spine", worldPosition: { x: 2, y: 0, z: 0 } },
      ],
    ],
  );
  const pairRates: Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> =
    new Map([
      ["hips", { linear: { x: 0, y: -4, z: 0 }, angular: zero }],
      ["spine", { linear: { x: 0, y: 4, z: 0 }, angular: zero }],
    ]);
  expectMomentum("point-mass orbit", read(pair, pairBones, pairRates), {
    centre: zero,
    velocity: zero,
    linear: zero,
    angular: { x: 0, y: 0, z: 48 },
  });

  const translatedBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map();
  const translatedRates: Map<
    AutoMovieHumanoidBone,
    resolveAutoMovieBoneRates.IRate
  > = new Map();
  for (const [name, bone] of pairBones)
    translatedBones.set(name, {
      ...bone,
      worldPosition: {
        x: bone.worldPosition.x + 13,
        y: bone.worldPosition.y + 17,
        z: bone.worldPosition.z - 19,
      },
    });
  for (const [name, current] of pairRates)
    translatedRates.set(name, {
      angular: current.angular,
      linear: {
        x: current.linear.x + 5,
        y: current.linear.y - 7,
        z: current.linear.z + 11,
      },
    });
  expectMomentum(
    "translated orbit",
    read(pair, translatedBones, translatedRates),
    {
      centre: { x: 13, y: 17, z: -19 },
      velocity: { x: 5, y: -7, z: 11 },
      linear: { x: 30, y: -42, z: 66 },
      angular: { x: 0, y: 0, z: 48 },
    },
  );
  const shiftedSingleBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map([
      [
        "hips",
        {
          ...frame,
          worldPosition: { x: 13, y: 17, z: -19 },
        },
      ],
    ]);
  const shiftedSingleRates: Map<
    AutoMovieHumanoidBone,
    resolveAutoMovieBoneRates.IRate
  > = new Map([
    [
      "hips",
      {
        linear: { x: 12, y: -7, z: 11 },
        angular: rate.angular,
      },
    ],
  ]);
  expectMomentum(
    "translated bone-origin spin",
    read(model, shiftedSingleBones, shiftedSingleRates),
    {
      centre: { x: 14, y: 17, z: -19 },
      velocity: { x: 12, y: -2, z: 11 },
      linear: { x: 24, y: -4, z: 22 },
      angular: { x: 0, y: 0, z: 20 },
    },
  );

  const halfRates: Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> =
    new Map([
      [
        "hips",
        {
          linear: { x: 3.5, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 2.5 },
        },
      ],
    ]);
  expectMomentum("twice the physical duration", read(model, bones, halfRates), {
    centre: { x: 1, y: 0, z: 0 },
    velocity: { x: 3.5, y: 2.5, z: 0 },
    linear: { x: 7, y: 5, z: 0 },
    angular: { x: 0, y: 0, z: 10 },
  });
  const massive: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 8,
    segments: [
      { ...model.segments[0]!, mass: 8, inertia: { x: 8, y: 12, z: 16 } },
    ],
  };
  expectMomentum(
    "four times the mass and inertia",
    read(massive, bones, rates),
    {
      centre: { x: 1, y: 0, z: 0 },
      velocity: { x: 7, y: 5, z: 0 },
      linear: { x: 56, y: 40, z: 0 },
      angular: { x: 0, y: 0, z: 80 },
    },
  );

  const quarter: IAutoMovieQuaternion = {
    x: 0,
    y: 0,
    z: Math.SQRT1_2,
    w: Math.SQRT1_2,
  };
  const turned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
    [
      "hips",
      {
        ...frame,
        localRotation: quarter,
        worldRotation: quarter,
      },
    ],
  ]);
  const turnedRates: Map<
    AutoMovieHumanoidBone,
    resolveAutoMovieBoneRates.IRate
  > = new Map([
    [
      "hips",
      {
        linear: zero,
        angular: { x: 1, y: 0, z: 0 },
      },
    ],
  ]);
  const principalTurned: IAutoMovieResolveCenterOfMass.IModel = {
    ...model,
    segments: [{ ...model.segments[0]!, axes: quarter }],
  };
  expectMomentum(
    "rotated bone-local principal frame",
    read(principalTurned, bones, turnedRates),
    {
      centre: { x: 1, y: 0, z: 0 },
      velocity: zero,
      linear: zero,
      angular: { x: 3, y: 0, z: 0 },
    },
  );
  expectMomentum(
    "rotated anisotropic principal frame",
    read(model, turned, turnedRates),
    {
      centre: { x: 0, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 1 },
      linear: { x: 0, y: 0, z: 2 },
      angular: { x: 3, y: 0, z: 0 },
    },
  );

  const masslessSpin: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: [
      model.segments[0]!,
      {
        bone: "spine",
        mass: 0,
        point: zero,
        inertia: { x: 0, y: 0, z: 2 },
        axes: identity,
      },
    ],
  };
  const withSpine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    bones,
  );
  withSpine.set("spine", { ...frame, bone: "spine" });
  const withSpineRates: Map<
    AutoMovieHumanoidBone,
    resolveAutoMovieBoneRates.IRate
  > = new Map(rates);
  withSpineRates.set("spine", { linear: zero, angular: { x: 0, y: 0, z: 3 } });
  expectMomentum(
    "zero-mass intrinsic spin is retained",
    read(masslessSpin, withSpine, withSpineRates),
    {
      centre: { x: 1, y: 0, z: 0 },
      velocity: { x: 7, y: 5, z: 0 },
      linear: { x: 14, y: 10, z: 0 },
      angular: { x: 0, y: 0, z: 26 },
    },
  );

  refused("missing posed bone", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
      model,
      posed,
      new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(),
      rates,
    ),
  );
  refused("missing bone rate", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
      model,
      posed,
      bones,
      new Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>(),
    ),
  );
  refused("missing zero-mass part's spin rate", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
      masslessSpin,
      resolveAutoMovieMomentum.pose(masslessSpin, withSpine),
      withSpine,
      rates,
    ),
  );
  refused("zero total mass", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates({ ...model, mass: 0 }, posed, bones, rates),
  );
  refused("inconsistent ordered total mass", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates({ ...model, mass: 3 }, posed, bones, rates),
  );
  refused("missing posed part", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(model, { ...posed, parts: [] }, bones, rates),
  );
  refused("part mass differs from model", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
      model,
      { ...posed, parts: [{ ...posed.parts[0]!, mass: 3 }] },
      bones,
      rates,
    ),
  );
  refused("negative part mass", (): unknown =>
    AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
      { ...model, segments: [{ ...model.segments[0]!, mass: -2 }] },
      { ...posed, parts: [{ ...posed.parts[0]!, mass: -2 }] },
      bones,
      rates,
    ),
  );
}

/** Prepare only the public posed input; no two-pose momentum supplies an oracle. */
function read(
  model: IAutoMovieResolveCenterOfMass.IModel,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  rates: ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>,
): IAutoMovieBodyMomentum {
  return AutoMovieEngineKinematics.resolveAutoMovieMomentumRates(
    model,
    resolveAutoMovieMomentum.pose(model, bones),
    bones,
    rates,
  );
}

/** Compare every observable SI vector with a finite-aware binary64 bound. */
function expectMomentum(
  label: string,
  actual: IAutoMovieBodyMomentum,
  expected: IAutoMovieBodyMomentum,
): void {
  const fields: readonly (keyof IAutoMovieBodyMomentum)[] = [
    "centre",
    "velocity",
    "linear",
    "angular",
  ];
  for (const field of fields)
    TestValidator.predicate(
      `${label}: ${field}`,
      vclose(actual[field], expected[field], 1e-12),
    );
}

/**
 * Assert outside the helper's catch, so the assertion cannot become its own
 * refusal.
 */
function refused(label: string, operation: () => unknown): void {
  TestValidator.predicate(
    `centroidal momentum refuses ${label}`,
    throwsError(operation),
  );
}
