import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";
import { HumanDebugCameraState } from "./HumanDebugCameraState";
import type { HumanDebugStage } from "./HumanDebugStage";
import type { HumanDebugView } from "./HumanDebugView";

/** Reads the already applied page state; it loads no source, changes no selection and frames no camera. */
export function HumanDebugPageSnapshot(state: {
  /** Actual mounted WebGL context; no renderer is constructed. */
  context: WebGLRenderingContext | WebGL2RenderingContext;
  /** Resolved options of the actual applied page request. */
  options: IHumanDebugOptions;
  /** Already collected parser and producer notices. */
  notices: readonly string[];
  /** Current real subject and its shown inventory. */
  view: HumanDebugView | undefined;
  /** Previously applied framing metadata, not a new camera fit. */
  placement: Record<string, unknown> | null;
  /** Actual current camera and orbit target. */
  stage: HumanDebugStage;
  /** Actual current section in millimetres. */
  section: number | null;
  /** Actual drawing buffer dimensions. */
  canvas: HTMLCanvasElement;
  /** Latest measured subject load, null when retained. */
  loaded: number | null;
  /** Server source identity observed by this mounted page. */
  source: string | null;
}): IHumanDebugSnapshot {
  const {
    context,
    options,
    notices,
    view,
    placement,
    stage,
    section,
    canvas,
    loaded,
    source,
  }: typeof state = state;
  const debug: WEBGL_debug_renderer_info | null = context.getExtension(
    "WEBGL_debug_renderer_info",
  );
  return {
    query: HumanDebugOptions.write(options),
    notices: [...notices],
    subject: view === undefined ? null : { ...view.subject.key },
    provenance: view?.subject.provenance ?? null,
    shown: view?.visible() ?? { parts: [], curves: [] },
    display: {
      reference: options.reference,
      referenceStyle: options.referenceStyle,
      referencePart: [...options.referencePart],
      referenceOpacity: options.referenceOpacity,
      opacity: options.opacity,
      xray: options.xray,
    },
    inventory: view?.inventory() ?? { parts: [], curves: [] },
    camera:
      placement === null
        ? null
        : {
            ...placement,
            ...HumanDebugCameraState(stage.camera, stage.orbit.target)
              .placement,
          },
    section,
    canvas: {
      width: canvas.width,
      height: canvas.height,
      gpu: String(
        context.getParameter(
          debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
        ),
      ),
    },
    loadMilliseconds: loaded,
    source,
  };
}
