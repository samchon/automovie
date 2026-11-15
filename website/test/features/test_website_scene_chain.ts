import * as archetypes from "@automovie/archetypes";
import type { AutoMovieComposition } from "@automovie/engine";
import type { IHumanProp } from "@automovie/motions";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import ts from "typescript";

import { PlaygroundChain } from "../../src/playground/package/PlaygroundChain";
import { PlaygroundObjects } from "../../src/playground/package/PlaygroundObjects";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { formatSceneChain } from "../../src/scenes/formatSceneChain";
import { SceneChainNames } from "../../src/scenes/package/SceneChainNames";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";
import type { ISceneChainNames } from "../../src/scenes/structures/ISceneChainNames";

/**
 * The code a scene page shows under "How is this made?" is the composition the scene plays: run against the packages, it builds exactly the composition, registers exactly the laws, and places exactly the props the playground and the bake build, and hands them to `HumanPerformance` as `PlaygroundPerformance` does.
 *
 * Scenarios:
 * 1. For every scene the bake computes, refused ones included, objects and mutual actions included, the shown code, compiled from TypeScript and run with the names it imports from `@automovie/motions`, with `@automovie/archetypes` and with a stand-in for each body, up to its last line, `const performance = new HumanPerformance(input);`, which it must end with and which is not run because planning costs seconds a scene: gives a `scene` whose composition node equals the playground's, and a `laws` list of the same laws.
 * 2. The code names every performer's subject.
 * 3. The shown `input` carries that composition node, each performer's subject, body, floor point, heading and skill, the laws only when there are some, and the props only when the scene places objects; its props are those `PlaygroundObjects.props` builds: the same subjects in order, the same `worn` wearer, bone and offset, and the same placed frame within a micrometre and a millionth of a quaternion component.
 */
export function test_website_scene_chain(): void {
  const exported: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;
  const findings: string[] = [];
  let checked: number = 0;
  const LAST: string = "const performance = new HumanPerformance(input);";
  for (const scene of SCENES) {
    if (scene.composition === null || !SceneStatus.bakes(SceneStatus.of(scene)))
      continue;
    const composition: IPlaygroundComposition = scene.composition;
    const names: ISceneChainNames = SceneChainNames.read(composition);
    const code: string = formatSceneChain(composition, names);
    if (!code.endsWith(`\n${LAST}`)) {
      findings.push(
        `${scene.id}: the shown code does not build the performance`,
      );
      continue;
    }

    // 1. Run the shown code with what it imports, each body standing in as
    // its id, up to the performance it builds.
    const imported: string[] = (
      /^import \{ ([^}]+) \} from "@automovie\/motions";/m.exec(code)?.[1] ?? ""
    )
      .split(",")
      .map((name: string): string => name.trim())
      .filter((name: string): boolean => name !== "");
    // The shown code is TypeScript; it runs as the JavaScript it compiles to.
    const body: string = ts.transpileModule(
      code.slice(0, -LAST.length).replace(/^import[^\n]*\n/gm, ""),
      { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
    ).outputText;
    const bodies: Record<string, string> = Object.fromEntries(
      composition.performers.map(
        (p: IPlaygroundComposition.IPerformer): [string, string] => [
          p.body,
          p.body,
        ],
      ),
    );
    let shown: IShown;
    try {
      shown = new Function(
        ...imported,
        "archetypes",
        "bodies",
        `${body}\nreturn { scene, laws: typeof laws === "undefined" ? [] : laws, input };`,
      )(
        ...imported.map((name: string): unknown => exported[name]),
        archetypes,
        bodies,
      ) as IShown;
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

    // 3. The performance's input, and its props.
    findings.push(...input(scene.id, composition, shown, built));
    checked++;
  }
  TestValidator.equals(
    "the shown code is the played composition",
    findings,
    [],
  );
  TestValidator.predicate(
    "scenes with objects, worn objects and mutual actions were checked",
    checked > 0 &&
      SCENES.some(
        (s: IScene): boolean =>
          s.composition !== null &&
          (s.composition.objects ?? []).length !== 0 &&
          SceneStatus.bakes(SceneStatus.of(s)),
      ) &&
      SCENES.some(
        (s: IScene): boolean =>
          s.composition !== null &&
          (s.composition.objects ?? []).some(
            (o: IPlaygroundComposition.IObject): boolean =>
              o.worn !== undefined,
          ) &&
          SceneStatus.bakes(SceneStatus.of(s)),
      ) &&
      SCENES.some(
        (s: IScene): boolean =>
          s.composition !== null &&
          s.composition.mutuals.length !== 0 &&
          SceneStatus.bakes(SceneStatus.of(s)),
      ),
  );
}

/** What the shown code leaves for the test to read. */
interface IShown {
  /** The joined chain. */
  scene: { node: AutoMovieComposition };

  /** The laws it registers; empty when it lists none. */
  laws: unknown[];

  /** The input it builds the performance from. */
  input: {
    seed: string;
    performers: {
      subject: string;
      body: unknown;
      at: { x: number; y: number; z: number };
      yaw: number;
      proficiency: { level: string };
    }[];
    composition: unknown;
    props?: IHumanProp[];
    laws?: unknown[];
  };
}

/** The findings on the shown performance input of one scene, against the composition and the props the playground builds. */
function input(
  id: string,
  composition: IPlaygroundComposition,
  shown: IShown,
  built: PlaygroundChain.IBuilt,
): string[] {
  const findings: string[] = [];
  const given: IShown["input"] = shown.input;
  if (given.seed !== composition.seed) findings.push(`${id}: another seed`);
  if (given.composition !== shown.scene.node)
    findings.push(`${id}: the input is not the shown composition`);
  if (
    JSON.stringify(given.performers) !==
    JSON.stringify(
      composition.performers.map(
        (
          p: IPlaygroundComposition.IPerformer,
        ): IShown["input"]["performers"][number] => ({
          subject: p.subject,
          body: p.body,
          at: { x: p.x, y: 0, z: p.z },
          yaw: p.yaw,
          proficiency: { level: p.proficiency },
        }),
      ),
    )
  )
    findings.push(`${id}: the input's performers differ from the composition`);
  if ((given.laws !== undefined) !== (built.laws.length !== 0))
    findings.push(`${id}: the laws are given where the playground gives none`);

  // The props, against those the playground builds.
  const expected: IHumanProp[] | undefined = PlaygroundObjects.props(
    composition.objects ?? [],
  );
  if ((given.props === undefined) !== (expected === undefined)) {
    findings.push(`${id}: the props are given where the playground gives none`);
    return findings;
  }
  const made: IHumanProp[] = given.props ?? [];
  const wanted: IHumanProp[] = expected ?? [];
  if (
    JSON.stringify(made.map((p: IHumanProp): string => p.subject)) !==
    JSON.stringify(wanted.map((p: IHumanProp): string => p.subject))
  ) {
    findings.push(`${id}: the props' subjects differ`);
    return findings;
  }
  wanted.forEach((want: IHumanProp, i: number): void => {
    const prop: IHumanProp = made[i]!;
    if (JSON.stringify(prop.worn) !== JSON.stringify(want.worn))
      findings.push(`${id}: ${want.subject} is worn otherwise`);
    const near: (a: number, b: number, tolerance: number) => boolean = (
      a: number,
      b: number,
      tolerance: number,
    ): boolean => Math.abs(a - b) <= tolerance;
    const p: IHumanProp.IFrame = prop.frame;
    const q: IHumanProp.IFrame = want.frame;
    if (
      !near(p.position.x, q.position.x, 1e-6) ||
      !near(p.position.y, q.position.y, 1e-6) ||
      !near(p.position.z, q.position.z, 1e-6) ||
      !near(p.rotation.x, q.rotation.x, 1e-6) ||
      !near(p.rotation.y, q.rotation.y, 1e-6) ||
      !near(p.rotation.z, q.rotation.z, 1e-6) ||
      !near(p.rotation.w, q.rotation.w, 1e-6)
    )
      findings.push(`${id}: ${want.subject} is placed otherwise`);
  });
  return findings;
}
