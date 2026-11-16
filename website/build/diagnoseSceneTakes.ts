// Compute every literal take of one scene, without the browser or its queue.
//
// From website/: ttsx --no-plugins -P build/tsconfig.json build/diagnoseSceneTakes.ts <scene-id> [--take "exact take label"]
//
// JSON lines identify every authored input and its hash, then separately
// name the execution selection before the first expensive computation.
// With no --take every take runs; an exact label selects only that take.
// Each start and outcome is logged. A missing end or completion record is
// incomplete evidence, not a refusal. The same public take computation as
// the worker plans the whole composition and poses every SCENE_FPS frame.
// No refusal is invented from refusedUntil; it is logged only as metadata.
import { createHash } from "node:crypto";

import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../src/playground/structures/IPlaygroundRefusal";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import type { ITake } from "../src/takes/structures/ITake";

/** One original take and the exact applied input whose JSON is hashed. */
interface IInput {
  index: number;
  label: string;
  sha256: string;
  composition: IPlaygroundComposition;
}

/**
 * Observe all takes, or one exact label, with one process and no retries.
 * This deliberately keeps the public computation's ordinary body and rest
 * caches; its timings do not measure a cold browser worker or queue wait.
 * A returned refusal is an observed result. An unexpected error sets a
 * failing exit code after the remaining takes have also been attempted.
 */
function main(): void {
  const id: string | undefined = process.argv[2];
  if (id === undefined || id.startsWith("--"))
    throw new Error("Expected an exact scene id, optionally followed by --take and an exact label");
  let chosenLabel: string | undefined;
  for (let index: number = 3; index < process.argv.length; index++) {
    const argument: string = process.argv[index]!;
    if (argument !== "--take" && !argument.startsWith("--take="))
      throw new Error(`Unknown take diagnostic argument ${JSON.stringify(argument)}`);
    if (chosenLabel !== undefined)
      throw new Error("--take may be supplied only once");
    chosenLabel = argument === "--take"
      ? process.argv[++index]
      : argument.slice("--take=".length);
    if (chosenLabel === undefined || chosenLabel.length === 0)
      throw new Error("--take requires one exact take label");
  }
  const scene: IScene | undefined = SCENES.find(
    (record: IScene): boolean => record.id === id,
  );
  if (scene === undefined) throw new Error(`No scene has the exact id ${JSON.stringify(id)}`);
  if (scene.composition === null || scene.takes.length === 0)
    throw new Error(`Scene ${id} has no authored takes to compute`);
  const base: IPlaygroundComposition = scene.composition;
  const inputs: IInput[] = scene.takes.map(
    (take: IScene.ITake, index: number): IInput => {
      const composition: IPlaygroundComposition = SceneTake.apply(base, take);
      return {
        index,
        label: take.label,
        sha256: createHash("sha256").update(JSON.stringify(composition)).digest("hex"),
        composition,
      };
    },
  );
  const selected: IInput[] = chosenLabel === undefined
    ? inputs
    : inputs.filter((input: IInput): boolean => input.label === chosenLabel);
  if (chosenLabel !== undefined && selected.length !== 1)
    throw new Error(
      selected.length === 0
        ? `Scene ${id} has no take with the exact label ${JSON.stringify(chosenLabel)}`
        : `Scene ${id} repeats the take label ${JSON.stringify(chosenLabel)}`,
    );
  console.log(JSON.stringify({
    event: "scene-takes-selection",
    scene: scene.id,
    refusedUntil: scene.refusedUntil ?? null,
    fps: SCENE_FPS,
    pid: process.pid,
    node: process.version,
    inputs,
  }));
  console.log(JSON.stringify({
    event: "scene-takes-execution-selection",
    scene: scene.id,
    mode: chosenLabel === undefined ? "all" : "exact-label",
    selected: selected.map(
      (input: IInput): { index: number; label: string; sha256: string } => ({
        index: input.index,
        label: input.label,
        sha256: input.sha256,
      }),
    ),
  }));
  const opened: number = performance.now();
  let tracks: number = 0;
  let refusals: number = 0;
  let errors: number = 0;
  for (const input of selected) {
    const started: number = performance.now();
    console.log(JSON.stringify({
      event: "scene-take-start",
      scene: scene.id,
      index: input.index,
      label: input.label,
      sha256: input.sha256,
      at: new Date().toISOString(),
    }));
    try {
      const result: ITake | IPlaygroundRefusal = TakeCompute.take(
        input.composition,
        SCENE_FPS,
      );
      if ("track" in result) {
        tracks++;
        console.log(JSON.stringify({
          event: "scene-take-end",
          scene: scene.id,
          index: input.index,
          elapsedSeconds: (performance.now() - started) / 1000,
          outcome: "track",
          duration: result.duration,
          fps: result.track.fps,
          frames: result.track.frames,
          values: result.track.values.length,
          figures: result.figures.map(
            (figure: ITake.IFigure): { subject: string; body: string } => ({
              subject: figure.subject,
              body: figure.body,
            }),
          ),
          props: result.props,
          timeline: result.timeline,
        }));
      } else {
        if (result.kind === "error") errors++;
        else refusals++;
        console.log(JSON.stringify({
          event: "scene-take-end",
          scene: scene.id,
          index: input.index,
          elapsedSeconds: (performance.now() - started) / 1000,
          outcome: result.kind === "error" ? "error" : "refusal",
          refusal: result,
        }));
      }
    } catch (error) {
      errors++;
      console.log(JSON.stringify({
        event: "scene-take-end",
        scene: scene.id,
        index: input.index,
        elapsedSeconds: (performance.now() - started) / 1000,
        outcome: "thrown",
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { message: String(error) },
      }));
    }
  }
  console.log(JSON.stringify({
    event: "scene-takes-complete",
    scene: scene.id,
    elapsedSeconds: (performance.now() - opened) / 1000,
    authored: inputs.length,
    selected: selected.length,
    completed: tracks + refusals + errors,
    tracks,
    refusals,
    errors,
  }));
  if (errors !== 0) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
