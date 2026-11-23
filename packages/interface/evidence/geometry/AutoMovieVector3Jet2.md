# src/geometry/AutoMovieVector3Jet2.ts#AutoMovieVector3Jet2

## @evidence contracts/development/common.md#meaningful-documentation

Defines component-first order, shared parameter, units/frame ownership and nested mutability.

## @evidence contracts/development/design.md#principled-representation

Exactly three ScalarJet2 entries preserve the component correspondence required by vector product rules; derivative validity remains with the numerical producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Human ArmJet vector arithmetic and ArmAxis course differentiation share this mathematical owner without carrying an arm-specific wrapper.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No spatial frame, Taylor coefficient scaling or derivative-first layout is silently substituted for the component-first arithmetic.
