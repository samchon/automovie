import { DEFAULT_HUMANOID_ROM, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { seated } from "../../everyday/internal/seated";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { fixedSeatFootSwing } from "./fixedSeatFootSwing";
import { fixedSeatTrunk } from "./fixedSeatTrunk";

const ZERO: Angles = [0, 0, 0];
const BONES: readonly AutoMovieHumanoidBone[] = [
  "spine",
  "chest",
  "leftShoulder",
  "rightShoulder",
];
/*
 * Move only the trunk coordinates that the closed bilateral fit supplied.
 */
function withTrunk(base: Posture, target: Joints, share: number): Posture {
  const joints: Joints = { ...base.joints };
  for (const bone of BONES) {
    const a: Angles = base.joints[bone] ?? ZERO;
    const b: Angles = target[bone] ?? a;
    joints[bone] = [
      a[0] + share * (b[0] - a[0]),
      a[1] + share * (b[1] - a[1]),
      a[2] + share * (b[2] - a[2]),
    ];
  }
  return { ...base, joints };
}
/*
 * Alternatives to an unsupported pelvic tilt on one working seat. Foot
 * placement is prepared once in the seat's actual frame. At a changing grip the
 * ordinary authoring remains first where the tilt is supported. Otherwise both
 * floor goals and the bearing stay fixed while the torso supplies the missing
 * excursion. The consumer admits each actual candidate independently.
 */
export function fixedSeatWorkingPostures(
  body: IAutoMovieMotionHumanBody,
  poseAt: Source,
  origin: IAutoMovieRigidTransform,
  requested: number,
  wrists: Points,
): OptionalDesign {
  if (!(requested > 0)) return undefined;
  const cap: ReturnType<typeof fixedSeatFootSwing> = fixedSeatFootSwing(
    body,
    poseAt,
    requested,
  );
  if (cap === undefined || cap >= requested) return undefined;
  const supported: Posture = poseAt(cap);
  const designs: readonly Joints[] = fixedSeatTrunk(body, supported, wrists);
  if (!designs.length) return undefined;
  const neutral: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
    Quaternion.inverse(origin.rotation),
    humanPostureHeading(poseAt(0)),
  );
  const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    HumanBoneGroups.SHOULDERS,
  );
  return function* alternatives(
    raw: Posture,
    frame: IAutoMovieRigidTransform,
  ): Alternatives {
    const level: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
      frame.rotation,
      neutral,
    );
    const turn: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
      Quaternion.inverse(level),
      humanPostureHeading(raw),
    );
    const sign: number = turn.w < 0 ? -1 : 1;
    const degrees: number =
      (2 * Math.atan2(sign * turn.x, sign * turn.w)) / Quaternion.DEG2RAD;
    if (degrees <= cap) return;
    const angles: ReturnType<typeof humanPostureHeading.angles> =
      humanPostureHeading.angles(
        Quaternion.multiply(
          level,
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, cap),
        ),
      );
    const base: Posture = {
      ...raw,
      ...angles,
      root: seated.root(body, seated.socket(body, raw), angles),
    };
    const share: number = Math.min(1, (degrees - cap) / (requested - cap));
    for (const design of designs) yield withTrunk(base, design, share);

    const before: ReturnType<typeof read> = read(
      resolveHumanPosture(body, { ...raw, limbs: {} }),
    );
    const old: Points = {
      left: before.get("leftUpperArm")!.worldPosition,
      right: before.get("rightUpperArm")!.worldPosition,
    };
    for (const aligned of fixedSeatTrunk(body, base, old))
      yield withTrunk(base, aligned, 1);
    const left: Posture["limbs"]["leftArm"] = raw.limbs.leftArm;
    const right: Posture["limbs"]["rightArm"] = raw.limbs.rightArm;
    if (!left || !right) return;
    for (const branch of fixedSeatTrunk(body, base, {
      left: left.point,
      right: right.point,
    })) {
      const candidate: Posture = withTrunk(base, branch, 1);
      const feedback: Feedback = yield candidate;
      if (!feedback.neck) continue;
      const limit: OptionalLimit =
        body.bones.get("neck")?.constraint ?? DEFAULT_HUMANOID_ROM.neck;
      if (!limit?.flexion) continue;
      const entry: Angles = candidate.joints.neck ?? ZERO;
      yield {
        ...candidate,
        joints: {
          ...candidate.joints,
          neck: [limit.flexion.min, entry[1], entry[2]],
        },
      };
    }
  };
}
/*
 * A rejected candidate's actual obstruction, supplied by the native pair model.
 */
export namespace fixedSeatWorkingPostures {
  export interface IFeedback {
    /*
     * The failed static evaluation identified a neck or head surface inside an
     * arm.
     */
    neck: boolean;
  }
}
type Posture = IAutoMovieMotionHumanPosture;
type Joints = Posture["joints"];
type Points = Parameters<typeof fixedSeatTrunk>[2];
type Angles = readonly [number, number, number];
type Source = (degrees: number) => Posture;

type Feedback = fixedSeatWorkingPostures.IFeedback;
type Alternatives = Generator<Posture, void, Feedback>;

type Design = (
  posture: Posture,
  frame: IAutoMovieRigidTransform,
) => Alternatives;

type OptionalDesign = Design | undefined;

type OptionalLimit = IAutoMovieJointConstraint | undefined;
