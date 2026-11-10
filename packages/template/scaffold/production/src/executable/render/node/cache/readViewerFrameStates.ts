import type { IAutoMovieHeadlessPage } from "../../headlessCapture/IAutoMovieHeadlessPage";

/**
 * Ask a loaded capture page for every frame's state digest and its graphics
 * identity, in one page round trip.
 *
 * The page publishes `globalThis[hook](seconds)`, returning (or resolving to) a
 * nonempty string that changes whenever anything drawn at that second could
 * change: the production's own digest of the scene state it will place for
 * that time. The hook must not move the scene or draw; capture seeks
 * separately. The graphics identity is the WebGL unmasked vendor and renderer
 * (the GL backend and GPU driver), read from a fresh canvas, or `unknown` when
 * the page exposes no WebGL.
 *
 * @param page Capture page, already navigated and ready.
 * @param hook Name of the page's frame-digest function.
 * @param times Frame seconds, in capture order.
 * @returns One digest per time and the graphics identity string.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One evaluate passes the whole schedule into the page and awaits each hook result there, so F frames cost one driver round trip; WEBGL_debug_renderer_info is the documented source of the unmasked GL vendor and renderer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Page observation only; key composition and storage are separate modules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing hook, a non-string or empty digest, or a wrong count throws instead of falling back to capturing everything silently.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frame count inside the page plus one serialization of F digests.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per render; nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The probe canvas and its context are page garbage after the call; the returned array holds F strings.
 * @evidence contracts/development/common.md#meaningful-documentation States the hook contract, its purity requirement, the identity source and failure behavior.
 */
export async function readViewerFrameStates(
  page: Pick<IAutoMovieHeadlessPage, "evaluate">,
  hook: string,
  times: readonly number[],
): Promise<{ digests: string[]; graphics: string }> {
  const observed: unknown = await page.evaluate(observe, {
    hook,
    times: [...times],
  });
  const result: { digests?: unknown; graphics?: unknown; missing?: boolean } =
    (observed ?? {}) as {
      digests?: unknown;
      graphics?: unknown;
      missing?: boolean;
    };
  if (result.missing === true)
    throw new Error(
      `Frame cache needs the page to publish ${hook}(seconds) returning a frame state digest`,
    );
  if (
    !Array.isArray(result.digests) ||
    result.digests.length !== times.length ||
    !result.digests.every(
      (digest: unknown): boolean =>
        typeof digest === "string" && digest.length > 0,
    ) ||
    typeof result.graphics !== "string"
  )
    throw new Error(
      `${hook} must return one nonempty string per frame for the frame cache`,
    );
  return { digests: result.digests as string[], graphics: result.graphics };
}

/** Page-side collection; reads only its argument because it is serialized into the page. */
const observe: (arg: {
  hook: string;
  times: number[];
}) => Promise<unknown> = async (arg: {
  hook: string;
  times: number[];
}): Promise<unknown> => {
  const scope: Record<string, unknown> = globalThis as unknown as Record<
    string,
    unknown
  >;
  const hook: unknown = scope[arg.hook];
  if (typeof hook !== "function") return { missing: true };
  const digests: unknown[] = [];
  for (const seconds of arg.times)
    digests.push(await (hook as (value: number) => unknown)(seconds));
  let graphics: string = "unknown";
  try {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const gl: WebGLRenderingContext | null = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    const info: WEBGL_debug_renderer_info | null =
      gl?.getExtension("WEBGL_debug_renderer_info") ?? null;
    if (gl !== null)
      graphics =
        info === null
          ? `${gl.getParameter(gl.VENDOR)} ${gl.getParameter(gl.RENDERER)}`
          : `${gl.getParameter(info.UNMASKED_VENDOR_WEBGL)} ${gl.getParameter(info.UNMASKED_RENDERER_WEBGL)}`;
  } catch {
    graphics = "unknown";
  }
  return { digests, graphics };
};
