# Design

Each exported type, interface, type alias and class answers every item in its doc comment with grounds a reviewer can check against the declaration and its consumers, as well as the [common](common.md) item. Keep simple decisions brief, and invent no alternatives or history.

## Principled representation

Model the concept the problem's semantics define, not the shape one caller happened to need. Represent each quantity with its unit, frame and timebase, and let the type's structure carry the domain's invariants, so a value the domain forbids cannot be written where the language can prevent it.

State the concept represented, its units, frames, timebases and invariants, which invalid states the type rules out, and which remain for runtime validation.

## Minimal and owned surface

Expose only the members current consumers read or write, with no member, option or generic parameter for presumed future needs. Give each concept one owner: import the type an installed package or another module already owns instead of declaring a parallel one, and let variation the consumers already exercise enter as data, such as a parameter, a discriminant or a table, rather than as members named after one of them.

State the owner, the consumers the surface serves, and why any non-obvious member, parameter or layer exists.

## Prohibited design shortcuts

Do not:

- shape a type around one consumer, fixture or scene when the concept it names serves others;
- fix a concept to one case its current consumers already outgrow, such as one body's bones in a gait several bodies use;
- encode alternatives as optional fields that combine into meaningless states, where a discriminated union separates them;
- widen to `any`, `unknown` or a cast to hide a mismatch between a value and its declared shape;
- duplicate a type another owner declares;
- add members only a test reads.

State any such shape present and its basis, or the violation that remains.
