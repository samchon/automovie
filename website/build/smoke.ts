// Open the built site in a headless browser and check that its pages run.
//
//   pnpm run smoke
//
// The type check and the Node tests cannot see what only the browser bundle
// does, such as a package source the bundler compiled wrongly. This serves
// `out/`, opens each page below, waits for what it must show, and fails on a
// missing element, a page error, a console error, a failed request, a page
// that creates more WebGL contexts than it may, or an address that does not
// arrive where it should. Every scene the build baked gets its own case.
import { compressToEncodedURIComponent } from "lz-string";
import fs from "node:fs";
import type http from "node:http";
import path from "node:path";
import { type Browser, type BrowserContext, type Page, chromium } from "playwright-core";

import type { ISceneManifest } from "../src/scenes/structures/ISceneManifest";
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

  /** The most WebGL contexts the page may create; unchecked when absent. */
  contexts?: number;

  /** The path, under the site's root, the page must end on. */
  arrives?: string;

  /** Whether the browser asks for reduced motion; the landing page's stage must then stay on its first scene. */
  reduced?: boolean;
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

/** A drawn scene view: a canvas inside a view that finished loading. */
const DRAWN: string = '.am-scene-view[aria-busy="false"] canvas';

/** The scenes the build baked, read from its manifest. */
const baked = (): string[] => {
  const manifest: ISceneManifest = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "..", "public", "baked", "manifest.json"),
      "utf8",
    ),
  );
  return Object.keys(manifest.scenes).filter(
    (id: string): boolean => id !== "lineup",
  );
};

const CASES: readonly ICase[] = [
  {
    name: "landing plays its hero",
    path: "",
    shows: [".am-hero h1", `.am-hero-stage ${DRAWN}`, 'a[href="/automovie/scenes/"]'],
    lacks: [".am-scene-view-note.am-danger-text"],
    contexts: 1,
  },
  {
    name: "landing under reduced motion holds its frames",
    path: "",
    shows: [`.am-hero-stage ${DRAWN}`],
    lacks: [],
    reduced: true,
  },
  {
    name: "scenes gallery plays its cards",
    path: "scenes/",
    shows: [`.am-scene-card ${DRAWN}`, "#am-roadmap"],
    lacks: [".am-scene-view-note.am-danger-text"],
    contexts: 1,
  },
  ...baked().map(
    (id: string): ICase => ({
      name: `scene ${id} plays with its takes and chain`,
      path: `scenes/${id}/`,
      shows: [`.am-player ${DRAWN}`, ".am-take-grid .am-take canvas", ".am-transport"],
      lacks: [".am-scene-view-note.am-danger-text"],
      contexts: 1,
    }),
  ),
  {
    name: "a scene that waits shows what it waits on",
    path: "scenes/line-volley/",
    shows: [".am-badge", 'a[href="https://github.com/samchon/automovie/issues/3392"]'],
    lacks: [".am-player"],
  },
  {
    name: "objects gallery draws its cards",
    path: "objects/",
    shows: [".am-object-card .am-object-view canvas", ".am-chips"],
    lacks: [".am-alert"],
    contexts: 1,
  },
  {
    name: "the old gallery address arrives at the opened door",
    path: "gallery/?subject=createDoor&variant=hinged&seed=7&move.hinge=70",
    arrives: "objects/?subject=createDoor&variant=hinged&seed=7&move.hinge=70",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      ".am-viewport-tag",
      'aside[aria-label="Details"] [role="tablist"]',
    ],
    lacks: [".am-viewport-error"],
  },
  {
    name: "the Human page stands every body",
    path: "human/",
    shows: [`.am-player ${DRAWN}`, "details.am-measures table"],
    lacks: [".am-scene-view-note.am-danger-text"],
    contexts: 1,
  },
  {
    name: "the motion reference lists the actions",
    path: "motions/actions/",
    shows: [".am-motion-nav", "section#walk", 'a[href^="/automovie/playground/#c="]'],
    lacks: [],
  },
  {
    name: "the docs open",
    path: "docs/composing-motion/",
    shows: ["article h1", "nav"],
    lacks: [],
  },
  {
    name: "playground performs the dance circle",
    path: "playground/",
    shows: ["#am-pane-compose", "#am-pane-result .am-instrument canvas", "#am-timeline", "#am-verdicts"],
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
];

/** Counts the WebGL contexts a page creates, installed before any of its scripts run. */
const COUNTERS: string = `
  window.__amContexts = 0;
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const made = getContext.call(this, kind, ...rest);
    if (made !== null && String(kind).startsWith("webgl") && !this.__amCounted) {
      this.__amCounted = true;
      window.__amContexts++;
    }
    return made;
  };
`;

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
      const context: BrowserContext = await browser.newContext({
        reducedMotion: each.reduced === true ? "reduce" : "no-preference",
        viewport: { width: 1440, height: 900 },
      });
      await context.addInitScript(COUNTERS);
      const page: Page = await context.newPage();
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
      if (each.arrives !== undefined)
        try {
          await page.waitForURL(`${served.address}${each.arrives}`, {
            timeout: 30000,
          });
        } catch {
          problems.push(`arrived at ${page.url()}, not ${each.arrives}`);
        }
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
      if (each.contexts !== undefined) {
        const made: number = await page.evaluate(
          (): number => (window as unknown as { __amContexts: number }).__amContexts,
        );
        if (made > each.contexts)
          problems.push(`created ${made} WebGL contexts, more than ${each.contexts}`);
      }
      if (each.reduced === true) {
        // A held stage draws its first picture and stays on its scene.
        const time: string = await page
          .locator(".am-hero-caption")
          .first()
          .textContent()
          .then((text: string | null): string => text ?? "");
        await page.waitForTimeout(1500);
        const later: string = await page
          .locator(".am-hero-caption")
          .first()
          .textContent()
          .then((text: string | null): string => text ?? "");
        if (time !== later)
          problems.push("the hero moved on under reduced motion");
      }
      console.log(`${problems.length === 0 ? "pass" : "FAIL"} ${each.name}`);
      for (const problem of problems) {
        console.log(`  ${problem}`);
        failures.push(`${each.name}: ${problem}`);
      }
      await context.close();
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
