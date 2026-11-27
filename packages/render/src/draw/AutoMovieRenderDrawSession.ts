import type {
  AutoMovieInspectionShade,
  IAutoMovieCaptureCell,
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureSubject,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
  IAutoMovieDrawnPass,
  IAutoMovieDrawnPicture,
  IAutoMovieInspectionRequest,
} from "@automovie/interface";

import { formatInspectionCameraView } from "../scene/inspection/internal/formatInspectionCameraView";
import { parseInspectionRequest } from "../scene/inspection/internal/parseInspectionRequest";
import { AutoMovieRenderDrawGlobals } from "./AutoMovieRenderDrawGlobals";
import type { IAutoMovieRenderDrawPage } from "./IAutoMovieRenderDrawPage";
import type { IAutoMovieRenderDrawPageRequest } from "./IAutoMovieRenderDrawPageRequest";
import type { IAutoMovieRenderDrawProps } from "./IAutoMovieRenderDrawProps";
import { decodeDrawPixels } from "./internal/decodeDrawPixels";
import { AutoMovieRenderDraw } from "./AutoMovieRenderDraw";
import { stampDrawLegend } from "./internal/stampDrawLegend";

/**
 * A host's hold on one draw page: the props injected before it loaded, the
 * subject it described, and the calls that turn cells and frames into pictures
 * through its draw function.
 *
 * Every picture a host saves comes through `draw`, `drawing` or `frame`, which
 * call the page's draw function and decode what it returns; the session never
 * screenshots the page and injects no style into it. `speak` hands the subject
 * the film's dialogue mouths before the first picture. Each call is bounded by
 * the session's timeout, so a subject that never reports ready fails the call
 * with the cell or frame it was drawing instead of holding the host forever.
 * Calls must not overlap.
 *
 * ```ts
 * const session = await AutoMovieRenderDrawSession.open({
 *   page,
 *   url,
 *   props: { subject: "starter", props: null },
 *   backend: "swiftshader; Chromium 131",
 *   timeout: 120_000,
 * });
 * const plan = planCapture({
 *   request,
 *   subject: session.subject,
 *   cuts: [],
 * });
 * await runCapture({
 *   plan,
 *   draw: (cell) => session.drawing(cell, plan),
 *   folder,
 *   revision,
 *   match: "cell",
 * });
 * await session.close();
 * ```
 */
export class AutoMovieRenderDrawSession {
  /*
   * The page, owned until `close`.
   */
  private readonly page: IAutoMovieRenderDrawPage;

  /*
   * Milliseconds any one page call may take.
   */
  private readonly timeout: number;

  /** The subject the page created, as a capture plans against it. */
  public readonly subject: IAutoMovieCaptureSubject;

  /** The WebGL renderer string the page reported. */
  public readonly renderer: string;

  /**
   * What every drawn row records as its backend: the host's launch description,
   * then the renderer string.
   */
  public readonly backend: string;

  /*
   * Hold an opened page; `open` prepares it.
   */
  private constructor(props: {
    page: IAutoMovieRenderDrawPage;
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
   * Inject the props, load the draw page, wait for its draw function and
   * describe its subject.
   *
   * Navigation, draw-function readiness and subject description each get the
   * session timeout. A rejected open leaves the page with the caller.
   */
  public static async open(props: {
    /** A fresh page, which the session owns once open resolves. */
    page: IAutoMovieRenderDrawPage;

    /** Address of the draw page. */
    url: string;

    /** What the page's draw function creates. */
    props: IAutoMovieRenderDrawProps;

    /**
     * The host's description of how the browser draws, such as `swiftshader;
     * Chromium 131.0.6778.33`.
     */
    backend: string;

    /** Milliseconds any one page call may take. */
    timeout: number;
  }): Promise<AutoMovieRenderDrawSession> {
    const { page, timeout } = props;
    await page.addInitScript({
      content: `globalThis[${JSON.stringify(AutoMovieRenderDrawGlobals.props)}] = ${JSON.stringify(props.props)};`,
    });
    await page.goto(props.url, { waitUntil: "load", timeout });
    try {
      await page.waitForFunction(
        (name: typeof AutoMovieRenderDrawGlobals.draw): boolean =>
          globalThis[name] !== undefined,
        AutoMovieRenderDrawGlobals.draw,
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
        (
          arg: IAutoMovieRenderDrawPageRequest.IDescribe,
        ): Promise<IAutoMovieDrawDescription> =>
          globalThis[arg.name]!.describe(),
        { kind: "describe", name: AutoMovieRenderDrawGlobals.draw },
      ),
    );
    return new AutoMovieRenderDrawSession({
      page,
      timeout,
      description,
      backend: props.backend,
    });
  }

  /**
   * Hand the page's subject the film's dialogue mouths over `track`, before the
   * first picture; every later picture carries the mouths the subject read.
   *
   * It rejects when the page's call throws or does not answer within the
   * timeout.
   */
  public async speak(track: IAutoMovieDialogueMouthTrack): Promise<void> {
    await bounded(
      this.timeout,
      `Handing the dialogue mouths to subject "${this.subject.name}"`,
      this.page.evaluate(
        (arg: IAutoMovieRenderDrawPageRequest.ISpeak): Promise<void> =>
          globalThis[arg.name]!.speak(arg.track),
        { kind: "speak", name: AutoMovieRenderDrawGlobals.draw, track },
      ),
    );
  }

  /**
   * Draw one call and decode its picture.
   *
   * It rejects when the page's draw throws, when it does not answer within the
   * timeout, naming `what`, and when the picture is not the call's raster.
   */
  public async draw(
    call: IAutoMovieDrawCall,
    what: string,
  ): Promise<IAutoMovieDrawnPicture> {
    const result: IAutoMovieDrawResult = await bounded(
      this.timeout,
      what,
      this.page.evaluate(
        (arg: IAutoMovieRenderDrawPageRequest.IDraw): Promise<IAutoMovieDrawResult> =>
          globalThis[arg.name]!.draw(arg.call),
        { kind: "draw", name: AutoMovieRenderDrawGlobals.draw, call },
      ),
    );
    return { picture: decodeDrawPixels(result, call), result };
  }

  /**
   * The capture run's draw function: draw one planned cell through
   * `AutoMovieRenderDraw.planCall`, returning its picture with the legend of its marks
   * in the top-left corner by `stampDrawLegend`, the legend texts and
   * the inspection's labels for the run to stamp, the session's backend, the
   * resolved camera as JSON with the fixed view text that draws it again, and
   * the paths each pattern resolved to.
   */
  public async drawing(
    cell: IAutoMovieCaptureCell,
    plan: Pick<IAutoMovieCapturePlan, "subject" | "times" | "layout">,
  ): Promise<IAutoMovieCaptureDrawing> {
    const call: IAutoMovieDrawCall = AutoMovieRenderDraw.planCall(cell, plan);
    const { picture, result } = await this.draw(call, `Cell ${cell.name}`);
    return {
      picture,
      labels: [
        ...stampDrawLegend(picture, result.legend, call.scale),
        ...result.labels,
      ],
      backend: this.backend,
      camera: JSON.stringify(result.camera),
      repeat: formatInspectionCameraView(result.camera),
      resolved: result.resolved,
      ...(result.diagnostics === undefined
        ? {}
        : { diagnostics: result.diagnostics }),
    };
  }

  /**
   * Draw one delivered frame in every given pass through the subject's own
   * camera, at its raster, one draw call per pass in the order given. With
   * `background` `transparent` the page draws over a transparent background and
   * returns straight alpha.
   */
  public async frame(
    seconds: number,
    passes: readonly AutoMovieInspectionShade[],
    inspectionDiagnostics?: IAutoMovieDrawCall["inspectionDiagnostics"],
    background?: IAutoMovieDrawCall["background"],
  ): Promise<IAutoMovieDrawnPass[]> {
    const plain: IAutoMovieInspectionRequest = parseInspectionRequest(
      (): undefined => undefined,
    );
    const pictures: IAutoMovieDrawnPass[] = [];
    for (const pass of passes) {
      const { picture, result } = await this.draw(
        {
          seconds,
          view: "film",
          request: { ...plain, shade: pass },
          width: this.subject.width,
          height: this.subject.height,
          frame: [seconds],
          scale: 1,
          ...(inspectionDiagnostics === undefined
            ? {}
            : { inspectionDiagnostics }),
          ...(background === undefined ? {} : { background }),
        },
        `Frame at ${seconds} s in pass ${pass}`,
      );
      pictures.push({
        pass,
        picture,
        ...(result.diagnostics === undefined
          ? {}
          : { diagnostics: result.diagnostics }),
        ...(result.semanticMask === undefined
          ? {}
          : { semanticMask: result.semanticMask }),
        ...(result.mouths === undefined ? {} : { mouths: result.mouths }),
      });
    }
    return pictures;
  }

  /** Close the page. */
  public async close(): Promise<void> {
    await this.page.close();
  }
}

/*
 * Settle with `task`, or reject naming `what` once `timeout` milliseconds pass
 * first.
 */
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
