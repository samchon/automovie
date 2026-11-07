import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanPhysicalFootShape } from "./AutoMovieHumanPhysicalFootShape";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPhysicalSource as Source } from "./IAutoMovieHumanPhysicalSource";

/**
 * Read one prepared person's physical source from its actual numerical FK.
 * Kept bones are the anatomical segments; finger, toe and facial carriers are
 * skipped and their parents resolve to the nearest kept ancestor. A capsule
 * ends at the kept child's joint, the bone's own leaf tip, or the hand's middle
 * or foot's hallux knuckle; the foot parts take the construction foot box.
 * Each coordinate's axis is probed by one FK evaluation at 0.1 degree inside
 * its clinical range, unclamped so a knee's constrained twist still reports its
 * axis. The probes cost one evaluation per coordinate, once per fixed person.
 */
export function AutoMovieHumanPhysicalSource(
  parameters: IAutoMovieHumanParameters,
  evaluate: Skeleton.PoseEvaluator,
): Source {
  const output: Skeleton.IOutput = evaluate({});
  const point: (value: readonly number[]) => IAutoMovieVector3 = (
    value: readonly number[],
  ): IAutoMovieVector3 => ({ x: value[0]!, y: value[1]!, z: value[2]! });
  const kept: Skeleton.IBone[] = output.bones.filter(
    (bone: Skeleton.IBone): boolean =>
      /^(hips|spine|chest|neck|atlas|head)$|^(left|right)(Shoulder|Scapula|UpperArm|LowerArm|Hand|UpperLeg|LowerLeg|Foot|Subtalar|Midfoot)$/u.test(
        bone.bone,
      ),
  );
  const neutral: Map<string, P.ITransform> = new Map(
    output.posed.map(
      (placement: Skeleton.IPlacement): [string, P.ITransform] => [
        placement.bone,
        { position: point(placement.position), rotation: rotation(placement) },
      ],
    ),
  );
  const position: (bone: string) => IAutoMovieVector3 = (
    bone: string,
  ): IAutoMovieVector3 => neutral.get(bone)!.position;
  const isKept: (bone: string) => boolean = (bone: string): boolean =>
    kept.some((candidate: Skeleton.IBone): boolean => candidate.bone === bone);
  const parentOf: (bone: string) => string | null = (
    bone: string,
  ): string | null =>
    output.bones.find(
      (candidate: Skeleton.IBone): boolean => candidate.bone === bone,
    )!.parent;
  return {
    sex: parameters.body.anatomy.sex === "female" ? "female" : "male",
    segments: kept.map((bone: Skeleton.IBone): Source.ISegment => {
      // The physical parent skips skeletal carriers without a segment.
      let parent: string | null = bone.parent;
      while (parent !== null && !isKept(parent)) parent = parentOf(parent);
      const own: P.ITransform = neutral.get(bone.bone)!;
      const solid: Source.ICapsule | Source.IBox = /(Subtalar|Midfoot)$/u.test(
        bone.bone,
      )
        ? AutoMovieHumanPhysicalFootShape(parameters, bone.bone, neutral)
        : { kind: "capsule", end: end(bone) };
      return {
        bone: bone.bone,
        parent,
        neutral: own,
        radius: bone.radius,
        solid,
        coordinates: parent === null ? [] : coordinates(bone.bone, parent, own),
      };
    }),
  };

  /** The effective end of a capsule segment at neutral. */
  function end(bone: Skeleton.IBone): IAutoMovieVector3 {
    const child: Skeleton.IBone | undefined = kept.find(
      (candidate: Skeleton.IBone): boolean => candidate.parent === bone.bone,
    );
    if (child) return position(child.bone);
    if (bone.tip)
      return Vector3.add(
        position(bone.bone),
        Quaternion.rotateVector(
          neutral.get(bone.bone)!.rotation,
          Vector3.subtract(point(bone.tip), point(bone.position)),
        ),
      );
    if (bone.bone.endsWith("Hand"))
      return position(`${bone.bone.slice(0, -4)}MiddleProximal`);
    if (bone.bone.endsWith("Foot"))
      return position(`${bone.bone.slice(0, -4)}HalluxProximal`);
    return Vector3.add(position(bone.bone), { x: 0, y: bone.radius * 2, z: 0 });
  }

  /** Probe each authored rotational channel of a joint by one FK evaluation. */
  function coordinates(
    bone: string,
    parent: string,
    own: P.ITransform,
  ): Source.ICoordinate[] {
    const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
    const base: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(neutral.get(parent)!.rotation),
      own.rotation,
    );
    return AutoMovieHumanPoseChannels.filter(
      (row: (typeof AutoMovieHumanPoseChannels)[number]): boolean =>
        row[1].replace("<side>", side) === bone &&
        row[2] !== "forward" &&
        row[2] !== "lateral",
    ).map(
      (
        row: (typeof AutoMovieHumanPoseChannels)[number],
      ): Source.ICoordinate => {
        const path: Controls.DegreeChannel = Controls.channel(
          row[0].replace("<side>", side),
        );
        const bounds: ReturnType<typeof Controls.bounds> =
          Controls.bounds(path);
        const degrees: number =
          bounds.maximum > 0
            ? Math.min(0.1, bounds.maximum)
            : Math.max(-0.1, bounds.minimum);
        const pose: IAutoMovieHumanPose = {};
        const parts: string[] = path.split(".");
        let node: object = pose;
        for (const part of parts.slice(0, -1)) {
          const child: object = {};
          Reflect.set(node, part, child);
          node = child;
        }
        Reflect.set(node, parts.at(-1)!, degrees);

        // The probe reads coordinate axes, including a knee's temporarily
        // constrained twist at neutral; it never supplies a simulated pose.
        const moved: Skeleton.IOutput = evaluate(pose, false);
        const at: (name: string) => IAutoMovieQuaternion = (
          name: string,
        ): IAutoMovieQuaternion =>
          rotation(
            moved.posed.find(
              (placement: Skeleton.IPlacement): boolean =>
                placement.bone === name,
            )!,
          );
        const delta: IAutoMovieQuaternion = Quaternion.multiply(
          Quaternion.inverse(base),
          Quaternion.multiply(Quaternion.inverse(at(parent)), at(bone)),
        );
        return {
          channel: path,
          direction: {
            x: delta.x / degrees,
            y: delta.y / degrees,
            z: delta.z / degrees,
          },
          minimum: bounds.minimum,
          maximum: bounds.maximum,
        };
      },
    );
  }
}

/** A placement's world rotation as an engine quaternion. */
function rotation(placement: Skeleton.IPlacement): IAutoMovieQuaternion {
  return {
    x: placement.rotation[0],
    y: placement.rotation[1],
    z: placement.rotation[2],
    w: placement.rotation[3],
  };
}
