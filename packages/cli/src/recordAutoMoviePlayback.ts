import * as fs from "node:fs/promises";

import { planAutoMovieChromiumLaunch } from "./planAutoMovieChromiumLaunch";

/** Milliseconds the page may take to load and show its controls: ten minutes, room for a film that prepares its performance before its first frame. */
const PREPARE: number = 600_000;

/** Longest pause between two readings of the time readout, milliseconds. */
const READING: number = 500;

/** The time readout the inspector shows: the second and the duration, such as `1.25 / 12.00 s`. */
const READOUT: RegExp = /\d+\.\d+ \/ \d+\.\d+ s/u;

/** The part of `playwright-core`'s `chromium` a playback recording calls. */
interface IRecordingChromium {
  launch(options: { headless: true; args: string[]; executablePath?: string }): Promise<IRecordingBrowser>;
}

/** A launched browser that opens recording contexts. */
interface IRecordingBrowser {
  newContext(options: {
    viewport: { width: number; height: number };
    recordVideo: { dir: string; size: { width: number; height: number } };
  }): Promise<IRecordingContext>;
  close(): Promise<void>;
}

/** A recording browser context. */
interface IRecordingContext {
  newPage(): Promise<IRecordingPage>;
  close(): Promise<void>;
}

/** The page calls a recording makes. */
interface IRecordingPage {
  on(event: "pageerror", listener: (error: Error) => void): unknown;
  goto(url: string, options: { waitUntil: "domcontentloaded"; timeout: number }): Promise<unknown>;
  getByRole(role: "button", options: { name: string; exact: true }): IRecordingLocator;
  locator(selector: string, options: { hasText: RegExp }): IRecordingLocator;
  waitForTimeout(milliseconds: number): Promise<void>;
  video(): { path(): Promise<string> } | null;
}

/** A located element. */
interface IRecordingLocator {
  first(): IRecordingLocator;
  waitFor(options: { timeout: number }): Promise<void>;
  click(): Promise<void>;
  innerText(): Promise<string>;
}

/**
 * Record real-time playback of the running inspector page: load it, press its Play button, and record the page as a video while reading its time readout, for a person to watch.
 *
 * The browser draws on the GPU backend, since playback is judged in real time; the recording is Playwright's own video of the page at a 1280 by 900 viewport, which `npx playwright-core install ffmpeg` provides. The page's Play button is found by its role and name, and the readout as the `output` showing `<second> / <duration> s`, both as the inspector renders them. The readout is read at most every half second for `seconds` of wall time after the click, and the page's script errors are collected. The video begins at navigation, so it includes the page's preparation; a reading's elapsed seconds count from the click.
 *
 * It rejects when the page shows no Play button or readout within ten minutes and when the browser produced no video. The browser is closed on every outcome.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is recorded and how, which backend and why, how the controls are found, the reading cadence, the clocks of the video and the readings, the refusals and the release.
 * @evidence contracts/development/implementation.md#principled-implementation Playback is observed on the page a person uses, through its own controls, so the recording shows the real loop's pacing instead of seeks turned into a supposed playback; Playwright closes the context to finish writing the video.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Launch, open a recording context, load, press Play, read for the duration, close.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing control or video is an error, never a recording of nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reading per half second.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each review records afresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The browser and its context are closed on every outcome; the readings grow by two per second of observation.
 */
export async function recordAutoMoviePlayback(props: {
  /** Playwright's `chromium`, loaded from the production. */
  chromium: unknown;

  /** The inspector page's address. */
  url: string;

  /** Wall-clock seconds observed after Play is pressed. */
  seconds: number;

  /** Folder the video is written into. */
  out: string;

  /** The environment, read for `CHROME_PATH`. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<{
  /** The recording. */
  video: string;

  /** Each reading of the time readout, with wall seconds since Play was pressed. */
  readings: { elapsedSeconds: number; text: string }[];

  /** The page's script errors. */
  errors: string[];
}> {
  const chromium: IRecordingChromium = props.chromium as IRecordingChromium;
  const plan: ReturnType<typeof planAutoMovieChromiumLaunch> = planAutoMovieChromiumLaunch("gpu", props.env);
  await fs.mkdir(props.out, { recursive: true });
  const browser: IRecordingBrowser = await chromium.launch({
    headless: true,
    args: [...plan.args, "--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling"],
    ...(plan.executablePath === undefined ? {} : { executablePath: plan.executablePath }),
  });
  try {
    const viewport: { width: number; height: number } = { width: 1280, height: 900 };
    const context: IRecordingContext = await browser.newContext({
      viewport,
      recordVideo: { dir: props.out, size: viewport },
    });
    const page: IRecordingPage = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error: Error): void => {
      errors.push(error.message);
    });
    await page.goto(props.url, { waitUntil: "domcontentloaded", timeout: PREPARE });
    const play: IRecordingLocator = page.getByRole("button", { name: "Play", exact: true }).first();
    const readout: IRecordingLocator = page.locator("output", { hasText: READOUT }).first();
    await play.waitFor({ timeout: PREPARE });
    await readout.waitFor({ timeout: PREPARE });

    // Press Play and read the readout for the observed seconds.
    await play.click();
    const started: number = performance.now();
    const readings: { elapsedSeconds: number; text: string }[] = [];
    while (performance.now() - started < props.seconds * 1000) {
      readings.push({ elapsedSeconds: (performance.now() - started) / 1000, text: await readout.innerText() });
      await page.waitForTimeout(Math.min(READING, Math.max(1, props.seconds * 1000 - (performance.now() - started))));
    }
    const video: { path(): Promise<string> } | null = page.video();
    await context.close();
    if (video === null) throw new Error("The browser produced no playback recording");
    return { video: await video.path(), readings, errors };
  } finally {
    await browser.close();
  }
}
