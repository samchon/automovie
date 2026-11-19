import { TestValidator } from "@nestia/e2e";

import { SceneClock } from "../../src/scenes/SceneClock";

/**
 * The presentation clock retains wall-time playback and exposes a distinct
 * final stop for fractional durations.
 *
 * Scenarios:
 * 1. The last two stops of a fractional film are each reachable in both
 *    directions, with the exact end available until it is reached.
 * 2. Zero has one stop, an exact-grid duration shares its last regular stop,
 *    and the adjacent floating-point timestamps stay ordered.
 * 3. A non-looping clock reports its final time before notifying listeners.
 *    A looping clock wraps by its duration in seconds at the chosen speed.
 */
export function test_website_scene_clock(): void {
  const clock: SceneClock = new SceneClock(false);
  clock.fps = 12;
  clock.duration = 5.6;

  // 1. The fractional film adds one stop after frame 67.
  clock.seek(5.599);
  TestValidator.equals(
    "the last stop stays available in the tail",
    [clock.frame, clock.lastFrame],
    [67, 68],
  );
  clock.step(1);
  TestValidator.predicate(
    "step forward reaches the exact end",
    clock.time === 5.6,
  );
  clock.step(-1);
  TestValidator.predicate(
    "the first step back reaches the last regular frame",
    clock.time === 67 / 12,
  );
  clock.step(1);
  TestValidator.predicate("one step returns to the end", clock.time === 5.6);

  // 2. The comparison uses grid timestamps even next to an exact frame.
  clock.duration = 0;
  clock.seekFrame(1);
  TestValidator.equals(
    "zero has just one stop",
    [clock.frame, clock.lastFrame],
    [0, 0],
  );
  clock.duration = 11.25;
  clock.seekFrame(135);
  TestValidator.predicate(
    "exact grid ends at its regular stop",
    clock.lastFrame === 135 && clock.time === 11.25,
  );
  clock.duration = 11.249999999999998;
  clock.seekFrame(135);
  TestValidator.predicate(
    "a duration just below a grid timestamp ends at its own time",
    clock.lastFrame === 135 && clock.time === 11.249999999999998,
  );
  clock.duration = 11.250000000000002;
  clock.seekFrame(135);
  TestValidator.predicate(
    "a duration just above a grid timestamp retains both stops",
    clock.lastFrame === 136 && clock.time === 11.25,
  );

  // 3. Playback follows seconds, independently of the scrubber grid.
  clock.duration = 0.14;
  clock.seek(0);
  clock.set({ loop: false, speed: 2 });
  clock.toggle();
  let notified: boolean = false;
  const unsubscribe: () => void = clock.subscribe((): void => {
    notified = clock.time === 0.14 && !clock.playing;
  });
  clock.advance(100);
  clock.advance(200);
  unsubscribe();
  TestValidator.predicate(
    "the stop listener sees the exact end of the stopped clock",
    notified,
  );
  clock.set({ loop: true });
  clock.toggle();
  clock.advance(500);
  clock.advance(600);
  TestValidator.predicate(
    "looping starts again at zero and wraps elapsed film seconds",
    clock.playing && Math.abs(clock.time - 0.06) < 1e-12,
  );
}
