import { createHash } from "node:crypto";
import type { JSHandle, Page } from "playwright-core";

import type { IAutoMovieHumanHeadPose } from "../../../human/src/structures/pose/IAutoMovieHumanHeadPose.ts";
import type { HumanStickmanController } from "../human-stickman/HumanStickmanController.ts";
import type { IHumanMannequinSnapshot } from "../human-stickman/IHumanMannequinSnapshot.ts";
import { captureHumanMannequinDraw } from "./captureHumanMannequinDraw.ts";
import { commitHumanMannequinSnapshot } from "./commitHumanMannequinSnapshot.ts";
import { navigateHumanCapturePage } from "./navigateHumanCapturePage.ts";

/** Capture the actual Mannequin page inside the existing Job-owned Human worker/Chrome.
 *
 * @evidence contracts/common.md#principled-implementation Navigates to the existing page, uses its original view/pass/hint/pose/expression and transport controls plus public fixed-time seek, then reads the paused public snapshot and canvas pixels after drawn frames.
 * @evidence contracts/common.md#clear-and-simple-design Adds a page-specific command consumer to the maintained worker, not another browser, CLI, renderer or serializer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects unsupported fields, conflicting clips and explicit pose/head input, playing capture state, changed document ownership, software GPU or malformed PNG; query labels never substitute for actual snapshot state.
 * @evidence contracts/common.md#meaningful-documentation Head uses public clinical units, root uses metres/radians/dimensionless nonsingular scale, and motion uses local seconds; captures are paused independently from their observed play/pause/reset actions.
 * @evidence contracts/performance.md#efficient-algorithms One body preparation serves camera/pass frames for an input key; actual snapshots cross Playwright and IPC as their existing JSON text, avoiding per-number protocol wrapper graphs.
 * @evidence contracts/performance.md#reuse-equivalent-work Source, alias and clamp form the prepared-body key; view, pass, hints, pose, expression, root and time reuse that body through existing controls. The parent retains at most six exact-fresh frame slots, while the execution owner bounds capture lifetime by one view/input chunk.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one key and document epoch; page/browser shutdown remains with the existing worker owner, and frame bytes/snapshot transfer to its queued caller.
 */
export class HumanImageMannequin {
  /** Borrowed page and fixed task-server origin; neither is replaced by this consumer. */
  private readonly page: Page;
  private readonly origin: string;
  /** Existing new-document observer, including target-close invalidation. */
  private readonly epoch: () => number;
  /** Source, alias and clamp identify the one prepared body currently mounted. */
  private bodyKey: string | undefined;
  /** Document epoch verified when that representation finished preparing. */
  private navigation: number = -1;

  /** Borrow the existing owned page and document observer; acquire no extra process. */
  public constructor(page: Page, origin: string, epoch: () => number) {
    this.page = page;
    this.origin = origin;
    this.epoch = epoch;
  }

  /** Capture one paused frame through the existing public Mannequin UI and snapshot.
   *
   * @evidence contracts/common.md#principled-implementation Uses the actual page's original buttons, ready flag, snapshot and preserved drawing buffer; document epoch and software-renderer checks qualify the pixels.
   * @evidence contracts/common.md#clear-and-simple-design This command is a consumer of the existing Mannequin page inside the existing worker, with no duplicate body or rig evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown fields, conflicting clip/head or pose inputs, playing capture state and changed ownership reject; actual snapshot hashes replace query-label inference.
   * @evidence contracts/common.md#meaningful-documentation Whole/face framing supports front/right/back/oblique-front and surface/overlay/construction. Optional hint/detail, clinical head fields, root transform and public local-time clip seek retain their actual controller observations.
   * @evidence contracts/performance.md#efficient-algorithms Same-key camera/pass captures reuse one prepared body and perform one PNG readback plus one actual snapshot; JSON text crosses Playwright, and one worker parse serves existing validation and hashes.
   * @evidence contracts/performance.md#reuse-equivalent-work Page key and document epoch identify the mounted body; the queued parent caches exact-fresh requests without another draw.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only key/epoch survive the command; actual PNG/snapshot pass to the caller and page/browser remain owned by the worker's close path.
   */
  public async capture(
    command: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const input: Record<string, unknown> = command.value as Record<
      string,
      unknown
    >;
    const frame: RegExpExecArray | null =
      /^(whole|face)-(front|right|back|oblique-front)\.(surface|overlay|construction)\.png$/.exec(
        String(command.name),
      );
    if (
      input === null ||
      typeof input !== "object" ||
      Object.keys(input).some(
        (key: string): boolean =>
          ![
            "alias",
            "pose",
            "expression",
            "clamp",
            "hint",
            "detail",
            "head",
            "root",
            "motion",
            "localTimeSeconds",
            "reset",
          ].includes(key),
      ) ||
      !["f1", "f2", "m1", "m2"].includes(String(input.alias)) ||
      !["rest", "demo", "limit"].includes(String(input.pose)) ||
      !["neutral", "happy", "angry", "surprised"].includes(
        String(input.expression),
      ) ||
      (input.clamp !== undefined && typeof input.clamp !== "boolean") ||
      frame === null
    )
      throw new Error("Unsupported static Mannequin input or frame");
    if (
      (input.hint !== undefined &&
        !["off", "parts", "joints", "combined"].includes(String(input.hint))) ||
      (input.detail !== undefined &&
        !["major", "all"].includes(String(input.detail))) ||
      (input.motion !== undefined &&
        !["rest", "neutral", "walk", "wave", "sit-stand"].includes(
          String(input.motion),
        )) ||
      (input.localTimeSeconds !== undefined &&
        (typeof input.localTimeSeconds !== "number" ||
          !Number.isFinite(input.localTimeSeconds) ||
          input.localTimeSeconds < 0 ||
          input.motion === undefined)) ||
      (input.reset !== undefined && typeof input.reset !== "boolean")
    )
      throw new Error("Unsupported Mannequin hint, motion or time input");
    if (
      input.motion !== undefined &&
      (input.head !== undefined || input.pose !== "rest")
    )
      throw new Error(
        "Body clips and explicit head/pose inputs require separate captures",
      );
    this.head(input.head);
    this.root(input.root);
    const controls: object[] = [];
    const bodyKey: string = createHash("sha256")
      .update(
        JSON.stringify([command.source, input.alias, input.clamp !== false]),
      )
      .digest("hex");
    if (
      this.bodyKey !== bodyKey ||
      this.navigation !== this.epoch() ||
      new URL(this.page.url()).pathname !== "/human-stickman.html"
    ) {
      const url: URL = new URL("/human-stickman.html", this.origin);
      for (const [name, value] of Object.entries({
        alias: input.alias,
        pose: input.pose,
        expression: input.expression,
        clamp: input.clamp === false ? "0" : "1",
        style: "polygon",
        framing: "whole",
        view: "front",
        pass: "surface",
      }))
        url.searchParams.set(name, String(value));
      await this.page.setViewportSize({ width: 1200, height: 1200 });
      await navigateHumanCapturePage(this.page, url.toString());
      const epoch: number = this.epoch();
      await this.page.waitForFunction(
        (): boolean => {
          const human:
            | {
                ready: boolean;
                completion: IHumanMannequinSnapshot["completion"];
              }
            | undefined = (
            window as Window & {
              __humanStickman?: {
                ready: boolean;
                completion: IHumanMannequinSnapshot["completion"];
              };
            }
          ).__humanStickman;
          if (human?.completion.error || human?.completion.closed)
            throw new Error(
              "Mannequin preparation failed: " + human.completion.error,
            );
          return human?.ready === true;
        },
        null,
        { timeout: 120000 },
      );
      if (epoch !== this.epoch())
        throw new Error("Mannequin document changed during preparation");
      this.bodyKey = bodyKey;
      this.navigation = epoch;
    }
    const epoch: number = this.navigation;
    await this.page
      .locator('button[data-control="pose"][data-value="' + input.pose + '"]')
      .click();
    await this.page
      .locator(
        'button[data-control="expression"][data-value="' +
          input.expression +
          '"]',
      )
      .click();
    await this.page
      .locator(
        'button[data-control="hint"][data-value="' +
          String(input.hint ?? "off") +
          '"]',
      )
      .click();
    await this.page
      .locator(
        'button[data-control="detail"][data-value="' +
          String(input.detail ?? "major") +
          '"]',
      )
      .click();
    await this.page.evaluate((selection: Record<string, unknown>): void => {
      const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
      const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
      if (human === undefined) throw new Error("Mannequin page owner is unavailable");
      const controller: HumanStickmanController = human.controller;
      if (selection.head !== undefined)
        controller.setPose({
          ...controller.state.pose,
          head: selection.head as IAutoMovieHumanHeadPose,
        });
      const root: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number];
      } = (selection.root as typeof root) ?? {};
      controller.object.position.set(...(root.position ?? [0, 0, 0]));
      controller.object.rotation.set(...(root.rotation ?? [0, 0, 0]));
      controller.object.scale.set(...(root.scale ?? [1, 1, 1]));
    }, input);
    if (input.motion !== undefined) {
      await this.page
        .getByRole("combobox", { name: "동작 선택" })
        .selectOption(String(input.motion));
      await this.page
        .getByRole("button", { name: "동작 시작", exact: true })
        .click();
      const afterPlay: number = await this.page.evaluate(
        (): number => {
          const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
          const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
          if (human === undefined) throw new Error("Mannequin page owner is unavailable");
          return human.completion.sequence;
        },
      );
      const played: JSHandle<
        | false
        | {
            motion: string | null;
            time: number;
            playing: boolean;
            duration: number;
            completionSequence: number;
          }
      > = await this.page.waitForFunction(
        (
          sequence: number,
        ):
          | false
          | {
              motion: string | null;
              time: number;
              playing: boolean;
              duration: number;
              completionSequence: number;
            } => {
          const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
          const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
          if (human === undefined) throw new Error("Mannequin page owner is unavailable");
          if (human.completion.error || human.completion.closed)
            throw new Error("Mannequin playback draw failed");
          const state: HumanStickmanController.IState = human.controller.state;

          // A loop may wrap its local time; observe positive playback after a new completed draw instead of requiring monotonic time.
          return human.completion.ready &&
            human.completion.sequence > sequence &&
            state.playing &&
            state.time > 0
            ? {
                motion: state.motion,
                time: state.time,
                playing: state.playing,
                duration: state.duration,
                completionSequence: human.completion.sequence,
              }
            : false;
        },
        afterPlay,
      );
      try {
        const observed:
          | false
          | {
              motion: string | null;
              time: number;
              playing: boolean;
              duration: number;
              completionSequence: number;
            } = await played.jsonValue();
        if (observed === false)
          throw new Error("Mannequin playback completion was not observed");
        controls.push({ action: "play", ...observed });
      } finally {
        await played.dispose();
      }
      await this.page
        .getByRole("button", { name: "일시 정지", exact: true })
        .click();
      controls.push({ action: "pause", ...(await this.controlState()) });
      await this.page.evaluate(
        (seconds: number): void => {
          const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
          const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
          if (human === undefined) throw new Error("Mannequin page owner is unavailable");
          human.controller.seek(seconds);
        },
        Number(input.localTimeSeconds ?? 0),
      );
      controls.push({ action: "seek", ...(await this.controlState()) });
    }
    if (input.reset === true) {
      controls.push({ action: "before-reset", ...(await this.controlState()) });
      await this.page
        .getByRole("button", { name: "처음으로", exact: true })
        .click();
      controls.push({ action: "reset", ...(await this.controlState()) });
    }
    await this.page
      .locator('button[data-control="framing"][data-value="' + frame[1] + '"]')
      .click();
    const view: string =
      frame[2] === "right"
        ? "side"
        : frame[2] === "oblique-front"
          ? "oblique"
          : frame[2];
    await this.page
      .locator('button[data-control="view"][data-value="' + view + '"]')
      .click();
    await this.page
      .locator('button[data-control="pass"][data-value="' + frame[3] + '"]')
      .click();
    const captured: { snapshotJson: string; png: string; capturedUtc: string } =
      await captureHumanMannequinDraw(this.page);
    const snapshot: IHumanMannequinSnapshot = JSON.parse(captured.snapshotJson);
    if (
      epoch !== this.epoch() ||
      snapshot.pass !== frame[3] ||
      /swiftshader|llvmpipe|software/i.test(snapshot.renderer.renderer)
    )
      throw new Error("Mannequin capture owner/pass/GPU mismatch");
    if (!captured.png.startsWith("data:image/png;base64,"))
      throw new Error("Mannequin canvas did not return PNG");
    const png: Buffer = Buffer.from(
      captured.png.slice("data:image/png;base64,".length),
      "base64",
    );
    if (
      png.length < 24 ||
      png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      png.readUInt32BE(16) !== snapshot.canvas.width ||
      png.readUInt32BE(20) !== snapshot.canvas.height
    )
      throw new Error("Mannequin PNG canvas mismatch");
    return {
      key: command.key,
      source: command.source,
      inputSha256: command.inputSha256,
      png,
      capturedUtc: captured.capturedUtc,
      pngSha256: createHash("sha256").update(png).digest("hex"),
      commitment: commitHumanMannequinSnapshot(snapshot),
      snapshotJson: captured.snapshotJson,
      controls,
      page: this.page.url(),
    };
  }

  /** Screen only the existing public head fields; clinical clamping remains with setPose. */
  private head(value: unknown): void {
    if (value === undefined) return;
    const fields: Set<string> = new Set([
      "eyes.left.horizontal",
      "eyes.left.vertical",
      "eyes.right.horizontal",
      "eyes.right.vertical",
      "jaw.opening",
      "jaw.protrusion",
      "jaw.lateralExcursion",
    ]);
    const visit: (current: unknown, prefix: string) => void = (
      current: unknown,
      prefix: string,
    ): void => {
      if (fields.has(prefix)) {
        if (typeof current !== "number" || !Number.isFinite(current))
          throw new Error(
            "Mannequin head requires finite public scalar fields",
          );
        return;
      }
      if (
        current === null ||
        typeof current !== "object" ||
        Array.isArray(current)
      )
        throw new Error("Mannequin head requires finite public fields");
      for (const [key, child] of Object.entries(current)) {
        const path: string = prefix ? prefix + "." + key : key;
        if (
          ![...fields].some(
            (field: string): boolean =>
              field === path || field.startsWith(path + "."),
          )
        )
          throw new Error("Unknown public head field: " + path);
        visit(child, path);
      }
    };
    visit(value, "");
  }

  /** Admit finite three-axis facade transforms; rotations are Three Euler radians, scale cannot be singular. */
  private root(value: unknown): void {
    if (value === undefined) return;
    if (value === null || typeof value !== "object" || Array.isArray(value))
      throw new Error("Mannequin root must be a transform object");
    for (const [key, vector] of Object.entries(value))
      if (
        !["position", "rotation", "scale"].includes(key) ||
        !Array.isArray(vector) ||
        vector.length !== 3 ||
        !vector.every(
          (entry: unknown): boolean =>
            typeof entry === "number" &&
            Number.isFinite(entry) &&
            (key !== "scale" || entry !== 0),
        )
      )
        throw new Error(
          "Mannequin root requires finite nonsingular three-axis transforms",
        );
  }

  /** Observe bounded public transport scalars after the actual UI action. */
  private controlState(): Promise<{
    motion: string | null;
    time: number;
    playing: boolean;
    duration: number;
  }> {
    return this.page.evaluate(
      (): {
        motion: string | null;
        time: number;
        playing: boolean;
        duration: number;
      } => {
        const owner: Window & { __humanStickman?: IHumanMannequinSnapshot.IPage } = window;
        const human: IHumanMannequinSnapshot.IPage | undefined = owner.__humanStickman;
        if (human === undefined) throw new Error("Mannequin page owner is unavailable");
        const state: HumanStickmanController.IState = human.controller.state;
        return {
          motion: state.motion,
          time: state.time,
          playing: state.playing,
          duration: state.duration,
        };
      },
    );
  }
}
