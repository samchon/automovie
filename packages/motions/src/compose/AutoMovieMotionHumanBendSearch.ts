import {
  DEFAULT_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  boxExcludedSwivels,
  decomposeJointRotation,
  hingedArmArticulation,
  jointRomOvershoot,
  normalizeJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmOvershoot } from "../posture/HumanArmOvershoot";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import { AutoMovieMotionHumanBendSide } from "./AutoMovieMotionHumanBendSide";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";

/**
 * The elbow search of `AutoMovieMotionHumanBend`: the swivel sweep of a hand
 * goal's elbow over its circle, each place read for its joints' overshoot,
 * the forearm's clearance of the body and its strain, and the best place
 * under a ranking the caller gives. The rule of an allowed place and the
 * strain's terms are stated on `AutoMovieMotionHumanBend.solve`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is searched, what a place is read for, who ranks it and where the rules are stated.
 * @evidence contracts/development/design.md#principled-representation One search shared by the solver, its level variant and its strain reading, which differ only in the ranking they pass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The candidate and score records, the side ranking, the search and its strain for a fit that takes its hint from its own sweep.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ranges, axes and clearance are the rig's and the engine's; the hanging arm is read from the body.
 */
export namespace AutoMovieMotionHumanBendSearch {
  /** The hanging arm's shoulder angles by body and side, clinical degrees. */
  const NEUTRAL: WeakMap<
    IHumanBody,
    Partial<Record<AutoMovieMotionHumanBend.Side, IAngles>>
  > = new WeakMap();

  /**
   * Three clinical angles of a joint, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the members are the clinical flexion, abduction and twist in degrees.
   * @evidence contracts/development/design.md#principled-representation A ball joint's three clinical angles in degrees, the form the rig's range-of-motion tables and the hanging arm's reading use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `ICandidate` and by the hanging-arm cache; no member is added for another joint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three members are required and named by axis, not a positional tuple.
   */
  export interface IAngles {
    /** Flexion. */
    flexion: number;

    /** Abduction. */
    abduction: number;

    /** Twist. */
    twist: number;
  }

  /**
   * One elbow place of a hand goal as the search reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit: the elbow in world metres, the shoulder's angles in degrees, the overshoot in degrees (0 when the place is allowed) and the strain unitless.
   * @evidence contracts/development/design.md#principled-representation A place on the swivel circle with the two readings the choice is made by: how far it is from being allowed (joints out of range plus the forearm inside its clearance, in degrees) and how strained the arm is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the rankings that `solve`, `level` and `strain` pass; the elbow is what the solver returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Allowed is the overshoot being 0, not a separate flag that could disagree with it.
   */
  export interface ICandidate {
    /** The elbow's place, world metres. */
    elbow: IAutoMovieVector3;

    /** The shoulder's clinical angles, degrees. */
    angles: IAngles;

    /** Degrees out of range plus the forearm's depth inside its clearance of the body as degrees of upper arm turn; 0 when allowed. */
    overshoot: number;

    /** The strain, unitless. */
    strain: number;
  }

  /**
   * What the engine's swivel sweep orders candidates by: `overshoot` first, compared exactly, then `deviation`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two keys, their order and that the first is compared exactly.
   * @evidence contracts/development/design.md#principled-representation A lexicographic key of two numbers, legality before preference, the form the engine's swivel sweep orders candidates by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the engine's sweep; each ranking the solver passes builds one.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The first key is compared exactly, so no tolerance lets a disallowed place outrank an allowed one.
   */
  export interface IScore {
    /** The first key. */
    overshoot: number;

    /** The second key. */
    deviation: number;
  }

  /**
   * The ranking that takes the elbow place on a point's side of the
   * shoulder-to-wrist line. Candidates within one degree of that side come
   * first, ordered by overshoot then strain plus the radial discrepancy,
   * which is under 0.0002 there. An elbow place has two arm poses, one per
   * bend branch, and this order takes the allowed one. Every other candidate
   * follows, nearer sides first.
   *
   * @param shoulder The shoulder, world metres.
   * @param wrist The wrist, world metres.
   * @param bend The point whose side is taken, world metres.
   * @returns The ranking.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the order it gives and why the allowed pose of a place comes first.
   * @evidence contracts/development/implementation.md#principled-implementation Within one degree of the side, the sweep's own step, a candidate keeps its overshoot and strain; every other ranks behind by its side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the original cold radial projection and band ranking to AutoMovieMotionHumanBendSide's numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate off the side never ranks as allowed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold rankings read current supplied points every candidate; fixed internal sweeps explicitly use the same owner's prepared geometry without changing this live-input facade.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a closure over three points until its ranking is released; fresh scores retain no reader, point history or external handle.
   */
  export function toward(
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    bend: IAutoMovieVector3,
  ): (candidate: ICandidate) => IScore {
    return AutoMovieMotionHumanBendSide(shoulder, wrist, bend);
  }

  /**
   * The strain `search` ranks an elbow place by, read from the rotations of
   * another fit of the same arm (`fitChainToTarget`'s `strain`): the upper
   * arm's bone-local rotation, read in the arm's own clinical frame, and the
   * lower arm's world rotation.
   *
   * @param body The body.
   * @param side The arm.
   * @param rotation The hand's world rotation, when its turn counts as strain.
   * @param hang The `hang` preset's hint for an upright trunk at the origin, from which the hanging arm's angles are read.
   * @returns The strain of a candidate, or null when the rig has no arm chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, from which rotations, and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The strain `search` ranks by (`AutoMovieMotionHumanBendStrain`), so a fit that takes its hint from its own sweep takes the place `solve` would.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain, the hanging arm, one strain.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain returns null, never a strain of zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms The chain, the ranges and the hanging arm are read once; each candidate costs one decomposition, and with a hand rotation one split and one more decomposition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `AutoMovieMotionHumanBendStrain` with `search`, and the hanging arm's angles with every search of the body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains the chain, its ranges and the hanging arm's angles.
   */
  export function strainOf(
    body: IHumanBody,
    side: AutoMovieMotionHumanBend.Side,
    rotation: IAutoMovieQuaternion | undefined,
    hang: (
      body: IHumanBody,
      side: AutoMovieMotionHumanBend.Side,
    ) => IAutoMovieVector3,
  ):
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        lowerWorld: IAutoMovieQuaternion,
      ) => number)
    | null {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(
        body,
        { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
        side,
      );
    const neutral: IAngles | null = neutralOf(body, side, hang);
    if (chain === null || neutral === null) return null;
    const upperBone: AutoMovieHumanoidBone = chain.prepared.chain.upper;
    const lowerAxes: IAutoMovieJointAxes | undefined =
      chain.axes[chain.prepared.chain.lower];
    if (lowerAxes === undefined) return null;
    const strained: (
      u: IAngles,
      lowerWorld: () => IAutoMovieQuaternion,
    ) => number = AutoMovieMotionHumanBendStrain.of(
      chain,
      body,
      side,
      rotation,
      neutral,
      lowerAxes,
    );
    return (
      upper: IAutoMovieQuaternion,
      _lower: IAutoMovieQuaternion,
      lowerWorld: IAutoMovieQuaternion,
    ): number =>
      strained(
        decomposeJointRotation(
          upper,
          chain.axes[upperBone],
          HUMANOID_REST_FRAME[upperBone],
          chain.prepared.upperDomain,
        ),
        (): IAutoMovieQuaternion => lowerWorld,
      );
  }

  /**
   * The best elbow place of a chain for a wrist's place under a ranking.
   *
   * @param chain The prepared chain.
   * @param body The body, for the hand's range.
   * @param side The arm.
   * @param point The wrist, world metres.
   * @param rotation The hand's world rotation, when its turn counts as strain.
   * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's strain at 0.
   * @param score The ranking of a candidate.
   * @returns The chosen candidate with its true overshoot, or null for a degenerate chain.
   */
  function best(
    chain: AutoMovieMotionHumanBendChain.IChain,
    body: IHumanBody,
    side: AutoMovieMotionHumanBend.Side,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
    neutral: IAngles | null,
    score: (candidate: ICandidate) => IScore,
  ): ICandidate | null {
    const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] = chain.prepared;
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
    const strained: (
      u: IAngles,
      lowerWorld: () => IAutoMovieQuaternion,
    ) => number = AutoMovieMotionHumanBendStrain.of(
      chain,
      body,
      side,
      rotation,
      neutral,
      lowerAxes,
    );
    const clear: ReturnType<typeof HumanArmOvershoot.prepare> =
      HumanArmOvershoot.prepare(body, chain.shapes, side);

    // A branch's candidates share one lower rotation, the same record, and
    // differ only in the swivel of the upper arm, so the lower joint's
    // overshoot is read once per record: the same value, read once.
    let mid: { rotation: IAutoMovieQuaternion; overshoot: number } | undefined;
    const midOf: (lower: IAutoMovieQuaternion) => number = (lower: IAutoMovieQuaternion): number => {
      if (mid !== undefined && mid.rotation === lower) return mid.overshoot;
      const l: IAngles = decomposeJointRotation(
        lower,
        lowerAxes,
        HUMANOID_REST_FRAME[lowerBone],
        prepared.lowerDomain,
      );
      mid = {
        rotation: lower,
        overshoot: jointRomOvershoot(
          { bone: lowerBone, ...l },
          prepared.lowerDomain.constraint,
        ),
      };
      return mid.overshoot;
    };
    const read: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => ICandidate = (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
    ): ICandidate => {
      const u: IAngles = decomposeJointRotation(
        upper,
        chain.axes[upperBone],
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
          jointRomOvershoot({ bone: upperBone, ...u }, upperRange) +
          midOf(lower) +
          clear(elbow, point),
        strain,
      };
    };
    const solved: ReturnType<typeof hingedArmArticulation> =
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
        ): IScore => score(read(upper, lower)),
      });
    return solved === null ? null : read(solved.upper, solved.lower);
  }

  /**
   * The shoulder angles of an unloaded hanging arm: the wrist 0.99 arm lengths
   * straight below the shoulder of an upright trunk, the elbow on the `hang`
   * preset's side. Computed once per body and side.
   *
   * @param body The body.
   * @param side The arm.
   * @param hang The `hang` preset's hint for an upright trunk at the origin.
   * @returns The angles, or null when the rig has no arm chain.
   */
  function neutralOf(
    body: IHumanBody,
    side: AutoMovieMotionHumanBend.Side,
    hang: (
      body: IHumanBody,
      side: AutoMovieMotionHumanBend.Side,
    ) => IAutoMovieVector3,
  ): IAngles | null {
    const known: IAngles | undefined = NEUTRAL.get(body)?.[side];
    if (known !== undefined) return known;
    const posture: AutoMovieMotionHumanBend.ISolve["posture"] = {
      root: { x: 0, y: 0, z: 0 }, yaw: 0,
    };
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(body, posture, side);
    if (chain === null) return null;
    const point: IAutoMovieVector3 = {
      x: chain.shoulder.x,
      y: chain.shoulder.y - 0.99 * chain.span,
      z: chain.shoulder.z,
    };
    const hint: IAutoMovieVector3 = hang(body, side);
    const hanging: ICandidate | null = best(
      chain,
      body,
      side,
      point,
      undefined,
      null,
      AutoMovieMotionHumanBendSide.prepare(chain.shoulder, point, hint),
    );
    if (hanging === null) return null;
    NEUTRAL.set(body, { ...NEUTRAL.get(body), [side]: hanging.angles });
    return hanging.angles;
  }

  /**
   * The search `solve` and `strain` share: prepares the chain, refuses a wrist
   * out of reach and returns the best candidate under a ranking.
   *
   * @param props The request.
   * @param rank The ranking of a candidate, given the prepared chain; its overshoot is positive wherever the candidate's is, so the swivels the upper arm's range refuses are spared.
   * @param hang The `hang` preset's hint for an upright trunk at the origin, from which the hanging arm's angles are read.
   * @returns The candidate, or the reason there is none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the reasons there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The chain on the request's trunk, a wrist beyond the arm's span refused, then the engine's swivel sweep ranked by the caller.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare, refuse, sweep.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain, an unreachable wrist and a degenerate chain each return their reason, never a guessed place.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and the engine's bounded sweep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hanging arm's angles are computed once per body and side.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only those angles, in a weak map keyed by the body.
   */
  export function search(
    props: AutoMovieMotionHumanBend.ISolve,
    rank: (
      chain: AutoMovieMotionHumanBendChain.IChain,
    ) => (candidate: ICandidate) => IScore,
    hang: (
      body: IHumanBody,
      side: AutoMovieMotionHumanBend.Side,
    ) => IAutoMovieVector3,
  ): ICandidate | string {
    return prepare(props, hang)(props, rank);
  }

  /**
   * Prepare one unchanged body's trunk/side for actual differently ranked sweeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes body/root/heading/side while each query supplies its world wrist, optional rest-relative rotation and original ranking. An optional genuine same-trunk source shares only actual FK/placement preparation across sides.
   * @evidence contracts/development/implementation.md#principled-implementation The same prepared arm chain, original colliders and neutral angles are independent of target/ranking; every call retains the original reach refusal and best sweep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed chain/neutral preparation precedes the original actual target admission and ranked numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sweep, candidate, overshoot, score, legality bound or refinement is omitted or reused as a result.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain FK/preparation serves Q original target/rank sweeps. Each actual sweep lazily prepares unchanged obstruction geometry once across its candidates; neutral side ranking also shares its fixed axis/hint projection. Every original candidate, screen, sample and distance evaluation remains, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body/profile/rig/ROM, rootXYZ/yaw/pitch/roll/side and scoring context establish chain equivalence; Chain.of verifies an optional issued trunk source or uses its cold path. Each best call shares HumanArmOvershoot.prepare only across that synchronous sweep's unchanged placed shapes, never between goals. Finite authored support-state plans require private immutable coordinates rather than time/pose identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A synchronous search or bounded authored support-state plan owns one chain/collider record and neutral angles per exact fixed state until release. Obstruction readers and actual candidate closures remain inside one best call and release on return or throw; no FK reader, target result, sampled pose or global history is retained.
   */
  export function prepare(
    props: Pick<AutoMovieMotionHumanBend.ISolve, "body" | "posture" | "side">,
    hang: Parameters<typeof search>[2],
    source?: AutoMovieMotionHumanBendChain.IPrepared,
  ): (goal: Pick<AutoMovieMotionHumanBend.ISolve, "point" | "rotation">, rank: Parameters<typeof search>[1]) => ICandidate | string {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(props.body, props.posture, props.side, source);
    const neutral: IAngles | null = neutralOf(props.body, props.side, hang);
    return (goal: Pick<AutoMovieMotionHumanBend.ISolve, "point" | "rotation">, rank: Parameters<typeof search>[1]): ICandidate | string => {
      if (chain === null || neutral === null) return "the rig has no arm chain";
      const distance: number = Vector3.length(
        Vector3.subtract(goal.point, chain.shoulder),
      );
      if (distance > chain.span)
        return `the wrist is ${distance.toFixed(3)} m from the shoulder and the arm is ${chain.span.toFixed(3)} m long`;
      return (
        best(
          chain,
          props.body,
          props.side,
          goal.point,
          goal.rotation,
          neutral,
          rank(chain),
        ) ?? "the arm chain is degenerate"
      );
    };
  }
}
