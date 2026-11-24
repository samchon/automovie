# Design

The contracts router names the types that answer this checklist, whether they also answer [common](common.md), and where each answers. Use evidence from the declaration and its consumers.

## Principled representation

Represent the domain's quantities with their units, frames and timebases. Encode invariants in the type where the language can enforce them.

State the concept represented, its units, frames, timebases and invariants, which invalid states the type rules out, and which remain for runtime validation.

## Minimal and owned surface

Expose only what current consumers use. Import existing types from their owner. Represent the variants current consumers use as data.

State the owner, the consumers the surface serves, and why any non-obvious member, parameter or layer exists.

## Prohibited design shortcuts

Do not:

- shape a type around one consumer, fixture or scene when the concept it names serves others;
- restrict a concept to one case when current consumers need others;
- encode alternatives as optional fields that combine into meaningless states, where a discriminated union separates them;
- widen to `any`, `unknown` or a cast to hide a mismatch between a value and its declared shape;
- add members only a test reads.

State any such shape present and its basis, or the violation that remains.
