import type {
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieScript,
} from "@automovie/interface";

/**
 * Refuse duplicate script beat ids and answer the beat the performance names,
 * the first declaration of its id.
 *
 * Each repeated id is one `type` violation at `$script.beats[<index>].id`
 * naming the index of its first declaration. The performance's beat is looked
 * up among first declarations only, so a duplicate never shadows it.
 *
 * @param context The shot's gate context: its collector and its performance.
 * @param script The script whose beats the performance names.
 * @returns The first beat declared with the performance's beat id, or undefined
 *   when the script has none.
 */
export function gatePerformShotScript(
  context: IAutoMovieEnginePerformShotGateContext,
  script: IAutoMovieScript,
): IAutoMovieScript["beats"][number] | undefined {
  const first: Map<string, number> = new Map();
  script.beats.forEach(
    (beat: IAutoMovieScript["beats"][number], index: number): void => {
      const existing: number | undefined = first.get(beat.id);
      if (existing === undefined) first.set(beat.id, index);
      else
        context.out.push(
          "type",
          `$script.beats[${index}].id`,
          `script beat id "${beat.id}" is duplicated; first declared at $script.beats[${existing}].id`,
          beat.id,
        );
    },
  );
  const index: number | undefined = first.get(context.performance.beat);
  return index === undefined ? undefined : script.beats[index];
}
