import {
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrip,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanGrip } from "./HumanGrip";

/**
 * The geometry of the clasp's clearance test (`HumanClasp.choose`): each
 * candidate hand's phalanx capsules and the partner candidate's forearm
 * collider, placed once per candidate, and the least signed gap between
 * them, queried per pair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed per candidate, what is queried per pair and the unit of the gap.
 * @evidence contracts/development/design.md#principled-representation The body's capsule chains give world-metre segment endpoints and a radius; HumanColliders owns the posed forearm's exact shape reader.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareDigits, bones, forearm and between serve `HumanClasp.choose` and `HumanClaspCandidateFrames`; no second distance owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No candidate pose, collider, radius or contact bound is guessed or substituted.
 */
export namespace HumanClaspClearance {
  /**
   * One phalanx capsule of a candidate's displayed hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents world-metre segment endpoints and capsule radius.
   * @evidence contracts/development/design.md#principled-representation Endpoints and radius represent the uniform-radius capsule HumanGrip.chain declares, including its stated approximation of wider phalanges.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareDigits produces and between consumes all three fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The skeleton and capsule profile determine the data; no distance or contact verdict is stored.
   */
  export interface IPhalanx {
    /** Proximal world point, metres. */
    from: IAutoMovieVector3;

    /** Distal world point, metres. */
    to: IAutoMovieVector3;

    /** Capsule radius, metres. */
    radius: number;
  }

  /**
   * Prepare a body's digit capsules for its candidate poses.
   *
   * @param body The body, unchanged through the search.
   * @param side The hand.
   * @returns A reader of a candidate's displayed bones that places its fifteen phalanx segments, world metres, in power-grip closing order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed body and hand, the bone input and the segments returned.
   * @evidence contracts/development/implementation.md#principled-implementation HumanGrip.chain owns capsule selection, distal tip and minimum radius; each segment runs from a phalanx joint to the next, the last to the rigidly placed distal tip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Five chains read on first use, one placement loop per candidate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing capsule throws in HumanGrip.chain; no thickness is guessed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five chain readings serve every candidate; each candidate places fifteen segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The chains depend only on the body and side, which the search holds fixed; segments are placed per candidate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds at most five chains until the search releases it; no global cache.
   */
  export function prepareDigits(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide):
    (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) => readonly IPhalanx[] {
    const chains: Map<IAutoMovieMotionHumanGrip.Digit, IAutoMovieCurlChainUntilContact.IChain> = new Map();
    const chain: (digit: IAutoMovieMotionHumanGrip.Digit) => IAutoMovieCurlChainUntilContact.IChain = (digit: IAutoMovieMotionHumanGrip.Digit): IAutoMovieCurlChainUntilContact.IChain => {
      let current: IAutoMovieCurlChainUntilContact.IChain | undefined = chains.get(digit);
      if (current === undefined) {
        current = HumanGrip.chain(body, side, digit);
        chains.set(digit, current);
      }
      return current;
    };
    return (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): readonly IPhalanx[] =>
      placedDigits(bones, chain);
  }

  /**
   * The bones the clasp's digit, forearm and closure geometry reads: one
   * side's lower arm, hand and power-grip digit bones.
   *
   * @param side The hand.
   * @returns A fresh name set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bones and their use.
   * @evidence contracts/development/implementation.md#principled-implementation The lower arm places the forearm collider; the hand and digit frames place every phalanx and closure collider.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Digit membership comes from HumanGrip's power-grip table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lists only bones the geometry reads; FK still resolves their ancestors.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed seventeen-name set.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Candidate frames and the ordered closure request the same set.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh set and retains nothing.
   */
  export function bones(side: AutoMovieHumanSide): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`,
      ...HumanGrip.CLOSING.power.flatMap((digit: IAutoMovieMotionHumanGrip.Digit): AutoMovieHumanoidBone[] => HumanGrip.bones(side, digit))]);
  }

  /**
   * A candidate's forearm collider, placed for the pair search.
   *
   * @param body The forearm's owner.
   * @param bones That person's displayed bones, world frame.
   * @param side The forearm.
   * @returns The placed collider's distance reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bone input, the side and the reader returned.
   * @evidence contracts/development/implementation.md#principled-implementation The person's same-side lower-arm collider, placed by HumanColliders.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A one-bone subset fed to the shared collider reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shape or radius is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement serves every pair the candidate enters.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The candidate's forearm frame is fixed through the search; each candidate gets its own reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader ends with the pair search.
   */
  export function forearm(body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): ReturnType<typeof HumanColliders.reading> {
    const bone: AutoMovieHumanoidBone = `${side}LowerArm`;
    return HumanColliders.reading(body, new Map([[bone, bones.get(bone)!]]));
  }

  /**
   * The least signed gap from a hand's phalanges to a forearm collider.
   *
   * @param phalanges The hand's placed phalanx segments.
   * @param geometry The forearm's distance reader.
   * @returns Metres, negative inside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the signed metre result.
   * @evidence contracts/development/implementation.md#principled-implementation A capsule's gap is its core segment's distance to the collider less its radius; the hand's is the least over its phalanges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reduction over the segments.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment is queried; no broad phase or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fifteen distance queries per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reduction over its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains nothing.
   */
  export function between(phalanges: readonly IPhalanx[],
    geometry: ReturnType<typeof HumanColliders.reading>,
  ): number {
    let least: number = Infinity;
    for (const phalanx of phalanges)
      least = Math.min(least, geometry.segment(phalanx.from, phalanx.to).distance - phalanx.radius);
    return least;
  }
}

/** Place every phalanx capsule of the power-grip digits from a candidate's frames, in closing order. */
function placedDigits(bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chainAt: (digit: IAutoMovieMotionHumanGrip.Digit) => IAutoMovieCurlChainUntilContact.IChain): readonly HumanClaspClearance.IPhalanx[] {
  const out: HumanClaspClearance.IPhalanx[] = [];
  for (const digit of HumanGrip.CLOSING.power) {
    const chain: IAutoMovieCurlChainUntilContact.IChain = chainAt(digit);
    const count: number = chain.bones.length;
    for (let index: number = 0; index < count; ++index) {
      const bone: AutoMovieHumanoidBone = chain.bones[index]!;
      const from: IAutoMovieResolvedBone = bones.get(bone)!;
      const next: AutoMovieHumanoidBone | undefined = chain.bones[index + 1];
      out.push({ from: from.worldPosition,
        to: next === undefined ? Vector3.add(from.worldPosition,
          Quaternion.rotateVector(from.worldRotation, chain.tip)) : bones.get(next)!.worldPosition,
        radius: chain.radius });
    }
  }
  return out;
}
