import * as archetypes from "@automovie/archetypes";
import type { AutoMovieComposition } from "@automovie/engine";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import ts from "typescript";

import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { formatSceneChain } from "../../src/scenes/formatSceneChain";
import { SceneChainNames } from "../../src/scenes/package/SceneChainNames";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";
import type { ISceneChainNames } from "../../src/scenes/structures/ISceneChainNames";

/**
 * The code a scene page shows under "How is this made?" is the composition the scene plays: run against the packages, it builds exactly the composition and registers exactly the laws the playground and the bake build.
 *
 * Scenarios:
 * 1. For every scene that plays, objects and mutual actions included, the shown code, compiled from TypeScript and run with the names it imports from `@automovie/motions` and with `@automovie/archetypes`, gives a `scene` whose composition node equals the playground's, and a `laws` list of the same laws.
 * 2. The code names every performer's subject.
 */
export function test_website_scene_chain(): void {
  const exported: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;
  const findings: string[] = [];
  let checked: number = 0;
  for (const scene of SCENES) {
    if (scene.composition === null || SceneStatus.of(scene).kind !== "plays")
      continue;
    const composition: IPlaygroundComposition = scene.composition;
    const names: ISceneChainNames = SceneChainNames.read(composition);
    const code: string = formatSceneChain(composition, names);

    // 1. Run the shown code with what it imports.
    const imported: string[] = (
      /^import \{ ([^}]+) \} from "@automovie\/motions";/m.exec(code)?.[1] ?? ""
    )
      .split(",")
      .map((name: string): string => name.trim())
      .filter((name: string): boolean => name !== "");
    // The shown code is TypeScript; it runs as the JavaScript it compiles to.
    const body: string = ts.transpileModule(
      code.replace(/^import[^\n]*\n/gm, ""),
      { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
    ).outputText;
    let shown: { scene: { node: AutoMovieComposition }; laws: unknown[] };
    try {
      shown = new Function(
        ...imported,
        "archetypes",
        `${body}\nreturn { scene, laws: typeof laws === "undefined" ? [] : laws };`,
      )(
        ...imported.map((name: string): unknown => exported[name]),
        archetypes,
      ) as { scene: { node: AutoMovieComposition }; laws: unknown[] };
    } catch (error) {
      findings.push(
        `${scene.id}: the shown code does not run: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const built: PlaygroundChain.IBuilt = PlaygroundChain.build(composition);
    if (JSON.stringify(shown.scene.node) !== JSON.stringify(built.composition))
      findings.push(
        `${scene.id}: the shown composition differs from the played one`,
      );
    const lawNames: (laws: readonly unknown[]) => string[] = (
      laws: readonly unknown[],
    ): string[] =>
      laws.map((law: unknown): string => (law as { name: string }).name);
    if (
      JSON.stringify(lawNames(shown.laws)) !==
      JSON.stringify(lawNames(built.laws))
    )
      findings.push(
        `${scene.id}: the shown laws differ from the registered ones`,
      );

    // 2. Every subject.
    for (const performer of composition.performers)
      if (
        !code.includes(
          `HumanChain.subject(${JSON.stringify(performer.subject)})`,
        )
      )
        findings.push(`${scene.id}: ${performer.subject} is not named`);
    checked++;
  }
  TestValidator.equals(
    "the shown code is the played composition",
    findings,
    [],
  );
  TestValidator.predicate(
    "scenes with objects and mutual actions were checked",
    checked > 0 &&
      SCENES.some(
        (s: IScene): boolean =>
          s.composition !== null &&
          (s.composition.objects ?? []).length !== 0 &&
          SceneStatus.of(s).kind === "plays",
      ) &&
      SCENES.some(
        (s: IScene): boolean =>
          s.composition !== null &&
          s.composition.mutuals.length !== 0 &&
          SceneStatus.of(s).kind === "plays",
      ),
  );
}
