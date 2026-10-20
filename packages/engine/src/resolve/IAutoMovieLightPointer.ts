import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/**
 * A parsed light pointer: which staged light, and which of its properties.
 *
 *
 * @evidence contracts/common.md#principled-implementation Pair a decoded scene light id with a closed animatable-property discriminator; parseLightPointer establishes canonical RFC-6901 spelling before constructing it.
 * @evidence contracts/common.md#clear-and-simple-design The pair separates pointer syntax from property dispatch without retaining the original pointer or a light object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not itself verify referenced light existence; shot resolution owns that lookup and refuses absent targets.
 * @evidence contracts/common.md#meaningful-documentation Members document the addressed light id and supported property, whose scalar units are defined by the override/table owners.
 * @evidence contracts/performance.md#efficient-algorithms Two string fields require space proportional to their text; parser work depends on pointer length rather than this record.
 * @evidence contracts/performance.md#reuse-equivalent-work Formatting and parsing share property semantics, but this type owns no parse cache or mutable light lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parser's caller owns the returned pair; no scene, transform, native light or task is retained.
 */
export interface IAutoMovieLightPointer {
  /** Id of the addressed scene light. */
  light: string;

  /** The animatable property. */
  property: AutoMovieLightProperty;
}
