import type {
  IAutoMovieCompiledPerformance,
  IAutoMovieMaskedContent,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
  IAutoMovieViolationAppendItemsSink,
} from "@automovie/interface";

import { validateMotion } from "../validation/validateMotion";

/**
 * Report what the compiled performance would lose or break: every channel a
 * region mask drops, and every clip that fails `validateMotion` against its
 * rig.
 *
 * A masked drop is one `type` violation at the author's `region` (or `onHit`)
 * field, `stageActionPaths[drop.action]`, naming the bones, root displacement
 * or expression the region does not carry. A clip of a node without a rig is
 * skipped; a failing clip's violations are re-rooted from `$input` to
 * `$compiled["<node>"]`.
 *
 * @param out The shot's violation collector.
 * @param compiled The compiled performance: its clips and its masked drops.
 * @param stageActionPaths The author's path of each stage action, by index.
 * @param skeleton The staged rig of a node, or null for a node without one.
 */
export function gatePerformShotCompiledMotions(
  out: IAutoMovieViolationAppendItemsSink,
  compiled: IAutoMovieCompiledPerformance,
  stageActionPaths: readonly string[],
  skeleton: (node: string) => IAutoMovieSkeleton | null,
): void {
  for (const drop of compiled.masked)
    out.push(
      "type",
      stageActionPaths[drop.action]!,
      `${drop.actor}'s clip authors ${maskedContent(drop)}, which the "${drop.region}" body region does not carry, so the performance would drop that content; set region to one that owns it ("fullBody" owns every bone and the root, only "face" carries an expression), or move the content to its own action`,
      drop.region,
    );
  for (const [node, motion] of Object.entries(compiled.performances)) {
    const rig: IAutoMovieSkeleton | null = skeleton(node);
    if (rig === null) continue;
    const validated: IAutoMovieValidation = validateMotion({
      motion,
      skeleton: rig,
    });
    if (validated.success === false)
      for (const violation of validated.violations)
        out.items.push({
          ...violation,
          path: violation.path.replace("$input", `$compiled["${node}"]`),
        });
  }
}

/** What a masked clip authored that its region drops, in words. */
function maskedContent(drop: IAutoMovieMaskedContent): string {
  return [
    ...(drop.bones.length > 0 ? [`the bones ${drop.bones.join(", ")}`] : []),
    ...(drop.root ? ["a root displacement"] : []),
    ...(drop.expression ? ["an expression"] : []),
  ].join(" and ");
}
