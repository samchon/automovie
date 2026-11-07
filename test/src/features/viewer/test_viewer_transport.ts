import {
  AutoMovieViewerTransport,
  parseAutoMovieInspectionView,
  readAutoMovieReviewInterval,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/** The review transport commits only drawn seconds, plays on one wall anchor snapped to the frame grid, and reads its URL and view inputs strictly.
 *
 * Scenarios:
 * 1. A seek commits only after the producer draws; a failing producer keeps the previous second and records the error.
 * 2. Playback at half speed places the frame due by the injected clock, snapped down to the 30 fps grid, and draws the interval's exact end before pausing.
 * 3. A sound start superseded by a pause never anchors the clock; a refused sound pauses and keeps its cause.
 * 4. An unsupported speed and an interval outside the range are refused; a freeze resumes only a formerly playing clock, once.
 * 5. URL intervals default to the range and refuse empty, nonfinite or out-of-range values; inspection views parse only x,y,z:tx,ty,tz.
 */
export async function test_viewer_transport(): Promise<void> {
  let wall: number = 0;
  const placed: number[] = [];
  let failing: boolean = false;
  const transport: AutoMovieViewerTransport = new AutoMovieViewerTransport({
    place: (seconds: number): void => {
      if (failing) throw new Error("draw failed");
      placed.push(seconds);
    },
    available: [0, 10],
    fps: 30,
    now: (): number => wall,
  });
  transport.seek(2);
  failing = true;
  let refused: boolean = false;
  try {
    transport.seek(3);
  } catch {
    refused = true;
  }
  failing = false;
  TestValidator.predicate(
    "committed seeks",
    refused && transport.seconds === 2 && transport.error === "draw failed",
  );

  // Half speed from 2 s inside [2, 2.5].
  transport.setInterval(2, 2.5);
  transport.speed = 0.5;
  await transport.play();
  wall = 1000 * (0.105 / 0.5);
  const first: boolean = transport.tick();
  const snapped: number = transport.seconds;
  wall = 1000 * (1 / 0.5);
  transport.tick();
  TestValidator.predicate(
    `anchored playback (${snapped})`,
    first &&
      Math.abs(snapped - 3 / 30 - 2) < 1e-12 &&
      transport.seconds === 2.5 &&
      !transport.playing &&
      !transport.tick(),
  );

  // Superseded and refused sound.
  let release: (value: undefined) => void = (): void => {};
  const audible: AutoMovieViewerTransport = new AutoMovieViewerTransport({
    place: (): void => {},
    available: [0, 1],
    fps: 30,
    now: (): number => wall,
    audio: {
      play: (): Promise<undefined> =>
        new Promise<undefined>((resolve: (value: undefined) => void): void => {
          release = resolve;
        }),
      pause: (): void => {},
    },
  });
  const pending: Promise<void> = audible.play();
  audible.pause();
  release(undefined);
  await pending;
  const silent: AutoMovieViewerTransport = new AutoMovieViewerTransport({
    place: (): void => {},
    available: [0, 1],
    fps: 30,
    audio: {
      play: (): Promise<void> => Promise.reject(new Error("no sound")),
      pause: (): void => {},
    },
  });
  let soundRefused: boolean = false;
  try {
    await silent.play();
  } catch {
    soundRefused = true;
  }
  TestValidator.predicate(
    "superseded and refused sound",
    !audible.playing &&
      soundRefused &&
      !silent.playing &&
      silent.error === "no sound",
  );

  // Refusals and freezes.
  const refusals: string[] = [];
  for (const [label, run] of [
    ["speed", (): void => void (transport.speed = 2)],
    ["interval", (): void => transport.setInterval(5, 11)],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("transport refusals", refusals, []);
  transport.setInterval(0, 10);
  await transport.play();
  const thaw: (resume: boolean) => void = transport.freeze();
  const frozen: boolean = transport.playing;
  thaw(true);
  thaw(true);
  await Promise.resolve();
  TestValidator.predicate("freeze and resume", !frozen && transport.playing);
  transport.pause();

  // URL intervals and inspection views.
  const read = (query: string): { start: number; end: number; speed: number } =>
    readAutoMovieReviewInterval(new URLSearchParams(query), [0, 180]);
  const urlRefusals: string[] = [];
  for (const query of [
    "start=",
    "end=abc",
    "start=10&end=5",
    "end=200",
    "speed=2",
  ])
    try {
      read(query);
      urlRefusals.push(query);
    } catch {}
  const view = parseAutoMovieInspectionView("1,2,3:0,1,0");
  let badView: boolean = false;
  try {
    parseAutoMovieInspectionView("1,2:0,1,0");
  } catch {
    badView = true;
  }
  TestValidator.predicate(
    "URL and view inputs",
    JSON.stringify(read("")) ===
      JSON.stringify({ start: 0, end: 180, speed: 1 }) &&
      JSON.stringify(read("start=5&end=6&speed=0.5")) ===
        JSON.stringify({ start: 5, end: 6, speed: 0.5 }) &&
      urlRefusals.length === 0 &&
      view.position[2] === 3 &&
      view.target[1] === 1 &&
      badView,
  );
}
