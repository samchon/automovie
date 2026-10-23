import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { type Browser, type Page, chromium } from "playwright-core";

import type { IHumanViewerPage } from "../human/IHumanViewerPage.ts";

/** Browser global published by `src/human-view.ts`. */
type HumanWindow = Window & { __automovieHuman?: IHumanViewerPage };

/** Model the page currently holds, as the session addressed it. */
interface IResidentModel {
  key: string;
  source: string;
  value: unknown;
  generation: number;
}

/**
 * Serve Human generation and PNG capture from one resident headless Chrome page.
 *
 * The child owns one Chrome process and one tab on the running Vite server's
 * `/human.html`, whose origin the plugin sets in `AUTOMOVIE_HUMAN_WORKER_ORIGIN`
 * once the server listens. Generation therefore runs through Vite's module
 * loading of the current source and every PNG is drawn by the same page a
 * person opens, with no separate bundle or renderer.
 *
 * - `generate` admits the parameters in-page (exact equality with a registered
 *   typed example), runs `AutoMovieHuman.generate`, and writes the
 *   `{ parameters, model }` JSON to `<worker directory>/publication.json` with
 *   its byte count and SHA-256 for `HumanImageProcess.publication`.
 * - `render` captures one named camera, pass, curve selection and free view at
 *   the reference conditions and returns the PNG bytes, capture UTC, SHA-256
 *   and render metadata.
 * - `diagram` draws the 2D curve diagram of a curve list in the same page and
 *   returns its PNG (or SVG) bytes with SHA-256 and capture UTC; it needs no
 *   generated model.
 *
 * The page and model are reused across frames of one model key and across
 * keys; a changed source hash navigates the tab back to the bare page so Vite serves the edited
 * modules, and a page that lost its model (for example a Vite full reload)
 * regenerates the same input before rendering. Page errors return as replies
 * so the Vite host survives; a Chrome crash or disconnect exits the child so
 * the session starts a fresh one. A software WebGL renderer is refused because
 * the reference photographs come from a hardware ANGLE renderer.
 *
 * @evidence contracts/common.md#principled-implementation Generation and capture run in the same human.html a person opens, loaded through Vite's module graph; the publication is written beside and renamed, and every PNG's signature and IHDR size are checked against the capture's canvas before its SHA-256 is computed.
 * @evidence contracts/common.md#clear-and-simple-design The child owns Chrome and the page only; queueing, cache, identity and HTTP stay with HumanImageSession, HumanImageProcess and the plugin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Page errors become error replies, a software renderer is refused, a render for an ungenerated key throws, and a lost page model is regenerated from the same admitted input rather than replaced by an older one.
 * @evidence contracts/common.md#meaningful-documentation States the origin hand-off, both commands, reuse, reload and crash rules and the hardware-renderer requirement.
 * @evidence contracts/performance.md#efficient-algorithms Chrome and the tab start once per child; generate costs one in-page generation plus O(model bytes) serialization, hashing and one file write; render costs one draw and PNG encode plus O(PNG bytes) decode and hash.
 * @evidence contracts/performance.md#reuse-equivalent-work One page and model serve every frame of a key and Chrome serves every key; a source change reloads the tab so stale modules are never reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one browser, one page, the last admitted input and its generation counter; PNG and publication bytes are released after each reply; IPC disconnect closes Chrome and exits, and Chrome exits on its own if the child is killed.
 */
export async function humanImageProcessEntry(): Promise<void> {
  if (!process.send)
    throw new Error("Human worker requires its owned IPC channel");
  const origin: string | undefined = process.env.AUTOMOVIE_HUMAN_WORKER_ORIGIN;
  const directory: string | undefined =
    process.env.AUTOMOVIE_HUMAN_WORKER_DIRECTORY;
  if (origin === undefined || directory === undefined)
    throw new Error("Human worker origin or directory is not configured");
  const publication: string = path.join(directory, "publication.json");
  const url: string = origin.replace(/\/+$/, "") + "/human.html";

  let closing: boolean = false;
  let loadedSource: string | undefined;
  let resident: IResidentModel | undefined;

  // One Chrome with real GPU WebGL; ANGLE D3D11 on Windows as the references.
  const browser: Browser = await chromium.launch({
    executablePath: DEFAULT_CHROME_EXECUTABLE,
    headless: true,
    args: [
      "--ignore-gpu-blocklist",
      "--enable-gpu",
      ...(process.platform === "win32" ? ["--use-angle=d3d11"] : []),
    ],
  });
  browser.on("disconnected", (): void => {
    if (!closing) {
      console.error("Human worker Chrome disconnected");
      process.exit(1);
    }
  });

  /** Close Chrome once and exit; used on IPC disconnect. */
  const shutdown: (code: number) => void = (code: number): void => {
    if (closing) return;
    closing = true;
    void browser
      .close()
      .catch(console.error)
      .finally((): never => process.exit(code));
  };
  process.once("disconnect", (): void => shutdown(0));

  const page: Page = await browser.newPage({
    viewport: { width: 1280, height: 1200 },
    deviceScaleFactor: 1,
  });
  page.on("crash", (): void => {
    console.error("Human worker page crashed");
    shutdown(1);
  });
  page.on("pageerror", (error: Error): void => {
    console.error("Human page error: " + error.message);
  });

  /**
   * Wait until the page has mounted and finished any load in progress.
   *
   * A Vite full reload keeps the page address, which the page mirrors its
   * view into, so a reloaded page may start generating its own alias; the
   * worker waits for that load to settle before issuing its own commands.
   */
  const ready: () => Promise<void> = async (): Promise<void> => {
    await page.waitForFunction(
      (): boolean => {
        const human: IHumanViewerPage | undefined = (window as HumanWindow)
          .__automovieHuman;
        return typeof human?.capture === "function" && !human.snapshot().busy;
      },
      null,
      { timeout: 120000 },
    );
  };
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await ready();

  /** Generate one input in-page; a changed source reloads the tab first. */
  const generate: (
    source: string,
    value: unknown,
  ) => Promise<IHumanViewerPage.ILoaded> = async (
    source: string,
    value: unknown,
  ): Promise<IHumanViewerPage.ILoaded> => {
    if (loadedSource !== undefined && loadedSource !== source) {
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      await ready();
    }
    loadedSource = source;
    return page.evaluate(
      (candidate: unknown): Promise<IHumanViewerPage.ILoaded> =>
        (window as HumanWindow).__automovieHuman!.load(candidate),
      value,
    );
  };

  /** Execute one session command and build its reply record. */
  const execute: (
    command: Record<string, unknown>,
  ) => Promise<Record<string, unknown>> = async (
    command: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    const source: string = String(command.source);
    const key: string = String(command.key);

    if (command.kind === "generate") {
      const started: number = performance.now();
      resident = undefined;
      const loaded: IHumanViewerPage.ILoaded = await generate(
        source,
        command.value,
      );
      const json: string = await page.evaluate((): string =>
        (window as HumanWindow).__automovieHuman!.serialize(),
      );

      // Write beside, then rename, so the session never reads a partial file.
      const bytes: Buffer = Buffer.from(json, "utf8");
      const sha256: string = digest(bytes);
      await fs.writeFile(publication + ".partial", bytes);
      await fs.rename(publication + ".partial", publication);

      // The archive's receipt rule commits to the model and to its
      // construction parts separately, over their canonical JSON bytes.
      const parsed: {
        model: { parts: Array<{ id: string }> };
      } = JSON.parse(json);
      const modelSha256: string = digest(
        Buffer.from(JSON.stringify(parsed.model)),
      );
      const constructionSha256: string = digest(
        Buffer.from(
          JSON.stringify(
            parsed.model.parts.filter((part: { id: string }): boolean =>
              part.id.startsWith("human.construction."),
            ),
          ),
        ),
      );
      resident = {
        key,
        source,
        value: command.value,
        generation: loaded.generation,
      };
      return {
        key,
        source,
        inputSha256: command.inputSha256,
        path: publication,
        bytes: bytes.length,
        sha256,
        receipt: {
          kind: "human-generation",
          key,
          sourceSha256: source,
          inputSha256: command.inputSha256,
          modelSha256,
          constructionSha256,
          alias: loaded.alias,
          generatedUtc: new Date().toISOString(),
          generateMilliseconds: loaded.generateMilliseconds,
          workerMilliseconds: performance.now() - started,
          parts: loaded.parts,
          bounds: loaded.bounds,
          construction: loaded.construction,
          publication: { bytes: bytes.length, sha256 },
          page: url,
        },
      };
    }

    if (command.kind === "render") {
      if (resident === undefined || resident.key !== key)
        throw new Error(
          "Human render requested for a model this worker has not generated",
        );
      const frame: RegExpExecArray | null =
        /^([a-z0-9-]+)\.(surface|overlay|construction)\.png$/.exec(
          String(command.name),
        );
      if (frame === null)
        throw new Error("Malformed Human frame name: " + String(command.name));

      // A reloaded page lost its model; regenerate the same admitted input.
      const generation: number = await page.evaluate(
        (): number =>
          (window as HumanWindow).__automovieHuman?.snapshot().generation ?? 0,
      );
      if (generation !== resident.generation || loadedSource !== source) {
        await ready();
        const loaded: IHumanViewerPage.ILoaded = await generate(
          source,
          resident.value,
        );
        resident.generation = loaded.generation;
      }

      // The canonical curves value reaches the page unchanged; the page
      // resolves it against the model and fails on an unmatched pattern.
      const curves: string = String(command.curves ?? "");
      const view: string = String(command.view ?? "");
      const capture: IHumanViewerPage.ICapture = await page.evaluate(
        ([camera, pass, selection, free]: [
          string,
          IHumanViewerPage.Pass,
          string,
          string,
        ]): IHumanViewerPage.ICapture =>
          (window as HumanWindow).__automovieHuman!.capture(
            camera,
            pass,
            selection,
            free,
          ),
        [frame[1]!, frame[2] as IHumanViewerPage.Pass, curves, view] as [
          string,
          IHumanViewerPage.Pass,
          string,
          string,
        ],
      );
      if (
        /swiftshader|llvmpipe|software/i.test(
          capture.metadata.renderer.renderer,
        )
      )
        throw new Error(
          "Human capture refused a software WebGL renderer: " +
            capture.metadata.renderer.renderer,
        );

      // Decode the data URL and check the PNG signature and IHDR size.
      const prefix: string = "data:image/png;base64,";
      if (!capture.png.startsWith(prefix))
        throw new Error("Human capture did not return a PNG data URL");
      const png: Buffer = Buffer.from(
        capture.png.slice(prefix.length),
        "base64",
      );
      if (
        png.length < 24 ||
        png.readUInt32BE(0) !== 0x89504e47 ||
        png.readUInt32BE(16) !== capture.metadata.canvas.width ||
        png.readUInt32BE(20) !== capture.metadata.canvas.height
      )
        throw new Error("Human capture PNG header does not match its canvas");
      return {
        key,
        source,
        png,
        capturedUtc: capture.capturedUtc,
        pngSha256: digest(png),
        metadata: {
          ...capture.metadata,
          frame: command.name,
          modelKey: key,
          source,
          page: url,
        },
      };
    }
    if (command.kind === "diagram") {
      // Diagrams need no generated model, only the current modules.
      // A render later regenerates the resident model if this reload lost it.
      if (loadedSource !== source) {
        await page.goto(url, { waitUntil: "load", timeout: 120000 });
        await ready();
        loadedSource = source;
      }
      const format: "svg" | "png" = command.format === "svg" ? "svg" : "png";
      const drawn: string = await page.evaluate(
        ([alias, curves, kind]: [
          string,
          string,
          "svg" | "png",
        ]): Promise<string> =>
          (window as HumanWindow).__automovieHuman!.diagram(
            alias,
            curves,
            kind,
          ),
        [String(command.alias), String(command.curves), format] as [
          string,
          string,
          "svg" | "png",
        ],
      );
      const bytes: Buffer =
        format === "svg"
          ? Buffer.from(drawn, "utf8")
          : Buffer.from(
              drawn.replace(/^data:image\/png;base64,/, ""),
              "base64",
            );
      if (format === "png" && bytes.readUInt32BE(0) !== 0x89504e47)
        throw new Error("Human curve diagram did not rasterize to PNG");
      return {
        key,
        source,
        bytes,
        sha256: digest(bytes),
        capturedUtc: new Date().toISOString(),
      };
    }
    throw new Error("Unknown Human worker command: " + String(command.kind));
  };

  // The process owner sends one command at a time; replies carry its id.
  process.on("message", (message: unknown): void => {
    if (
      message === null ||
      typeof message !== "object" ||
      !("id" in message) ||
      !Number.isSafeInteger(message.id)
    ) {
      process.send?.({ error: "Malformed Human worker request" });
      return;
    }
    const id: number = message.id as number;
    void execute(message as Record<string, unknown>)
      .then(
        (reply: Record<string, unknown>): Record<string, unknown> => ({
          ...reply,
          id,
        }),
      )
      .catch(
        (error: unknown): Record<string, unknown> => ({
          id,
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      .then((reply: Record<string, unknown>): void => {
        process.send?.(reply);
      });
  });
  process.send({ kind: "ready" });
}

/** Lowercase hex SHA-256 of exact bytes. */
function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

void humanImageProcessEntry().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
