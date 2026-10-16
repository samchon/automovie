# Testing

## Location

A unit test is a `test_<name>.ts` under `test/src/features/<domain>/` that imports the source it calls and declares `export function test_<name>(): void` or `export async function test_<name>(): Promise<void>`, never an arrow function. Reuse the helpers in `test/src/features/internal/`.

## Cases

Open each case with what it pins, then a numbered `Scenarios:` list.

## Assertions

Observe through the product's seams or its own output, and never replace globals or foreign methods in a test. Compare floats with `TestValidator.predicate` over `nclose`, `vclose`, or `qclose`, never deep equality.
