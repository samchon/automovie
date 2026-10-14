import type { IAutoMovieHumanHeadMeasurement } from "./IAutoMovieHumanHeadMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { readHumanHeadBreadth } from "./readHumanHeadBreadth";
import { readHumanHeadCircumference } from "./readHumanHeadCircumference";
import { readHumanHeadLength } from "./readHumanHeadLength";
import { readHumanLandmarkDistance } from "./readHumanLandmarkDistance";
import { readHumanTragionTop } from "./readHumanTragionTop";

/**
 * Read one head rule on a head view at rest, by its kind.
 *
 * @evidence contracts/common.md#principled-implementation The closed kind switch dispatches the five supported source-head rules to their owning instruments, preserving each rule's registration, precision and refusal semantics.
 * @evidence contracts/common.md#clear-and-simple-design One dispatch owner connects discriminated rule records to readers without another registry, fallback protocol or option layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unsupported kind is redirected to an expected reading, and protocol-specific source searches stay in their actual producers.
 * @evidence contracts/common.md#meaningful-documentation The public comment identifies rest-head rule dispatch, while the union/member readers describe source roles, units and their approximation limits.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch itself is constant work; total cost is that of the chosen reader, including any complete mesh scan, section graph and hull sort.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing instrument implementations are reused by kind and no cross-rule cache treats different landmarks, source populations or effects as equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The wrapper retains no state beyond its synchronous delegated call; returned reading ownership belongs to the caller and reader-local resources keep their own lifetime.
 */
export function readHumanHeadMeasurement(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadMeasurement,
): IAutoMovieHumanHeadReading {
  switch (rule.kind) {
    case "tragion-top":
      return readHumanTragionTop(head, rule);
    case "head-length":
      return readHumanHeadLength(head, rule);
    case "head-breadth":
      return readHumanHeadBreadth(head, rule);
    case "landmark-distance":
      return readHumanLandmarkDistance(head, rule);
    case "head-circumference":
      return readHumanHeadCircumference(head, rule);
  }
}
