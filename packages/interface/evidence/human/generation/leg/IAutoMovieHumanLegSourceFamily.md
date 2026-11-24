# src/human/generation/leg/IAutoMovieHumanLegSourceFamily.ts#IAutoMovieHumanLegSourceFamily

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegSourceFamily exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IOutput, IAnkle, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegSourceFamily; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IOutput, IAnkle, IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegSourceFamily.ts#IAutoMovieHumanLegSourceFamily.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Regional and full demands of the same production family. A binding operation borrows the already prepared independent base for the caller's tape scope.

## @evidence contracts/development/design.md#principled-representation

Regional and full demands of the same production family.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegSourceFamily.create. Also types AutoMovieHumanLegSources.legSource.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSourceFamily.create, AutoMovieHumanLegSources.legSource for regional and full demands of the same production family.

# src/human/generation/leg/IAutoMovieHumanLegSourceFamily.ts#IAutoMovieHumanLegSourceFamily.IAnkle

## @evidence contracts/development/common.md#meaningful-documentation

Exact retained region with the actual explicit full-resolver capability.

## @evidence contracts/development/design.md#principled-representation

Exact retained region with the actual explicit full-resolver capability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegSourceFamily.ankle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegSourceFamily.ankle, AutoMovieHumanLegSourceFamily.create for exact retained region with the actual explicit full-resolver capability.

# src/human/generation/leg/IAutoMovieHumanLegSourceFamily.ts#IAutoMovieHumanLegSourceFamily.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Invocation-owned production inputs and its optional full-parent completion seam.

## @evidence contracts/development/design.md#principled-representation `name`: Existing side-qualified production name. `bones`: Actual immutable bone frames. `law`: Existing measured and intermediate source laws.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegSourceFamily.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The explicit complete callback returns the actual final leg of the owning trunk, or throws its recorded failure. A binding trial edits no other original.
