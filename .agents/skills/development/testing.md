# Testing

## Location

In `test/src/features/<domain>/test_<name>.ts`, import the source and export a named `test_<name>` function returning `void` or `Promise<void>` when async. Reuse `test/src/features/internal/` helpers.

## Cases

Open each case with what it pins, then a numbered `Scenarios:` list.

## Assertions

Observe through the product's seams or its own output, and never replace globals or foreign methods in a test. Compare floats with `TestValidator.predicate` over `nclose`, `vclose`, or `qclose`, never deep equality.
