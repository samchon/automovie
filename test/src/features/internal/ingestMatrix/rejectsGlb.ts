import type { IAutoMovieExternalModelInspection } from "@automovie/ingest";
import { throwsError } from "../predicates";
import { inspectGlb } from "./inspectGlb";

/**
 * Assert a GLB field-specific refusal using independent container bytes.
 */
export const rejectsGlb: (document: unknown, bin: Buffer | null, message: string, resolver?: (uri: string) => Uint8Array | null) => boolean = (
  document: unknown,
  bin: Buffer | null,
  message: string,
  resolver?: (uri: string) => Uint8Array | null,
): boolean => throwsError(() : IAutoMovieExternalModelInspection => inspectGlb(document, bin, resolver), message);
