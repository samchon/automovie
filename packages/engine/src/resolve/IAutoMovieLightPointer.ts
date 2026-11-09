import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/**
 * A parsed light pointer: which staged light, and which of its properties.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Pair a decoded scene light id with a closed animatable-property discriminator; parseLightPointer establishes canonical RFC-6901 spelling before constructing it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pair separates pointer syntax from property dispatch without retaining the original pointer or a light object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not itself verify referenced light existence; shot resolution owns that lookup and refuses absent targets.
 * @evidence contracts/development/common.md#meaningful-documentation Members document the addressed light id and supported property, whose scalar units are defined by the override/table owners.
 */
export interface IAutoMovieLightPointer {
  /** Id of the addressed scene light. */
  light: string;

  /** The animatable property. */
  property: AutoMovieLightProperty;
}
