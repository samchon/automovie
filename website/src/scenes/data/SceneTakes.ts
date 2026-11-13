import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";

/**
 * The takes most scenes offer beside themselves: another seed, other bodies
 * and other skill. Each varies one choice of the same composition, so the
 * takes side by side show what that one choice changes.
 */
export namespace SceneTakes {
  /**
   * The four standard takes of a composition.
   *
   * @param composition The scene's composition.
   * @param skill The skill every performer has in the last take.
   * @returns The scene itself, a second seed, the bodies exchanged, and every performer at `skill`.
   */
  export function of(
    composition: IPlaygroundComposition,
    skill: IPlaygroundComposition.Proficiency = "novice",
  ): IScene.ITake[] {
    return [
      { label: "The scene" },
      { label: "Another seed", seed: `${composition.seed}-2` },
      {
        label: "Other bodies",
        bodies: Object.fromEntries(
          composition.performers.map(
            (performer: IPlaygroundComposition.IPerformer): [string, string] => [
              performer.subject,
              EXCHANGE[performer.body] ?? performer.body,
            ],
          ),
        ),
      },
      {
        label: `Every performer ${skill}`,
        proficiency: Object.fromEntries(
          composition.performers.map(
            (
              performer: IPlaygroundComposition.IPerformer,
            ): [string, IPlaygroundComposition.Proficiency] => [
              performer.subject,
              skill,
            ],
          ),
        ),
      },
    ];
  }

  /** The body each body is exchanged for: a woman for a man of the other build, and back. */
  const EXCHANGE: Readonly<Record<string, string>> = {
    f1: "m2",
    f2: "m1",
    m1: "f2",
    m2: "f1",
  };
}
