import {
  Quaternion,
  Vector3,
  type curlChainUntilContact,
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
import type { HumanHand } from "../posture/HumanHand";
import { HumanGrip } from "./HumanGrip";

/**
 * Fixed candidate geometry for the reciprocal clearance of clasping hands.
 * Each candidate's actual digit segments and opposite forearm are prepared
 * once before the pair search; each pair still queries their exact distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the candidate scope, two prepared geometries and unchanged pair judgement.
 * @evidence contracts/development/design.md#principled-representation The body's existing capsule chains give world-metre segment endpoints and radius, while HumanColliders owns the posed forearm's exact shape reader.
 * @evidence contracts/development/design.md#minimal-and-owned-surface digits, forearm and between serve both the choose loop and the existing one-off clearance facade without another numerical distance owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No candidate pose, collider, radius or contact bound is guessed or substituted.
 */
export namespace HumanClaspClearance {
  /**
   * One actual phalanx capsule of a candidate's displayed hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents world-metre segment endpoints and capsule radius.
   * @evidence contracts/development/design.md#principled-representation Required endpoints and radius represent the same uniform-radius capsule HumanGrip.chain declares, including its documented wider-phalange approximation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface digits produces and between consumes all three fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual skeleton and capsule profile determine the data; no solved distance or contact verdict is stored.
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
   * Place a fixed candidate's phalanx segments in original closing order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads one unchanged body, displayed bone map and hand and returns their actual world-metre capsule segments.
   * @evidence contracts/development/implementation.md#principled-implementation Retains HumanGrip's canonical power-grip digit order and capsule geometry; each distal endpoint is the original rigidly placed core tip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chain owner supplies geometry and the shared placedDigits adapter places its three observed segments.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing capsule or bone behavior and the existing minimum-radius chain model are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five chain readings and fifteen segment placements occur once per candidate rather than once per pair; direct iteration of each genuine three-bone list omits five short-lived forEach closures and fifteen internal callback dispatches without removing a placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged candidate pose/body/side determines these segments; the synchronous pair search releases them before any input can change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fifteen segment records, held only by the current pair search and released with its candidate arrays; no global cache or history exists.
   */
  export function digits(body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): readonly IPhalanx[] {
    return placedDigits(bones, (digit: IAutoMovieMotionHumanGrip.Digit): IAutoMovieCurlChainUntilContact.IChain =>
      HumanGrip.chain(body, side, digit));
  }

  /**
   * Prepare an unchanged body's digit capsules for its actual candidate poses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes body/profile and hand for one synchronous pair search; each query returns its current displayed world segments with the original capsule radii.
   * @evidence contracts/development/implementation.md#principled-implementation HumanGrip.chain still owns capsule selection, distal tip and minimum radius. Each digit is admitted lazily in original power-grip order before its first actual placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A five-entry local chain map supplies the same placedDigits numerical owner used by cold digits calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No profile capsule, missing-bone behavior, segment order, radius or contact distance changes; changed body/profile geometry requires another producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five actual chain/profile readings serve C candidate maps instead of five readings per candidate; all fifteen current segment placements remain per query. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/profile/side establish chain equivalence; no current bone map, segment result or pair verdict is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller releases at most five fresh chain/name/tip records with its synchronous search. Fresh segment arrays borrow each actual map's joint positions and retain no producer or body; no global history or handle exists.
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
   * Bone frames consumed by clasp digit, forearm and closure geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists one side's lower arm, hand and power-grip digit joints for actual contact/closure FK; posture bands request their separate two-arm observations and ancestors remain the engine's responsibility.
   * @evidence contracts/development/implementation.md#principled-implementation Lower arm supplies forearm clearance while hand/digit frames place every original closure collider and phalanx; unrelated band-only upper-arm output is unnecessary here.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fresh name set derives digit membership from HumanGrip's existing power-grip owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Omits only unobserved bones, retaining all original clasp geometry and full pose admission before requested FK output.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed seventeen-name assembly has no varying population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Candidate readbacks and ordered closure use the same required-name owner, without storing any pose or solution.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh name set without retaining body, pose, reader, history or handle.
   */
  export function bones(side: AutoMovieHumanSide): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`,
      ...HumanGrip.CLOSING.power.flatMap((digit: IAutoMovieMotionHumanGrip.Digit): AutoMovieHumanoidBone[] => HumanGrip.bones(side, digit))]);
  }

  /**
   * Prepare the opposite forearm alone for a candidate pair search.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed world-bone map/side and exact segment-distance reader returned.
   * @evidence contracts/development/implementation.md#principled-implementation The tested subset remains exactly the other person's same-side lower-arm collider, placed by HumanColliders' existing owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original one-bone subset feeds the shared fixed-geometry reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shape, radius, empty-profile refusal or query policy changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed forearm placement/shape preparation serves every opposite candidate's fifteen changing segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body, profile and candidate's forearm frame remain unchanged through this synchronous pair search; distinct forearm candidates get separate readers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search releases the one-bone subset and lazy distance reader with its candidate arrays; no queried segment or result is retained.
   */
  export function forearm(body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): ReturnType<typeof HumanColliders.reading> {
    const bone: AutoMovieHumanoidBone = `${side}LowerArm`;
    return HumanColliders.reading(body, new Map([[bone, bones.get(bone)!]]));
  }

  /**
   * Query every original phalanx against one original opposite forearm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world segment inputs and returned signed clearance in metres.
   * @evidence contracts/development/implementation.md#principled-implementation The original minimum signed segment-to-forearm distance less each phalanx's own radius, in original segment order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered reduction delegates every exact distance to the original collider owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original segment is queried with unchanged radii, signs, ordering and Math.min behavior; no broad-phase or acceptance bound is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fifteen actual distance queries remain per ordered candidate pair; only invariant placement and chain preparation have moved out of the pair loop.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared geometry is shared, while each changed segment/forearm combination computes its own clearance.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no input or handle.
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

/** Place every original capsule from its current frames, preserving cold admission order. */
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
