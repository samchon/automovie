import type {
  IAutoMovieBone,
  IAutoMoviePolygonBodyCue,
  IAutoMovieSkeleton,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Append polygon body cue findings under `$input.polygonBodyCues`. Artifact
 * readers resolve placement IDs. Performance supplies a skeleton resolver to
 * require existing bones and disjoint target branches.
 */
export function appendPolygonBodyCuesArtifact(
  cues: readonly IAutoMoviePolygonBodyCue[] | undefined,
  sceneNodes: readonly { id: string }[],
  shotDuration: number,
  collector: IAutoMovieViolationCollector,
  skeleton?: (subject: string) => IAutoMovieSkeleton | null,
): void {
  const root: string = "$input.polygonBodyCues";
  if (cues === undefined || cues.length === 0) return;

  const placements: Set<string> = new Set(
    sceneNodes.map((node: { id: string }): string => node.id),
  );
  const targets: Map<string, Map<string, number>> = new Map();
  const rigParents: Map<string, ReadonlyMap<string, string | null>> = new Map();
  cues.forEach((cue: IAutoMoviePolygonBodyCue, index: number): void => {
    const path: string = `${root}[${index}]`;
    const subject: string = cue.subject;
    const bone: string = cue.bone;
    if (!placements.has(subject))
      collector.push(
        "type",
        `${path}.subject`,
        "must name a staged subject",
        subject,
      );
    else {
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

    const at: number = cue.at;
    const duration: number = cue.duration;
    if (at < 0 || at >= shotDuration)
      collector.push(
        "range",
        `${path}.at`,
        "must be finite source-shot seconds within [0, shot duration)",
        at,
      );
    if (duration < 0 || at + duration > shotDuration)
      collector.push(
        "range",
        `${path}.duration`,
        "must be finite nonnegative seconds ending by the shot end",
        duration,
      );

    collector.unitQuaternion(
      `${path}.rotation`,
      cue.rotation,
      "polygon body cue rotation",
    );
  });

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
        parent !== null && parent !== undefined && depth < parents.size;
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
