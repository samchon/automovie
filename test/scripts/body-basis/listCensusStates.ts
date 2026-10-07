import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { BodyCensusSets } from "./BodyCensusSets";

/**
 * The census findings of the named sets as states, shape-only states first.
 *
 * A shape-only state's corrective is a product of one-sided channel ramps that
 * hold past their full weight, so it stays on at every body further along
 * those channels, and one solved beside another on a separate shard is added
 * to it where both hold and the heavier bodies cross worse than before either
 * was solved. Every shape-only state is therefore one group, `rest`, solved on
 * one shard in order of generality (fewest channels, then least total weight),
 * so each corrective carries only what the more general ones left. The same
 * holds for one pose worn by several shapes, so a shaped posed state is grouped
 * by its pose (`pose:<json>`). A posed state with no shape is grouped by its
 * name before `@`.
 */
export function listCensusStates(
  census: BodyCensusSets,
  sets: string[],
): IBodyCorrectiveState[] {
  const out: IBodyCorrectiveState[] = [];
  for (const one of sets)
    for (const finding of census[one]?.findings ?? []) {
      const pose = (finding.document.pose ?? []).map((joint) => ({ ...joint }));
      const shoulders = finding.document.shoulders ?? [];
      out.push({
        name: finding.name,
        set: one,
        group:
          pose.length === 0 && shoulders.length === 0
            ? "rest"
            : Object.keys(finding.document.shape ?? {}).length > 0
              ? "pose:" + JSON.stringify([pose, shoulders])
              : finding.name.split("@")[0],
        shape: { ...finding.document.shape },
        pose,
        ...(finding.document.shoulders === undefined ? {} : { shoulders: shoulders.map((goal) => ({ ...goal })) }),
      });
    }
  const generality = (state: IBodyCorrectiveState): [number, number] => {
    const weights = Object.values(state.shape).filter((w) => w !== 0);
    return [weights.length, weights.reduce((s, w) => s + Math.abs(w), 0)];
  };
  const shaped = (state: IBodyCorrectiveState): boolean =>
    state.group === "rest" || state.group.startsWith("pose:");
  const ordered = out.filter(shaped).sort((a, b) => {
    const [ca, wa] = generality(a);
    const [cb, wb] = generality(b);
    return ca - cb || wa - wb;
  });
  return [...ordered, ...out.filter((state) => !shaped(state))];
}
