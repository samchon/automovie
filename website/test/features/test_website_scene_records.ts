import { HUMAN_ACTIONS } from "@automovie/motions";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PLAYGROUND_BODIES } from "../../src/playground/data/PLAYGROUND_BODIES";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { SceneFacts } from "../../src/scenes/SceneFacts";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import { IScene } from "../../src/scenes/structures/IScene";

/**
 * Every scene record is whole, and together the records cover the vocabulary the installed package has.
 *
 * Scenarios:
 * 1. Scene ids are unique, and every setting is one of the gallery's.
 * 2. A scene with a composition casts exactly its performers, in their order; each performer's body is one of the site's bodies; each take names only those performers and bodies; the first take is the scene itself.
 * 3. A scene with a composition that waits, and every planned scene, names the issues it waits on; a planned scene states its cast and pieces and has no takes.
 * 4. Every action of `HUMAN_ACTIONS` and every family of the installed lexicon is composed by at least one scene, so nothing the package performs is left out of the site.
 */
export function test_website_scene_records(): void {
  // 1. Ids and settings.
  const ids: string[] = SCENES.map((s: IScene): string => s.id);
  TestValidator.equals("scene ids are unique", new Set(ids).size, ids.length);
  TestValidator.equals(
    "every setting is the gallery's",
    SCENES.filter(
      (s: IScene): boolean =>
        !(IScene.SETTINGS as readonly string[]).includes(s.setting),
    ).map((s: IScene): string => s.id),
    [],
  );

  // 2. Cast, bodies and takes.
  const findings: string[] = [];
  for (const scene of SCENES) {
    if (scene.composition === null) continue;
    const subjects: string[] = scene.composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): string => p.subject,
    );
    if (
      JSON.stringify(scene.cast.map((c: IScene.ICast): string => c.subject)) !==
      JSON.stringify(subjects)
    )
      findings.push(`${scene.id}: the cast is not its performers`);
    for (const performer of scene.composition.performers)
      if (!(performer.body in PLAYGROUND_BODIES))
        findings.push(`${scene.id}: ${performer.subject} has no body ${performer.body}`);
    if (scene.takes.length === 0 || Object.keys(scene.takes[0]!).length !== 1)
      findings.push(`${scene.id}: the first take is not the scene itself`);
    for (const take of scene.takes) {
      for (const [subject, body] of Object.entries(take.bodies ?? {}))
        if (!subjects.includes(subject) || !(body in PLAYGROUND_BODIES))
          findings.push(`${scene.id} ${take.label}: ${subject} as ${body}`);
      for (const subject of Object.keys(take.proficiency ?? {}))
        if (!subjects.includes(subject))
          findings.push(`${scene.id} ${take.label}: no performer ${subject}`);
    }
  }
  TestValidator.equals("every record is whole", findings, []);

  // 3. What a scene waits on.
  TestValidator.equals(
    "a scene that does not play names its issues",
    SCENES.filter(
      (s: IScene): boolean =>
        SceneStatus.of(s).kind !== "plays" && s.needs.length === 0,
    ).map((s: IScene): string => s.id),
    [],
  );
  TestValidator.equals(
    "a planned scene states its cast and pieces and has no takes",
    SCENES.filter(
      (s: IScene): boolean =>
        s.composition === null &&
        (s.planned === undefined || s.takes.length !== 0),
    ).map((s: IScene): string => s.id),
    [],
  );

  // 4. Coverage of the installed vocabulary.
  const used: Set<string> = new Set(SCENES.flatMap(SceneFacts.actions));
  TestValidator.equals(
    "every action is composed by a scene",
    Object.keys(HUMAN_ACTIONS).filter((name: string): boolean => !used.has(name)),
    [],
  );
  const lexicon: unknown = (motions as Readonly<Record<string, unknown>>)["HUMAN_LEXICON"];
  const families: Record<string, { name: string }[]> =
    typeof lexicon === "object" && lexicon !== null
      ? (lexicon as Record<string, { name: string }[]>)
      : {};
  TestValidator.equals(
    "every family of the lexicon is composed by a scene",
    Object.entries(families)
      .filter(([, rows]: [string, { name: string }[]]): boolean =>
        rows.every((row: { name: string }): boolean => !used.has(row.name)),
      )
      .map(([name]: [string, { name: string }[]]): string => name),
    [],
  );
}
