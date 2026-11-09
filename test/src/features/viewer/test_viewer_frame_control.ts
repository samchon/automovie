import { createViewerFrameControl } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * The actual mounted controller coordinates a separately clocked producer.
 *
 * Scenarios:
 * 1. Capture, a different seek, restore and paused redraw reproduce source time and camera.
 * 2. Nested freezes suppress ticks but permit explicit restore/redraw; final release resumes without counting the held wall time.
 * 3. Desired pause survives release, and disposal retires the source lease without resuming.
 * 4. Invalid transfers refuse before native camera, source or mount-clock mutation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public controller used by mountViewer with actual Three camera transfer and an independently advanced producer clock. Asserts source placement, camera values, suppressed producer calls, nested release count, explicit frozen draws, desired pause and terminal refusal.
 * @evidence contracts/development/testing.md#independent-expectations Authored scene time 3 seconds and camera position provide the transfer oracle. A 30-second frozen wall interval contributes zero motion, while a subsequent 100 ms contributes 0.1 seconds; expected calls follow outermost acquisition/final release ownership rather than an implementation snapshot.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts live ticks with frozen ticks, explicit draws with animation suppression, nested and repeated release, paused and playing intent, invalid time/camera inputs and terminal cleanup. The companion failure test owns acquisition/release failures; browser/GPU completion remains operator validation.
 * @evidence contracts/development/testing.md#execution-ownership Uses actual public controller and native CPU camera objects through declared producer ports; starts no browser, process, renderer or timer and replaces no global or foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Capture, a different seek, restore and paused redraw reproduce source time and camera.).
 */
export function test_viewer_frame_control(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    42,
    1.5,
    0.1,
    100,
  );
  camera.position.set(1, 2, 3);
  let now: number = 1000;
  let previous: number = now;
  let seconds: number = 3;
  let playing: boolean = true;
  let paused: boolean = false;
  let draws: number = 0;
  let rebases: number = 0;
  let acquired: number = 0;
  const released: boolean[] = [];
  const owner: ReturnType<typeof createViewerFrameControl> =
    createViewerFrameControl({
      camera,
      currentSeconds: (): number => seconds,
      assertActive: (): void => {},
      rebase: (): void => {
        ++rebases;
      },
      redraw: (time: number): void => {
        seconds = time;
        previous = now;
        ++draws;
      },
      freezeCompleted: (): ((resume: boolean) => void) => {
        ++acquired;
        paused = true;
        return (resume: boolean): void => {
          released.push(resume);
          paused = false;
          previous = now;
          if (!resume) playing = false;
        };
      },
    });
  const tick: () => void = (): void =>
    owner.frame((): void => {
      if (playing && !paused) seconds += (now - previous) / 1000;
      previous = now;
      ++draws;
    });
  const saved: unknown = owner.control.capture();
  seconds = 10;
  camera.position.set(8, 9, 10);
  owner.control.restore(saved);
  TestValidator.predicate(
    "restored actual source seconds",
    nclose(seconds, 3, 0),
  );
  TestValidator.predicate(
    "restored actual native camera",
    nclose(camera.position.x, 1, 0) &&
      nclose(camera.position.y, 2, 0) &&
      nclose(camera.position.z, 3, 0),
  );
  TestValidator.equals("restore rebased once", rebases, 1);
  owner.control.redraw!();
  TestValidator.equals("paused original redraw completes", draws, 2);

  const releaseFirst: () => void = owner.control.freeze!();
  const releaseSecond: () => void = owner.control.freeze!();
  now += 30000;
  tick();
  TestValidator.equals("frozen animation calls suppressed", draws, 2);
  TestValidator.equals("outer producer acquisition once", acquired, 1);
  owner.control.redraw!();
  seconds = 9;
  owner.control.restore(saved);
  TestValidator.predicate(
    "explicit frozen restore places source",
    nclose(seconds, 3, 0) && draws === 4,
  );
  releaseFirst();
  releaseFirst();
  tick();
  TestValidator.equals("nested lease still holds producer", draws, 4);
  TestValidator.equals("no early producer release", released, []);
  releaseSecond();
  releaseSecond();
  TestValidator.equals("one resumable source release", released, [true]);
  now += 100;
  tick();
  TestValidator.predicate(
    "resume excludes frozen wall time",
    nclose(seconds, 3.1, 1e-12),
  );

  const releasePaused: () => void = owner.control.freeze!();
  playing = false;
  now += 10000;
  releasePaused();
  now += 100;
  tick();
  TestValidator.predicate(
    "desired pause survives release",
    nclose(seconds, 3.1, 1e-12),
  );
  const beforeDraws: number = draws;
  const beforeRebases: number = rebases;
  for (const state of [
    null,
    { elapsedSeconds: -1 },
    { elapsedSeconds: NaN },
    { elapsedSeconds: 4, camera: {} },
  ])
    assert.throws((): void => owner.control.restore(state));
  TestValidator.equals("invalid transfer never draws", draws, beforeDraws);
  TestValidator.equals(
    "invalid transfer never rebases",
    rebases,
    beforeRebases,
  );
  TestValidator.predicate(
    "invalid transfer preserves native camera",
    nclose(camera.position.x, 1, 0) && nclose(seconds, 3.1, 1e-12),
  );

  const releaseTerminal: () => void = owner.control.freeze!();
  owner.control.freeze!();
  owner.dispose();
  owner.dispose();
  releaseTerminal();
  TestValidator.equals("terminal lease does not resume", released, [
    true,
    true,
    false,
  ]);
  for (const operation of [
    (): unknown => owner.control.capture(),
    (): void => owner.control.restore(saved),
    (): void => owner.control.redraw!(),
    (): unknown => owner.control.freeze!(),
    tick,
  ])
    assert.throws(operation);
}
