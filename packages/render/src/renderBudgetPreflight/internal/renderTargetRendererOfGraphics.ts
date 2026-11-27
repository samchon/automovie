import type {
  IAutoMovieRenderGraphicsIdentity,
  IAutoMovieRenderTargetRenderer,
} from "@automovie/interface";

/*
 * Read a capture host's graphics probe as a render-target renderer identity, or
 * `null` when no probe ran.
 *
 * `null` is the whole point of the return type. A render job that could not ask
 * the browser what it is drawing with has not measured its target, and a
 * fabricated `"unknown/unknown/unknown"` identity would fingerprint every such
 * host identically, so two different GPUs would produce one digest and a stale
 * report would read as fresh. A host that answered but withheld a field is a
 * different case and keeps the `unknown` the target contract documents.
 */
export const renderTargetRendererOfGraphics: (
  graphics: IAutoMovieRenderGraphicsIdentity | null | undefined,
) => IAutoMovieRenderTargetRenderer | null = (
  graphics: IAutoMovieRenderGraphicsIdentity | null | undefined,
): IAutoMovieRenderTargetRenderer | null =>
  graphics === null || graphics === undefined
    ? null
    : {
        api: blankAs(graphics.api, "unknown"),
        vendor: blankAs(graphics.vendor, "unknown"),
        device: blankAs(graphics.renderer, "unknown"),
      };

const blankAs: (value: string, fallback: string) => string = (
  value: string,
  fallback: string,
): string => (value.trim().length === 0 ? fallback : value);
