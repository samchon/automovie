import { HUMAN_ACTIONS } from "@automovie/motions";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionUsage } from "../../src/motions/MotionUsage";
import { MotionReference } from "../../src/motions/package/MotionReference";
import type { IMotionReference } from "../../src/motions/structures/IMotionReference";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The motion reference lists what the installed package has, and each name's scenes are the scenes that compose it.
 *
 * Scenarios:
 * 1. The actions are the keys of `HUMAN_ACTIONS`, in the package's order.
 * 2. Every row of the installed `HUMAN_LEXICON` is on exactly one family page.
 * 3. For every action and row, the scenes listed are exactly the listed scenes whose composition names it; its trial is either one person performing that name after a standing start, or, when the first use names another person, an object or an anchor, the first of those scenes that plays on the installed packages, and none only when no such scene plays, so a trial never names someone who is not there or opens a scene the packages refuse.
 */
export function test_website_motion_reference(): void {
  const reference: IMotionReference = MotionReference.read();

  // 1. Actions.
  TestValidator.equals(
    "the actions",
    reference.actions,
    Object.keys(HUMAN_ACTIONS),
  );

  // 2. Rows.
  const lexicon: unknown = (motions as Readonly<Record<string, unknown>>)[
    "HUMAN_LEXICON"
  ];
  const installed: string[] =
    typeof lexicon === "object" && lexicon !== null
      ? Object.values(lexicon as Record<string, { name: string }[]>)
          .flat()
          .map((row: { name: string }): string => row.name)
      : [];
  const listed: string[] = reference.families.flatMap(
    (f: IMotionReference.IFamily): string[] =>
      f.rows.map((r: IMotionReference.IRow): string => r.name),
  );
  TestValidator.equals(
    "every row on one page",
    [...listed].sort(),
    [...installed].sort(),
  );

  // 3. Uses.
  const names: string[] = [...reference.actions, ...listed];
  const findings: string[] = [];
  for (const name of names) {
    const expected: string[] = SCENES.filter(
      (scene: IScene): boolean =>
        scene.hidden !== true &&
        scene.composition !== null &&
        (JSON.stringify(scene.composition.performers).includes(
          `"name":${JSON.stringify(name)}`,
        ) ||
          scene.composition.mutuals.some(
            (m: IPlaygroundComposition.IMutual): boolean => m.name === name,
          )),
    ).map((scene: IScene): string => scene.id);
    const found: string[] = MotionUsage.of(name).scenes.map(
      (s: { id: string }): string => s.id,
    );
    if (JSON.stringify(found) !== JSON.stringify(expected))
      findings.push(
        `${name}: lists ${found.join(", ")} for ${expected.join(", ")}`,
      );
    const trial: MotionUsage.ITrial | null = MotionUsage.trial(name);
    const playing: IScene | undefined = SCENES.find(
      (scene: IScene): boolean =>
        found.includes(scene.id) && SceneStatus.of(scene).kind === "plays",
    );
    if (trial === null) {
      if (playing !== undefined)
        findings.push(`${name}: no trial, though ${playing.id} plays`);
    } else if (trial.label === "Try it alone") {
      if (trial.composition.performers[0]!.actions.at(-1)!.name !== name)
        findings.push(`${name}: the trial performs something else`);
    } else if (
      playing === undefined ||
      trial.label !== `Try it in ${playing.title}` ||
      JSON.stringify(trial.composition.performers) !==
        JSON.stringify(playing.composition!.performers)
    )
      findings.push(`${name}: the trial is not its first playing scene`);
  }
  TestValidator.equals("each name's scenes", findings, []);
}
