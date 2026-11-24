import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  boxExcludedSwivels,
  clinicalDeviation,
  decomposeJointRotationOnBasis,
  hingedArmArticulation,
  jointRomOvershoot,
  normalizeJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHingedArticulation,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The swivels a joint's three-angle box certainly refuses, and the hinged
 * chain's sweep that spares them.
 *
 * Scenarios:
 * 1. Every swivel the test refuses is refused by the box: for both hips
 *    (proximal twist, with the humanoid rest frames) and a hip's box read
 *    on the upper arm's distal basis, each of 40 seeded rotations turned about
 *    a seeded axis is decomposed every quarter degree, and every swivel the
 *    test refuses scores a positive overshoot; the test refuses some swivels
 *    of every joint.
 * 2. A joint gated by swing and twist (the upper arm's own range) without
 *    the frame its range is read in, and an unconstrained joint, refuse
 *    nothing.
 * 3. The sweep that spares the refused swivels returns the full sweep's pose,
 *    to every bit: 200 seeded leg chains, scored by the hip's decomposition
 *    and overshoot plus a deviation, solve to the same rotations and
 *    overshoot with the test as without it, among them chains with a legal
 *    pose and chains without, and the test refuses swivels in some of them.
 * 4. A swing-twist gate given the frame its range is read in refuses by the
 *    range: for both upper arms, each of 40 seeded rotations turned about a
 *    seeded axis is decomposed every quarter degree, every swivel the test
 *    refuses scores a positive overshoot, and the test refuses some; the
 *    gate decomposed on another bone's basis refuses nothing.
 */
export function test_unit_engine_kinematics_box_excluded_swivels(): void {
  const random: () => number = seeded(20251115);
  const hip: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM.leftUpperLeg!;

  // 1. Every refused swivel is refused by the box.
  const joints: IJoint[] = [
    joint("leftUpperLeg", "leftUpperLeg", hip),
    joint(
      "rightUpperLeg",
      "rightUpperLeg",
      DEFAULT_HUMANOID_ROM.rightUpperLeg!,
    ),
    joint("leftUpperArm", "leftUpperLeg", hip),
  ];
  const complaints: string[] = [];
  const refusing: string[] = [];
  for (const one of joints) {
    let refused: number = 0;
    for (let k: number = 0; k < 40; ++k) {
      const rotation: (swivel: number) => IAutoMovieQuaternion =
        turning(random);
      const test: (low: number, high: number) => boolean = boxExcludedSwivels({
        basis: one.basis,
        frame: one.frame,
        constraint: one.constraint,
        rotation,
      });
      for (let swivel: number = 0; swivel < 360; swivel += 0.25) {
        if (!test(swivel, swivel)) continue;
        ++refused;
        const overshoot: number = overshootOf(one, rotation(swivel));
        if (!(overshoot > 0))
          complaints.push(
            `${one.name} rotation ${k} swivel ${swivel}: refused, overshoot ${overshoot}`,
          );
      }
    }
    if (refused > 0) refusing.push(one.name);
  }
  TestValidator.equals(
    "every refused swivel is past the box",
    complaints.slice(0, 20),
    [],
  );
  TestValidator.equals(
    "every joint's box refuses swivels",
    refusing,
    joints.map((one: IJoint): string => one.name),
  );

  // 2. A swing-twist gate and no constraint refuse nothing.
  const gated: IJoint = joint(
    "leftUpperArm",
    "leftUpperArm",
    DEFAULT_HUMANOID_ROM.leftUpperArm!,
  );
  const free: IJoint = {
    ...joint("leftUpperLeg", "leftUpperLeg", hip),
    constraint: null,
  };
  const nothing: string[] = [];
  for (const one of [gated, free]) {
    const test: (low: number, high: number) => boolean = boxExcludedSwivels({
      basis: one.basis,
      frame: one.frame,
      constraint: one.constraint,
      rotation: turning(random),
    });
    for (let swivel: number = 0; swivel < 360; swivel += 1)
      if (test(swivel, swivel)) {
        nothing.push(
          `${one.name} ${one.constraint === null ? "free" : "gated"}`,
        );
        break;
      }
  }
  TestValidator.equals("a gated or free joint refuses nothing", nothing, []);

  // 4. A swing-twist gate read in its range's frame refuses by its range.
  const ranged: string[] = [];
  let gatedRefused: number = 0;
  for (const side of ["leftUpperArm", "rightUpperArm"] as const) {
    const one: IJoint = joint(side, side, DEFAULT_HUMANOID_ROM[side]!);
    for (let k: number = 0; k < 40; ++k) {
      const rotation: (swivel: number) => IAutoMovieQuaternion =
        turning(random);
      const test: (low: number, high: number) => boolean = boxExcludedSwivels({
        basis: one.basis,
        frame: one.frame,
        constraint: one.constraint,
        joint: swingTwistRange.of(side),
        rotation,
      });
      for (let swivel: number = 0; swivel < 360; swivel += 0.25) {
        if (!test(swivel, swivel)) continue;
        ++gatedRefused;
        const overshoot: number = overshootOf(one, rotation(swivel));
        if (!(overshoot > 0))
          ranged.push(
            `${one.name} rotation ${k} swivel ${swivel}: refused, overshoot ${overshoot}`,
          );
      }
    }
  }
  TestValidator.equals(
    "every swivel a swing-twist gate refuses is past its range",
    ranged.slice(0, 20),
    [],
  );
  TestValidator.predicate(
    `a swing-twist gate refuses swivels (${gatedRefused})`,
    gatedRefused > 0,
  );
  const foreign: IJoint = joint(
    "leftUpperLeg",
    "leftUpperArm",
    DEFAULT_HUMANOID_ROM.leftUpperArm!,
  );
  const elsewhere: (low: number, high: number) => boolean = boxExcludedSwivels({
    basis: foreign.basis,
    frame: foreign.frame,
    constraint: foreign.constraint,
    joint: swingTwistRange.of("leftUpperArm"),
    rotation: turning(random),
  });
  TestValidator.equals(
    "a gate read on another basis refuses nothing",
    Array.from({ length: 360 }, (_: unknown, swivel: number): number => swivel)
      .filter((swivel: number): boolean => elsewhere(swivel, swivel))
      .slice(0, 1),
    [],
  );

  // 3. The spared sweep is the full sweep.
  const leg: IJoint = joints[0]!;
  const differ: string[] = [];
  let legal: number = 0;
  let illegal: number = 0;
  let spared: number = 0;
  for (let k: number = 0; k < 200; ++k) {
    const chain = {
      upper: {
        worldPosition: { x: 0, y: 0, z: 0 },
        worldRotation: unit(random),
      },
      midOffset: { x: 0, y: -0.45, z: 0 },
      midRest: { x: 0, y: 0, z: 0, w: 1 },
      endOffset: { x: 0, y: -0.42, z: 0 },
      hinge: { x: 1, y: 0, z: 0 },
      target: {
        x: (random() - 0.5) * 0.8,
        y: -0.2 - random() * 0.6,
        z: (random() - 0.5) * 0.8,
      },
      range: { min: 0, max: (150 * Math.PI) / 180 },
    };
    const toward: IAutoMovieQuaternion = unit(random);
    const score = (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
    ): { overshoot: number; deviation: number } => {
      const angles: IAutoMovieResolvedJointAngles =
        decomposeJointRotationOnBasis(upper, leg.basis, leg.frame, {
          bone: leg.bone,
          constraint: leg.constraint,
        });
      return {
        overshoot: jointRomOvershoot(
          { bone: leg.bone, ...angles },
          leg.constraint,
        ),
        deviation:
          1e-6 * clinicalDeviation(angles) +
          Quaternion.angle(upper, toward) +
          Quaternion.angle(lower, toward),
      };
    };
    let refusedAny: boolean = false;
    const full: IAutoMovieHingedArticulation | null = hingedArmArticulation({
      ...chain,
      score,
    });
    const pruned: IAutoMovieHingedArticulation | null = hingedArmArticulation({
      ...chain,
      score,
      excluded: (
        upper: (swivel: number) => IAutoMovieQuaternion,
      ): ((low: number, high: number) => boolean) => {
        const test: (low: number, high: number) => boolean = boxExcludedSwivels(
          {
            basis: leg.basis,
            frame: leg.frame,
            constraint: leg.constraint,
            rotation: upper,
          },
        );
        return (low: number, high: number): boolean => {
          const out: boolean = test(low, high);
          if (out) refusedAny = true;
          return out;
        };
      },
    });
    if (refusedAny) ++spared;
    if (full !== null && full.overshoot === 0) ++legal;
    else ++illegal;
    if (!same(full, pruned)) differ.push(`chain ${k}`);
  }
  TestValidator.equals(
    "the spared sweep answers as the full sweep",
    differ,
    [],
  );
  TestValidator.predicate(
    `chains with a legal pose (${legal}), without one (${illegal}) and with refused swivels (${spared}) are all met`,
    legal > 0 && illegal > 0 && spared > 0,
  );
}

/** A joint as the fit decomposes and scores it. */
interface IJoint {
  name: string;
  bone: AutoMovieHumanoidBone;
  basis: IAutoMovieJointAxes;
  frame: IAutoMovieRestFrame | undefined;
  constraint: IAutoMovieJointConstraint | null;
}

/** A bone's basis and rest frame (`axes`), scored as `bone` under a constraint. */
function joint(
  axes: AutoMovieHumanoidBone,
  bone: AutoMovieHumanoidBone,
  constraint: IAutoMovieJointConstraint,
): IJoint {
  return {
    name: `${axes} under ${bone}'s range`,
    bone,
    basis: normalizeJointAxes(HUMANOID_JOINT_AXES[axes]!, axes),
    frame: HUMANOID_REST_FRAME[axes],
    constraint,
  };
}

/** The overshoot the fit scores a rotation by. */
function overshootOf(one: IJoint, rotation: IAutoMovieQuaternion): number {
  const angles: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
    rotation,
    one.basis,
    one.frame,
    { bone: one.bone, constraint: one.constraint },
  );
  return jointRomOvershoot({ bone: one.bone, ...angles }, one.constraint);
}

/** A seeded rotation turned about a seeded axis by the swivel, degrees. */
function turning(
  random: () => number,
): (swivel: number) => IAutoMovieQuaternion {
  const aim: IAutoMovieQuaternion = unit(random);
  const raw: IAutoMovieVector3 = {
    x: random() - 0.5,
    y: random() - 0.5,
    z: random() - 0.5,
  };
  const length: number = Math.hypot(raw.x, raw.y, raw.z);
  const axis: IAutoMovieVector3 = {
    x: raw.x / length,
    y: raw.y / length,
    z: raw.z / length,
  };
  return (swivel: number): IAutoMovieQuaternion =>
    Quaternion.multiply(aim, Quaternion.fromAxisAngle(axis, swivel));
}

/** A seeded unit quaternion. */
function unit(random: () => number): IAutoMovieQuaternion {
  return Quaternion.normalize({
    x: random() - 0.5,
    y: random() - 0.5,
    z: random() - 0.5,
    w: random() - 0.5,
  });
}

/** Whether two answers agree to every bit. */
function same(
  a: IAutoMovieHingedArticulation | null,
  b: IAutoMovieHingedArticulation | null,
): boolean {
  if (a === null || b === null) return a === b;
  const parts = (q: IAutoMovieQuaternion): number[] => [q.x, q.y, q.z, q.w];
  return (
    Object.is(a.overshoot, b.overshoot) &&
    Object.is(a.shortfall, b.shortfall) &&
    [...parts(a.upper), ...parts(a.lower)].every(
      (value: number, i: number): boolean =>
        Object.is(value, [...parts(b.upper), ...parts(b.lower)][i]),
    )
  );
}

/** A seeded linear congruential generator in [0, 1). */
function seeded(seed: number): () => number {
  let state: number = seed;
  return (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}
