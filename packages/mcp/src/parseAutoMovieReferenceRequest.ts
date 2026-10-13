import { z } from "zod";
import { DEFAULT_BUDGET } from "./internal/DEFAULT_BUDGET";
import type { AutoMovieReferenceRequest } from "./structures/IAutoMovieReference";
import { autoMovieReferenceSchemas } from "./autoMovieReferenceSchemas";


const requestSchema: z.ZodType<AutoMovieReferenceRequest> = z.discriminatedUnion("operation", [
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


/**
 * Admit an unknown request without reflecting submitted source or credentials in errors.
 *
 *
 * @evidence contracts/common.md#principled-implementation A discriminated Zod union validates the operation-specific strict schema and supplies the documented 64 KiB budget only when absent.
 * @evidence contracts/common.md#clear-and-simple-design One parser owns unknown-input admission and returns either a typed request with required budget or null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed values, unknown operations and extra keys are refused without coercing submitted fields or reflecting their contents.
 * @evidence contracts/common.md#meaningful-documentation The return type documents applied budget and null refusal; the caller owns subsequent error classification.
 * @evidence contracts/performance.md#efficient-algorithms One bounded request shape is parsed with no document scan; constructing the four-member union is module-local fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed union reuses the public operation schemas; request results are not retained across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the admitted request's small value copy escapes; schemas retain no source bytes, file handles or tasks.
 */
export function parseAutoMovieReferenceRequest(input: unknown):
  | (AutoMovieReferenceRequest & {

      /** Admitted success-envelope byte ceiling, with the 64 KiB default already applied. */
      budgetBytes: number;
    })
  | null {
  const parsed: ReturnType<typeof requestSchema.safeParse> = requestSchema.safeParse(input);
  return parsed.success
    ? { ...parsed.data, budgetBytes: parsed.data.budgetBytes ?? DEFAULT_BUDGET }
    : null;
}
