import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionSampleSide,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMoviePoseRig,
  IAutoMoviePoseState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineRomTolerance } from "../../rom/AutoMovieEngineRomTolerance";

/*
 * Companion types and helpers of samplePoseVelocity.
 */
export namespace samplePoseVelocity {
  /*
   * A pose and its rate of change at one instant, read from the pure function of
   * time that produces it.
   *
   * Read from both sides, the rate is the symmetric difference `(f(t + h) - f(t -
   * h)) / 2h` of every clinical angle and of the root translation, and the root's
   * angular velocity is the rotation vector of `q(t + h) q(t - h)^-1` over `2h`.
   * A motion that only exists on one side of the instant (the action a cut ends,
   * the action a cut begins) is read from that side alone, by the three-point
   * difference `s (-3 f(t) + 4 f(t + s h) - f(t + 2 s h)) / 2h` with `s` the
   * side's sign, the rotation vectors taken from `q(t)`: a symmetric difference
   * would average the motion's rate with whatever its function returns across the
   * instant. Differencing the source function, never emitted frames, keeps the
   * estimate free of the frame grid: either difference is second order, its error
   * `O(h^2)` times the third derivative. An angle absent from a sample counts as
   * zero, its clinical neutral.
   *
   * Each joint's angular velocity (`spins`) is read the way the root's is, from
   * the rotation vectors of its articulation at the same samples
   * (AutoMovieEngineKinematics.poseJointCodec), never from the angle rates: at an angle chart's
   * gimbal the angle rates of a smooth rotation are unbounded, while its angular
   * velocity is not.
   *
   * A pose whose limbs are fitted to targets carries each fit's resolution into
   * the difference, divided by `h`. With `continued`, the rate is read from the
   * instant's own fits continued to its neighbours (each seeded with the
   * instant's choice and refined to samplePoseVelocity.tolerance,
   * `IAutoMovieSwivelNear`), the instant's sample included, while the pose
   * returned is still `sample`'s: the difference then sees the motion, not the
   * fits' resolution, and a fit whose best basin changes inside the step is read
   * on the branch the instant is on.
   * Parameter sample: The pose as a pure function of seconds.
   * Parameter seconds: The instant.
   * Parameter step: The difference interval `h`, seconds; 1 ms by default.
   * Parameter side: Which side of the instant the motion is read from: both by
   * default.
   * Parameter rig: The rig the joints' angles are read through for `spins`; the
   * default basis with rest-relative angles when omitted.
   * Parameter continued: The pose as a pure function of seconds with every fit
   * continued from the instant's, the rate's samples; `sample` when omitted.
   * Parameter prepared: Optional same-rig codec or lazy getter, demanded only after
   * the actual samples and joint-rate indexing.
   * Returns: The pose at the instant and its velocity.
   */
  export function sample(
    sample: (seconds: number) => IAutoMoviePose,
    seconds: number,
    step: number = 1e-3,
    side: AutoMovieMotionSampleSide = "both",
    rig?: IAutoMoviePoseRig,
    continued?: (seconds: number) => IAutoMoviePose,
    prepared?:
      | IAutoMoviePoseJointCodec.ICodec
      | (() => IAutoMoviePoseJointCodec.ICodec),
  ): IAutoMoviePoseState {
    if (!(step > 0)) throw new Error("A velocity step is positive");
    const pose: IAutoMoviePose = sample(seconds);

    // The rate's samples: the instant and two beside it, continued from the
    // instant's fits when `continued` is given, and the weights of the difference
    // `(near * f(a) + far * f(b) + here * f(t)) / 2h`.
    const read: (seconds: number) => IAutoMoviePose = continued ?? sample;
    const instant: IAutoMoviePose =
      continued === undefined ? pose : continued(seconds);
    const sign: number = side === "before" ? -1 : 1;
    const a: IAutoMoviePose = read(seconds + sign * step);
    const b: IAutoMoviePose = read(
      side === "both" ? seconds - step : seconds + 2 * sign * step,
    );
    const near: number = side === "both" ? 1 : 4 * sign;
    const far: number = side === "both" ? -1 : -sign;
    const here: number = side === "both" ? 0 : -3 * sign;
    const rate: (x: number, y: number, z: number) => number = (
      x: number,
      y: number,
      z: number,
    ): number => (near * x + far * y + here * z) / (2 * step);

    const aa: Map<AutoMovieHumanoidBone, [number, number, number]> =
      AutoMovieEngineKinematics.indexPoseJoints(a);
    const ba: Map<AutoMovieHumanoidBone, [number, number, number]> =
      AutoMovieEngineKinematics.indexPoseJoints(b);
    const pa: Map<AutoMovieHumanoidBone, [number, number, number]> =
      AutoMovieEngineKinematics.indexPoseJoints(instant);
    const joints: Map<AutoMovieHumanoidBone, [number, number, number]> =
      new Map();
    for (const bone of new Set([...aa.keys(), ...ba.keys(), ...pa.keys()])) {
      const x: [number, number, number] = aa.get(bone) ?? [0, 0, 0];
      const y: [number, number, number] = ba.get(bone) ?? [0, 0, 0];
      const z: [number, number, number] = pa.get(bone) ?? [0, 0, 0];
      joints.set(bone, [
        rate(x[0], y[0], z[0]),
        rate(x[1], y[1], z[1]),
        rate(x[2], y[2], z[2]),
      ]);
    }

    // Joint spins: the rotation vectors of each articulation at the two samples
    // beside the instant, from the same origin sample as the root's below.
    const codec: IAutoMoviePoseJointCodec.ICodec =
      prepared === undefined
        ? AutoMovieEngineKinematics.poseJointCodec(rig)
        : typeof prepared === "function"
          ? prepared()
          : prepared;
    const still: [number, number, number] = [0, 0, 0];
    const spins: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
    for (const bone of joints.keys()) {
      const from: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
        codec.rotation(bone, (side === "both" ? ba : pa).get(bone) ?? still),
      );
      const x: IAutoMovieVector3 = spinFrom(
        codec.rotation(bone, aa.get(bone) ?? still),
        from,
      );
      const y: IAutoMovieVector3 = spinFrom(
        codec.rotation(bone, ba.get(bone) ?? still),
        from,
      );
      spins.set(bone, {
        x: rate(x.x, y.x, 0),
        y: rate(x.y, y.y, 0),
        z: rate(x.z, y.z, 0),
      });
    }

    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const at: IAutoMovieVector3 = a.root?.translation ?? zero;
    const bt: IAutoMovieVector3 = b.root?.translation ?? zero;
    const pt: IAutoMovieVector3 = instant.root?.translation ?? zero;

    // Rotation vectors are taken from the far sample when reading both sides,
    // where the near one's is the whole turn, and from the instant otherwise.
    const origin: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      (side === "both" ? b : instant).root?.rotation ?? AutoMovieEngineQuaternion.identity(),
    );
    const ar: IAutoMovieVector3 = spinFrom(
      a.root?.rotation ?? AutoMovieEngineQuaternion.identity(),
      origin,
    );
    const br: IAutoMovieVector3 = spinFrom(
      b.root?.rotation ?? AutoMovieEngineQuaternion.identity(),
      origin,
    );
    return {
      pose,
      velocity: {
        joints,
        spins,
        linear: {
          x: rate(at.x, bt.x, pt.x),
          y: rate(at.y, bt.y, pt.y),
          z: rate(at.z, bt.z, pt.z),
        },
        angular: {
          x: rate(ar.x, br.x, 0),
          y: rate(ar.y, br.y, 0),
          z: rate(ar.z, br.z, 0),
        },
      },
    };
  }

  /*
   * The swivel tolerance, degrees, a continued fit is refined to for the
   * `continued` samples of a velocity read at `step` that an inertialization of
   * `duration` decays.
   *
   * A continued fit lies within its tolerance `τ` of its bracket's best
   * (`IAutoMovieSwivelNear`), and a swivel turns its chain's root about one
   * axis, so the joint's turn is off by at most `τ`. The three-point difference
   * weighs its samples `(3, 4, 1) / 2h`, so one read's rate is off by at most
   * `4 τ / h`, and the offset an inertialization decays is the difference of
   * two reads, the source's and the target's, off by at most `8 τ / h`. An
   * offset velocity error `δv` moves the decayed offset by at most `256 / 3125
   * δv duration`, the peak of its quintic's signed lobe (`inertializeOffset`,
   * linear in the velocity over a fixed duration). That is held to
   * `AutoMovieEngineRomTolerance`, the resolution a solver need resolve a joint's angle to,
   * so `τ = AutoMovieEngineRomTolerance h 3125 / (8 256 duration)`: 3.8e-5 degrees for a 1 ms
   * step and a 0.4 s decay, where a fit's own resolution
   * (`hingedArmSwivel.RESOLUTION`, 0.0062 degrees) bounds the displacement at
   * 1.6 degrees.
   * Parameter step: The difference interval `h`, seconds; positive.
   * Parameter duration: The decay the read feeds, seconds; positive.
   * Returns: Degrees.
   */
  export function tolerance(step: number, duration: number): number {
    if (!(step > 0) || !(duration > 0))
      throw new Error(
        "A continued fit's tolerance needs a positive step and decay",
      );
    return (AutoMovieEngineRomTolerance * step * 3125) / (8 * 256 * duration);
  }

  /*
   * The rotation vector (axis times angle in radians) of a unit quaternion,
   * taking the shorter of the two equivalent rotations.
   * Parameter q: A unit quaternion.
   * Returns: Its rotation vector.
   */
  export function rotationVector(q: IAutoMovieQuaternion): IAutoMovieVector3 {
    const sign: number = q.w < 0 ? -1 : 1;
    const w: number = Math.min(1, sign * q.w);
    const sine: number = Math.hypot(q.x, q.y, q.z);
    if (sine < 1e-12)
      return { x: 2 * sign * q.x, y: 2 * sign * q.y, z: 2 * sign * q.z };
    const angle: number = 2 * Math.atan2(sine, w);
    const k: number = (sign * angle) / sine;
    return { x: q.x * k, y: q.y * k, z: q.z * k };
  }

  /*
   * Read a current articulation/root's rotation vector from the same inverse
   * origin.
   */
  function spinFrom(
    rotation: IAutoMovieQuaternion,
    from: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    return samplePoseVelocity.rotationVector(AutoMovieEngineQuaternion.multiply(rotation, from));
  }
}
