import type { bindHumanSimulationGrips } from "./bindHumanSimulationGrips";

/*
 * The coupled groups of a simulated window at each step: performers who grip
 * each other while both still track are fitted together against one snapshot,
 * each connected set of such pairs one group.
 *
 * A one-way grip is no group: its receiver is read where the solver put it,
 * which the engine's individual fit already does. The label names the group's
 * members, so a step's group is the same string wherever it holds.
 * Parameter grips: Every grip of the window.
 * Parameter releases: Each simulated performer's release step; past the interval
 * count for one never released.
 * Parameter end: The last step the solver may own a segment.
 * Returns: Each step's labels by performer; a step without a group is absent.
 */
export function coupleHumanSimulationGrips(
  grips: readonly coupleHumanSimulationGrips.IGrip[],
  releases: ReadonlyMap<string, number>,
  end: number,
): Map<number, Map<string, string>> {
  const groups: Map<number, Map<string, string>> = new Map();
  for (let step: number = 1; step <= end; step++) {
    const active: readonly coupleHumanSimulationGrips.IGrip[] = grips.filter(
      (grip: coupleHumanSimulationGrips.IGrip): boolean =>
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
          (other: coupleHumanSimulationGrips.IGrip): boolean =>
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

/*
 * What a coupling reads of a grip.
 */
export namespace coupleHumanSimulationGrips {
  /*
   * A grip's two performers and its steps.
   */
  export type IGrip = Pick<
    bindHumanSimulationGrips.IGrip,
    "subject" | "partner" | "from" | "to"
  >;
}

/*
 * Code-unit order of two ids, the deterministic order of a label.
 */
function ordinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
