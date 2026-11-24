import { Quaternion, Vector3, resolvePose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWater,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanWater } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A body the water carries (#3432): `HumanWater`.
 *
 * Every body lies prone in its rest shape, turned a quarter about its left
 * axis, in fresh water whose surface is at 0 m.
 *
 * Scenarios:
 * on every body of `EXTREMES`:
 * 1. Archimedes: lowered by `float`, the body's submerged volume times the
 *    water's density equals its mass within 2 % (the issue's bound). The
 *    profile carries no lung air, so a body whose colliders displace less
 *    than its mass truthfully sinks (`float` reports null): then its whole
 *    volume's displacement must be under its mass, and the report is the
 *    passing verdict, not a failure.
 * 2. Denser water: sea water (1025 kg/m³) floats a floating body no lower
 *    than fresh water, and a body whose whole volume of sea water outweighs
 *    it floats there by Archimedes within the same 2 %.
 * 3. A glide of 1 m/s along the body's long axis, its shape held, afloat or
 *    wholly under for a sinking body, decays as
 *    quadratic drag predicts, `v(t) = v0 / (1 + k v0 t)` with `k` the summed
 *    drag at 1 m/s over the mass, within 2 % over 2 s.
 * 4. Determinism: the glide read at shuffled times gives the bits read in
 *    order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Floats and glides real bodies through the public module; a float off Archimedes, a denser fluid floating lower, a glide that decays linearly or reads differently by order fails.
 * @evidence contracts/development/testing.md#independent-expectations Archimedes' principle, the closed form of quadratic-drag decay and the integrator's order contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies, two densities, a sinking body's report, a glide's knots and between; the single segment's forces belong to `test_engine_hydrodynamic_force`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and their bounds.
 */
export function test_motion_swim_water_buoyancy(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const prone = (body: IAutoMovieMotionHumanBody): Bones => {
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      90,
    );
    return new Map(
      resolvePose(
        { skeleton: body.skeleton.id, root: null, joints: [] },
        body.skeleton,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          r.bone,
          {
            ...r,
            worldPosition: Quaternion.rotateVector(turn, r.worldPosition),
            worldRotation: Quaternion.multiply(turn, r.worldRotation),
          },
        ],
      ),
    );
  };
  const lowered = (bones: Bones, dy: number): Bones =>
    new Map(
      [...bones].map(
        ([bone, r]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          bone,
          {
            ...r,
            worldPosition: { ...r.worldPosition, y: r.worldPosition.y + dy },
          },
        ],
      ),
    );
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const fresh: IAutoMovieMotionHumanWater = { surface: 0 };

  for (const name of ["f-small", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const bones: Bones = prone(body);
    const mass: number = body.profile.mass;

    // 1. Archimedes.
    const dy: number | null = HumanWater.float(body, bones, fresh);
    // A profile without lung air may displace less than its mass: then the
    // truthful verdict is that it sinks, wholly under it displaces less
    // than it weighs, and its glide is read wholly under the plane.
    const whole: IAutoMovieMotionHumanWater.ISum = HumanWater.sum(
      body,
      lowered(bones, -10 * body.measure.stature),
      still,
      fresh,
    );
    if (dy === null) {
      if (!(whole.volume * 1000 < mass))
        findings.push(
          `${name}: reported sinking though its ${(whole.volume * 1000).toFixed(1)} kg of displacement exceeds ${mass} kg`,
        );
    } else {
      const floated: IAutoMovieMotionHumanWater.ISum = HumanWater.sum(
        body,
        lowered(bones, dy),
        still,
        fresh,
      );
      if (Math.abs(floated.submerged * 1000 - mass) > 0.02 * mass)
        findings.push(
          `${name}: floats displacing ${(floated.submerged * 1000).toFixed(2)} kg for ${mass} kg`,
        );
    }

    // 2. Sea water floats it no lower, and floats by Archimedes when its
    // whole volume of sea water outweighs it.
    const sea: number | null = HumanWater.float(body, bones, {
      surface: 0,
      density: 1025,
    });
    if (dy !== null && (sea === null || sea < dy - 1e-6))
      findings.push(
        `${name}: sea water floats it at ${sea}, below fresh water's ${dy}`,
      );
    if (whole.volume * 1025 > mass) {
      if (sea === null)
        findings.push(
          `${name}: sea water outweighs it but it is reported sinking`,
        );
      else {
        const salted: number = HumanWater.sum(
          body,
          lowered(bones, sea),
          still,
          {
            surface: 0,
            density: 1025,
          },
        ).submerged;
        if (Math.abs(salted * 1025 - mass) > 0.02 * mass)
          findings.push(
            `${name}: floats in sea water displacing ${(salted * 1025).toFixed(2)} kg for ${mass} kg`,
          );
      }
    }

    // 3. The glide's decay, afloat or wholly under.
    const afloat: Bones = lowered(bones, dy ?? -10 * body.measure.stature);
    const along: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
    const k: number =
      -Vector3.dot(HumanWater.sum(body, afloat, along, fresh).drag, along) /
      mass;
    const glide: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      HumanWater.glide(body, afloat, along, 1, 2, fresh);
    for (let i: number = 0; i <= 20; i++) {
      const t: number = i / 10;
      const v: number = glide.at(t).x[0]!;
      const expected: number = 1 / (1 + k * t);
      if (Math.abs(v - expected) > 0.02 * expected) {
        findings.push(
          `${name}: glides at ${v.toFixed(4)} m/s at ${t} s, quadratic drag ${expected.toFixed(4)}`,
        );
        break;
      }
    }
  }

  TestValidator.predicate(
    `water: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
