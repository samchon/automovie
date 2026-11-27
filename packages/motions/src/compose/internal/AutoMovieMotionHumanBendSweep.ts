import { DEFAULT_JOINT_AXES, HUMANOID_REST_FRAME, Quaternion, Vector3, swingTwistRange, AutoMovieEngineKinematics, AutoMovieEngineKinematicsJointRotation } from "@automovie/engine";
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

import { HumanArmOvershoot } from "../../posture/internal/HumanArmOvershoot";
import { AutoMovieMotionHumanBendBound } from "./AutoMovieMotionHumanBendBound";
import type { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";

/**
 * The best elbow place of a prepared arm chain for a wrist's place under a
 * ranking: the engine's swivel sweep over the elbow's circle, each place read
 * for its joints' overshoot, the forearm's clearance of the body and its strain
 * (`AutoMovieMotionHumanBendSearch`).
 *
 * @param chain The prepared chain.
 * @param body The body, for the hand's range and the colliders.
 * @param side The arm.
 * @param point The wrist, world metres.
 * @param rotation The hand's world rotation, when its turn counts as strain.
 * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's
 *   strain at 0.
 * @param score The ranking of a candidate.
 * @param near The seed of a nearby solve to refine instead of sweeping
 *   (`IAutoMovieSwivelNear`).
 * @param byStrain Whether `score` is `AutoMovieMotionHumanBendSearch.strained`,
 *   whose deviation is the strain: a cold sweep is then decided
 *   by branch and bound on the strain's certified swivel-interval bound
 *   (`AutoMovieMotionHumanBendBound`).
 * @returns The chosen candidate with its true overshoot and its seed, or null
 *   for a degenerate chain.
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
  byStrain: boolean = false,
): IAutoMovieMotionHumanBendSweepResult | null {
  const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] =
    chain.prepared;
  const upperBone: AutoMovieHumanoidBone = prepared.chain.upper;
  const lowerBone: AutoMovieHumanoidBone = prepared.chain.lower;
  const lowerAxes: IAutoMovieJointAxes | undefined = chain.axes[lowerBone];
  if (lowerAxes === undefined) return null;
  const upperRange: IAutoMovieJointConstraint | null =
    prepared.upperDomain.constraint;
  const upperBasis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    chain.axes[upperBone] ?? DEFAULT_JOINT_AXES,
    "AutoMovieMotionHumanBendSearch axes",
  );
  const strained: (
    u: IAutoMovieResolvedJointAngles,
    lowerWorld: () => IAutoMovieQuaternion,
  ) => number = AutoMovieMotionHumanBendStrain(
    chain,
    body,
    side,
    rotation,
    neutral,
    lowerAxes,
  );

  const least: ((u: IAutoMovieResolvedJointAngles) => number) | null =
    AutoMovieMotionHumanBendStrain.least(chain, rotation, neutral);

  // The two joints' bases and ranges are the rig's, fixed over the search:
  // admitted and resolved once, as the engine's own candidate scoring
  // reads them, instead of once a candidate.
  const lowerBasis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    lowerAxes,
    "AutoMovieMotionHumanBendSearch axes",
  );
  const upperOvershoot: (joint: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot(upperBone, upperRange);
  const lowerOvershoot: (joint: IAutoMovieJointPose) => number =
    AutoMovieEngineKinematics.prepareJointRomOvershoot(lowerBone, prepared.lowerDomain.constraint);

  const clear: ReturnType<typeof HumanArmOvershoot.prepare> =
    HumanArmOvershoot.prepare(body, chain.shapes, side);

  // A branch's candidates share one lower rotation, the same record, and
  // differ only in the swivel of the upper arm, so the lower joint's
  // overshoot is read once per record: the same value, read once.
  let mid: IAutoMovieMotionHumanBendSweepMid | undefined;
  const midOf: (lower: IAutoMovieQuaternion) => number = (
    lower: IAutoMovieQuaternion,
  ): number => {
    if (mid !== undefined && mid.rotation === lower) return mid.overshoot;
    const l: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(
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
    const u: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(
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
    // With a hand rotation the strain's costly share is the hand's, read only
    // when a comparison asks for it; the shoulder's share bounds it from
    // below meanwhile (`AutoMovieMotionHumanBendStrain.least`).
    let strain: number | undefined;
    const exact: () => number = (): number =>
      (strain ??= strained(
        u,
        (): IAutoMovieQuaternion =>
          Quaternion.multiply(
            Quaternion.multiply(turned, prepared.lowerRotation),
            lower,
          ),
      ));
    const overshoot: number =
      upperOvershoot({ bone: upperBone, ...u }) +
      midOf(lower) +
      clear(elbow, point);
    return least === null
      ? { elbow, angles: u, overshoot, strain: exact() }
      : {
          elbow,
          angles: u,
          overshoot,
          get strain(): number {
            return exact();
          },
          least: least(u),
        };
  };
  // The strain's certified bound over a bracket of swivels, for a cold sweep
  // ranked by the strain itself.
  const wrist: AutoMovieMotionHumanBendStrain.IHand =
    AutoMovieMotionHumanBendStrain.handOf(chain, body, side);
  const bound:
    | ReturnType<typeof AutoMovieMotionHumanBendBound.prepare>
    | undefined =
    byStrain && near === undefined && neutral !== null
      ? AutoMovieMotionHumanBendBound.prepare({
          basis: upperBasis,
          frame: HUMANOID_REST_FRAME[upperBone],
          range: upperRange,
          neutral,
          hand:
            rotation === undefined
              ? undefined
              : {
                  parent: prepared.upper.worldRotation,
                  rest: prepared.lowerRotation,
                  rotation,
                  axis: lowerAxes.twist,
                  range: prepared.lowerDomain.constraint?.twist,
                  handAxes: wrist.axes,
                  handFrame: HUMANOID_REST_FRAME[`${side}Hand`],
                  handRange: wrist.range,
                },
        })
      : undefined;
  const solve = () =>
    AutoMovieEngineKinematics.hingedArmArticulation({
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
        AutoMovieEngineKinematics.boxExcludedSwivels({
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
        return score(read(upper, lower));
      },

      // A solve continued from a nearby one refines that one's swivel on
      // its branch, with no sweep (`IAutoMovieSwivelNear`).
      ...(near === undefined ? {} : { near }),
      ...(bound === undefined ? {} : { bound }),
    });
  const complete = () => {
    const solved: ReturnType<typeof AutoMovieEngineKinematics.hingedArmArticulation> = solve();
    return solved === null
      ? null
      : {
          candidate: read(solved.upper, solved.lower),
          seed: { swivel: solved.swivel, branch: solved.branch },
        };
  };
  return complete();
}

/** The record of `IAutoMovieMotionHumanBendSweepMid`'s site. */
type IAutoMovieMotionHumanBendSweepMid = {
  rotation: IAutoMovieQuaternion;
  overshoot: number;
};

/** The record of `IAutoMovieMotionHumanBendSweepResult`'s site. */
type IAutoMovieMotionHumanBendSweepResult = {
  candidate: ICandidate;
  seed: IAutoMovieSwivelSeed;
};

/** A place on the swivel circle, the search's. */
type ICandidate = AutoMovieMotionHumanBendSearch.ICandidate;

/** The sweep's ordering key, the search's. */
type IScore = AutoMovieMotionHumanBendSearch.IScore;
