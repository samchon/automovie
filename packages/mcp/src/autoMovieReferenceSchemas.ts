import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";
import { z } from "zod";
import { MAX_BUDGET } from "./internal/MAX_BUDGET";


const budgetBytes: z.ZodOptional<z.ZodNumber> = z.number().int().min(256).max(MAX_BUDGET).optional();

const revision: z.ZodString = z.string().regex(/^[0-9a-f]{64}$/u);

const read: {expectedDigest:z.ZodOptional<z.ZodString>;detail:z.ZodOptional<z.ZodBoolean>;budgetBytes:z.ZodOptional<z.ZodNumber>} = {
  expectedDigest: revision.optional(),
  detail: z.boolean().optional(),
  budgetBytes,
};


/**
 * The four narrow input schemas reused by MCP registration and local admission.
 *
 *
 * Strict Zod objects encode the four operation-specific inputs, the shared authored layer tuple, bounded numeric fields and lowercase SHA-256 revision syntax.
 * One schema registry is consumed by both local admission and SDK registration, keeping transport argument grammar identical.
 * Unknown keys and out-of-range values are rejected; root replacement and authoring operations have no schema entry.
 * Each member identifies its operation and optional stale/detail behavior; limits and defaults are applied by schema construction and the request parser.
 * Four schema objects are initialized once; validation traverses one small request envelope and never source documents.
 * The same schema instances serve registration and parsing for the process lifetime, with no source-dependent validation cache.
 * Module-owned schemas retain fixed grammar objects and the shared thirteen-layer tuple, without project bytes or handles.
 */
export const autoMovieReferenceSchemas: {

  /** Current authored-layer identity, page size and revision-bound continuation. */
  get_index_of_layer: z.ZodObject<{
    layer: z.ZodEnum<{[K in typeof AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS[number]]: K}>;
    limit: z.ZodOptional<z.ZodNumber>;
    continuation: z.ZodOptional<z.ZodObject<{revision:z.ZodString;offset:z.ZodNumber}, z.core.$strict>>;
    budgetBytes: typeof budgetBytes;
  }, z.core.$strict>;

  /** One canonical Markdown file's compact navigation request. */
  get_index_of_file: z.ZodObject<{file:z.ZodString;budgetBytes:typeof budgetBytes}, z.core.$strict>;

  /** Whole-file projection with optional stale and detail checks. */
  read_file_without_annotations: z.ZodObject<{file:z.ZodString} & typeof read, z.core.$strict>;

  /** Explicit anchored-section projection with optional stale and detail checks. */
  read_section_without_annotations: z.ZodObject<{location:z.ZodString} & typeof read, z.core.$strict>;
} = {

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
