import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieQuaternion } from "@automovie/interface";
import { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { getConstraint } from "../rom/getConstraint";
import { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { IPreparedChainPlant } from "./IPreparedChainPlant";
import { resolveBoneMap } from "./resolveBoneMap";


/**
 * Prepare articulation-free frames and effective domains for one reachable descendant two-bone chain in the current pose's resolved model-metre frame. Missing bones or invalid ancestry return null; supplied topology and clinical mappings must match the unchanged skeleton.
 *
 * @evidence contracts/common.md#principled-implementation Removes only upper/lower articulation before FK, preserving current parent pose; strict descendant checks allow fixed intermediate bones, and relative rotations/local offsets recover the same chain for candidate FK under actual effective ROM.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns pose-invariant geometry used by both solvePreparedChainPlant and resolvePreparedChainEffector, while target/bend choice belongs to each candidate input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolved or branched pseudo-chains return null rather than treating same-named bones as adjacent; domains come from getConstraint on the actual rig, and no alternate geometric proxy replaces its offsets.
 * @evidence contracts/common.md#meaningful-documentation States articulation removal, model frame, topology/mapping premises, descendant-chain admission and null meaning.
 * @evidence contracts/performance.md#efficient-algorithms One FK and two skeleton-domain scans plus bounded descendant tree walks are linear in rig/joint population; returned preparation has a fixed number of vectors/frames/domains.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared record is reused for every candidate of the same parent pose/chain; a changed pose or semantic mapping requires new preparation rather than a name-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned fields borrow chain and resolved records and own derived offsets; temporary zeroed joints/FK map are released after return/null, with no resource handles.
 */
export const prepareChainPlant: (props: Pick < IFitChainToTargetProps , "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames" >) => IPreparedChainPlant | null = (
  props: Pick<
    IFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >,
): IPreparedChainPlant | null => {
  const { chain }: typeof props = props;
  // The limb at rest under the current parent pose: zero its own articulation
  // so the recovered world rotations carry the torso pose but not the limb's.
  const zeroed: IAutoMoviePose = {
    skeleton: props.pose.skeleton,
    root: props.pose.root,
    joints: props.pose.joints.filter(
      (j: IAutoMovieJointPose): boolean => j.bone !== chain.upper && j.bone !== chain.lower,
    ),
  };
  const map: ReturnType<typeof resolveBoneMap> = resolveBoneMap(
    props.skeleton,
    zeroed,
    props.topology,
    props.jointAxes,
    props.restFrames,
  );
  const upper: IAutoMovieResolvedBone | undefined = map.get(chain.upper);
  const lower: IAutoMovieResolvedBone | undefined = map.get(chain.lower);
  const effector: IAutoMovieResolvedBone | undefined = map.get(chain.effector);
  if (upper === undefined || lower === undefined || effector === undefined)
    return null;
  if (
    isDescendant(props.topology, chain.upper, chain.lower) === false ||
    isDescendant(props.topology, chain.lower, chain.effector) === false
  )
    return null;

  const upperInverse: IAutoMovieQuaternion = Quaternion.inverse(upper.worldRotation);
  const lowerInverse: IAutoMovieQuaternion = Quaternion.inverse(lower.worldRotation);
  return {
    chain,
    upper,
    lower,
    upperDomain: {
      bone: chain.upper,
      constraint: getConstraint(
        chain.upper,
        props.skeleton.bones.find((bone: IAutoMovieBone): boolean => bone.bone === chain.upper)
          ?.constraint ?? null,
      ),
    },
    lowerDomain: {
      bone: chain.lower,
      constraint: getConstraint(
        chain.lower,
        props.skeleton.bones.find((bone: IAutoMovieBone): boolean => bone.bone === chain.lower)
          ?.constraint ?? null,
      ),
    },
    end: effector.worldPosition,
    hinge: Quaternion.rotateVector(
      lower.worldRotation,
      normalizeJointAxes(
        props.jointAxes?.[chain.lower] ?? DEFAULT_JOINT_AXES,
        "prepareChainPlant axes",
      ).flexion,
    ),
    lowerOffset: Quaternion.rotateVector(
      upperInverse,
      Vector3.subtract(lower.worldPosition, upper.worldPosition),
    ),
    lowerRotation: Quaternion.multiply(upperInverse, lower.worldRotation),
    effectorOffset: Quaternion.rotateVector(
      lowerInverse,
      Vector3.subtract(effector.worldPosition, lower.worldPosition),
    ),
  };
};


/** Whether a reachable bone sits strictly below another in the rig tree. */
const isDescendant: (topology: IAutoMovieSkeletonTopology, ancestor: AutoMovieHumanoidBone, descendant: AutoMovieHumanoidBone) => boolean = (
  topology: IAutoMovieSkeletonTopology,
  ancestor: AutoMovieHumanoidBone,
  descendant: AutoMovieHumanoidBone,
): boolean =>
  (topology.childrenByParent.get(ancestor) ?? []).some(
    (child: IAutoMovieBone): boolean =>
      child.bone === descendant ||
      isDescendant(topology, child.bone, descendant),
  );

