import { AutoMovieViewerTransport } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerTransport` plays a review interval on a wall clock, placing
 * the picture at the latest whole frame the elapsed wall time reaches.
 *
 * Scenarios, over [0, 4] s at 10 fps with a manual wall clock:
 *
 * 1. A transport opens paused at 0 s over the whole interval; an empty range is
 *    refused.
 * 2. Playing, then 1.5 s of wall time places frame 1.5 s; at speed 0.5, 1.5 s of
 *    wall time reaches 0.75 s and places the frame at 0.7 s.
 * 3. Wall time past the interval end places the end and pauses.
 * 4. Seeking places a second and pauses; seeking outside is refused.
 * 5. An interval [1, 2] seeks to 1; playing from 2 restarts at 1.
 * 6. A freeze pauses and its release resumes play; an unsupported speed is
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines review playback from wall seconds to whole frames, seeking, interval restart and scoped pause/release.
 * @evidence contracts/development/testing.md#behavioral-verification Advances a manual wall clock through play speeds, end pause, seek, range update and freeze/release, and submits invalid inputs.
 * @evidence contracts/development/testing.md#independent-expectations At 10 fps, half of 1.5 s is 0.75 s and its latest whole frame is 0.7 s. Boundary selection, pause state and subsequent restart are observable independently.
 */
export async function test_viewer_transport_viewer_transport(): Promise<void> {
  TestValidator.error(
    "an empty range",
    (): AutoMovieViewerTransport =>
      new AutoMovieViewerTransport({
        place: (): void => {},
        available: { start: 2, end: 2 },
        fps: 10,
      }),
  );
  let now: number = 0;
  const placed: number[] = [];
  const transport: AutoMovieViewerTransport = new AutoMovieViewerTransport({
    place: (seconds: number): void => {
      placed.push(seconds);
    },
    available: { start: 0, end: 4 },
    fps: 10,
    now: (): number => now,
  });
  TestValidator.equals(
    "opens paused",
    [transport.seconds, transport.playing, transport.interval],
    [0, false, { start: 0, end: 4 }],
  );
  await transport.play();
  now = 1500;
  TestValidator.predicate(
    "1.5 s of wall time",
    transport.tick() && transport.seconds === 1.5,
  );
  transport.speed = 0.5;
  transport.seek(0);
  await transport.play();
  now += 1500;
  transport.tick();
  TestValidator.equals("half speed", transport.seconds, 0.7);
  now += 100_000;
  transport.tick();
  TestValidator.equals(
    "the end pauses",
    [transport.seconds, transport.playing],
    [4, false],
  );
  transport.seek(2);
  TestValidator.equals("a seek", [transport.seconds, placed.at(-1)], [2, 2]);
  TestValidator.error("a seek outside", (): void => transport.seek(5));
  transport.setInterval(1, 2);
  TestValidator.equals("an interval seeks its start", transport.seconds, 1);
  transport.seek(2);
  await transport.play();
  TestValidator.equals("play restarts the interval", transport.seconds, 1);
  const release: (resume: boolean) => void = transport.freeze();
  TestValidator.equals("a freeze pauses", transport.playing, false);
  release(true);
  await Promise.resolve();
  TestValidator.equals("its release resumes", transport.playing, true);
  TestValidator.error("an unsupported speed", (): void => {
    transport.speed = 3;
  });
}
