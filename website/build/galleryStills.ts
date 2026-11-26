import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import {
  type Browser,
  type Locator,
  type Page,
  chromium,
} from "playwright-core";

import { BakedTake } from "../src/baked/BakedTake";
import type { ITake } from "../src/takes/structures/ITake";

/** Camera labels on the published scene player. */
const VIEWS: readonly string[] = ["Side", "Three-quarter", "Front"];

/** The exported site and the destination for an auditable still set. */
const SITE: string = path.resolve(__dirname, "..");
const OUT: string = path.join(SITE, ".shots", "gallery-stills");

/** Every second source frame and the frames bracketing each named event. */
function frames(take: ITake): number[] {
  const last: number = take.track.frames - 1;
  const fps: number = take.track.fps;
  const needed: Set<number> = new Set([last]);
  for (let frame: number = 0; frame < last; frame += 2) needed.add(frame);
  for (const track of take.timeline.tracks)
    for (const span of track.spans)
      for (const seconds of [
        span.from,
        span.to,
        ...span.events.map((event) => event.seconds),
      ]) {
        const index: number = Math.round(seconds * fps);
        for (const frame of [index - 1, index, index + 1])
          if (frame >= 0 && frame <= last) needed.add(frame);
      }
  return [...needed].sort(
    (left: number, right: number): number => left - right,
  );
}

/** Seek through the playback control and wait for the shared stage to draw. */
async function seek(page: Page, frame: number): Promise<void> {
  const range: Locator = page.getByRole("slider", { name: "Time" });
  await range.evaluate((element: HTMLInputElement, index: number): void => {
    const value: PropertyDescriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!;
    value.set!.call(element, String(index));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, frame);
  await page.waitForFunction(
    (index: number): boolean =>
      document
        .querySelector(".am-transport-scrub")
        ?.getAttribute("aria-valuetext")
        ?.includes(`frame ${index} of `) === true,
    frame,
  );
  await page.evaluate(
    (): Promise<void> =>
      new Promise((resolve: () => void): void => {
        requestAnimationFrame((): void => {
          requestAnimationFrame((): void => resolve());
        });
      }),
  );
}

/** Capture one served scene with its exact take bytes and view controls. */
async function capture(
  page: Page,
  base: URL,
  id: string,
  round: { revision: string; workingTree: boolean; folder: string },
): Promise<void> {
  const served: URL = new URL(`scenes/${id}/`, base);
  const bytes: Buffer = fs.readFileSync(
    path.join(SITE, "out", "baked", "scenes", `${id}.take`),
  );
  const take: ITake = BakedTake.decode(gunzipSync(bytes));
  const folder: string = path.join(round.folder, id);
  fs.mkdirSync(folder, { recursive: true });
  await page.goto(served.href, { waitUntil: "load" });
  const canvas: Locator = page
    .locator('.am-scene-view[aria-busy="false"] canvas')
    .first();
  await canvas.waitFor({ timeout: 60000 });
  const box: Awaited<ReturnType<Locator["boundingBox"]>> =
    await canvas.boundingBox();
  const instants: number[] = frames(take);
  for (const view of VIEWS) {
    await page
      .getByRole("group", { name: "View" })
      .getByRole("button", { name: view, exact: true })
      .click();
    for (const frame of instants) {
      await seek(page, frame);
      await canvas.screenshot({
        path: path.join(
          folder,
          `${view.toLowerCase()}-${String(frame).padStart(4, "0")}.png`,
        ),
      });
    }
  }
  fs.writeFileSync(
    path.join(folder, "record.json"),
    JSON.stringify(
      {
        revision: round.revision,
        workingTree: round.workingTree,
        url: served.href,
        takeSha256: createHash("sha256").update(bytes).digest("hex"),
        scene: id,
        fps: take.track.fps,
        duration: take.duration,
        width: 1440,
        height: 900,
        canvas: box,
        views: VIEWS,
        instants,
        timeline: take.timeline,
        renderer: "website shared stage, Chromium SwiftShader",
      },
      null,
      2,
    ),
  );
  console.log(
    `${id} saved ${instants.length} stills in each of ${VIEWS.length} views`,
  );
}

/** Capture from a running production export. */
async function main(): Promise<void> {
  const [address, ...ids]: string[] = process.argv
    .slice(2)
    .filter((arg: string): boolean => arg !== "--");
  if (
    address === undefined ||
    ids.length === 0 ||
    ids.some((id: string): boolean => !/^[a-z0-9-]+$/.test(id))
  )
    throw new Error(
      "Name the served site's root URL followed by one or more scene ids",
    );
  const base: URL = new URL(address.endsWith("/") ? address : `${address}/`);
  const revision: string = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const workingTree: boolean =
    execFileSync(
      "git",
      ["status", "--porcelain", "--", "website", "packages"],
      { encoding: "utf8", cwd: path.join(SITE, "..") },
    ).trim() !== "";
  const started: string = new Date().toISOString().replaceAll(":", "-");
  const folder: string = path.join(OUT, `${revision.slice(0, 8)}-${started}`);
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    const page: Page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    for (const id of ids) {
      try {
        await capture(page, base, id, { revision, workingTree, folder });
      } catch (error: unknown) {
        process.exitCode = 1;
        console.error(id, error);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
