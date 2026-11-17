import type { AutoMovieScalarJet2 } from "./AutoMovieScalarJet2";

/**
 * Component-first order-two jet of a three-component vector.
 *
 * Entries are the x, y and z scalar jets, each `[value, first, second]` in
 * the same independent parameter. This is not derivative-first storage
 * `[position, firstVector, secondVector]`. The containing field declares
 * coordinate frame, vector units and parameter units; second derivatives
 * are unscaled. Both the outer tuple and its scalar tuples are mutable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines component-first order, shared parameter, units/frame ownership and nested mutability.
 * @evidence contracts/development/design.md#principled-representation Exactly three ScalarJet2 entries preserve the component correspondence required by vector product rules; derivative validity remains with the numerical producer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Human ArmJet vector arithmetic and ArmAxis course differentiation share this mathematical owner without carrying an arm-specific wrapper.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No spatial frame, Taylor coefficient scaling or derivative-first layout is silently substituted for the component-first arithmetic.
 */
export type AutoMovieVector3Jet2 = [
  x: AutoMovieScalarJet2,
  y: AutoMovieScalarJet2,
  z: AutoMovieScalarJet2,
];
