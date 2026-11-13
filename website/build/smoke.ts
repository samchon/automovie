// Open the built site in a headless browser and check that its pages run.
//
//   pnpm run smoke
//
// The type check and the Node tests cannot see what only the browser bundle
// does, such as a package source the bundler compiled wrongly. This serves
// `out/`, opens each page below, waits for what it must show, and fails on a
// missing element, a page error, a console error or a failed request.
import { compressToEncodedURIComponent } from "lz-string";
import type http from "node:http";
import { type Browser, type Page, chromium } from "playwright-core";

import { serveExport } from "./serveExport";

/** One page to open and what it must show. */
interface ICase {
  /** What the case is, for the log. */
  name: string;

  /** The path under the site's root, with its query and fragment. */
  path: string;

  /** Selectors that must each match within the time limit. */
  shows: string[];

  /** Selectors that must match nothing once the others do. */
  lacks: string[];
}

/** A composition whose second action the vocabulary lacks. */
const REFUSED: string = compressToEncodedURIComponent(
  JSON.stringify({
    version: 1,
    seed: "smoke",
    performers: [
      {
        subject: "a",
        body: "m1",
        x: 0,
        z: 0,
        yaw: 0,
        proficiency: "trained",
        actions: [
          { name: "stand", params: { seconds: 1 } },
          { name: "levitate", params: {} },
        ],
      },
    ],
    mutuals: [],
  }),
);

const CASES: readonly ICase[] = [
  {
    name: "landing",
    path: "",
    shows: [
      'a[href="/automovie/playground/"]',
      'a[href="/automovie/gallery/"]',
    ],
    lacks: [],
  },
  {
    name: "playground performs its first preset",
    path: "playground/",
    shows: [
      "#am-pane-compose",
      "#am-pane-result .am-instrument canvas",
      "#am-timeline",
      "#am-verdicts",
    ],
    lacks: [".am-alert"],
  },
  {
    name: "playground shows a refusal on its action",
    path: `playground/#c=${REFUSED}`,
    shows: [
      '#am-pane-result .am-alert[role="alert"]',
      '.am-action[data-refused="true"] .am-action-refusal',
    ],
    lacks: [".am-instrument"],
  },
  {
    name: "gallery draws the polygon man",
    path: "gallery/",
    shows: [
      'nav[aria-label="Catalogue"]',
      'section[aria-label="3D view"] .am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] .am-table',
    ],
    lacks: [".am-viewport-error"],
  },
  {
    name: "gallery draws an opened door with its affordances",
    path: "gallery/?subject=createDoor&variant=hinged&seed=7&move.hinge=70",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      ".am-viewport-tag",
      'aside[aria-label="Details"] input[type="range"]',
    ],
    lacks: [".am-viewport-error"],
  },
];

const main = async (): Promise<void> => {
  const served: { server: http.Server; address: string } = await serveExport(0);
  const browser: Browser = await chromium.launch({
    headless: true,

    // A software WebGL backend, so the 3D views draw without a GPU.
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const failures: string[] = [];
  try {
    for (const each of CASES) {
      const page: Page = await browser.newPage();
      const problems: string[] = [];
      page.on("console", (message): void => {
        if (message.type() === "error")
          problems.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error: Error): void => {
        problems.push(`error: ${error.message}`);
      });
      page.on("requestfailed", (request): void => {
        problems.push(`failed request: ${request.url()}`);
      });
      await page.goto(`${served.address}${each.path}`, { waitUntil: "load" });
      for (const selector of each.shows)
        try {
          await page.waitForSelector(selector, {
            state: "attached",
            timeout: 180000,
          });
        } catch {
          problems.push(`missing: ${selector}`);
        }
      for (const selector of each.lacks)
        if ((await page.locator(selector).count()) !== 0)
          problems.push(
            `unexpected: ${selector}: ${((await page.locator(selector).first().textContent()) ?? "").slice(0, 300)}`,
          );
      console.log(`${problems.length === 0 ? "pass" : "FAIL"} ${each.name}`);
      for (const problem of problems) {
        console.log(`  ${problem}`);
        failures.push(`${each.name}: ${problem}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    served.server.close();
  }
  if (failures.length !== 0) process.exit(1);
};
main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
