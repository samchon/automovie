import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createCharacterPerformance } from "../../src/actors/createCharacterPerformance";
import { createDepartureActor } from "../../src/actors/createDepartureActor";
import { createFootControls } from "../../src/actors/createFootControls";
import { createHumanActor } from "../../src/actors/createHumanActor";
import { createHumanParameters } from "../../src/actors/createHumanParameters";
import { createStudentNoteGrip } from "../../src/actors/createStudentNoteGrip";
import { evaluateDeparture } from "../../src/actors/evaluateDeparture";

/** Original accepted boundary and completed failure times for implementation checks. */
export interface IGripPreparationInput {
  boundary: ReturnType<ReturnType<typeof createCharacterPerformance>["snapshot"]>;
  paper: number[];
  event: { time: number; progress: number };
  exitCases: { frame: number; previous: IAutoMovieHumanPose }[];
  expectedFootFingerprint: string;
  expectedMaterialAddresses: { index: object; thumb: object };
}

/** Complete deterministic unit observations, not a visible-performance approval. */
export interface IGripPreparationResult {
  admitted: boolean;
  models: { person: "carina" | "harry"; parameters: ReturnType<typeof createHumanParameters>; profile: { admitted: boolean; hand: ReturnType<typeof createStudentNoteGrip>["hand"]; index: ReturnType<typeof createStudentNoteGrip>["index"]; thumb: ReturnType<typeof createStudentNoteGrip>["thumb"]; frameInHand: number[]; attempts: ReturnType<typeof createStudentNoteGrip>["attempts"] } }[];
  exit: { frame: number; motion?: ReturnType<ReturnType<typeof createDepartureActor>["fit"]>["motion"]; error?: string }[];
  errors: string[];
  elapsedMs: number;
}

/**
 * Exercise the actual two model factories before another expensive whole bake.
 *
 * @evidence contracts/common.md#implementation-and-ownership Calls the production's real Human actor, support descriptor, bounded grip preparation and exit adapter in the same Vite browser environment. No synthetic hand, copied Harry address, altered mesh or replacement IK is used. Carina's neutral material addresses and full-foot fingerprint are compared with the retained original model. The entire exit at24fps and all retained failure neighbours are collected because changing cadence can move a failure away from an old sample. All cases finish before status is reported; failed profiles remain failed. These math/implementation checks do not show or approve the film.
 * @evidence contracts/common.md#authoring-interface Supply the exact retained48s boundary, source forehead event, resting note and prior failure times from the declared epoch. Raw native requests and original triangle/containment results are returned. A profile must pass its unchanged actual physical guards; each exit case must pass original full-foot admission. Call only in the dedicated local fixture host. Every created actor is disposed, and no external tool, playback or media generation is invoked.
 */
export async function run(input: IGripPreparationInput): Promise<IGripPreparationResult> {
  const started: number = performance.now();
  const result: IGripPreparationResult = { admitted: false, models: [], exit: [], errors: [], elapsedMs: 0 };
  for (const person of ["carina", "harry"] as const) {
    let actor: ReturnType<typeof createHumanActor> | undefined;
    try {
      actor = createHumanActor(person);
      const feet: ReturnType<typeof createFootControls> | undefined = person === "carina" ? createFootControls(actor) : undefined;
      const grip: ReturnType<typeof createStudentNoteGrip> = createStudentNoteGrip(actor, person, person === "carina" ? "lower" : "upper");
      result.models.push({ person, parameters: createHumanParameters(person), profile: { admitted: grip.admitted, hand: grip.hand, index: grip.index, thumb: grip.thumb, frameInHand: grip.frameInHand.toArray(), attempts: grip.attempts } });
      if (!grip.admitted) result.errors.push(person + ": finite original-skin grip was not admitted");
      if (feet !== undefined) {
        if (feet.descriptor.fingerprint !== input.expectedFootFingerprint) result.errors.push("Carina full-foot model fingerprint changed");
        if (JSON.stringify({ index: grip.index, thumb: grip.thumb }) !== JSON.stringify(input.expectedMaterialAddresses)) result.errors.push("Carina original neutral material addresses changed");
        const controller: ReturnType<typeof createDepartureActor> = createDepartureActor(actor, person, feet, grip, input.boundary);
        const frames: number[] = [...new Set([
          ...input.exitCases.flatMap((row: IGripPreparationInput["exitCases"][number]): number[] => [-2, -1, 0, 1].map((offset: number): number => row.frame + offset)),
          ...Array.from({ length: 1440 - 1323 + 1 }, (_: unknown, index: number): number => 1323 + index),
        ])].sort((a: number, b: number): number => a - b);
        const ground: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(input.paper));
        for (const frame of frames) {
          try {
            const action: ReturnType<typeof evaluateDeparture> = evaluateDeparture(person, frame / 24, feet.reference, input.event, ground);
            const state: ReturnType<ReturnType<typeof createDepartureActor>["fit"]> = controller.fit(frame / 24, action, undefined, undefined, {}, 0);
            result.exit.push({ frame, motion: state.motion });
            if (state.motion.status !== "admitted") result.errors.push("Exit original-foot admission failed:" + frame);
          } catch (error) { const text: string = error instanceof Error ? error.message : String(error); result.exit.push({ frame, error: text }); result.errors.push("Exit:" + frame + ":" + text); }
          await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
        }
      }
    } catch (error) { result.errors.push(person + ":" + (error instanceof Error ? error.message : String(error))); }
    finally { actor?.dispose(); }
  }
  result.elapsedMs = performance.now() - started;
  result.admitted = result.models.length === 2 && result.models.every((model: IGripPreparationResult["models"][number]): boolean => model.profile.admitted) && result.errors.length === 0;
  return result;
}
