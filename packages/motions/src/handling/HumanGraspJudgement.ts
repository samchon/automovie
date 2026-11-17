import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";

/**
 * The original demanded held-tool measure on actual displayed bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines body/hand-local grip geometry, each live tool demand and the original metre-valued two-point stray with its proven-least floor.
 * @evidence contracts/development/design.md#principled-representation The original judge callback accepts the complete displayed bone map and returns metres; fixed canonical surface geometry is distinct from the borrowed raw posture and live demand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface tool serves HumanGraspDemand's actual key builder with one lazy grip-point reader; StrikingHeld owns the original two-point stray formula.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No dependency certificate, registration, result capability, fixed posture, fitted answer or narrowed-map policy is exposed; callers retain the complete ordinary map contract.
 */
export namespace HumanGraspJudgement {
  /**
   * Prepare one canonical body's local grip point for actual demanded tools.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes canonical body/side surface geometry while each returned judge reads its actual demand/tool/frame/back/least and current complete displayed bones in original metre units.
   * @evidence contracts/development/implementation.md#principled-implementation The existing non-digit grip point producer supplies the displayed world contact, then the unchanged StrikingHeld.strayed and Math.max least floor compute the original measure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical grip-point reader supplies independent demand callbacks; no separate stray mathematics, fit or map-observation policy is added.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both original hand reads and every actual judgement remain, with unchanged demand/contact/bound/least behavior. The callback does not certify its source graph as immutable or allow eager observations to be skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed grip offset prepares lazily once for this body/side reader; each actual judgement retains its original two-point measure while omitting unused normal/forward outputs. Complete fit/FK observations remain with Search and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The genuine canonical body owns fixed surface prerequisites, while every changed demand and current hand is actually read. No borrowed posture, evaluated contact, metric or candidate answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder and its callbacks retain one lazy canonical grip reader plus each original demand and hand name until released. They retain no full pose map, FK workspace, query/time history, registry or external handle.
   */
  export function tool(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide):
    (demand: Omit<IAutoMovieMotionHumanActionLaw.IDemand, "posture">) => IJudge {
    const name: AutoMovieHumanoidBone = `${side}Hand`;
    const point: ReturnType<typeof HumanHand.preparePoint> = HumanHand.preparePoint(body, side, "grip");
    return (demand: Omit<IAutoMovieMotionHumanActionLaw.IDemand, "posture">): IJudge =>
      (bones: Bones): number => Math.max(demand.least ?? 0, StrikingHeld.strayed(demand.tool, {
        point: point(bones), rotation: bones.get(name)!.worldRotation,
      }, demand.frame, demand.back));
  }
}

/** The original metre-valued grasp callback; it accepts the complete map. */
type IJudge = NonNullable<IAutoMovieMotionHumanGrasp.IKey["judge"]>;

/** Original canonical displayed frames passed to actual judges. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
