import {
  HUMANOID_REST_FRAME,
  Vector3,
  decomposeJointRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";
import { AutoMovieMotionHumanBendSide } from "./AutoMovieMotionHumanBendSide";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";
import { AutoMovieMotionHumanBendSweep } from "./AutoMovieMotionHumanBendSweep";

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
  /**
   * Three clinical angles of a joint, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the members are the clinical flexion, abduction and twist in degrees.
   * @evidence contracts/development/design.md#principled-representation A ball joint's three clinical angles in degrees, the form the rig's range-of-motion tables and the hanging arm's reading use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `ICandidate` and by the body's hanging arm (`hanging`); no member is added for another joint.
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

    /** The strain, unitless; read on demand where `least` is given. */
    strain: number;

    /** A certified lower bound of `strain` known without reading it, where the hand's share of the strain is deferred (`AutoMovieMotionHumanBendStrain.least`); absent where `strain` is cheap. */
    least?: number;
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

    /** The second key, or its certified lower bound where `exact` is given. */
    deviation: number;

    /**
     * The exact second key, read only where its bound cannot decide a comparison (`hingedSwivelAhead`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the reader returns and when it is read.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A slot a ranking fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A slot a ranking fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A slot a ranking fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A slot a ranking fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A slot a ranking fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A slot a ranking fills; the interface declares it and implements nothing.
     */
    exact?: () => number;
  }

  /**
   * The ranking `solve` takes: overshoot first, then the strain, deferred to
   * its certified lower bound where the candidate carries one.
   *
   * @param candidate The candidate.
   * @returns Its score, whose comparisons are the same as with the strain read at once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the deferral and what it preserves.
   * @evidence contracts/development/implementation.md#principled-implementation A deferred deviation whose bound is at most its exact value decides every comparison of the engine's comparator as the exact value does (`hingedSwivelAhead`), so the sweep's choice is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record, the deferral only where a bound exists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound never stands for the strain: the exact strain is read for any comparison it leaves open.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The candidate's own lazy strain is the exact value, read at most once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The score retains its candidate only while the sweep holds it.
   */
  export function strained(candidate: ICandidate): IScore {
    return candidate.least === undefined
      ? { overshoot: candidate.overshoot, deviation: candidate.strain }
      : {
          overshoot: candidate.overshoot,
          deviation: candidate.least,
          exact: (): number => candidate.strain,
        };
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
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion | undefined,
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
    const neutral: IAngles | null = body.hanging(side);
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
   * `AutoMovieMotionHumanBend.solve`'s search with the seed it was chosen
   * at, on one request's trunk prepared once: cold, or continued from a
   * nearby solve's seed; legality first, then the least strain.
   *
   * @param props The request; its `fallback` is not read.
   * @returns The search of the request, given the seed of a nearby solve of the same arm to continue (`IAutoMovieSwivelNear`) or none to sweep every swivel: the candidate and its swivel and bend branch, or the reason there is none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ranking, the two modes, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's swivel search cold, or its continuation of a seed within one step either way on the seed's branch (`hingedArmArticulation`'s `near`), under `solve`'s ranking.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare once; each call refuses, then searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A continued candidate's overshoot is reported as scored, so a caller sees a seed that left the legal places.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation for every search of the request, as a walk along one request makes many; cold, the bounded sweep; continued, the refinement's probes alone; the hand's share of the strain is deferred to its certified bound (`strained`), the same choice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The chain depends on the request's body, trunk and side alone, so every search of the request shares it; the hanging arm is the body's.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains the chain until released.
   */
  export function continued(
    props: Pick<
      IAutoMovieMotionHumanBend.ISolve,
      "body" | "posture" | "side" | "point" | "rotation"
    >,
  ): (
    near?: IAutoMovieSwivelNear,
  ) => { candidate: ICandidate; seed: IAutoMovieSwivelSeed } | string {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(props.body, props.posture, props.side);
    const neutral: IAngles | null = props.body.hanging(props.side);
    return (
      near?: IAutoMovieSwivelNear,
    ): { candidate: ICandidate; seed: IAutoMovieSwivelSeed } | string => {
      if (chain === null || neutral === null) return "the rig has no arm chain";
      if (
        Vector3.length(Vector3.subtract(props.point, chain.shoulder)) >
        chain.span
      )
        return "the wrist is beyond the arm's span";
      return (
        AutoMovieMotionHumanBendSweep(
          chain,
          props.body,
          props.side,
          props.point,
          props.rotation,
          neutral,
          strained,
          near,
        ) ?? "the arm chain is degenerate"
      );
    };
  }

  /**
   * The shoulder angles of an unloaded hanging arm: the wrist straight below
   * the shoulder of an upright trunk, as far as the relaxed elbow
   * (`stand.ELBOW`) leaves it, the elbow on the hint's side. The body reads
   * it once per side (`IAutoMovieMotionHumanBody.hanging`).
   *
   * @param body The body.
   * @param side The arm.
   * @param hint The `hang` preset's hint for an upright trunk at the origin.
   * @returns The angles, or null when the rig has no arm chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture read, its source, the hint and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist under the elbow a standing posture relaxes the arm to, by the law of cosines on the two segments, and the sweep's best elbow on the hint's side for it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain, one wrist, one sweep.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain, or a degenerate one, is null, never a guessed angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and one bounded sweep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The body owns the result; this computes it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the angles are returned.
   */
  export function hanging(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    hint: IAutoMovieVector3,
  ): IAngles | null {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(
        body,
        { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
        side,
      );
    if (chain === null) return null;

    // The wrist under the elbow a standing posture relaxes the arm to
    // (`stand.ELBOW`): the law of cosines on the two segments, as a share
    // of the straight arm.
    const upper: number = body.measure.upperArm;
    const fore: number = body.measure.forearm;
    const flexion: number = (stand.ELBOW * Math.PI) / 180;
    const share: number =
      Math.sqrt(
        upper * upper + fore * fore + 2 * upper * fore * Math.cos(flexion),
      ) /
      (upper + fore);
    const point: IAutoMovieVector3 = {
      x: chain.shoulder.x,
      y: chain.shoulder.y - share * chain.span,
      z: chain.shoulder.z,
    };
    return (
      AutoMovieMotionHumanBendSweep(
        chain,
        body,
        side,
        point,
        undefined,
        null,
        AutoMovieMotionHumanBendSide.prepare(chain.shoulder, point, hint),
      )?.candidate.angles ?? null
    );
  }

  /**
   * The search `solve` and `strain` share: prepares the chain, refuses a wrist
   * out of reach and returns the best candidate under a ranking.
   *
   * @param props The request.
   * @param rank The ranking of a candidate, given the prepared chain; its overshoot is positive wherever the candidate's is, so the swivels the upper arm's range refuses are spared.
   * @returns The candidate, or the reason there is none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the reasons there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The chain on the request's trunk, a wrist beyond the arm's span refused, then the engine's swivel sweep ranked by the caller.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare, refuse, sweep.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain, an unreachable wrist and a degenerate chain each return their reason, never a guessed place.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and the engine's bounded sweep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hanging arm's angles are the body's, read once per side.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
   */
  export function search(
    props: IAutoMovieMotionHumanBend.ISolve,
    rank: (
      chain: AutoMovieMotionHumanBendChain.IChain,
    ) => (candidate: ICandidate) => IScore,
  ): ICandidate | string {
    return prepare(props)(props, rank);
  }

  /**
   * Prepare one unchanged body's trunk/side for actual differently ranked sweeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes body/root/heading/side while each query supplies its world wrist, optional rest-relative rotation and original ranking. An optional same-trunk source shares only FK/placement preparation across sides.
   * @evidence contracts/development/implementation.md#principled-implementation The same prepared arm chain, original colliders and the body's hanging angles are independent of target/ranking; every call retains the original reach refusal and sweep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed chain preparation precedes the original actual target admission and ranked numerical owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sweep, candidate, overshoot, score, legality bound or refinement is omitted or reused as a result.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain FK/preparation serves Q original target/rank sweeps. Each actual sweep prepares unchanged obstruction geometry once across its candidates; side ranking also shares its fixed axis/hint projection. Every original candidate, screen, sample and distance evaluation remains, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body/profile/rig/ROM, rootXYZ/yaw/pitch/roll/side and scoring context establish chain equivalence; an optional trunk source from `AutoMovieMotionHumanBendChain.prepare` shares that trunk's preparation. Each sweep shares HumanArmOvershoot.prepare only across its own placed shapes, never between goals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A synchronous search or bounded authored support-state plan owns one chain/collider record per fixed state until release. Obstruction readers and candidate closures remain inside one sweep and release on return or throw; no FK reader, target result, sampled pose or global history is retained.
   */
  export function prepare(
    props: Pick<IAutoMovieMotionHumanBend.ISolve, "body" | "posture" | "side">,
    source?: AutoMovieMotionHumanBendChain.IPrepared,
  ): (
    goal: Pick<IAutoMovieMotionHumanBend.ISolve, "point" | "rotation">,
    rank: Parameters<typeof search>[1],
    trial?: readonly [AutoMovieMotionHumanBendRepeat.IRead, 0 | 1],
  ) => ICandidate | string {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(
        props.body,
        props.posture,
        props.side,
        source,
      );
    const neutral: IAngles | null = props.body.hanging(props.side);
    return (
      goal: Pick<IAutoMovieMotionHumanBend.ISolve, "point" | "rotation">,
      rank: Parameters<typeof search>[1],
      trial?: readonly [AutoMovieMotionHumanBendRepeat.IRead, 0 | 1],
    ): ICandidate | string => {
      if (chain === null || neutral === null) return "the rig has no arm chain";
      const distance: number = Vector3.length(
        Vector3.subtract(goal.point, chain.shoulder),
      );
      if (distance > chain.span)
        return `the wrist is ${distance.toFixed(3)} m from the shoulder and the arm is ${chain.span.toFixed(3)} m long`;
      return (
        AutoMovieMotionHumanBendSweep(
          chain,
          props.body,
          props.side,
          goal.point,
          goal.rotation,
          neutral,
          rank(chain),
          undefined,
          trial,
        )?.candidate ?? "the arm chain is degenerate"
      );
    };
  }
}
