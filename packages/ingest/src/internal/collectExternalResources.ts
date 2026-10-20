import type { IAutoMovieExternalModelResource } from "../IAutoMovieExternalModelResource";
import { compareCodeUnits } from "./compareCodeUnits";
import { object } from "./object";

const externalUri: (value: unknown, path: string) => string | null = (
  value: unknown,
  path: string,
): string | null => {
  if (value === undefined) return null;
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`${path} must be a non-empty URI string.`);
  return value.startsWith("data:") ? null : value;
};

/**
 * Collect exact sidecar URI identities without decoding their payloads.
 *
 * @evidence contracts/common.md#principled-implementation Buffers preserve declared byte lengths; images carry null lengths, while repeated URIs must agree on role and buffer extent.
 * @evidence contracts/common.md#clear-and-simple-design One URI-keyed map owns conflict detection and deterministic resource ordering shared by every ingest profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Data URIs are excluded, conflicting roles/lengths throw, and URI spelling is preserved rather than normalized into aliases.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies exact URI ownership, buffer/image length meaning, conflict behavior and code-unit ordering.
 * @evidence contracts/performance.md#efficient-algorithms B buffers and I images cause B+I expected map operations over exact URI strings; U distinct resources require O(U log U) comparisons, each scanning at most the compared shared prefix, with string identity/hash work dependent on URI text.
 * @evidence contracts/performance.md#reuse-equivalent-work One map coordinates exact URI conflict checks and the final unique inventory; repeated declarations replace their scalar row, while byte resolution remains a separate effectful payload owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only U scalar resource records survive in the result; the temporary map retains no resident sidecar bytes.
 */
export const collectExternalResources: (
  buffers: unknown[],
  images: unknown[],
) => IAutoMovieExternalModelResource[] = (
  buffers: unknown[],
  images: unknown[],
): IAutoMovieExternalModelResource[] => {
  const byUri: Map<string, IAutoMovieExternalModelResource> = new Map<
    string,
    IAutoMovieExternalModelResource
  >();
  buffers.forEach((value: unknown, index: number): void => {
    const buffer: Record<string, unknown> = object(value, `buffers[${index}]`);
    const uri: string | null = externalUri(buffer.uri, `buffers[${index}].uri`);
    if (uri === null) return;
    const byteLength: number = buffer.byteLength as number;
    const prior: IAutoMovieExternalModelResource | undefined = byUri.get(uri);
    if (
      prior !== undefined &&
      (prior.kind !== "buffer" || prior.byteLength !== byteLength)
    )
      throw new Error(
        `External URI "${uri}" is declared with conflicting resource roles or lengths.`,
      );
    byUri.set(uri, { uri, kind: "buffer", byteLength });
  });
  images.forEach((value: unknown, index: number): void => {
    const image: Record<string, unknown> = object(value, `images[${index}]`);
    const uri: string | null = externalUri(image.uri, `images[${index}].uri`);
    if (uri === null) return;
    const prior: IAutoMovieExternalModelResource | undefined = byUri.get(uri);
    if (prior !== undefined && prior.kind !== "image")
      throw new Error(
        `External URI "${uri}" is declared as both a buffer and an image.`,
      );
    byUri.set(uri, { uri, kind: "image", byteLength: null });
  });
  return [...byUri.values()].sort(
    (
      left: IAutoMovieExternalModelResource,
      right: IAutoMovieExternalModelResource,
    ): number => compareCodeUnits(left.uri, right.uri),
  );
};
