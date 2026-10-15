# Testing

Test behavior at the layer that owns it. The [test contracts](../contracts/testing.md) define the evidence every test must provide.

| Kind | Location |
| --- | --- |
| Unit | A `test_<name>.ts` under `test/src/features/<domain>/` declaring `export function test_<name>(): void` or `export async function test_<name>(): Promise<void>`, never an arrow function, and importing the source it calls. |

- Observe through the product's seams or its own output; never replace globals or foreign methods in a test.
- Open each case with what it pins, then a numbered `Scenarios:` list. Reuse `test/src/features/internal/`.
- Compare floats with `TestValidator.predicate` over `nclose`, `vclose`, or `qclose`, never deep equality.
