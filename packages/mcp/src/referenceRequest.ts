import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";
import { z } from "zod";

import { DEFAULT_BUDGET, MAX_BUDGET } from "./internal/referenceError";
import type { AutoMovieReferenceRequest } from "./structures/IAutoMovieReference";

const budgetBytes = z.number().int().min(256).max(MAX_BUDGET).optional();
const revision = z.string().regex(/^[0-9a-f]{64}$/u);
const read = {
  expectedDigest: revision.optional(),
  detail: z.boolean().optional(),
  budgetBytes,
};

/**
 * The four narrow input schemas reused by MCP registration and local admission.
 */
export const autoMovieReferenceSchemas = {
  /** Strict shared schema for revision-bound authored-layer pagination. */
  get_index_of_layer: z
    .object({
      layer: z.enum(AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS),
      limit: z.number().int().min(1).max(100).optional(),
      continuation: z
        .object({ revision, offset: z.number().int().min(1).max(10_000) })
        .strict()
        .optional(),
      budgetBytes,
    })
    .strict(),
  /** Strict shared schema for one compact canonical-file index. */
  get_index_of_file: z
    .object({ file: z.string().min(1).max(4_096), budgetBytes })
    .strict(),
  /** Strict shared schema for full-source projection with optional stale and detail checks. */
  read_file_without_annotations: z
    .object({ file: z.string().min(1).max(4_096), ...read })
    .strict(),
  /** Strict shared schema for an explicit section address and bounded subtree projection. */
  read_section_without_annotations: z
    .object({ location: z.string().min(1).max(4_096), ...read })
    .strict(),
};

const requestSchema = z.discriminatedUnion("operation", [
  autoMovieReferenceSchemas.get_index_of_layer.extend({
    operation: z.literal("get_index_of_layer"),
  }),
  autoMovieReferenceSchemas.get_index_of_file.extend({
    operation: z.literal("get_index_of_file"),
  }),
  autoMovieReferenceSchemas.read_file_without_annotations.extend({
    operation: z.literal("read_file_without_annotations"),
  }),
  autoMovieReferenceSchemas.read_section_without_annotations.extend({
    operation: z.literal("read_section_without_annotations"),
  }),
]);

const layerProbe = z.object({
  operation: z.literal("get_index_of_layer"),
  layer: z.string(),
});

/**
 * Distinguish an unknown authored population from a malformed request envelope.
 */
export function autoMovieReferenceRequestError(input: unknown): {
  /** Distinguishes unknown authored layers from all other malformed request inputs. */
  code: string;
  /** Recovery guidance without reflecting request values or document contents. */
  message: string;
} {
  const layer = layerProbe.safeParse(input);
  return layer.success &&
    !AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS.some(
      (candidate) => candidate === layer.data.layer,
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

/**
 * Admit an unknown request without reflecting submitted source or credentials in errors.
 */
export function parseAutoMovieReferenceRequest(input: unknown):
  | (AutoMovieReferenceRequest & {
      /** Admitted success-envelope byte ceiling, with the 64 KiB default already applied. */
      budgetBytes: number;
    })
  | null {
  const parsed = requestSchema.safeParse(input);
  return parsed.success
    ? { ...parsed.data, budgetBytes: parsed.data.budgetBytes ?? DEFAULT_BUDGET }
    : null;
}
