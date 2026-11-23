# src/authoring/IAutoMovieShotDefinition.ts#IAutoMovieShotDefinition

## @evidence contracts/development/design.md#principled-representation

defineShot selects exactly id, scene, contract and build, dropping runtime extra fields and preventing a definition id from replacing the id argument. After registration-id admission, compileDefinedShot invokes build once and checks the returned program's scene, beat, duration and events before staging, blocking, performance and measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record is the single declaration of scene, contract and builder; `IAutoMovieDefinedShot` extends it with only the id, so the two halves cannot document or type the same member differently.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The builder is opaque code the engine never inspects; correctness is judged only from the program it returns, so no source pattern or fixture is recognized specially.

## @evidence contracts/development/common.md#meaningful-documentation

States when the builder runs, how often, with what argument, that it must return synchronously, how a throw is reported, and that `scene` and the contract bind the returned program.
