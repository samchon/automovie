import {
  DEFAULT_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  boxExcludedSwivels,
  decomposeJointRotationOnBasis,
  hingedArmArticulation,
  jointRomOvershoot,
  normalizeJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmOvershoot } from "../posture/HumanArmOvershoot";
import type { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";

/**
 * The best elbow place of a prepared arm chain for a wrist's place under a
 * ranking: the engine's swivel sweep over the elbow's circle, each place
 * read for its joints' overshoot, the forearm's clearance of the body and
 * its strain (`AutoMovieMotionHumanBendSearch`).
 *
 * @param chain The prepared chain.
 * @param body The body, for the hand's range and the colliders.
 * @param side The arm.
 * @param point The wrist, world metres.
 * @param rotation The hand's world rotation, when its turn counts as strain.
 * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's strain at 0.
 * @param score The ranking of a candidate.
 * @param near The seed of a nearby solve to refine instead of sweeping (`IAutoMovieSwivelNear`).
 * @returns The chosen candidate with its true overshoot and its seed, or null for a degenerate chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is swept, what each place is read for, the inputs, the two modes and the null case.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's analytic hinged-arm swivel sweep (`hingedArmArticulation`), the upper arm's range sparing swivels it refuses (`boxExcludedSwivels`), each candidate read for the rig's range overshoot, the forearm's clearance and the strain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixed bases and ranges, one candidate reader, one engine sweep.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the lower arm's axes is null, never a guessed place; the returned candidate is read again at the solved rotations, so its overshoot is the true one.
 * @evidence contracts/development/implementation.md#efficient-algorithms The bases and ranges are admitted once a sweep, the lower joint's overshoot once a branch's shared lower rotation, and the clearance prepared once a sweep over the chain's placed shapes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `AutoMovieMotionHumanBendStrain` and `HumanArmOvershoot` with every search of the arm.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Readers and candidate closures end with the call; only the chosen candidate and its seed escape.
 */
export function AutoMovieMotionHumanBendSweep(
  chain: AutoMovieMotionHumanBendChain.IChain,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion | undefined,
  neutral: IAutoMovieResolvedJointAngles | null,
  score: (candidate: ICandidate) => IScore,
  near?: IAutoMovieSwivelNear,
  repeat?: readonly [AutoMovieMotionHumanBendRepeat.IRead, 0 | 1],
): { candidate: ICandidate; seed: IAutoMovieSwivelSeed } | null {
  const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] =
    chain.prepared;
  const upperBone: AutoMovieHumanoidBone = prepared.chain.upper;
  const lowerBone: AutoMovieHumanoidBone = prepared.chain.lower;
  const lowerAxes: IAutoMovieJointAxes | undefined = chain.axes[lowerBone];
  if (lowerAxes === undefined) return null;
  const upperRange: IAutoMovieJointConstraint | null =
    prepared.upperDomain.constraint;
  const upperBasis: IAutoMovieJointAxes = normalizeJointAxes(
    chain.axes[upperBone] ?? DEFAULT_JOINT_AXES,
    "AutoMovieMotionHumanBendSearch axes",
  );
  let hand: IAutoMovieJointConstraint | null = null;
  let handAxes: IAutoMovieJointAxes | undefined;
  const strained: (
    u: IAutoMovieResolvedJointAngles,
    lowerWorld: () => IAutoMovieQuaternion,
  ) => number = AutoMovieMotionHumanBendStrain.of(
    chain,
    body,
    side,
    rotation,
    neutral,
    lowerAxes,
    repeat === undefined
      ? undefined
      : (
          range: IAutoMovieJointConstraint | null,
          axes: IAutoMovieJointAxes | undefined,
        ): void => {
          hand = range;
          handAxes = axes;
        },
  );

  // The two joints' bases and ranges are the rig's, fixed over the search:
  // admitted and resolved once, as the engine's own candidate scoring
  // reads them, instead of once a candidate.
  const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes(
    lowerAxes,
    "AutoMovieMotionHumanBendSearch axes",
  );
  const upperOvershoot: (joint: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare(upperBone, upperRange);
  const lowerOvershoot: (joint: IAutoMovieJointPose) => number =
    jointRomOvershoot.prepare(lowerBone, prepared.lowerDomain.constraint);

  const trial =
    repeat !== undefined &&
    near === undefined &&
    rotation !== undefined &&
    neutral !== null &&
    handAxes !== undefined
      ? repeat[0].start(repeat[1], {
          chain,
          body,
          side,
          point,
          rotation,
          neutral,
          clinical: {
            upperBone,
            lowerBone,
            handBone: `${side}Hand`,
            upperBasis,
            lowerBasis,
            lowerAxes,
            handAxes,
            upperRange,
            lowerRange: prepared.lowerDomain.constraint,
            handRange: hand,
          },
        })
      : undefined;
  const clear: ReturnType<typeof HumanArmOvershoot.prepare> =
    trial === undefined
      ? HumanArmOvershoot.prepare(body, chain.shapes, side)
      : HumanArmOvershoot.prepare(
          body,
          chain.shapes,
          side,
          [],
          true,
          undefined,
          undefined,
          [],
          trial.room,
        );

  // A branch's candidates share one lower rotation, the same record, and
  // differ only in the swivel of the upper arm, so the lower joint's
  // overshoot is read once per record: the same value, read once.
  let mid: { rotation: IAutoMovieQuaternion; overshoot: number } | undefined;
  const midOf: (lower: IAutoMovieQuaternion) => number = (
    lower: IAutoMovieQuaternion,
  ): number => {
    if (mid !== undefined && mid.rotation === lower) return mid.overshoot;
    const l: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      lower,
      lowerBasis,
      HUMANOID_REST_FRAME[lowerBone],
      prepared.lowerDomain,
    );
    mid = {
      rotation: lower,
      overshoot: lowerOvershoot({ bone: lowerBone, ...l }),
    };
    return mid.overshoot;
  };
  const read: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => ICandidate = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): ICandidate => {
    const u: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      upper,
      upperBasis,
      HUMANOID_REST_FRAME[upperBone],
      prepared.upperDomain,
    );
    const turned: IAutoMovieQuaternion = Quaternion.multiply(
      prepared.upper.worldRotation,
      upper,
    );
    const elbow: IAutoMovieVector3 = Vector3.add(
      chain.shoulder,
      Quaternion.rotateVector(turned, prepared.lowerOffset),
    );
    const strain: number = strained(
      u,
      (): IAutoMovieQuaternion =>
        Quaternion.multiply(
          Quaternion.multiply(turned, prepared.lowerRotation),
          lower,
        ),
    );
    return {
      elbow,
      angles: u,
      overshoot:
        upperOvershoot({ bone: upperBone, ...u }) +
        midOf(lower) +
        clear(elbow, point),
      strain,
    };
  };
  const solve = () =>
    hingedArmArticulation({
      upper: prepared.upper,
      midOffset: prepared.lowerOffset,
      midRest: prepared.lowerRotation,
      endOffset: prepared.effectorOffset,
      hinge: lowerAxes.flexion,
      target: point,
      // The upper arm's range refuses swivels its overshoot can only score
      // above zero, which every ranking scores above zero in turn, so the
      // sweep spares them (`boxExcludedSwivels`), read in the frame the
      // overshoot reads it in.
      excluded: (
        upper: (swivel: number) => IAutoMovieQuaternion,
      ): ((low: number, high: number) => boolean) =>
        boxExcludedSwivels({
          basis: upperBasis,
          frame: HUMANOID_REST_FRAME[upperBone],
          constraint: upperRange,
          joint: swingTwistRange.of(upperBone),
          rotation: upper,
        }),
      score: (
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
      ): IScore => {
        const ranked: IScore = score(read(upper, lower));
        trial?.score(ranked);
        return ranked;
      },

      // A solve continued from a nearby one refines that one's swivel on
      // its branch, with no sweep (`IAutoMovieSwivelNear`).
      ...(near === undefined ? {} : { near }),
    });
  const complete = () => {
    const solved: ReturnType<typeof hingedArmArticulation> = solve();
    return solved === null
      ? null
      : {
          candidate: read(solved.upper, solved.lower),
          seed: { swivel: solved.swivel, branch: solved.branch },
        };
  };
  return trial === undefined ? complete() : trial.complete(complete);
}

/** A place on the swivel circle, the search's. */
type ICandidate = AutoMovieMotionHumanBendSearch.ICandidate;

/** The sweep's ordering key, the search's. */
type IScore = AutoMovieMotionHumanBendSearch.IScore;
