import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";
import { z } from "zod";


const layerProbe: z.ZodObject<{operation:z.ZodLiteral<"get_index_of_layer">;layer:z.ZodString}> = z.object({
  operation: z.literal("get_index_of_layer"),
  layer: z.string(),
});


/**
 * Distinguish an unknown authored population from a malformed request envelope.
 *
 *
 * @evidence contracts/common.md#principled-implementation A small layer probe distinguishes a syntactically named unsupported authored layer from other malformed request shapes.
 * @evidence contracts/common.md#clear-and-simple-design Classification is separate from the full admission parser so refused envelopes receive one source-free recovery category.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only shared supported-layer membership influences the special category; submitted paths, credentials and source content are never echoed.
 * @evidence contracts/common.md#meaningful-documentation The returned code and message distinguish unknown layer recovery from malformed request recovery.
 * @evidence contracts/performance.md#efficient-algorithms A small probe and thirteen-name membership scan are constant with respect to document population; no file is read.
 * @evidence contracts/performance.md#reuse-equivalent-work The module shares its fixed probe schema and layer registry; unknown request values are inspected anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one short classified error escapes; probe results are local and acquire no external resource.
 */
export function autoMovieReferenceRequestError(input: unknown): {

  /** Distinguishes unknown authored layers from all other malformed request inputs. */
  code: string;

  /** Recovery guidance without reflecting request values or document contents. */
  message: string;
} {
  const layer: ReturnType<typeof layerProbe.safeParse> = layerProbe.safeParse(input);
  return layer.success &&
    !AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS.some(
      (candidate: string) : boolean => candidate === layer.data.layer,
    )
    ? {
        code: "INVALID_LAYER",
        message:
          "Choose one of the thirteen documented authored Markdown layers.",
      }
    : {
        code: "INVALID_REQUEST",
        message:
          "Use one documented reference operation and its bounded arguments.",
      };
}
