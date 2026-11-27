import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointRotationDomain,
  IAutoMoviePlantChain,
  IAutoMoviePrepareChainConstants,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../../kinematics/DEFAULT_JOINT_AXES";
import { normalizeJointAxes } from "../../kinematics/internal/normalizeJointAxes";
import { getConstraint } from "../../rom/internal/getConstraint";
import { prepareChainRigConstants } from "./prepareChainRigConstants";

/*
 * What a parent-child two-bone chain's articulation-free frames depend on in
 * the rig alone, read once for a rig and placed under any pose by
 * `placeChainPlant`.
 *
 * `prepareChainPlant` recovers the same values from forward kinematics of the
 * pose with the chain's two joints left out: with no articulation, the mid bone
 * stands at its rest translation and rotation in the root bone's frame and the
 * end bone at its own in the mid bone's, whatever the pose above the chain.
 * Only the chain root's parent frame comes from the pose.
 *
 * The record also carries the fit's rig-only readers
 * (`prepareChainRigConstants`), built here over the same skeleton, axes and
 * rest frames, so that a chain placed from the record brings them to its fit
 * instead of the fit building them again.
 * Parameter props: The rig, the chain and the clinical axes and rest frames the fit
 * reads.
 * Returns: The constants; null when a bone is missing or the chain is not
 * parent to child twice (a chain with a fixed bone between two of its own
 * keeps `prepareChainPlant`).
 */
export function prepareChainConstants(props: {
  /*
   * The rig, unchanged for the record's life.
   */
  skeleton: IAutoMovieSkeleton;

  /*
   * The chain: its root, mid and end bones.
   */
  chain: IAutoMoviePlantChain;

  /*
   * The merged clinical axes the fit reads the mid joint's hinge by.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /*
   * The rest frames every fit of a chain placed from this record passes; the
   * record's fit readers (`rig`) are built for them.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}): IAutoMoviePrepareChainConstants.IConstants | null {
  const { chain }: typeof props = props;
  let upper: IAutoMovieBone | undefined;
  let lower: IAutoMovieBone | undefined;
  let effector: IAutoMovieBone | undefined;
  for (const bone of props.skeleton.bones)
    if (bone.bone === chain.upper) upper = bone;
    else if (bone.bone === chain.lower) lower = bone;
    else if (bone.bone === chain.effector) effector = bone;
  if (upper === undefined || lower === undefined || effector === undefined)
    return null;
  if (lower.parent !== chain.upper || effector.parent !== chain.lower)
    return null;
  const upperDomain: IAutoMovieJointRotationDomain = {
    bone: chain.upper,
    constraint: getConstraint(chain.upper, upper.constraint ?? null),
  };
  const lowerDomain: IAutoMovieJointRotationDomain = {
    bone: chain.lower,
    constraint: getConstraint(chain.lower, lower.constraint ?? null),
  };
  const effectorBaseRotation: IAutoMovieQuaternion = {
    ...effector.rest.rotation,
  };
  return {
    chain,
    parent: upper.parent,
    upperTranslation: { ...upper.rest.translation },
    upperRotation: { ...upper.rest.rotation },
    lowerOffset: { ...lower.rest.translation },
    lowerRotation: { ...lower.rest.rotation },
    effectorOffset: { ...effector.rest.translation },
    effectorBaseRotation,
    hinge: normalizeJointAxes(
      props.jointAxes?.[chain.lower] ?? DEFAULT_JOINT_AXES,
      "prepareChainConstants axes",
    ).flexion,
    upperDomain,
    lowerDomain,

    // The fit's rig-only readers over the same rest records and tables.
    rig: prepareChainRigConstants(
      {
        skeleton: props.skeleton,
        chain,
        jointAxes: props.jointAxes,
        restFrames: props.restFrames,
      },
      {
        upperDomain,
        lowerDomain,
        effectorBaseRotation,
        lowerOffset: lower.rest.translation,
        lowerRotation: lower.rest.rotation,
        effectorOffset: effector.rest.translation,
      },
    ),
  };
}
