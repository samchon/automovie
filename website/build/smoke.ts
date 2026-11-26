// Open the built site in a headless browser and check that its pages run.
//
//   pnpm run smoke [--shots] [--only <case pattern>]
//
// The type check cannot see what only the browser bundle
// does, such as a package source the bundler compiled wrongly. This serves
// `out/`, opens each page below, waits for what it must show, and fails on a
// missing element, a page error, a console error, a failed request, a page
// that creates more WebGL contexts than it may, or an address that does not
// arrive where it should. The cases check that the cards show the baked
// stills, that a card pointed at plays its take, and that a scene's and a
// motion's page play their baked takes. Each page's time to show what it
// must is logged, and with `--shots` each page is saved once checked as
// `.shots/smoke-<n>.png`, which git ignores. `pnpm run bake` must have run
// before the build.
import { compressToEncodedURIComponent } from "lz-string";
import fs from "node:fs";
import type http from "node:http";
import path from "node:path";
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  type Locator,
  type Page,
  type Request,
  chromium,
} from "playwright-core";

import { SCENES } from "../src/scenes/SCENES";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import { archetypeSmokeCases } from "./catalogue/archetypeSmokeCases";
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

  /** Whether the browser asks for reduced motion. */
  reduced?: boolean;

  /** A further check once the selectors match, adding what it finds to problems. */
  check?: (page: Page, problems: string[]) => Promise<void>;
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

/** A saved half-second standing take. */
const SAVED: string = compressToEncodedURIComponent(
  JSON.stringify({
    version: 1,
    seed: "saved",
    performers: [
      {
        subject: "a",
        body: "m1",
        x: 0,
        z: 0,
        yaw: 0,
        proficiency: "trained",
        actions: [{ name: "stand", params: { hold: 0.5 } }],
      },
    ],
    mutuals: [],
  }),
);

/** A drawn scene view: a canvas inside a view that finished loading. */
const DRAWN: string = '.am-scene-view[aria-busy="false"] canvas';

/** Whether each page is saved as a screenshot once checked. */
const SHOTS: boolean = process.argv.includes("--shots");

/** Restrict a local smoke run to a case name or path. */
const ONLY_AT: number = process.argv.indexOf("--only");
if (ONLY_AT !== -1 && process.argv[ONLY_AT + 1] === undefined)
  throw new Error("--only requires a case pattern");
const ONLY: RegExp | null =
  ONLY_AT === -1 ? null : new RegExp(process.argv[ONLY_AT + 1]!);

/**
 * The longest a take may take to compute and draw in the headless browser,
 * which poses on the CPU alone, before the case fails.
 */
const COMPUTE_LIMIT: number = 180000;

/** A marked scene that still exercises the packages' refusal path. */
const REFUSED_SCENE: IScene | undefined = SCENES.find(
  (scene: IScene): boolean => {
    if (
      scene.hidden === true ||
      scene.composition === null ||
      scene.takes[0] === undefined ||
      SceneStatus.of(scene).kind !== "refused" ||
      (ONLY !== null &&
        !ONLY.test(
          `scene ${scene.id} shows the packages' refusal scenes/${scene.id}/`,
        ))
    )
      return false;
    const result: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
      SceneTake.apply(scene.composition, scene.takes[0]),
      SCENE_FPS,
    );
    return !("track" in result) && result.kind !== "error";
  },
);

/** A baked still on a card. */
const STILL: (kind: "scenes" | "motions") => string = (
  kind: "scenes" | "motions",
): string => `img[src*="/automovie/baked/${kind}/"]`;

/**
 * Pointing at the gallery's first card plays its baked take in place of its
 * still; the time from pointing to drawing is logged.
 */
const hoverCard: (page: Page, problems: string[]) => Promise<void> = async (
  page: Page,
  problems: string[],
): Promise<void> => {
  const card: Locator = page
    .locator(`.am-scene-card:has(${STILL("scenes")})`)
    .first();
  const started: number = Date.now();
  await card.hover();
  try {
    await card
      .locator(DRAWN)
      .waitFor({ state: "attached", timeout: COMPUTE_LIMIT });
    console.log(
      `  the first card drew its take ${((Date.now() - started) / 1000).toFixed(1)} s after it was pointed at`,
    );
  } catch {
    problems.push("the first card did not play its take when pointed at");
  }
};

const CASES: readonly ICase[] = [
  {
    name: "landing plays its screenplay beside its take",
    path: "",
    shows: [
      ".am-hero h1",
      '.am-script-stage .am-figure-canvas[data-state="playing"] canvas',
      '.am-script-beats li[data-active="true"]',
      ".am-graph svg",
      'a[href="/automovie/scenes/"]',
      ".am-motion-code .am-line-mark",
    ],
    lacks: [".am-scene-view"],
    contexts: 0,
  },
  {
    name: "landing under reduced motion holds its figures",
    path: "",
    shows: ['.am-script-stage .am-figure-canvas[data-state="paused"] canvas'],
    lacks: ['.am-figure-canvas[data-state="playing"]'],
    reduced: true,
  },
  {
    name: "scenes gallery shows baked stills and plays a card pointed at",
    path: "scenes/",
    shows: [`.am-scene-card ${STILL("scenes")}`, ".am-chips"],
    lacks: [".am-scene-view-refusal", ".am-scene-view-note.am-danger-text"],
    contexts: 1,
    check: hoverCard,
  },
  {
    name: "a scene page plays its baked take, its code and its takes",
    path: "scenes/meeting/",
    shows: [`.am-scene-page ${DRAWN}`, ".am-transport", ".am-code"],
    lacks: [".am-scene-view-note.am-danger-text"],
    contexts: 1,
    check: async (page: Page, problems: string[]): Promise<void> => {
      await page.getByRole("tab", { name: /^Takes/ }).click();
      try {
        await page
          .locator(`.am-take-grid .am-take ${DRAWN}`)
          .nth(1)
          .waitFor({ state: "attached", timeout: COMPUTE_LIMIT });
      } catch {
        problems.push(
          "the second take was not computed when the takes were opened",
        );
      }
    },
  },
  ...(REFUSED_SCENE === undefined
    ? []
    : [
        {
          name: `scene ${REFUSED_SCENE.id} shows the packages' refusal`,
          path: `scenes/${REFUSED_SCENE.id}/`,
          shows: [".am-scene-refused", ".am-scene-view-refusal"],
          lacks: [".am-scene-view-note.am-danger-text"],
          contexts: 1,
        },
      ]),
  {
    name: "a scene page under reduced motion renders as the server did",
    path: "scenes/meeting/",
    shows: [`.am-scene-page ${DRAWN}`, ".am-transport"],
    lacks: [".am-scene-view-note.am-danger-text"],
    reduced: true,
  },
  {
    name: "a scene that waits shows what it waits on",
    path: "scenes/line-volley/",
    shows: [
      ".am-scene-waiting",
      'a[href^="https://github.com/samchon/automovie/issues/"]',
    ],
    lacks: [".am-scene-view"],
  },
  {
    name: "archetypes draw their cards",
    path: "archetypes/",
    shows: [".am-object-card .am-object-view canvas", ".am-index-nav"],
    lacks: [".am-alert"],
    contexts: 1,
  },
  {
    name: "the transit bus opens with its seeded dimensions",
    path: "archetypes/?subject=createTransitBus&seed=7",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] td:text-is("aisleWidth")',
    ],
    lacks: [".am-viewport-error"],
    contexts: 1,
  },
  {
    name: "a derived archetype dimension shows as a single value",
    path: "archetypes/?subject=createStageWeaponProp&variant=mace",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] tr:has(td:text-is("height")) .am-band-text:text-is("Single value")',
    ],
    lacks: [".am-viewport-error"],
    contexts: 1,
  },
  {
    name: "the oldest archetype address arrives at the opened door",
    path: "gallery/?subject=createDoor&variant=hinged&seed=7&move.hinge=70",
    arrives:
      "archetypes/?subject=createDoor&variant=hinged&seed=7&move.hinge=70",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      ".am-viewport-tag",
      'aside[aria-label="Details"] [role="group"][aria-label="Details view"]',
    ],
    lacks: [".am-viewport-error"],
  },
  {
    name: "the former archetype address arrives with its query",
    path: "objects/?subject=createSeat",
    arrives: "archetypes/?subject=createSeat",
    shows: ['.am-viewport[aria-busy="false"] canvas'],
    lacks: [".am-viewport-error"],
  },
  ...archetypeSmokeCases,
  {
    name: "the motion catalogue shows its stills and opens a motion's page",
    path: "motions/",
    shows: [`.am-motion-card ${STILL("motions")}`, ".am-index-nav"],
    lacks: [],
    check: async (page: Page, problems: string[]): Promise<void> => {
      await page
        .getByRole("searchbox", { name: "Search motions" })
        .fill("cartwheelLeft");
      await page.getByRole("link", { name: /^cartwheelLeft/ }).click();
      await page
        .locator(`.am-motion-page ${DRAWN}`)
        .waitFor({ state: "attached", timeout: COMPUTE_LIMIT });
      if (
        (await page.getByRole("heading", { name: "cartwheelLeft" }).count()) !==
        1
      )
        problems.push("the catalogue did not open the cartwheel");
    },
  },
  {
    name: "a motion's page plays its baked take and links its API entry",
    path: "motions/cartwheelLeft/",
    shows: [
      `.am-scene-page ${DRAWN}`,
      'a[href$="/api/variables/_automovie_motions.HumanSportThrow.cartwheelLeft.html"]',
    ],
    lacks: [".am-scene-view-note.am-danger-text"],
    contexts: 1,
  },
  {
    name: "a motion named in the catalogue's fragment arrives at its page",
    path: "motions/#jab",
    arrives: "motions/jab/",
    shows: [".am-motion-name"],
    lacks: [],
  },
  {
    name: "a family's former page arrives at its section of the catalogue",
    path: "motions/stageFight/",
    arrives: "motions/#family-stageFight",
    shows: ["#family-stageFight"],
    lacks: [],
  },
  {
    name: "the former Human address arrives at the landing page",
    path: "human/",
    arrives: "",
    shows: [".am-hero h1"],
    lacks: [],
  },
  {
    name: "the docs open",
    path: "docs/screenplay/evidence-graph/",
    shows: ["article h1", "nav"],
    lacks: [],
  },
  {
    name: "the reference opens",
    path: "reference/motion/composing/",
    shows: ["article h1", "nav"],
    lacks: [],
  },
  {
    name: "the API reference opens an action's entry",
    path: "api/classes/_automovie_motions.HumanChain.html#punch",
    shows: ["#punch"],
    lacks: [],
  },
  {
    name: "gallery shows baked examples and both catalogues",
    path: "gallery/",
    shows: [
      ".am-gallery-hub h1",
      '.am-gallery-nav a[href="/automovie/motions/"]',
      '.am-gallery-nav a[href="/automovie/archetypes/"]',
      `.am-gallery-hub .am-scene-card ${STILL("scenes")}`,
    ],
    lacks: ['a[href="/automovie/playground/"]', ".am-gallery-saved"],
    contexts: 1,
    check: hoverCard,
  },
  {
    name: "the former editor address opens the gallery",
    path: "playground/",
    arrives: "gallery/",
    shows: [".am-gallery-hub h1"],
    lacks: ["#am-pane-compose", ".am-gallery-saved"],
  },
  {
    name: "a legacy shared performance plays in the gallery on request",
    path: `playground/#c=${SAVED}`,
    arrives: `gallery/#c=${SAVED}`,
    shows: [".am-gallery-saved button"],
    lacks: ["#am-pane-compose", ".am-scene-view-refusal"],
    contexts: 1,
    check: async (page: Page): Promise<void> => {
      await page.getByRole("button", { name: "Load saved take" }).click();
      await page
        .locator(`.am-gallery-saved ${DRAWN}`)
        .waitFor({ state: "attached", timeout: COMPUTE_LIMIT });
    },
  },
  {
    name: "an invalid legacy shared performance explains its missing action",
    path: `playground/#c=${REFUSED}`,
    arrives: `gallery/#c=${REFUSED}`,
    shows: [".am-gallery-saved button"],
    lacks: ["#am-pane-compose"],
    check: async (page: Page): Promise<void> => {
      await page.getByRole("button", { name: "Load saved take" }).click();
      await page
        .locator(".am-gallery-saved")
        .getByRole("alert")
        .filter({ hasText: "no action is named levitate" })
        .waitFor({ state: "visible", timeout: COMPUTE_LIMIT });
    },
  },
];
/**
 * Counts the WebGL contexts a page creates, installed before any of its scripts
 * run.
 */
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

const main: () => Promise<void> = async (): Promise<void> => {
  if (ONLY === null) await import("./catalogue/check");
  const selected: readonly ICase[] =
    ONLY === null
      ? CASES
      : CASES.filter((each: ICase): boolean =>
          ONLY.test(`${each.name} ${each.path}`),
        );
  if (selected.length === 0) throw new Error("No smoke case matches --only");
  const served: { server: http.Server; address: string } = await serveExport(0);
  const browser: Browser = await chromium.launch({
    headless: true,

    // A software WebGL backend, so the 3D views draw without a GPU.
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const failures: string[] = [];
  try {
    for (const each of selected) {
      const context: BrowserContext = await browser.newContext({
        reducedMotion: each.reduced === true ? "reduce" : "no-preference",
        viewport: { width: 1440, height: 900 },
      });
      await context.addInitScript(COUNTERS);
      const page: Page = await context.newPage();
      const problems: string[] = [];
      page.on("console", (message: ConsoleMessage): void => {
        if (message.type() === "error")
          problems.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error: Error): void => {
        problems.push(`error: ${error.message}`);
      });
      page.on("requestfailed", (request: Request): void => {
        problems.push(`failed request: ${request.url()}`);
      });
      const opened: number = Date.now();
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
            timeout: COMPUTE_LIMIT,
          });
        } catch {
          problems.push(`missing: ${selector}`);
        }
      console.log(
        `  shown in ${((Date.now() - opened) / 1000).toFixed(1)} s after it was opened`,
      );
      if (each.check !== undefined)
        try {
          await each.check(page, problems);
        } catch (error: unknown) {
          problems.push(error instanceof Error ? error.message : String(error));
        }
      for (const selector of each.lacks)
        if ((await page.locator(selector).count()) !== 0)
          problems.push(
            `unexpected: ${selector}: ${((await page.locator(selector).first().textContent()) ?? "").slice(0, 300)}`,
          );
      if (each.contexts !== undefined) {
        const made: number = await page.evaluate(
          (): number =>
            (window as unknown as { __amContexts: number }).__amContexts,
        );
        if (made > each.contexts)
          problems.push(
            `created ${made} WebGL contexts, more than ${each.contexts}`,
          );
      }

      if (SHOTS) {
        const out: string = path.resolve(__dirname, "..", ".shots");
        fs.mkdirSync(out, { recursive: true });
        await page.screenshot({
          path: path.join(out, `smoke-${CASES.indexOf(each)}.png`),
        });
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
