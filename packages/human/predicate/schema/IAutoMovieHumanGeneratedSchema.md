# src/schema/IAutoMovieHumanGeneratedSchema.ts#IAutoMovieHumanGeneratedSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the engine model and the originating parameters. The Human package currently ships body and component producers.

## @evidence contracts/development/design.md#principled-representation

The intersection retains both fields of the Interface envelope and refines only `parameters`. It applies their metadata when a caller generates a validator or schema.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Interface owns the model envelope and engine model shape. Human reuses its existing parameter refinement and leaves production of the complete envelope to the caller.
