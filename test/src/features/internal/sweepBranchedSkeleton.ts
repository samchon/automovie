import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSweepBinding,
} from "@automovie/engine";
import {
  type AutoMovieHumanoidBone,
  type IAutoMovieQuaternion,
  type IAutoMovieVector3,
} from "@automovie/interface";

/** Each bone's parent and rest origin, metres, in the branched test body's frame. */
const BONES: Array<
  [AutoMovieHumanoidBone, AutoMovieHumanoidBone | null, IAutoMovieVector3]
> = [
  ["hips", null, { x: 0, y: 0, z: 0 }],
  ["spine", "hips", { x: 0, y: 0.3, z: 0.012 }],
  ["neck", "spine", { x: 0, y: 0.66, z: 0 }],
  ["leftUpperArm", "spine", { x: 0.2, y: 0.456, z: 0 }],
  ["leftLowerArm", "leftUpperArm", { x: 0.5, y: 0.456, z: 0 }],
  ["rightUpperArm", "spine", { x: -0.2, y: 0.456, z: 0 }],
  ["rightLowerArm", "rightUpperArm", { x: -0.5, y: 0.456, z: 0 }],
  ["leftUpperLeg", "hips", { x: 0.095, y: -0.16, z: 0 }],
  ["leftLowerLeg", "leftUpperLeg", { x: 0.1, y: -0.55, z: 0 }],
  ["rightUpperLeg", "hips", { x: -0.095, y: -0.16, z: 0 }],
  ["rightLowerLeg", "rightUpperLeg", { x: -0.1, y: -0.55, z: 0 }],
];

const multiply = (
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): IAutoMovieQuaternion => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});

const rotate = (
  q: IAutoMovieQuaternion,
  v: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
};

/**
 * A skeleton for `sweepBranchedBody` and the bindings that make the body ride
 * it: the trunk on the hips and spine with a joint station where they meet,
 * each side tube on an upper and lower arm and each fork tube on an upper and
 * lower leg, both with a joint station at the tube's middle, the top tube on
 * the neck, the fork curve on the hips and each side tube's end ring on its
 * lower arm.
 *
 * Bones rest unrotated at the given origins. `pose` turns bones by local
 * rotations about their own origins and carries the turn down the chain, the
 * forward kinematics `resolvePose` performs, so a child's origin moves with
 * its parent.
 *
 * @returns The rest bones, a posing function and the bindings.
 */
export function sweepBranchedSkeleton(): {
  rest: IAutoMovieResolvedBone[];
  pose: (
    turns: Partial<Record<AutoMovieHumanoidBone, IAutoMovieQuaternion>>,
  ) => IAutoMovieResolvedBone[];
  bindings: {
    sweeps: Record<string, IAutoMovieSweepBinding>;
    curves: Record<string, AutoMovieHumanoidBone>;
    rings: Record<string, AutoMovieHumanoidBone>;
  };
} {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const pose = (
    turns: Partial<Record<AutoMovieHumanoidBone, IAutoMovieQuaternion>>,
  ): IAutoMovieResolvedBone[] => {
    const world: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const [bone, parent, origin] of BONES) {
      const local: IAutoMovieQuaternion = turns[bone] ?? identity;
      const up: IAutoMovieResolvedBone | undefined =
        parent === null ? undefined : world.get(parent);
      const restParent: IAutoMovieVector3 | undefined = BONES.find(
        (b) => b[0] === parent,
      )?.[2];
      const offset: IAutoMovieVector3 =
        up === undefined || restParent === undefined
          ? origin
          : rotate(up.worldRotation, {
              x: origin.x - restParent.x,
              y: origin.y - restParent.y,
              z: origin.z - restParent.z,
            });
      world.set(bone, {
        bone,
        localRotation: local,
        worldPosition:
          up === undefined
            ? origin
            : {
                x: up.worldPosition.x + offset.x,
                y: up.worldPosition.y + offset.y,
                z: up.worldPosition.z + offset.z,
              },
        worldRotation:
          up === undefined ? local : multiply(up.worldRotation, local),
      });
    }
    return BONES.map(([bone]): IAutoMovieResolvedBone => world.get(bone)!);
  };
  const tube = (
    upper: AutoMovieHumanoidBone,
    lower: AutoMovieHumanoidBone,
  ): IAutoMovieSweepBinding => ({
    points: [upper, lower],
    stations: [[upper], [upper, lower], [lower]],
  });
  return {
    rest: pose({}),
    pose,
    bindings: {
      sweeps: {
        trunk: {
          points: ["hips", "spine", "spine"],
          stations: [
            ["hips"],
            ["hips", "spine"],
            ["spine"],
            ["spine"],
            ["spine"],
          ],
        },
        sideLeft: tube("leftUpperArm", "leftLowerArm"),
        sideRight: tube("rightUpperArm", "rightLowerArm"),
        forkLeft: tube("leftUpperLeg", "leftLowerLeg"),
        forkRight: tube("rightUpperLeg", "rightLowerLeg"),
        top: { points: ["neck", "neck"], stations: [["neck"], ["neck"]] },
      },
      curves: { fork: "hips" },
      rings: {
        "sideLeft.end": "leftLowerArm",
        "sideRight.end": "rightLowerArm",
      },
    },
  };
}
