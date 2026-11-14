import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { swingTwist } from "../math/swingTwist";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";

/**
 * The twist a distally twisting mid bone (a forearm, which pronates and
 * supinates about its own length beyond the elbow's hinge) takes so its
 * effector (a wrist, which flexes and deviates but cannot twist) can reach a
 * requested rotation.
 *
 * The effector reads its rotation as clinical angles in its own Euler
 * convention, and the share it cannot take is that convention's twist. The
 * mid bone's twist composes last in its own articulation, `A = Abd Flex
 * T(u, r)`, so the effector's local rotation is `rest^-1 T(u, -r) K` with `K`
 * fixed by the pose above and the request. The effector's rig twist is
 * `atan2(P, Q)` of two components of that rotation applied to its flexion
 * (and, for a distal effector, abduction) axis (`decomposeJointRotationOnBasis`),
 * and each component of a vector turned about `u` by `-r` is
 * `alpha + beta cos r + gamma sin r`. Asking the effector's twist to stand at
 * its clinical zero is therefore one equation `A + B cos r + C sin r = 0`,
 * solved in closed form: at most two forearm twists, the circle the hand
 * turns on as the forearm twists crossing the rotations the wrist's two
 * angles make. Of those inside the forearm's range, the range's two ends and
 * the start, the one whose effector, clamped to its own range, shows the
 * request most nearly is taken, and between equals the one nearest the
 * start: the current twist plus the swing-twist share (`swingTwist`) of the
 * change from the effector's current rotation to the requested one. So only
 * the residual beyond the current pose moves, a request near the current
 * hand rotation moves the forearm little, and a rotation the two joints can
 * reach together is reached exactly.
 *
 * @param props The mid joint's and the effector's current clinical angles;
 *   `above`, the world rotation the mid joint's articulation composes after
 *   (its parent's world rotation and its rest); the mid and effector bases
 *   (normalized) and rest frames; the effector's rest rotation; the requested
 *   effector world rotation; and the skeleton whose ranges clamp.
 * @returns The mid joint with its twist solved, clamped to the rig's range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the effector cannot take, the equation its twist makes, how it is solved, which solution is taken and the start that breaks a tie.
 * @evidence contracts/development/implementation.md#principled-implementation The effector's twist is read exactly as its decomposition reads it, so the solution leaves it nothing to drop; a vector turned about an axis is Rodrigues' formula, linear in the cosine and sine of the turn, so the condition is a first-order trigonometric equation with a closed-form solution; every solution is weighed by the rotation the clamped effector then shows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One equation, its two solutions and one choice among a handful of candidates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every twist is clamped to the rig's range, so none past pronation or supination is returned; with no solution the range's nearer end or the start is taken by the same measure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: a few compositions and at most five decompositions, cheap enough for every swivel the limb fit ranks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Composes and decomposes on the caller's normalized bases and reads the rig's own angle maps (`toRigAngle`, `toClinicalAngle`).
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function solveDistalTwist(props: {
  joint: IAutoMovieJointPose;
  effector: IAutoMovieJointPose;
  above: IAutoMovieQuaternion;
  lowerBasis: IAutoMovieJointAxes;
  lowerFrame: IAutoMovieRestFrame | undefined;
  effectorRest: IAutoMovieQuaternion;
  effectorBasis: IAutoMovieJointAxes;
  effectorFrame: IAutoMovieRestFrame | undefined;
  rotation: IAutoMovieQuaternion;
  skeleton: IAutoMovieSkeleton;
}): IAutoMovieJointPose {
  const at = (twist: number): IAutoMovieJointPose =>
    clampJointToSkeleton({ ...props.joint, twist }, props.skeleton);
  const effectorOf = (joint: IAutoMovieJointPose): IAutoMovieQuaternion =>
    Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(props.effectorRest),
        Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              props.above,
              jointToQuaternionOnBasis(
                joint,
                props.lowerBasis,
                props.lowerFrame,
              ),
            ),
          ),
          props.rotation,
        ),
      ),
    );

  // How far the effector, clamped to its range, shows its asked rotation.
  const missed = (twist: number): number => {
    const local: IAutoMovieQuaternion = effectorOf(at(twist));
    const a = decomposeJointRotationOnBasis(
      local,
      props.effectorBasis,
      props.effectorFrame,
    );
    const shown: IAutoMovieQuaternion = jointToQuaternionOnBasis(
      clampJointToSkeleton(
        {
          bone: props.effector.bone,
          flexion: a.flexion,
          abduction: a.abduction,
          twist: a.twist,
        },
        props.skeleton,
      ),
      props.effectorBasis,
      props.effectorFrame,
    );
    return Quaternion.angle(Quaternion.normalize(shown), local);
  };

  // The start: the current twist plus the twist, about the mid bone's axis,
  // of the change from the effector's current rotation to the requested one.
  const articulated: IAutoMovieQuaternion = jointToQuaternionOnBasis(
    props.joint,
    props.lowerBasis,
    props.lowerFrame,
  );
  const needed: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(props.above, articulated)),
    props.rotation,
  );
  const held: IAutoMovieQuaternion = Quaternion.multiply(
    props.effectorRest,
    jointToQuaternionOnBasis(
      props.effector,
      props.effectorBasis,
      props.effectorFrame,
    ),
  );
  const { twist } = swingTwist(
    Quaternion.normalize(Quaternion.multiply(needed, Quaternion.inverse(held))),
    props.lowerBasis.twist,
  );
  const start: number =
    at(
      decomposeJointRotationOnBasis(
        Quaternion.normalize(Quaternion.multiply(articulated, twist)),
        props.lowerBasis,
        props.lowerFrame,
      ).twist ?? 0,
    ).twist ?? 0;

  // K: the request seen from the mid bone's articulation before its twist.
  const untwisted: IAutoMovieQuaternion = jointToQuaternionOnBasis(
    { ...props.joint, twist: toClinicalAngle(0, props.lowerFrame?.twist) },
    props.lowerBasis,
    props.lowerFrame,
  );
  const K: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(props.above, untwisted)),
    props.rotation,
  );
  const u: IAutoMovieVector3 = props.lowerBasis.twist;
  const e: IAutoMovieJointAxes = props.effectorBasis;
  const flexion: IAutoMovieVector3 = Quaternion.rotateVector(
    props.effectorRest,
    e.flexion,
  );
  const abduction: IAutoMovieVector3 = Quaternion.rotateVector(
    props.effectorRest,
    e.abduction,
  );
  // n . T(u, -r) x = alpha + beta cos r + gamma sin r (Rodrigues).
  const harmonic = (
    n: IAutoMovieVector3,
    x: IAutoMovieVector3,
  ): [number, number, number] => {
    const along: number = Vector3.dot(n, u) * Vector3.dot(u, x);
    return [
      along,
      Vector3.dot(n, x) - along,
      -Vector3.dot(n, Vector3.cross(u, x)),
    ];
  };
  const x: IAutoMovieVector3 = Quaternion.rotateVector(K, e.flexion);
  const y: IAutoMovieVector3 = Quaternion.rotateVector(K, e.abduction);
  const [P, Q]: [number, number, number][] =
    e.twistPlacement === "distal"
      ? [harmonic(abduction, x), harmonic(abduction, y)]
      : [harmonic(abduction, x), harmonic(flexion, x)];
  const handed: number =
    Vector3.dot(e.twist, Vector3.cross(e.flexion, e.abduction)) >= 0 ? 1 : -1;
  const phi: number =
    (handed * (toRigAngle(0, props.effectorFrame?.twist) ?? 0) * Math.PI) / 180;
  const [A, B, C]: number[] = [0, 1, 2].map(
    (i: number): number => P[i]! * Math.cos(phi) - Q[i]! * Math.sin(phi),
  );

  // The forearm's range, and the clinical twist of each solution inside it.
  const low: number = at(-1e6).twist ?? 0;
  const high: number = at(1e6).twist ?? 0;
  const candidates: number[] = [low, high, start];
  const radius: number = Math.hypot(B!, C!);
  if (radius > 1e-12 && Math.abs(A!) <= radius) {
    const centre: number = Math.atan2(C!, B!);
    const spread: number = Math.acos(Math.max(-1, Math.min(1, -A! / radius)));
    for (const r of [centre + spread, centre - spread]) {
      const clinical: number =
        toClinicalAngle((r * 180) / Math.PI, props.lowerFrame?.twist) ?? 0;
      // The alias of the solution nearest the range's middle.
      const middle: number = (low + high) / 2;
      candidates.push(clinical - 360 * Math.round((clinical - middle) / 360));
    }
  }

  // The candidate whose clamped effector misses least; between equals, the
  // nearest to the start.
  let chosen: number = start;
  let least: number = missed(start);
  for (const t of candidates) {
    const m: number = missed(t);
    if (
      m < least - TIE ||
      (Math.abs(m - least) <= TIE &&
        Math.abs((at(t).twist ?? 0) - start) <
          Math.abs((at(chosen).twist ?? 0) - start))
    ) {
      chosen = t;
      least = Math.min(least, m);
    }
  }
  return at(chosen);
}

/** The difference, radians, under which two misses are equal: a few hundred times the rounding of the quaternion products a miss is read through, so a solution does not displace an exact start over rounding. */
const TIE: number = 1e-6;
