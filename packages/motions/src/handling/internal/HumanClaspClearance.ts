import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrip,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanGrip } from "./HumanGrip";

/**
 * The geometry of the clasp's clearance test (`HumanClasp.choose`): each
 * candidate hand's phalanx capsules and the partner candidate's forearm
 * collider, placed once per candidate, and the least signed gap between them,
 * queried per pair.
 */
export namespace HumanClaspClearance {
  /** One phalanx capsule of a candidate's displayed hand. */
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
   * @returns A reader of a candidate's displayed bones that places its fifteen
   *   phalanx segments, world metres, in power-grip closing order.
   */
  export function prepareDigits(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => readonly IPhalanx[] {
    const chains: Map<
      IAutoMovieMotionHumanGrip.Digit,
      IAutoMovieCurlChainUntilContact.IChain
    > = new Map();
    const chain: (
      digit: IAutoMovieMotionHumanGrip.Digit,
    ) => IAutoMovieCurlChainUntilContact.IChain = (
      digit: IAutoMovieMotionHumanGrip.Digit,
    ): IAutoMovieCurlChainUntilContact.IChain => {
      let current: IAutoMovieCurlChainUntilContact.IChain | undefined =
        chains.get(digit);
      if (current === undefined) {
        current = HumanGrip.chain(body, side, digit);
        chains.set(digit, current);
      }
      return current;
    };
    return (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): readonly IPhalanx[] => placedDigits(bones, chain);
  }

  /**
   * The bones the clasp's digit, forearm and closure geometry reads: one side's
   * lower arm, hand and power-grip digit bones.
   *
   * @param side The hand.
   * @returns A fresh name set.
   */
  export function bones(
    side: AutoMovieHumanSide,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return new Set<AutoMovieHumanoidBone>([
      `${side}LowerArm`,
      `${side}Hand`,
      ...HumanGrip.CLOSING.power.flatMap(
        (digit: IAutoMovieMotionHumanGrip.Digit): AutoMovieHumanoidBone[] =>
          HumanGrip.bones(side, digit),
      ),
    ]);
  }

  /**
   * A candidate's forearm collider, placed for the pair search.
   *
   * @param body The forearm's owner.
   * @param bones That person's displayed bones, world frame.
   * @param side The forearm.
   * @returns The placed collider's distance reader.
   */
  export function forearm(
    body: IAutoMovieMotionHumanBody,
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
   */
  export function between(
    phalanges: readonly IPhalanx[],
    geometry: ReturnType<typeof HumanColliders.reading>,
  ): number {
    let least: number = Infinity;
    for (const phalanx of phalanges)
      least = Math.min(
        least,
        geometry.segment(phalanx.from, phalanx.to).distance - phalanx.radius,
      );
    return least;
  }
}

/**
 * Place every phalanx capsule of the power-grip digits from a candidate's
 * frames, in closing order.
 */
function placedDigits(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chainAt: (
    digit: IAutoMovieMotionHumanGrip.Digit,
  ) => IAutoMovieCurlChainUntilContact.IChain,
): readonly HumanClaspClearance.IPhalanx[] {
  const out: HumanClaspClearance.IPhalanx[] = [];
  for (const digit of HumanGrip.CLOSING.power) {
    const chain: IAutoMovieCurlChainUntilContact.IChain = chainAt(digit);
    const count: number = chain.bones.length;
    for (let index: number = 0; index < count; ++index) {
      const bone: AutoMovieHumanoidBone = chain.bones[index]!;
      const from: IAutoMovieResolvedBone = bones.get(bone)!;
      const next: AutoMovieHumanoidBone | undefined = chain.bones[index + 1];
      out.push({
        from: from.worldPosition,
        to:
          next === undefined
            ? Vector3.add(
                from.worldPosition,
                Quaternion.rotateVector(from.worldRotation, chain.tip),
              )
            : bones.get(next)!.worldPosition,
        radius: chain.radius,
      });
    }
  }
  return out;
}
