import type { IAutoMovieExternalModelInspection } from "@automovie/ingest";
import { throwsError } from "../predicates";
import { inspectGlb } from "./inspectGlb";

/**
 * Assert a GLB field-specific refusal using independent container bytes.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const rejectsGlb: (document: unknown, bin: Buffer | null, message: string, resolver?: (uri: string) => Uint8Array | null) => boolean = (
  document: unknown,
  bin: Buffer | null,
  message: string,
  resolver?: (uri: string) => Uint8Array | null,
): boolean => throwsError(() : IAutoMovieExternalModelInspection => inspectGlb(document, bin, resolver), message);
