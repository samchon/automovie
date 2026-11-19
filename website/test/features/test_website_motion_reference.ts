import { HUMAN_ACTIONS } from "@automovie/motions";
import * as motions from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionUsage } from "../../src/motions/MotionUsage";
import { MotionReference } from "../../src/motions/package/MotionReference";
import type { IMotionReference } from "../../src/motions/structures/IMotionReference";
import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import { SceneStatus } from "../../src/scenes/package/SceneStatus";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * The motion reference lists what the installed package has, and each name's scenes are the scenes that compose it.
 *
 * Scenarios:
 * 1. The actions are the keys of `HUMAN_ACTIONS`, in the package's order, and each action and row with a schema in `HUMAN_LEXICON_SCHEMAS` lists that schema's parameters, so the actions' parameters show too.
 * 2. Every row of the installed `HUMAN_LEXICON` is on exactly one family page.
 * 3. For every action and row, the scenes listed are exactly the listed scenes whose composition names it. A trial alone needs a primary action, complete independent parameters and no authored forces in its first scene. Other trials preserve the first playing scene's entire context and round trip through its address.
 * 4. At least one first use has empty parameters, no required schema parameter and authored forces. It must keep its full scene rather than silently turn a force-driven action into its zero-input solo.
 */
export function test_website_motion_reference(): void {
  const reference: IMotionReference = MotionReference.read();
  const schemas: {
    rows?: Record<string, unknown>;
    actions?: Record<string, unknown>;
  } = ((motions as Readonly<Record<string, unknown>>)[
    "HUMAN_LEXICON_SCHEMAS"
  ] ?? {}) as {
    rows?: Record<string, unknown>;
    actions?: Record<string, unknown>;
  };

  // 1. Actions, and every schema's parameters listed.
  TestValidator.equals(
    "the actions",
    reference.actions.map((a: IMotionReference.IRow): string => a.name),
    Object.keys(HUMAN_ACTIONS),
  );
  const unlisted: string[] = [
    ...reference.actions.filter(
      (a: IMotionReference.IRow): boolean =>
        (a.parameters !== null) !==
        Object.hasOwn(schemas.actions ?? {}, a.name),
    ),
    ...reference.families
      .flatMap((f: IMotionReference.IFamily): IMotionReference.IRow[] => f.rows)
      .filter(
        (r: IMotionReference.IRow): boolean =>
          (r.parameters !== null) !== Object.hasOwn(schemas.rows ?? {}, r.name),
      ),
  ].map((r: IMotionReference.IRow): string => r.name);
  TestValidator.equals("every schema's parameters are listed", unlisted, []);
  TestValidator.predicate(
    "some action lists parameters",
    reference.actions.some(
      (a: IMotionReference.IRow): boolean =>
        a.parameters !== null && a.parameters.length !== 0,
    ),
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
  const entries: IMotionReference.IRow[] = [
    ...reference.actions,
    ...reference.families.flatMap(
      (f: IMotionReference.IFamily): IMotionReference.IRow[] => f.rows,
    ),
  ];
  const findings: string[] = [];
  let forceOnlyContexts: number = 0;
  for (const entry of entries) {
    const name: string = entry.name;
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
    const first: IScene | undefined = SCENES.find(
      (scene: IScene): boolean => scene.id === found[0],
    );
    const firstUse: IPlaygroundComposition.IAction | undefined =
      first === undefined ? undefined : firstAction(first, name);
    if (
      (first?.composition?.forces?.length ?? 0) !== 0 &&
      firstUse !== undefined &&
      Object.keys(firstUse.params).length === 0 &&
      (entry.parameters ?? []).every(
        (parameter: IMotionReference.IParameter): boolean =>
          !parameter.required,
      )
    )
      forceOnlyContexts++;
    const trial: MotionUsage.ITrial | null = MotionUsage.trial(
      name,
      entry.parameters,
    );
    const playing: IScene | undefined = SCENES.find(
      (scene: IScene): boolean =>
        found.includes(scene.id) && SceneStatus.of(scene).kind === "plays",
    );
    if (trial === null) {
      if (playing !== undefined)
        findings.push(`${name}: no trial, though ${playing.id} plays`);
    } else if (trial.label === "Try it alone") {
      // The solo performs the first listed scene's own first use of the name.
      const use: IPlaygroundComposition.IAction | undefined =
        first === undefined ? undefined : firstAction(first, name);
      const solo: IPlaygroundComposition.IAction =
        trial.composition.performers[0]!.actions.at(-1)!;
      const missing: string[] = (entry.parameters ?? [])
        .filter(
          (p: IMotionReference.IParameter): boolean =>
            p.required && !Object.hasOwn(solo.params, p.name),
        )
        .map((p: IMotionReference.IParameter): string => p.name);
      if (solo.name !== name)
        findings.push(`${name}: the trial performs something else`);
      if (first !== undefined && use === undefined)
        findings.push(
          `${name}: tried alone, though ${first.id} names it only as a mutual action`,
        );
      if (
        use !== undefined &&
        first?.composition?.performers.every(
          (performer): boolean => !performer.actions.includes(use),
        )
      )
        findings.push(`${name}: the solo drops its carrier action`);
      if ((first?.composition?.forces?.length ?? 0) !== 0)
        findings.push(
          `${name}: the solo drops its first scene's authored forces`,
        );
      if (JSON.stringify(solo.params) !== JSON.stringify(use?.params ?? {}))
        findings.push(`${name}: the solo's parameters are not its first use's`);
      if (missing.length !== 0)
        findings.push(
          `${name}: tried alone without the required ${missing.join(", ")}`,
        );
    } else {
      const opened: IScene | undefined = SCENES.find(
        (scene: IScene): boolean => trial.label === `Try it in ${scene.title}`,
      );
      if (opened !== undefined && SceneStatus.of(opened).kind !== "plays")
        findings.push(
          `${name}: the trial opens ${opened.id}, which is ${SceneStatus.of(opened).kind}`,
        );
      if (
        playing === undefined ||
        opened?.id !== playing.id ||
        JSON.stringify(trial.composition.performers) !==
          JSON.stringify(playing.composition!.performers)
      )
        findings.push(`${name}: the trial is not its first playing scene`);
      if (playing?.composition !== undefined && playing.composition !== null) {
        TestValidator.equals(
          `${name}: the trial preserves the full playing scene context`,
          { ...trial.composition, version: playing.composition.version },
          playing.composition,
        );
        TestValidator.equals(
          `${name}: the full scene trial survives its actual address`,
          PlaygroundAddress.decode(PlaygroundAddress.encode(trial.composition)),
          trial.composition,
        );
      }
    }
  }
  TestValidator.equals("each name's scenes", findings, []);
  TestValidator.predicate(
    "a force-only first use distinguishes context from solo parameters",
    forceOnlyContexts > 0,
  );
  const headTilt: IMotionReference.IRow | undefined = entries.find(
    (entry: IMotionReference.IRow): boolean => entry.name === "headTilt",
  );
  TestValidator.equals(
    "the walking head tilt opens its rehearsal",
    headTilt === undefined
      ? null
      : MotionUsage.trial(headTilt.name, headTilt.parameters)?.label,
    "Try it in Rehearsing reactions",
  );
}

/** A scene's first performer action of a name, overlays included, in the order its chains are written; undefined when only a mutual action names it. */
function firstAction(
  scene: IScene,
  name: string,
): IPlaygroundComposition.IAction | undefined {
  const visit: (
    actions: readonly IPlaygroundComposition.IAction[],
  ) => IPlaygroundComposition.IAction | undefined = (
    actions: readonly IPlaygroundComposition.IAction[],
  ): IPlaygroundComposition.IAction | undefined => {
    for (const action of actions) {
      if (action.name === name) return action;
      const inner: IPlaygroundComposition.IAction | undefined = visit(
        action.over ?? [],
      );
      if (inner !== undefined) return inner;
    }
    return undefined;
  };
  for (const performer of scene.composition?.performers ?? []) {
    const found: IPlaygroundComposition.IAction | undefined = visit(
      performer.actions,
    );
    if (found !== undefined) return found;
  }
  return undefined;
}
