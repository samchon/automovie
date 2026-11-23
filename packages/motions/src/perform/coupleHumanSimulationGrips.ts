import type { bindHumanSimulationGrips } from "./bindHumanSimulationGrips";

/**
 * The coupled groups of a simulated window at each step: performers who grip
 * each other while both still track are fitted together against one snapshot,
 * each connected set of such pairs one group.
 *
 * A one-way grip is no group: its receiver is read where the solver put it,
 * which the engine's individual fit already does. The label names the group's
 * members, so a step's group is the same string wherever it holds.
 *
 * @param grips Every grip of the window.
 * @param releases Each simulated performer's release step; past the interval
 *   count for one never released.
 * @param end The last step the solver may own a segment.
 * @returns Each step's labels by performer; a step without a group is absent.
 * @evidence contracts/development/common.md#meaningful-documentation States who is grouped, why a one-way grip is not, and the label.
 * @evidence contracts/development/implementation.md#principled-implementation The engine admits a group only with reciprocal adjustable receivers (`preparePhysicalCoupledTargetSchedule`), so a group is a connected set of mutual grips between tracking bodies, found by union-find.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Per step: the active grips, their mutual pairs joined, the sets labelled.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A released performer joins no group, since the engine refuses an inactive member.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S * G^2) for S steps and G grips, G a handful per window.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh maps; retains nothing.
 */
export function coupleHumanSimulationGrips(
  grips: readonly bindHumanSimulationGrips.IGrip[],
  releases: ReadonlyMap<string, number>,
  end: number,
): Map<number, Map<string, string>> {
  const groups: Map<number, Map<string, string>> = new Map();
  for (let step: number = 1; step <= end; step++) {
    const active: readonly bindHumanSimulationGrips.IGrip[] = grips.filter(
      (grip: bindHumanSimulationGrips.IGrip): boolean =>
        grip.from <= step &&
        step <= grip.to &&
        step < releases.get(grip.subject)! &&
        step < releases.get(grip.partner)!,
    );
    const parent: Map<string, string> = new Map();
    const find = (subject: string): string => {
      const up: string = parent.get(subject)!;
      return up === subject ? subject : find(up);
    };
    for (const grip of active)
      if (
        active.some(
          (other: bindHumanSimulationGrips.IGrip): boolean =>
            other.subject === grip.partner && other.partner === grip.subject,
        )
      ) {
        for (const subject of [grip.subject, grip.partner])
          if (!parent.has(subject)) parent.set(subject, subject);
        const a: string = find(grip.subject);
        const b: string = find(grip.partner);
        if (a !== b) parent.set(a < b ? b : a, a < b ? a : b);
      }
    if (parent.size === 0) continue;
    const members: Map<string, string[]> = new Map();
    for (const subject of parent.keys())
      members.set(find(subject), [
        ...(members.get(find(subject)) ?? []),
        subject,
      ]);
    const labels: Map<string, string> = new Map();
    for (const set of members.values())
      for (const subject of set)
        labels.set(subject, `grip:${[...set].sort(ordinal).join(",")}`);
    groups.set(step, labels);
  }
  return groups;
}

/** Code-unit order of two ids, the deterministic order of a label. */
function ordinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
