import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  rigAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { type IAutoMovieQuaternion, type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";
import { throwsError } from "../internal/throwsError";

/** A rotation by `degrees` about a unit axis. */
const turn = (x: number, y: number, z: number, degrees: number): IAutoMovieQuaternion => {
  const half: number = (degrees * Math.PI) / 360;
  return { x: x * Math.sin(half), y: y * Math.sin(half), z: z * Math.sin(half), w: Math.cos(half) };
};

/** A vector rotated by a unit quaternion through its rotation matrix. */
const rotate = (q: IAutoMovieQuaternion, v: IAutoMovieVector3): IAutoMovieVector3 => {
  const { x, y, z, w } = q;
  return {
    x: (1 - 2 * (y * y + z * z)) * v.x + 2 * (x * y - w * z) * v.y + 2 * (x * z + w * y) * v.z,
    y: 2 * (x * y + w * z) * v.x + (1 - 2 * (x * x + z * z)) * v.y + 2 * (y * z - w * x) * v.z,
    z: 2 * (x * z - w * y) * v.x + 2 * (y * z + w * x) * v.y + (1 - 2 * (x * x + y * y)) * v.z,
  };
};

/**
 * A surface rig keeps pinned rings exact, its rest cage equal to sampling and
 * no state between poses, and refuses malformed calls.
 *
 * Scenarios:
 *
 * 1. Pinned ring vertices take their given positions exactly at rest and,
 *    posed, the positions their bone carries them to, computed here.
 * 2. The rest cage equals `sampleAutoMovieSurfaceNetwork`; posing writes the
 *    caller's buffer and carries no state between poses: pose B after A gives
 *    B bit for bit as a fresh rig does, and A again gives A.
 * 3. A buffer of the wrong length, posed bones out of order, bindings
 *    without rest bones and a binding naming nothing are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses a rig repeatedly into caller buffers and reads pinned vertices and the rest cage; a rig that fitted pinned vertices, moved them by the wrong bone, cached a previous pose or diverged from sampling at rest fails, and each refusal must name its fault.
 * @evidence contracts/testing.md#independent-expectations Pinned positions come from the ring declaration and from the rigid bone motion computed in this test; repeated poses are compared with a fresh rig's.
 * @evidence contracts/testing.md#distinguishing-cases Covers rest and posed pins, interleaved poses, a fresh rig, and each malformed buffer, bone list and binding; equality with the record path is owned by the rig pose test and the volume by the rig volume test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_rig_state` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_rig_state(): void {
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const skeleton = sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({ spine: turn(1, 0, 0, 15), leftUpperArm: turn(0, 0, 1, 30), leftLowerArm: turn(0, 0, 1, 90) });
  const rig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({ network, tier: "medium", bindings: skeleton.bindings, rest: skeleton.rest });
  const ring: IAutoMovieSurfaceNetwork.IRing = network.rings!.find((r: IAutoMovieSurfaceNetwork.IRing): boolean => r.name === "sideLeft.end")!;
  const members: number[] = rig.cage.rings["sideLeft.end"]!;
  const restElbow: IAutoMovieResolvedBone = skeleton.rest.find((b: IAutoMovieResolvedBone): boolean => b.bone === "leftLowerArm")!;
  const posedElbow: IAutoMovieResolvedBone = posed.find((b: IAutoMovieResolvedBone): boolean => b.bone === "leftLowerArm")!;
  // rest rotations are the identity, so the motion is the posed rotation about the bone's origin
  const carried = (p: IAutoMovieVector3): number[] => {
    const r: IAutoMovieVector3 = rotate(posedElbow.worldRotation, {
      x: p.x - restElbow.worldPosition.x,
      y: p.y - restElbow.worldPosition.y,
      z: p.z - restElbow.worldPosition.z,
    });
    return [r.x + posedElbow.worldPosition.x, r.y + posedElbow.worldPosition.y, r.z + posedElbow.worldPosition.z];
  };
  const moved: Float64Array = new Float64Array(rig.cage.cage.positions.length);
  rig.pose(posed, moved);
  TestValidator.equals(
    "pinned ring vertices are exact at rest and follow their bone when posed",
    namedFacts([
      [
        "rest",
        (): boolean =>
          members.every((v: number, k: number): boolean =>
            [ring.positions![k]!.x, ring.positions![k]!.y, ring.positions![k]!.z].every((x: number, a: number): boolean => rig.cage.cage.positions[3 * v + a] === x),
          ),
      ],
      [
        "posed",
        (): boolean =>
          members.every((v: number, k: number): boolean =>
            carried(ring.positions![k]!).every((x: number, a: number): boolean => Math.abs(moved[3 * v + a]! - x) <= 1e-12),
          ),
      ],
    ]),
    { rest: true, posed: true },
  );

  const other: IAutoMovieResolvedBone[] = skeleton.pose({ rightUpperArm: turn(0, 1, 0, 50), rightUpperLeg: turn(0, 0, 1, 20) });
  const first: Float64Array = new Float64Array(moved.length);
  const second: Float64Array = new Float64Array(moved.length);
  const fresh: Float64Array = new Float64Array(moved.length);
  rig.pose(other, second);
  rig.pose(posed, first);
  rigAutoMovieSurfaceNetwork({ network, tier: "medium", bindings: skeleton.bindings, rest: skeleton.rest }).pose(other, fresh);
  TestValidator.equals(
    "the rest cage is the sampled cage and poses carry no state",
    namedFacts([
      ["rest", (): boolean => JSON.stringify(rig.cage) === JSON.stringify(sampleAutoMovieSurfaceNetwork({ network, tier: "medium" }))],
      ["fresh", (): boolean => second.every((x: number, k: number): boolean => x === fresh[k])],
      ["again", (): boolean => first.every((x: number, k: number): boolean => x === moved[k])],
    ]),
    { rest: true, fresh: true, again: true },
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    ["a short buffer", (): unknown => rig.pose(posed, new Float64Array(3)), "a posed cage needs"],
    ["bones out of order", (): unknown => rig.pose([...posed].reverse(), new Float64Array(moved.length)), "posed bone 0 is"],
    ["bindings without rest bones", (): unknown => rigAutoMovieSurfaceNetwork({ network, tier: "lowest", bindings: skeleton.bindings }), "a rig with bindings needs the rest bones"],
    [
      "a binding naming nothing",
      (): unknown => rigAutoMovieSurfaceNetwork({ network, tier: "lowest", bindings: { curves: { nowhere: "hips" } }, rest: skeleton.rest }),
      "binding names unknown curve nowhere",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(`${name} is refused by its own diagnostic`, throwsError(callback, message));
}
