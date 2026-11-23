import type {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { bodyRegionBones } from "../perform/bodyRegionBones";
import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRotationArtifact } from "./validateRotationArtifact";
import { validateVectorArtifact } from "./validateVectorArtifact";

/** The body drawing omits the facial leaf pivots from its ring modules. */
const BODY_PIVOTS: ReadonlySet<string> = new Set(
  bodyRegionBones("fullBody").filter(
    (bone: string): boolean => bone !== "jaw" && !bone.endsWith("Eye"),
  ),
);

/**
 * Append polygon body cue findings under `$input.polygonBodyCues`. Artifact
 * readers resolve placement IDs and humanoid bone names. Performance supplies a
 * skeleton resolver to require existing bones and disjoint target branches.
 */
export function appendPolygonBodyCuesArtifact(
  cues: unknown,
  sceneNodes: readonly unknown[],
  shotDuration: number,
  collector: IAutoMovieViolationCollector,
  skeleton?: (subject: string) => IAutoMovieSkeleton | null,
): void {
  const root: string = "$input.polygonBodyCues";
  if (
    cues === undefined ||
    !validateArrayArtifact(cues, root, "polygon body cues", collector.items) ||
    cues.length === 0
  )
    return;

  const placements: Set<string> = new Set();
  for (const node of sceneNodes)
    if (isRecord(node) && typeof node.id === "string") placements.add(node.id);
  const targets: Map<string, Map<string, number>> = new Map();
  const rigParents: Map<string, ReadonlyMap<string, string | null>> = new Map();
  for (const [index, cue] of cues.entries()) {
    const path: string = `${root}[${index}]`;
    if (!validateObjectArtifact(cue, path, "polygon body cue", collector.items))
      continue;

    const subject: unknown = cue.subject;
    const bone: unknown = cue.bone;
    if (typeof subject !== "string" || !placements.has(subject))
      collector.push(
        "type",
        `${path}.subject`,
        "must name a staged subject",
        subject,
      );
    if (typeof bone !== "string" || !BODY_PIVOTS.has(bone))
      collector.push(
        "type",
        `${path}.bone`,
        "must name a polygon body pivot",
        bone,
      );
    else if (typeof subject === "string" && placements.has(subject)) {
      if (skeleton !== undefined) {
        let parents: ReadonlyMap<string, string | null> | undefined =
          rigParents.get(subject);
        if (parents === undefined) {
          parents = new Map(
            skeleton(subject)?.bones.map(
              (entry: IAutoMovieBone): [string, string | null] => [
                entry.bone,
                entry.parent,
              ],
            ),
          );
          rigParents.set(subject, parents);
        }
        if (!parents.has(bone))
          collector.push(
            "type",
            `${path}.bone`,
            "must name a bone in the staged subject's rig",
            bone,
          );
      }

      let subjectTargets: Map<string, number> | undefined =
        targets.get(subject);
      if (subjectTargets === undefined) {
        subjectTargets = new Map();
        targets.set(subject, subjectTargets);
      }
      if (subjectTargets.has(bone))
        collector.push(
          "type",
          `${path}.bone`,
          "one cue per staged subject and bone",
          bone,
        );
      else subjectTargets.set(bone, index);
    }

    const at: unknown = cue.at;
    const duration: unknown = cue.duration;
    if (
      typeof at !== "number" ||
      !Number.isFinite(at) ||
      at < 0 ||
      at >= shotDuration
    )
      collector.push(
        "range",
        `${path}.at`,
        "must be finite source-shot seconds within [0, shot duration)",
        at,
      );
    if (
      typeof duration !== "number" ||
      !Number.isFinite(duration) ||
      duration < 0 ||
      (typeof at === "number" && at + duration > shotDuration)
    )
      collector.push(
        "range",
        `${path}.duration`,
        "must be finite nonnegative seconds ending by the shot end",
        duration,
      );

    validateRotationArtifact(
      cue.rotation,
      `${path}.rotation`,
      "polygon body cue rotation",
      collector,
    );
    if (cue.kind === "detach")
      validateVectorArtifact(
        cue.translation,
        `${path}.translation`,
        "polygon body cue translation",
        collector.items,
      );
    else if (cue.kind !== "bend")
      collector.push(
        "type",
        `${path}.kind`,
        'must be "bend" or "detach"',
        cue.kind,
      );
  }

  // Check directed ancestor paths after collecting all targets so either cue
  // order identifies the same overlapping descendant.
  for (const [subject, parents] of rigParents) {
    const subjectTargets: ReadonlyMap<string, number> | undefined =
      targets.get(subject);
    if (subjectTargets === undefined) continue;
    for (const [bone, index] of subjectTargets) {
      let parent: string | null | undefined = parents.get(bone);
      // Bound traversal even if an external rig resolver supplies a cycle.
      for (
        let depth: number = 0;
        typeof parent === "string" && depth < parents.size;
        depth++
      ) {
        if (parent !== bone && subjectTargets.has(parent)) {
          collector.push(
            "type",
            `${root}[${index}].bone`,
            `must target a branch disjoint from "${parent}"`,
            bone,
          );
          break;
        }
        parent = parents.get(parent);
      }
    }
  }
}
