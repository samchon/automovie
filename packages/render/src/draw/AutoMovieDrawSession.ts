import type { IAutoMovieCaptureCell } from "../capture/IAutoMovieCaptureCell.js";
import type { IAutoMovieCaptureDrawing } from "../capture/IAutoMovieCaptureDrawing.js";
import type { IAutoMovieCapturePlan } from "../capture/IAutoMovieCapturePlan.js";
import type { IAutoMovieCaptureSubject } from "../capture/IAutoMovieCaptureSubject.js";
import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import { parseAutoMovieInspectionRequest } from "../scene/inspection/parseAutoMovieInspectionRequest.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import { AUTO_MOVIE_DRAW_GLOBALS } from "./AUTO_MOVIE_DRAW_GLOBALS.js";
import type { IAutoMovieDrawCall } from "./IAutoMovieDrawCall.js";
import type { IAutoMovieDrawDescription } from "./IAutoMovieDrawDescription.js";
import type { IAutoMovieDrawPage } from "./IAutoMovieDrawPage.js";
import type { IAutoMovieDrawProps } from "./IAutoMovieDrawProps.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";
import { decodeAutoMovieDrawPixels } from "./decodeAutoMovieDrawPixels.js";
import { planAutoMovieDrawCall } from "./planAutoMovieDrawCall.js";
import { stampAutoMovieDrawLegend } from "./stampAutoMovieDrawLegend.js";

/**
 * A host's hold on one draw page: the props injected before it loaded, the subject it described, and the calls that turn cells and frames into pictures through its draw function.
 *
 * Every picture a host saves comes through `draw`, `drawing` or `frame`, which call the page's draw function and decode what it returns; the session never screenshots the page and injects no style into it. Each call is bounded by the session's timeout, so a subject that never reports ready fails the call with the cell or frame it was drawing instead of holding the host forever. Calls must not overlap.
 *
 * ```ts
 * const session = await AutoMovieDrawSession.open({ page, url, props: { subject: "starter", props: null }, backend: "swiftshader; Chromium 131", timeout: 120_000 });
 * const plan = planAutoMovieCapture({ request, subject: session.subject, cuts: [] });
 * await runAutoMovieCapture({ plan, draw: (cell) => session.drawing(cell, plan), folder, revision, match: "cell" });
 * await session.close();
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the session holds, which calls make pictures and how, the timeout's effect, the no-overlap rule, and shows the open, plan, draw and close order.
 * @evidence contracts/development/design.md#principled-representation An opened page with a described subject, so a session that exists can always draw; the backend text joins what launched the browser with the renderer the page reported, because the record must name both.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `open`, `drawing` for the capture run, `frame` for a delivery's passes, `draw` beneath both, `close`; the subject, the renderer and the backend are read by hosts to plan and to report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The page is reached only through the structural page, so a test drives every rule with a recording double.
 */
export class AutoMovieDrawSession {
  /** The page, owned until `close`. */
  private readonly page: IAutoMovieDrawPage;

  /** Milliseconds any one page call may take. */
  private readonly timeout: number;

  /** The subject the page created, as a capture plans against it. */
  public readonly subject: IAutoMovieCaptureSubject;

  /** The WebGL renderer string the page reported. */
  public readonly renderer: string;

  /** What every drawn row records as its backend: the host's launch description, then the renderer string. */
  public readonly backend: string;

  /** Hold an opened page; `open` prepares it. */
  private constructor(props: {
    page: IAutoMovieDrawPage;
    timeout: number;
    description: IAutoMovieDrawDescription;
    backend: string;
  }) {
    this.page = props.page;
    this.timeout = props.timeout;
    this.subject = props.description.subject;
    this.renderer = props.description.renderer;
    this.backend = `${props.backend}; ${props.description.renderer}`;
  }

  /**
   * Inject the props, load the draw page, wait for its draw function and describe its subject.
   *
   * It rejects when the page does not install the draw function within the timeout, naming the address, and when describing the subject fails or outlasts the timeout. A rejected open leaves the page with the caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four steps, the refusals and who owns the page after a refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The props go in through an init script, the JSON of the props assigned to their global, which runs before the page's own modules, so the subject module reads them at its first line, as Remotion's renderer hands props to its bundle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Inject, load, wait, describe, each one page call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing draw function is an error naming the address, never a fallback to screenshots.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four page calls; describing creates the subject once, which every later picture reuses.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The created subject and the page's renderer serve every call of the session.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned session owns the page until `close`.
   */
  public static async open(props: {
    /** A fresh page, which the session owns once open resolves. */
    page: IAutoMovieDrawPage;

    /** Address of the draw page. */
    url: string;

    /** What the page's draw function creates. */
    props: IAutoMovieDrawProps;

    /** The host's description of how the browser draws, such as `swiftshader; Chromium 131.0.6778.33`. */
    backend: string;

    /** Milliseconds any one page call may take. */
    timeout: number;
  }): Promise<AutoMovieDrawSession> {
    const { page, timeout } = props;
    await page.addInitScript({
      content: `globalThis[${JSON.stringify(AUTO_MOVIE_DRAW_GLOBALS.props)}] = ${JSON.stringify(props.props)};`,
    });
    await page.goto(props.url, { waitUntil: "load" });
    try {
      await page.waitForFunction(
        (name: string): boolean =>
          typeof (globalThis as unknown as Record<string, unknown>)[name] ===
          "object",
        AUTO_MOVIE_DRAW_GLOBALS.draw,
        { timeout },
      );
    } catch (error) {
      throw new Error(
        `The page at ${props.url} installed no draw function within ${timeout / 1000} s`,
        { cause: error },
      );
    }
    const description: IAutoMovieDrawDescription = await bounded(
      timeout,
      `Describing the subject at ${props.url}`,
      page.evaluate(
        (name: string): Promise<IAutoMovieDrawDescription> =>
          (
            (globalThis as unknown as Record<string, unknown>)[name] as {
              describe(): Promise<IAutoMovieDrawDescription>;
            }
          ).describe(),
        AUTO_MOVIE_DRAW_GLOBALS.draw,
      ),
    );
    return new AutoMovieDrawSession({
      page,
      timeout,
      description,
      backend: props.backend,
    });
  }

  /**
   * Draw one call and decode its picture.
   *
   * It rejects when the page's draw throws, when it does not answer within the timeout, naming `what`, and when the picture is not the call's raster.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the three rejections.
   * @evidence contracts/development/implementation.md#principled-implementation One page call per picture; the decode checks the size the call asked for.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Call, bound, decode.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A slow or failed picture is an error, never retried.
   * @evidence contracts/development/implementation.md#efficient-algorithms One page call and one decode linear in the picture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is a different picture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one picture's text and bytes at a time.
   */
  public async draw(
    call: IAutoMovieDrawCall,
    what: string,
  ): Promise<{ picture: IAutoMovieRasterImage; result: IAutoMovieDrawResult }> {
    const result: IAutoMovieDrawResult = await bounded(
      this.timeout,
      what,
      this.page.evaluate(
        (arg: { name: string; call: IAutoMovieDrawCall }): Promise<IAutoMovieDrawResult> =>
          (
            (globalThis as unknown as Record<string, unknown>)[arg.name] as {
              draw(call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult>;
            }
          ).draw(arg.call),
        { name: AUTO_MOVIE_DRAW_GLOBALS.draw, call },
      ),
    );
    return { picture: decodeAutoMovieDrawPixels(result, call), result };
  }

  /**
   * The capture run's draw function: draw one planned cell through `planAutoMovieDrawCall`, returning its picture with the legend of its marks in the top-left corner by `stampAutoMovieDrawLegend`, the legend texts and the inspection's labels for the run to stamp, the session's backend, the resolved camera as JSON and the paths each pattern resolved to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and what each returned member holds.
   * @evidence contracts/development/implementation.md#principled-implementation The cell becomes the page call by the shared planner, so a cell's second, view, pass, request and raster reach the page as planned.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the call, draw it, shape the drawing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failures reach the capture run, which records the cell as not drawn.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each cell is a different picture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The picture is the caller's.
   */
  public async drawing(
    cell: IAutoMovieCaptureCell,
    plan: Pick<IAutoMovieCapturePlan, "subject" | "times" | "layout">,
  ): Promise<IAutoMovieCaptureDrawing> {
    const call: IAutoMovieDrawCall = planAutoMovieDrawCall(cell, plan);
    const { picture, result } = await this.draw(call, `Cell ${cell.name}`);
    return {
      picture,
      labels: [
        ...stampAutoMovieDrawLegend(picture, result.legend, call.scale),
        ...result.labels,
      ],
      backend: this.backend,
      camera: JSON.stringify(result.camera),
      resolved: result.resolved,
    };
  }

  /**
   * Draw one delivered frame in every given pass through the subject's own camera, at its raster, one draw call per pass in the order given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the view, the raster, the order and the one call per pass.
   * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md`: every pass of a set is drawn from the same evaluated state, so each pass is the same second through the same `film` view with only the shade changed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One draw per pass with the default inspection and the pass as its shade.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No screenshot and no injected style: the page draws each pass itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw per pass, which is the minimum since every pass is another picture.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pass is a different picture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns every pass's picture of the frame; the caller writes and drops them.
   */
  public async frame(
    seconds: number,
    passes: readonly IAutoMovieInspectionRequest.Shade[],
  ): Promise<{ pass: IAutoMovieInspectionRequest.Shade; picture: IAutoMovieRasterImage }[]> {
    const plain: IAutoMovieInspectionRequest = parseAutoMovieInspectionRequest(
      (): undefined => undefined,
    );
    const pictures: {
      pass: IAutoMovieInspectionRequest.Shade;
      picture: IAutoMovieRasterImage;
    }[] = [];
    for (const pass of passes) {
      const { picture } = await this.draw(
        {
          seconds,
          view: "film",
          request: { ...plain, shade: pass },
          width: this.subject.width,
          height: this.subject.height,
          frame: [seconds],
          scale: 1,
        },
        `Frame at ${seconds} s in pass ${pass}`,
      );
      pictures.push({ pass, picture });
    }
    return pictures;
  }

  /**
   * Close the page.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidence contracts/development/implementation.md#principled-implementation Closing the page releases its scene and renderer with it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One driver call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A close failure propagates.
   * @evidence contracts/development/implementation.md#efficient-algorithms One call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Closing happens once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The release point of the page the session owns.
   */
  public async close(): Promise<void> {
    await this.page.close();
  }
}

/** Settle with `task`, or reject naming `what` once `timeout` milliseconds pass first. */
function bounded<T>(
  timeout: number,
  what: string,
  task: Promise<T>,
): Promise<T> {
  return new Promise<T>(
    (resolve: (value: T) => void, reject: (reason: unknown) => void): void => {
      const timer: ReturnType<typeof setTimeout> = setTimeout(
        (): void =>
          reject(
            new Error(
              `${what} did not finish within ${timeout / 1000} s; the subject never reported ready`,
            ),
          ),
        timeout,
      );
      task
        .then((value: T): void => resolve(value))
        .catch((error: unknown): void => reject(error))
        .finally((): void => clearTimeout(timer));
    },
  );
}
