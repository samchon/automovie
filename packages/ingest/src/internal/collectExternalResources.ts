import type { IAutoMovieExternalModelResource } from "@automovie/interface";

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

/** Collect exact sidecar URI identities without decoding their payloads. */
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
