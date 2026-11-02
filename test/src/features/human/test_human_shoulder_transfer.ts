import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanShoulderTransfer } from "../../../../packages/human/src/skeleton/AutoMovieHumanShoulderTransfer";
import { AutoMovieHumanSkeletonMath as M } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeletonMath";

/**
 * Separate scapular motion does not alter the requested humeral world frame.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes a raised clavicle, independent scapular rotation and GH compensation over noncommuting original rotations, checking the blade and humerus against sequential Rodrigues rotations. The legacy compensation at the scapula is red for the blade's world rotation while the new transfer is green and keeps the humeral world direction.
 * @evidence contracts/testing.md#independent-expectations Rodrigues' vector formula supplies expected directions independently of quaternion multiplication. Identity, 28 degree clavicular raise, 46 degree blade raise and authored compound rotations are synthetic algebraic witnesses, not measured anatomical magnitudes. Full skeleton position and clinical-range integration remain owned by engine_pose and the generic scapular articulation test.
 * @evidence contracts/testing.md#distinguishing-cases Identity, several humeral vectors, both mirrored upward-rotation axes, noncommuting authored rotations, deterministic direct restoration to zero and unchanged input arrays. No person-specific coefficient enters.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous unit calling the same transfer helper the clinical skeleton uses, without body generation, browser, GPU or process.
 */
export function test_human_shoulder_transfer(): void {
  const x: M.Vector = [1, 0, 0];
  const y: M.Vector = [0, 1, 0];
  const z: M.Vector = [0, 0, 1];
  const original: M.Quaternion = M.fromAxisAngle(y, 25);
  const raised: M.Quaternion = M.multiply(original, M.fromAxisAngle(z, 28));
  const inverse: M.Quaternion = [-raised[0], -raised[1], -raised[2], raised[3]];
  const back: M.Quaternion = M.multiply(inverse, original);
  const own: M.Quaternion = M.fromAxisAngle(x, 10);
  const upper: M.Quaternion = M.fromAxisAngle(y, 80);
  const snapshot: string = JSON.stringify({ back, own });
  for (const sign of [-1, 1]) {
    const axis: M.Vector = [0, 0, sign];
    const transfer: AutoMovieHumanShoulderTransfer.ITransfer = AutoMovieHumanShoulderTransfer.apply(back, own, axis, 46);
    for (const v of [x, y, z]) {
      const blade: M.Vector = M.rotate(M.multiply(raised, transfer.scapula), v);
      const expected: M.Vector = rodrigues(rodrigues(rodrigues(v, x, 10), axis, 46), y, 25);
      TestValidator.predicate("blade retains its own automatic motion", distance(blade, expected) < 1e-12);
      const humerus: M.Quaternion = M.multiply(M.multiply(M.multiply(raised, transfer.scapula), transfer.humerus), upper);
      const target: M.Vector = rodrigues(rodrigues(rodrigues(v, y, 80), x, 10), y, 25);
      TestValidator.predicate("humeral world direction is preserved", distance(M.rotate(humerus, v), target) < 1e-12);
    }
    const legacy: M.Quaternion = M.multiply(raised, M.multiply(back, own));
    const wanted: M.Vector = rodrigues(rodrigues(rodrigues(x, x, 10), axis, 46), y, 25);
    TestValidator.predicate("legacy blade cancellation is red", distance(M.rotate(legacy, x), wanted) > 0.5);
  }
  const identity: M.Quaternion = [0, 0, 0, 1];
  const neutral: AutoMovieHumanShoulderTransfer.ITransfer = AutoMovieHumanShoulderTransfer.apply(identity, own, z, 0);
  TestValidator.predicate("direct neutral restoration", distance(M.rotate(neutral.scapula, y), rodrigues(y, x, 10)) < 1e-12 && distance(M.rotate(neutral.humerus, y), y) < 1e-12);
  TestValidator.predicate("source rotations remain immutable", JSON.stringify({ back, own }) === snapshot);
}

/** Independent vector form of a rotation around a unit axis. */
function rodrigues(v: M.Vector, axis: M.Vector, degrees: number): M.Vector {
  const angle: number = degrees * Math.PI / 180;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  const dot: number = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
  const cross: M.Vector = [axis[1] * v[2] - axis[2] * v[1], axis[2] * v[0] - axis[0] * v[2], axis[0] * v[1] - axis[1] * v[0]];
  return [0, 1, 2].map((i: number): number => v[i]! * cosine + cross[i]! * sine + axis[i]! * dot * (1 - cosine)) as M.Vector;
}

/** Euclidean distance between independently evaluated directions. */
function distance(a: M.Vector, b: M.Vector): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
