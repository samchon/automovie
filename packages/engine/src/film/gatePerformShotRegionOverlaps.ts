import {
  AutoMovieBodyRegion,
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  type IAutoMovieActionSynthesizer,
  type IAutoMovieEnginePerformShotGateContext,
  IAutoMovieMotion,
} from "@automovie/interface";

import { actionRegion } from "../perform/actionRegion";
import { bodyRegionBones } from "../perform/bodyRegionBones";
import { AutoMovieEngineText } from "../text/AutoMovieEngineText";
import { performShotActionSpan } from "./performShotActionSpan";
import { performShotActors } from "./performShotActors";

/**
 * What one action's clip carries after its region mask, cached by action only
 * while that actor's overlap pairs are compared.
 */
interface ICarriedContent {
  /** Bones authored by at least one key and retained by the action's region. */
  bones: Set<AutoMovieHumanoidBone>;

  /** Whether a face-region key authors an expression. */
  expression: boolean;

  /** Whether the action's key and layering policy retain a pose root. */
  root: boolean;
}

/**
 * Refuse two overlapping actions of one actor whose clips, after their region
 * masks, author the same channel.
 *
 * Region names are only mask policy: a `fullBody` gait that authors legs and
 * arms shares nothing with a head-only `lookAt`, but does collide with an arm
 * gesture. So each overlapping pair is compared by the content its synthesized
 * clip actually carries: the bones its region keeps, the root when the actor
 * has a single region or the action is `lowerBody` or `fullBody`, and the
 * expression for a `face` action. Two actions overlap when one starts more than
 * `1e-9` s before the other ends. A shared channel is one `range` violation at
 * the later action's `start`, listing `root`, the shared bones in code-unit
 * order, and `expression`.
 *
 * Synthesis only follows a clean input gate, so the check is skipped for every
 * actor once the collector holds a violation: a malformed request must return
 * its located violations rather than reach a throwing synthesizer.
 *
 * @param context The shot's staged tables and collector.
 * @param actions The performing action list; `frame` actions are ignored.
 * @param synthesize The shot's memoized synthesizer, shared with the compile.
 */
export function gatePerformShotRegionOverlaps(
  context: IAutoMovieEnginePerformShotGateContext,
  actions: readonly IAutoMovieActionCall[],
  synthesize: IAutoMovieActionSynthesizer,
): void {
  const duration: number = context.performance.duration;
  const byActor: Map<
    string,
    { action: IAutoMovieActionCall; index: number }[]
  > = new Map();
  actions.forEach((action: IAutoMovieActionCall, index: number): void => {
    if (action.verb === "frame") return;
    for (const actor of performShotActors(action)) {
      const list: { action: IAutoMovieActionCall; index: number }[] =
        byActor.get(actor) ?? [];
      list.push({ action, index });
      byActor.set(actor, list);
    }
  });
  for (const [actor, list] of byActor) {
    if (context.out.items.length > 0) continue;
    const layered: boolean =
      new Set(
        list.map(
          (entry: { action: IAutoMovieActionCall }): AutoMovieBodyRegion =>
            actionRegion(entry.action),
        ),
      ).size > 1;
    const carried: Map<IAutoMovieActionCall, ICarriedContent> = new Map();
    function contentOf(action: IAutoMovieActionCall): ICarriedContent {
      const cached: ICarriedContent | undefined = carried.get(action);
      if (cached !== undefined) return cached;
      const content: ICarriedContent = carriedContent(
        synthesize(action, actor),
        actionRegion(action),
        layered,
      );
      carried.set(action, content);
      return content;
    }
    const sorted: { action: IAutoMovieActionCall; index: number }[] = [
      ...list,
    ].sort(
      (
        a: { action: IAutoMovieActionCall },
        b: { action: IAutoMovieActionCall },
      ): number =>
        performShotActionSpan(a.action, duration)[0] -
        performShotActionSpan(b.action, duration)[0],
    );
    for (let i: number = 0; i + 1 < sorted.length; ++i) {
      const a: { action: IAutoMovieActionCall; index: number } = sorted[i]!;
      const [a0, a1]: [number, number] = performShotActionSpan(
        a.action,
        duration,
      );
      for (let j: number = i + 1; j < sorted.length; ++j) {
        const b: { action: IAutoMovieActionCall; index: number } = sorted[j]!;
        const [b0, b1]: [number, number] = performShotActionSpan(
          b.action,
          duration,
        );
        if (b0 >= a1 - 1e-9) break;
        const aContent: ICarriedContent = contentOf(a.action);
        const bContent: ICarriedContent = contentOf(b.action);
        const shared: string[] = [
          ...(aContent.root && bContent.root ? ["root"] : []),
          ...[...aContent.bones]
            .filter((bone: AutoMovieHumanoidBone): boolean =>
              bContent.bones.has(bone),
            )
            .sort(AutoMovieEngineText.compareCodeUnits),
          ...(aContent.expression && bContent.expression ? ["expression"] : []),
        ];
        if (shared.length > 0 && b1 > a0 + 1e-9)
          context.out.push(
            "range",
            `${context.base}[${b.index}].start`,
            `${actor} has overlapping ${actionRegion(a.action)} and ${actionRegion(b.action)} actions that both author ${shared.join(", ")} after region masking; move one action, shorten it, or author disjoint content`,
            b.action.start,
          );
      }
    }
  }
}

/** The channels one clip carries after its region mask. */
function carriedContent(
  motion: IAutoMovieMotion | null,
  region: AutoMovieBodyRegion,
  layered: boolean,
): ICarriedContent {
  const allowed: Set<AutoMovieHumanoidBone> = new Set(bodyRegionBones(region));
  const content: ICarriedContent = {
    bones: new Set(),
    expression: false,
    root: false,
  };
  if (motion === null) return content;
  for (const keyframe of motion.keyframes) {
    for (const joint of keyframe.pose.joints)
      if (allowed.has(joint.bone)) content.bones.add(joint.bone);
    if (
      keyframe.pose.root !== null &&
      (!layered || region === "lowerBody" || region === "fullBody")
    )
      content.root = true;
    if (keyframe.expression !== null && region === "face")
      content.expression = true;
  }
  return content;
}
