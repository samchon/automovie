import { HUMAN_ACTIONS } from "@automovie/motions";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionUsage } from "../../src/motions/MotionUsage";
import { MotionReference } from "../../src/motions/package/MotionReference";
import type { IMotionReference } from "../../src/motions/structures/IMotionReference";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The motion reference lists what the installed package has, and each name's scenes are the scenes that compose it.
 *
 * Scenarios:
 * 1. The actions are the keys of `HUMAN_ACTIONS`, in the package's order.
 * 2. Every row of the installed `HUMAN_LEXICON` is on exactly one family page.
 * 3. For every action and row, the scenes listed are exactly the listed scenes whose composition names it, and a "Try it alone" composition performs that name after a standing start.
 */
export function test_website_motion_reference(): void {
  const reference: IMotionReference = MotionReference.read();

  // 1. Actions.
  TestValidator.equals("the actions", reference.actions, Object.keys(HUMAN_ACTIONS));

  // 2. Rows.
  const lexicon: unknown = (motions as Readonly<Record<string, unknown>>)["HUMAN_LEXICON"];
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
  TestValidator.equals("every row on one page", [...listed].sort(), [...installed].sort());

  // 3. Uses.
  const names: string[] = [...reference.actions, ...listed];
  const findings: string[] = [];
  for (const name of names) {
    const expected: string[] = SCENES.filter(
      (scene: IScene): boolean =>
        scene.hidden !== true &&
        scene.composition !== null &&
        (JSON.stringify(scene.composition.performers).includes(`"name":${JSON.stringify(name)}`) ||
          scene.composition.mutuals.some(
            (m: IPlaygroundComposition.IMutual): boolean => m.name === name,
          )),
    ).map((scene: IScene): string => scene.id);
    const found: string[] = MotionUsage.of(name).scenes.map(
      (s: { id: string }): string => s.id,
    );
    if (JSON.stringify(found) !== JSON.stringify(expected))
      findings.push(`${name}: lists ${found.join(", ")} for ${expected.join(", ")}`);
    const trial: IPlaygroundComposition = MotionUsage.trial(name);
    if (trial.performers[0]!.actions.at(-1)!.name !== name)
      findings.push(`${name}: the trial performs something else`);
  }
  TestValidator.equals("each name's scenes", findings, []);
}
