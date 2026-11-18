import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Skin } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "../audit/prepareAutoMovieMotionHumanAuditDepths";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanColliders } from "../posture/HumanColliders";

/**
 * Prepare the displayed hand and measure its penetration into the moving head and neck in both directions.
 *
 * @param context The original held presentation and kisser's measured body.
 * @param side The already presented hand.
 * @returns Directed positive skin depths in metres for that actual hand and each posed head and neck.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two anatomical sets and returned units.
 * @evidence contracts/development/implementation.md#principled-implementation The same part probes and convex shape depths used by the partner audit judge both projections of each pair.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the immutable hand once and place the requested head and neck on each candidate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the partner's displayed finger bones and the kisser's posed shapes. No contact exclusion or tolerance changes the returned depths.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits only the fixed hand and fingers against two skull segments, with reusable placed finger shapes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every candidate shares the exact same posed hand and body geometry but supplies its own trunk frames.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A single contact plan owns the prepared hand. Per-pose frames and depths end with their call.
 */
export function kissHandClearance(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKiss.IParams>,
  side: AutoMovieHumanSide,
): (posture: IAutoMovieMotionHumanPosture) => number[] {
  const other: IAutoMovieMotionHumanPerformerReader = context.performer(
    context.params.partner,
  );
  const hand: Skin.IPart[] = Skin.model(other.body).parts.filter(
    (part: Skin.IPart): boolean =>
      part.bone.startsWith(side) &&
      /Hand|Thumb|Index|Middle|Ring|Little/.test(part.bone),
  );
  const demand: Set<AutoMovieHumanoidBone> = new Set(
    hand.map((part) => part.bone),
  );
  const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.preparePlaced(
      other.body,
      demand,
    )(other.bones(context.start, demand));
  const handProbes: Map<AutoMovieHumanoidBone, readonly IAutoMovieVector3[]> =
    new Map(hand.map((part) => [part.bone, part.probes]));
  const neck: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    "head",
    "neck",
  ]);
  const head: Map<AutoMovieHumanoidBone, readonly IAutoMovieVector3[]> =
    new Map(
      Skin.model(context.body)
        .parts.filter((p) => neck.has(p.bone))
        .map((p) => [p.bone, p.probes]),
    );
  const resolve: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(context.body, neck);
  const colliders: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(context.body, neck);
  const intoHand: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>[] =
    placed.map((shape) => prepareAutoMovieMotionHumanAuditDepths(shape));
  return (posture: IAutoMovieMotionHumanPosture): number[] => {
    const depths: number[] = [];
    for (const skull of colliders(resolve(posture))) {
      const inside: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths> =
        prepareAutoMovieMotionHumanAuditDepths(skull);
      for (let i: number = 0; i < placed.length; ++i) {
        const finger: IAutoMovieMotionHumanColliders.IPlaced = placed[i]!;
        depths.push(
          Math.max(0, ...inside(handProbes.get(finger.bone)!, finger)),
        );
        depths.push(Math.max(0, ...intoHand[i]!(head.get(skull.bone)!, skull)));
      }
    }
    return depths;
  };
}
