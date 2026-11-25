import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareAutoMovieMotionHumanAuditDepths } from "../audit/prepareAutoMovieMotionHumanAuditDepths";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanColliders } from "../posture/HumanColliders";

/**
 * Prepare the displayed hand and measure its penetration into the moving head
 * and neck in both directions.
 *
 * @param context The original held presentation and kisser's measured body.
 * @param side The already presented hand.
 * @returns Directed positive skin depths in metres for that actual hand and
 *   each posed head and neck.
 */
export function kissHandClearance(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKiss.IParams>,
  side: AutoMovieHumanSide,
): (posture: IAutoMovieMotionHumanPosture) => number[] {
  const other: IAutoMovieMotionHumanPerformerReader = context.performer(
    context.params.partner,
  );
  const hand: IAutoMovieMotionHumanAuditTangleModel.IPart[] =
    other.body.tangle.parts.filter(
      (part: IAutoMovieMotionHumanAuditTangleModel.IPart): boolean =>
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
      context.body.tangle.parts
        .filter((p) => neck.has(p.bone))
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
