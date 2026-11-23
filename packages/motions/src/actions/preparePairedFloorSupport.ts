import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmMirror } from "../posture/HumanArmMirror";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanBodyFitMerit } from "../posture/HumanBodyFitMerit";
import { HumanFitVariables } from "../posture/HumanFitVariables";
import { HumanFrame } from "../posture/HumanFrame";

type Target = IAutoMovieMotionHumanBodyFitTypes.ITarget;
type Contact = IAutoMovieMotionHumanSupport.IContact;
type Variable = IAutoMovieMotionHumanJacobian.IVariable;
type Candidate = IAutoMovieMotionHumanPosture | undefined;
type Angles = NonNullable<IAutoMovieMotionHumanPosture["joints"]["hips"]>;

/**
 * Solve one side of a bilaterally specified hands-on-surface, feet-on-floor
 * stance and reflect the clinical joint configuration across its sagittal
 * plane. Both actual sides must pass the original full-body evaluation.
 */
export function preparePairedFloorSupport(
  body: IAutoMovieMotionHumanBody,
  preferred: IAutoMovieMotionHumanPosture,
  from: IAutoMovieMotionHumanPosture,
  contacts: readonly Contact[],
  targets: readonly Target[],
  bearing: readonly RegExp[],
  merit: HumanBodyFitMerit.IMerit,
): Candidate {
  const feet: Contact[] = contacts.filter((c: Contact): boolean =>
    c.part.endsWith("Foot"),
  );
  const hands: Contact[] = contacts.filter((c: Contact): boolean =>
    c.part.endsWith("Hand"),
  );
  if (
    feet.length !== 2 ||
    hands.length !== 2 ||
    contacts.length !== feet.length + hands.length ||
    feet[0]!.part === feet[1]!.part ||
    hands[0]!.part === hands[1]!.part ||
    feet.some((c: Contact): boolean => c.target !== undefined) ||
    hands.some((c: Contact): boolean => c.target !== "on") ||
    hands[0]!.kind !== hands[1]!.kind ||
    feet[0]!.kind !== feet[1]!.kind
  )
    return undefined;
  const forward: IAutoMovieVector3 = HumanFrame.forward(preferred.yaw);
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const mid: IAutoMovieVector3 = Vector3.lerp(
    targets[contacts.indexOf(hands[0]!)]!.goal,
    targets[contacts.indexOf(hands[1]!)]!.goal,
    0.5,
  );
  const left: Target[] = targets.filter((t: Target): boolean =>
    t.bone.startsWith("left"),
  );
  const right: Target[] = targets.filter((t: Target): boolean =>
    t.bone.startsWith("right"),
  );
  if (
    left.length !== right.length ||
    left.length + right.length !== targets.length
  )
    return undefined;
  for (const l of left) {
    const r: Target | undefined = right.find(
      (t: Target): boolean =>
        t.bone === HumanArmMirror.opposite(l.bone) &&
        t.axes?.join() === l.axes?.join(),
    );
    if (
      r === undefined ||
      l.on !== undefined ||
      r.on !== undefined ||
      l.bound !== undefined ||
      r.bound !== undefined ||
      l.normal?.world.y !== r.normal?.world.y ||
      (l.normal !== undefined &&
        (l.normal.world.x !== 0 || l.normal.world.z !== 0)) ||
      (r.normal !== undefined &&
        (r.normal.world.x !== 0 || r.normal.world.z !== 0))
    )
      return undefined;
    const offset: IAutoMovieVector3 = Vector3.subtract(l.goal, mid);
    const mirrored: IAutoMovieVector3 = Vector3.addScaled(
      l.goal,
      across,
      -2 * Vector3.dot(offset, across),
    );
    if (Vector3.distance(mirrored, r.goal) > HumanBodyFitMerit.TOLERANCE)
      return undefined;
  }
  const variables: Variable[] = HumanFitVariables.BODY.filter(
    (v: Variable): boolean => {
      if (v.kind === "heading") return v.axis === "pitch";
      if (v.kind === "place") return v.axis === "y" || forward[v.axis] !== 0;
      return (
        v.bone.startsWith("left") ||
        (!v.bone.startsWith("right") && v.axis === 0)
      );
    },
  );
  const half: IAutoMovieMotionHumanPosture = HumanBodyFit.fit({
    body,
    posture: preferred,
    start: from,
    variables,
    targets: left,
    bearing: bearing.filter(
      (r: RegExp): boolean => r.test("leftFoot") || r.test("leftToes"),
    ),
  }).posture;
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of Object.keys(half.joints) as AutoMovieHumanoidBone[]) {
    const angles: Angles = half.joints[bone]!;
    if (bone.startsWith("left")) {
      joints[bone] = angles;
      joints[HumanArmMirror.opposite(bone)] = angles;
    } else if (!bone.startsWith("right")) joints[bone] = [angles[0], 0, 0];
  }
  const root: IAutoMovieVector3 = Vector3.addScaled(
    half.root,
    across,
    Vector3.dot(Vector3.subtract(mid, half.root), across),
  );
  const pose: IAutoMovieMotionHumanPosture = {
    ...half,
    root,
    roll: 0,
    joints,
    limbs: {},
  };
  return merit.holds(
    merit.evaluate(HumanFitVariables.vector(HumanFitVariables.BODY, pose))
      .misses,
  )
    ? pose
    : undefined;
}
