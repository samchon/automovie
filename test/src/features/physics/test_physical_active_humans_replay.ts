import {
  AutoMoviePhysicalPlayback as Playback,
  AutoMoviePhysicalSimulation as Simulation,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalActiveHumans } from "../internal/PhysicalActiveHumans";
import { measurePhysicalActiveHumanFrames } from "../internal/measurePhysicalActiveHumanFrames";

/** Thirty cache intervals with a snapshot every ten. */
const DURATION: number = 0.25;
const CHECKPOINT_EVERY: number = 10;

/** The late edit and the last snapshot before it. */
const EDIT: number = 25;
const RESUME: number = 20;

/** Archive decoder allocation cap. */
const ARCHIVE_BYTES: number = 64 * 1024 ** 2;

/**
 * Three canonical Humans with active arms on force-tracked feet (#3789) bake,
 * replay and resume exactly.
 *
 * 1. Every Human stays within joint range, anchor, target and floor bounds, both elbows follow an authored sweep of at least 5 degrees, and every Human loads the floor.
 * 2. The decoded archive reproduces the live cache in sequential and reordered seeks.
 * 3. Editing interval 25 resumes from the snapshot at 20 and recomputes only the last 10 intervals.
 * 4. The resumed run equals a fresh bake of the edited input in every frame and contact.
 * 5. The fresh bake equals the original before the edit and first departs at the edited interval.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute`, `AutoMoviePhysicalPlayback.encode` and `decode` on the actual three-Human workload and asserts measured maxima, replay digests, recomputed step counts, frame digests and contact receipts.
 * @evidence contracts/development/testing.md#independent-expectations Bounds are the stated limits (0.01 rad, 5 mm, 50 mm, 5 mm); step counts follow from the declared snapshot cadence; equality is exact against an independent fresh bake, not a recorded snapshot.
 * @evidence contracts/development/testing.md#distinguishing-cases A broken prefix reuse changes the recomputed count; a nondeterministic or stale resume breaks frame equality; an edit that is ignored or leaks backward moves the first departure off interval 25; arms crossing or feet sliding break the quality bounds.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_physical_active_humans_replay`; three native bakes run in process and no browser, viewer, render or GPU host starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios with the workload, the edit and the resume point they pin.
 */
export async function test_physical_active_humans_replay(): Promise<void> {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalActiveHumans.input(DURATION, CHECKPOINT_EVERY);
  const run: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
  TestValidator.equals(
    "the original bakes every interval",
    run.recomputedSteps,
    input.maximumSteps,
  );
  TestValidator.equals(
    "snapshots follow the declared cadence",
    [...run.cache.checkpoints.keys()].sort((a: number, b: number) => a - b),
    [0, 10, 20, 30],
  );

  const quality: ReturnType<typeof measurePhysicalActiveHumanFrames> =
    measurePhysicalActiveHumanFrames(input, run.cache.frames);
  TestValidator.predicate(
    `joint range, anchors, targets and floor stay within bounds: ${JSON.stringify(quality.maxima)}`,
    quality.withinHistoricalLimits,
  );
  TestValidator.predicate(
    `every authored elbow sweeps at least 5 degrees: ${JSON.stringify(quality.elbows)}`,
    quality.elbows.every(
      (elbow: (typeof quality.elbows)[number]): boolean =>
        elbow.authoredRadians >= (5 * Math.PI) / 180,
    ),
  );
  TestValidator.predicate(
    `both elbows of every Human follow the authored motion: ${JSON.stringify(quality.elbows)}`,
    quality.active,
  );
  TestValidator.equals(
    "every Human loads the floor",
    input.bodies
      .map((body: IAutoMoviePhysicalSimulationInput.IBody): string => body.id)
      .filter((id: string): boolean =>
        run.cache.contacts.some(
          (receipt: IAutoMovieContactReceipt): boolean =>
            receipt.impulse !== null &&
            receipt.impulse > 0 &&
            ((receipt.a.body === "floor" && receipt.b.body === id) ||
              (receipt.b.body === "floor" && receipt.a.body === id)),
        ),
      ),
    input.bodies.map(
      (body: IAutoMoviePhysicalSimulationInput.IBody): string => body.id,
    ),
  );

  const archive: Uint8Array = await Playback.encode(run.cache, ARCHIVE_BYTES);
  const reader: IAutoMoviePhysicalPlayback = await Playback.decode(
    archive,
    run.cache.identity,
    {
      maximumBytes: ARCHIVE_BYTES,
      maximumFrames: input.maximumSteps + 1,
      maximumSegments: input.maximumSegments,
    },
  );
  // Throws on any disagreeing seek or contact episode.
  measurePhysicalActiveHumanFrames.compareReplay(input, run, reader);

  // Digest the original before the resume can reuse its frames.
  const original: string[] = measurePhysicalActiveHumanFrames.digests(
    input,
    run.cache.frames,
  );
  const edited: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalActiveHumans.lateEdit(input, EDIT);
  const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
    edited,
    run,
  );
  TestValidator.equals(
    "the resume recomputes only after the last snapshot before the edit",
    resumed.recomputedSteps,
    input.maximumSteps - RESUME,
  );

  const fresh: IAutoMoviePhysicalSimulation = await Simulation.compute(edited);
  const expected: string[] = measurePhysicalActiveHumanFrames.digests(
    edited,
    fresh.cache.frames,
  );
  TestValidator.equals(
    "the resumed frames equal a fresh bake of the edited input",
    measurePhysicalActiveHumanFrames.digests(edited, resumed.cache.frames),
    expected,
  );
  TestValidator.equals(
    "the resumed contacts equal the fresh bake's",
    JSON.stringify(resumed.cache.contacts),
    JSON.stringify(fresh.cache.contacts),
  );
  TestValidator.equals(
    "the fresh bake first departs from the original at the edit",
    expected.findIndex(
      (digest: string, step: number): boolean => digest !== original[step],
    ),
    EDIT,
  );
}
