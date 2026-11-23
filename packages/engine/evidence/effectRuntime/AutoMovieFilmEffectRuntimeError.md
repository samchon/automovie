# src/effectRuntime/AutoMovieFilmEffectRuntimeError.ts#AutoMovieFilmEffectRuntimeError

## @evidence contracts/development/design.md#principled-representation

A plain `Error` subclass with a readonly discriminant and a `name` set to the class name, the idiomatic way to give a thrown JavaScript error a stable machine-readable class while keeping its stack and message.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One error type for the whole film-effect boundary with a closed code union, rather than one subclass per refusal, because callers branch on the code and nothing else differs between refusals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No caller or code is special-cased, and the class replaces no global or built-in behavior; it only adds the `code` field to `Error`.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states who throws it, how a caller classifies it, what each code means, and that the production builder flattens it into one diagnostic code.
