// Capture each declared viewer clip with one Chromium process and one page per clip.
// The page's existing seek hook draws each sample before PNG decoding and H.264 encoding.
//
// Prerequisites:
//   1. Dev server running:  pnpm --filter @automovie/playground dev   (:5173)
//   2. Google Chrome installed (Playwright drives it via executablePath).
// Overrides: CHROME=/path/to/chrome, BASE=http://host:port.
//
// Usage:
//   pnpm shots            # all shots
//   pnpm shots shadowbox  # only outputs matching the arg
import { createH264MP4Encoder } from "h264-mp4-encoder";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";
import type { IAutoMoviePlaygroundOperationFailure } from "./IAutoMoviePlaygroundOperationFailure";
import { preserveCleanupFailure } from "./preserveCleanupFailure";

/**
 * Browser window reached by this CLI's existing capture callbacks. Viewer pages publish the seek hook; its presence is checked before frames are captured. This local assertion adds no runtime hook or global Window declaration.
 */
type CaptureShotsWindow = Window & {
  /** Step and draw the published viewer at seconds supplied by the capture loop. */
  __afSeek(time: number): void;
};

const here: string = path.dirname(fileURLToPath(import.meta.url));
const shotsDir: string = path.resolve(here, "../../../.shots");
const BASE: string = process.env.BASE ?? "http://localhost:5173";
const CHROME: string = DEFAULT_CHROME_EXECUTABLE;

// Rows request an inclusive sampling interval in seconds and an independent encoded frame rate.
// The page hook owns endpoint playback; encoded duration is frames/fps and can retime the motion.
type Shot = readonly [
  page: string,
  query: string,
  durationSeconds: number,
  frames: number,
  width: number,
  height: number,
  output: string,
  fps: number,
];

const SHOTS: readonly Shot[] = [
  [
    "stickman.html",
    "char=human&clip=shadowbox&az=28",
    30.2,
    480,
    600,
    720,
    "human/shadowbox.mp4",
    30,
  ],
  [
    "knight.html",
    "clip=performance&az=38",
    28.8,
    460,
    720,
    720,
    "knight/scenario.mp4",
    30,
  ],
  [
    "knight.html",
    "clip=gallopTravel&follow=1&az=42",
    4.96,
    150,
    720,
    720,
    "knight/charge.mp4",
    30,
  ],
  ["spar.html", "", 29.55, 470, 760, 620, "spar/ko.mp4", 30],
  ["film.html", "", 5.5, 165, 960, 540, "film/pursuit.mp4", 30],
  ["launch.html", "", 3.0, 90, 960, 540, "film/launch.mp4", 30],
  ["attach.html", "", 4.0, 120, 960, 540, "film/attach.mp4", 30],
  ["gesture.html", "", 3.0, 90, 720, 560, "film/jump.mp4", 30],
  ["archery.html", "", 9.0, 270, 760, 600, "knight/archery.mp4", 30],
  ["impact.html", "az=62", 9.0, 270, 720, 640, "impact/reactions.mp4", 30],
  ["trampoline.html", "az=30", 9.0, 270, 640, 720, "impact/trampoline.mp4", 30],
  [
    "stickman.html",
    "char=human&clip=walk&az=80",
    1.0,
    30,
    560,
    660,
    "human/walk.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=human&clip=run&az=80",
    0.6,
    36,
    560,
    660,
    "human/run.mp4",
    60,
  ],
  [
    "stickman.html",
    "char=human&clip=kick&az=35",
    1.0,
    40,
    560,
    660,
    "human/kick.mp4",
    40,
  ],
  [
    "stickman.html",
    "char=human&clip=combo&az=30",
    5.2,
    160,
    560,
    660,
    "human/combo.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=human&clip=stroll&follow=1&az=70",
    6.0,
    180,
    640,
    640,
    "human/stroll.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=human&clip=sprint&follow=1&az=70",
    5.4,
    162,
    640,
    640,
    "human/sprint.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=cat&clip=walk&az=70",
    0.8,
    32,
    600,
    620,
    "cat/walk.mp4",
    40,
  ],
  [
    "stickman.html",
    "char=cat&clip=leap&az=70",
    1.0,
    40,
    600,
    620,
    "cat/leap.mp4",
    40,
  ],
  [
    "stickman.html",
    "char=cat&clip=combo&az=40",
    6.6,
    198,
    600,
    620,
    "cat/combo.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=cat&clip=prowl&follow=1&az=65",
    6.4,
    192,
    640,
    640,
    "cat/prowl.mp4",
    30,
  ],
  [
    "stickman.html",
    "char=cat&clip=bound&follow=1&az=65",
    5.0,
    150,
    640,
    640,
    "cat/bound.mp4",
    30,
  ],
];

const only: string | undefined = process.argv[2];
const shots: readonly Shot[] = only
  ? SHOTS.filter((s: Shot): boolean => s[6].includes(only))
  : SHOTS;
if (shots.length === 0) {
  console.error(`no shots match "${only}"`);
  process.exit(1);
}

const even: (n: number) => number = (n: number): number => n - (n % 2);

const browser: Awaited<ReturnType<typeof chromium.launch>> =
  await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });

const capture: ([
  page,
  q,
  dur,
  n,
  w,
  h,
  out,
  fps,
]: Shot) => Promise<void> = async ([
  page,
  q,
  dur,
  n,
  w,
  h,
  out,
  fps,
]: Shot): Promise<void> => {
  const W: number = even(w);
  const H: number = even(h);
  const dest: string = path.join(shotsDir, out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const pg: Awaited<ReturnType<typeof browser.newPage>> = await browser.newPage(
    {
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    },
  );
  let completion: string | undefined;
  let pageFailure: IAutoMoviePlaygroundOperationFailure | undefined;
  try {
    const sep: "" | "&" = q ? "&" : "";
    // Pass the even frame size in the URL too (#1251): the viewer pins `#view` to
    // exactly W×H, so the element screenshot is that size even if the viewport
    // above ever drifts. Viewport and canvas now agree by contract, not luck.
    await pg.goto(`${BASE}/${page}?${q}${sep}cap=1&w=${W}&h=${H}`, {
      waitUntil: "load",
    });
    await pg.waitForFunction((): boolean => {
      const host: CaptureShotsWindow = window as unknown as CaptureShotsWindow;
      return typeof host.__afSeek === "function";
    });
    // frame only the 3D: hide any UI overlay (clip-selector bar) that would
    // otherwise overlap the canvas in the element screenshot
    await pg.addStyleTag({ content: "#clips{display:none!important}" });
    const view: ReturnType<typeof pg.locator> = pg.locator("#view");

    const enc: Awaited<ReturnType<typeof createH264MP4Encoder>> =
      await createH264MP4Encoder();
    let encoderFailure: IAutoMoviePlaygroundOperationFailure | undefined;
    try {
      enc.width = W;
      enc.height = H;
      enc.frameRate = fps;
      enc.quantizationParameter = 20; // lower = higher quality
      enc.initialize();

      const t0: number = Date.now();
      for (let i: number = 0; i < n; i++) {
        const t: number = (dur * i) / (n - 1);
        await pg.evaluate((tt: number): void => {
          const host: CaptureShotsWindow =
            window as unknown as CaptureShotsWindow;
          host.__afSeek(tt);
        }, t);
        const buf: Buffer<ArrayBufferLike> = await view.screenshot({
          type: "png",
        });
        const png: ReturnType<typeof PNG.sync.read> = PNG.sync.read(buf);
        enc.addFrameRgba(new Uint8Array(png.data));
      }
      enc.finalize();
      fs.writeFileSync(dest, Buffer.from(enc.FS.readFile(enc.outputFilename)));
      completion = `wrote ${out} (${n} frames @ ${fps}fps, ${((Date.now() - t0) / 1000).toFixed(1)}s)`;
    } catch (error) {
      encoderFailure = { error };
      throw error;
    } finally {
      await preserveCleanupFailure(
        encoderFailure,
        "capture encoder",
        (): void => enc.delete(),
      );
    }
  } catch (error) {
    pageFailure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(
      pageFailure,
      "capture page",
      (): Promise<void> => pg.close(),
    );
  }
  console.log(completion);
};

let browserFailure: IAutoMoviePlaygroundOperationFailure | undefined;
try {
  for (const shot of shots) await capture(shot);
} catch (error) {
  browserFailure = { error };
  throw error;
} finally {
  await preserveCleanupFailure(
    browserFailure,
    "capture browser",
    (): Promise<void> => browser.close(),
  );
}
console.log("done");
