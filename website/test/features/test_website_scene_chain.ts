import type { AutoMovieComposition } from "@automovie/engine";
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { formatSceneChain } from "../../src/scenes/formatSceneChain";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The code a scene page shows under "How is this made?" is the composition the scene plays: run against `@automovie/motions`, it builds each person's chain exactly as the playground and the bake build it.
 *
 * Scenarios:
 * 1. For every scene that plays and places no object, the shown code, run with the package's `HumanChain`, gives one chain per performer whose composition node equals the playground's chain of that performer.
 * 2. The code names every performer's subject, and joins the chains with `with`.
 */
export function test_website_scene_chain(): void {
  const findings: string[] = [];
  for (const scene of SCENES) {
    if (scene.composition === null || SceneStatus.of(scene).kind !== "plays")
      continue;
    if ((scene.composition.objects ?? []).length !== 0) continue;
    const composition: IPlaygroundComposition = scene.composition;
    const code: string = formatSceneChain(composition);

    // 1. Run the shown code: its import is the package's chain, its
    // constants are the chains.
    const identifiers: string[] = composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): string =>
        p.subject.replace(/[^A-Za-z0-9_$]/g, "_"),
    );
    const body: string = code.replace(/^import[^\n]*\n/, "");
    const chains: { node: AutoMovieComposition }[] = new Function(
      "HumanChain",
      `${body}\nreturn [${identifiers.join(", ")}];`,
    )(HumanChain) as { node: AutoMovieComposition }[];
    const built: AutoMovieComposition =
      PlaygroundChain.build(composition).composition;

    // The playground's composition is a sequence whose first part runs every
    // person's chain in parallel.
    const parallel: unknown = (built as unknown as { parts: unknown[] })
      .parts[0];
    const parts: AutoMovieComposition[] = (
      parallel as { parts: AutoMovieComposition[] }
    ).parts;
    chains.forEach((chain: { node: AutoMovieComposition }, i: number): void => {
      if (JSON.stringify(chain.node) !== JSON.stringify(parts[i]))
        findings.push(
          `${scene.id}: ${identifiers[i]}'s chain differs from the playground's`,
        );
    });

    // 2. Every subject, and the join.
    for (const performer of composition.performers)
      if (
        !code.includes(
          `HumanChain.subject(${JSON.stringify(performer.subject)})`,
        )
      )
        findings.push(`${scene.id}: ${performer.subject} is not named`);
    if (composition.performers.length > 1 && !code.includes(".with("))
      findings.push(`${scene.id}: the chains are not joined`);
  }
  TestValidator.equals(
    "the shown code is the played composition",
    findings,
    [],
  );
  TestValidator.predicate(
    "at least one scene was checked",
    SCENES.some(
      (s: IScene): boolean =>
        s.composition !== null &&
        (s.composition.objects ?? []).length === 0 &&
        SceneStatus.of(s).kind === "plays",
    ),
  );
}
