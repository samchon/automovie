import type { IAutoMovieCaptionSidecar } from "./IAutoMovieCaptionSidecar";

/**
 * Serialize a caption sidecar for the host to write: two-space indented JSON in declaration order, followed by one newline.
 *
 * @evidence contracts/common.md#principled-implementation `JSON.stringify` emits object keys in insertion order, and the planner and slicer build every object with a fixed key order, so the same sidecar always yields the same bytes.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the byte format; writing the file is the host's job, which keeps the render package free of file-system access here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It formats the value as given and adds no field or ordering for a particular consumer.
 * @evidence contracts/common.md#meaningful-documentation The doc states the indentation, the key order and the trailing newline a host writes.
 * @evidence contracts/performance.md#efficient-algorithms One stringify pass is linear in the number of spans and their text length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Serialization of one value per call coordinates no phases or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The only allocation is the returned string, owned by the caller, and no handle or task is opened.
 * @author Samchon
 */
export const renderCaptionSidecar: (
  sidecar: IAutoMovieCaptionSidecar,
) => string = (sidecar: IAutoMovieCaptionSidecar): string =>
  `${JSON.stringify(sidecar, null, 2)}\n`;
