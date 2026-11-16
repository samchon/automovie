import { type IAutoMovieResolvedBone, Vector3, Quaternion, type curlChainUntilContact } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chain owner supplies geometry and this adapter places its three observed segments.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing capsule or bone behavior and the existing minimum-radius chain model are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five chain readings and fifteen segment placements occur once per candidate rather than once per candidate pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged candidate pose/body/side determines these segments; the synchronous pair search releases them before any input can change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fifteen segment records, held only by the current pair search and released with its candidate arrays; no global cache or history exists.
   */
  export function digits(body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
  ): readonly IPhalanx[] {
    const out: IPhalanx[] = [];
    for (const digit of HumanGrip.CLOSING.power) {
      const chain: curlChainUntilContact.IChain = HumanGrip.chain(body, side, digit);
      chain.bones.forEach((bone: AutoMovieHumanoidBone, index: number): void => {
        const from: IAutoMovieResolvedBone = bones.get(bone)!;
        const next: AutoMovieHumanoidBone | undefined = chain.bones[index + 1];
        out.push({
          from: from.worldPosition,
          to: next === undefined ? Vector3.add(from.worldPosition,
            Quaternion.rotateVector(from.worldRotation, chain.tip)) : bones.get(next)!.worldPosition,
          radius: chain.radius,
        });
      });
    }
    return out;
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
  export function forearm(body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
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
