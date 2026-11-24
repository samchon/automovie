import { createViewerFrameControl } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * Source-lease failures retain actual causes without repeated release effects.
 *
 * Scenarios:
 * 1. Failed acquisition creates no lease and does not suppress ordinary ticks.
 * 2. Rebase and source release failures are both attempted and retained in order.
 * 3. A throwing terminal release is attempted once and never resumes the source.
 */
export function test_unit_viewer_viewer_frame_control_failures(): void {
  const acquisition: Error = new Error("source pause failed");
  let frames: number = 0;
  const refused: ReturnType<typeof createViewerFrameControl> =
    createViewerFrameControl({
      camera: new THREE.PerspectiveCamera(),
      currentSeconds: (): number => 2,
      assertActive: (): void => {},
      rebase: (): void => {},
      redraw: (): void => {},
      freezeCompleted: (): never => {
        throw acquisition;
      },
    });
  assert.throws(
    (): unknown => refused.control.freeze!(),
    (error: unknown): boolean => error === acquisition,
  );
  refused.frame((): void => {
    ++frames;
  });
  TestValidator.equals("failed acquisition did not hold ticks", frames, 1);
  refused.dispose();

  const rebase: Error = new Error("mount rebase failed");
  const release: Error = new Error("source resume failed");
  let released: number = 0;
  const failed: ReturnType<typeof createViewerFrameControl> =
    createViewerFrameControl({
      camera: new THREE.PerspectiveCamera(),
      currentSeconds: (): number => 2,
      assertActive: (): void => {},
      rebase: (): never => {
        throw rebase;
      },
      redraw: (): void => {},
      freezeCompleted:
        (): ((resume: boolean) => void) =>
        (_resume: boolean): never => {
          ++released;
          throw release;
        },
    });
  const end: () => void = failed.control.freeze!();
  let original: unknown;
  try {
    end();
  } catch (error) {
    original = error;
  }
  TestValidator.predicate(
    "both final-release failures survive",
    original instanceof AggregateError &&
      original.errors[0] === rebase &&
      original.errors[1] === release,
  );
  assert.throws(end, (error: unknown): boolean => error === original);
  assert.throws(
    (): void =>
      failed.frame((): void => {
        ++frames;
      }),
    (error: unknown): boolean => error === original,
  );
  failed.dispose();
  TestValidator.equals("uncertain release was not retried", released, 1);

  const terminal: Error = new Error("terminal cleanup failed");
  const flags: boolean[] = [];
  const closing: ReturnType<typeof createViewerFrameControl> =
    createViewerFrameControl({
      camera: new THREE.PerspectiveCamera(),
      currentSeconds: (): number => 2,
      assertActive: (): void => {},
      rebase: (): void => {},
      redraw: (): void => {},
      freezeCompleted:
        (): ((resume: boolean) => void) =>
        (resume: boolean): never => {
          flags.push(resume);
          throw terminal;
        },
    });
  const late: () => void = closing.control.freeze!();
  assert.throws(
    closing.dispose,
    (error: unknown): boolean => error === terminal,
  );
  assert.throws(
    closing.dispose,
    (error: unknown): boolean => error === terminal,
  );
  late();
  TestValidator.equals("one terminal nonresuming cleanup", flags, [false]);
}
