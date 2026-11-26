import * as fs from "node:fs/promises";

import type { AutoMovieCliReviewTypes } from "../AutoMovieCliReviewTypes";
import { planAutoMovieChromiumLaunch } from "../../capture/internal/planAutoMovieChromiumLaunch";

/**
 * Record real-time playback of the running inspector page: load it, press its
 * Play button, and record the page as a video while reading its time readout,
 * for a person to watch.
 *
 * The browser draws on the GPU backend, since playback is judged in real time;
 * the recording is Playwright's own video of the page at a 1280 by 900
 * viewport, which `npx playwright-core install ffmpeg` provides. The page's
 * Play button is found by its role and name, and the readout as the `output`
 * showing `<second> / <duration> s`, both as the inspector renders them. The
 * readout is read at most every half second for `seconds` of wall time after
 * the click, and the page's script errors are collected. The video begins at
 * navigation, so it includes the page's preparation; a reading's elapsed
 * seconds count from the click.
 *
 * An uncaught page error before the controls are ready rejects immediately with
 * that error as its cause; every page error also prints its stack, so a failed
 * preparation leaves a usable diagnostic. It rejects when the page shows no
 * Play button or readout within ten minutes and when the browser produced no
 * video. Errors during playback remain in the returned report. The browser is
 * closed on every outcome.
 */
export async function recordAutoMoviePlayback(
  props: AutoMovieCliReviewTypes.PlaybackProps,
): Promise<AutoMovieCliReviewTypes.PlaybackRecord> {
  const chromium: IRecordingChromium = props.chromium as IRecordingChromium;
  const plan: ReturnType<typeof planAutoMovieChromiumLaunch> =
    planAutoMovieChromiumLaunch("gpu", props.env);
  await fs.mkdir(props.out, { recursive: true });
  const browser: IRecordingBrowser = await chromium.launch({
    headless: true,
    args: [
      ...plan.args,
      "--autoplay-policy=no-user-gesture-required",
      "--disable-background-timer-throttling",
    ],
    ...(plan.executablePath === undefined
      ? {}
      : { executablePath: plan.executablePath }),
  });
  try {
    const viewport: { width: number; height: number } = {
      width: 1280,
      height: 900,
    };
    const context: IRecordingContext = await browser.newContext({
      viewport,
      recordVideo: { dir: props.out, size: viewport },
    });
    const page: IRecordingPage = await context.newPage();
    const errors: string[] = [];
    const failed: Promise<never> = new Promise((_resolve, reject): void => {
      page.on("pageerror", (error: Error): void => {
        errors.push(error.message);
        console.error("Inspector page error:", error.stack ?? error.message);
        reject(
          new Error(
            `The inspector page at ${props.url} failed during initialization`,
            { cause: error },
          ),
        );
      });
    });
    const play: IRecordingLocator = page
      .getByRole("button", { name: "Play", exact: true })
      .first();
    const readout: IRecordingLocator = page
      .locator("output", { hasText: READOUT })
      .first();
    await Promise.race([
      (async (): Promise<void> => {
        await page.goto(props.url, {
          waitUntil: "domcontentloaded",
          timeout: PREPARE,
        });
        await play.waitFor({ timeout: PREPARE });
        await readout.waitFor({ timeout: PREPARE });
      })(),
      failed,
    ]);

    // Press Play and read the readout for the observed seconds.
    await play.click();
    const started: number = performance.now();
    const readings: { elapsedSeconds: number; text: string }[] = [];
    while (performance.now() - started < props.seconds * 1000) {
      readings.push({
        elapsedSeconds: (performance.now() - started) / 1000,
        text: await readout.innerText(),
      });
      await page.waitForTimeout(
        Math.min(
          READING,
          Math.max(1, props.seconds * 1000 - (performance.now() - started)),
        ),
      );
    }
    const video: { path(): Promise<string> } | null = page.video();
    await context.close();
    if (video === null)
      throw new Error("The browser produced no playback recording");
    return { video: await video.path(), readings, errors };
  } finally {
    await browser.close();
  }
}

/**
 * Milliseconds the page may take to load and show its controls: ten minutes,
 * room for a film that prepares its performance before its first frame.
 */
const PREPARE: number = 600_000;

/** Longest pause between two readings of the time readout, milliseconds. */
const READING: number = 500;

/**
 * The time readout the inspector shows: the second and the duration, such as
 * `1.25 / 12.00 s`.
 */
const READOUT: RegExp = /\d+\.\d+ \/ \d+\.\d+ s/u;

/** The part of `playwright-core`'s `chromium` a playback recording calls. */
interface IRecordingChromium {
  launch(options: {
    headless: true;
    args: string[];
    executablePath?: string;
  }): Promise<IRecordingBrowser>;
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
  goto(
    url: string,
    options: { waitUntil: "domcontentloaded"; timeout: number },
  ): Promise<unknown>;
  getByRole(
    role: "button",
    options: { name: string; exact: true },
  ): IRecordingLocator;
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
