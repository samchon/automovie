import { IAutoMovieRenderTargetRenderer } from "@automovie/interface";

import { IAutoMovieRenderGraphicsIdentity } from "./IAutoMovieRenderGraphicsIdentity";

/**
 * Read a capture host's graphics probe as a render-target renderer identity, or
 * `null` when no probe ran.
 *
 * `null` is the whole point of the return type. A render job that could not ask
 * the browser what it is drawing with has not measured its target, and a
 * fabricated `"unknown/unknown/unknown"` identity would fingerprint every such
 * host identically, so two different GPUs would produce one digest and a stale
 * report would read as fresh. A host that answered but withheld a field is a
 * different case and keeps the `unknown` the target contract documents.
 *
 * @evidence contracts/common.md#principled-implementation Absent graphics probes remain null; an answered probe maps its renderer spelling to device and substitutes unknown only for individual blank fields, preserving the distinction between no observation and masked information.
 * @evidence contracts/common.md#clear-and-simple-design This projection is the single boundary translating the host graphics record into the engine target renderer record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whitespace is inspected solely to detect missing information; present device strings remain unchanged and no absent probe is assigned a fabricated identity.
 * @evidence contracts/common.md#meaningful-documentation The comment explains null versus masked fields and the renderer-to-device rename, including why absence cannot fingerprint a measured graphics context.
 * @evidence contracts/performance.md#efficient-algorithms Three string trims and one fixed-size record allocation cost linear time in the supplied identity strings, independent of the rendered scene.
 * @evidence contracts/performance.md#reuse-equivalent-work The projection reads the supplied probe once and retains no cache; identical device names alone cannot authorize sharing actual render effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only three string references escape in a new record; the projection holds no graphics context, browser session or process resource.
 */
export const autoMovieRenderTargetRendererOfGraphics: (
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
