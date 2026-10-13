import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/**
 * A parsed light pointer: which staged light, and which of its properties.
 *
 * @author Samchon
 */
export interface IAutoMovieLightPointer {
  /** Id of the addressed scene light. */
  light: string;

  /** The animatable property. */
  property: AutoMovieLightProperty;
}
