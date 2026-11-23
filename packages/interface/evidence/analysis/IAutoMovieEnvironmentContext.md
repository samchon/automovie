# src/analysis/IAutoMovieEnvironmentContext.ts#IAutoMovieEnvironmentContext

## @evidence contracts/development/design.md#principled-representation

Context validation checks metre units, finite direction components with length above 1e-12, unique strictly time-ordered instants, beam/horizon consistency, occluder planes and collisions with caller-supplied reserved building ids. Production supplies element, space and boundary ids; direct solver validation reserves none. Declared nested containers are premises, although missing resident instant/occluder records are refused by index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record holding only the read-only site inputs, kept apart from the building record so no building query can reach an occluder; solvers look up an instant by id through `autoMovieEnvironmentInstant`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Instant order is validated rather than sorted; north is included in daylight identity, and `autoMovieSunDirection` reads it with the ground's up to orient a solved sun position; it rotates no geometry. A finite-component vector whose measured norm overflows can pass direction admission while skipping the horizon gate, so extreme accepted inputs do not establish beam/horizon consistency.

## @evidence contracts/development/common.md#meaningful-documentation

States the ownership separation and how the build enforces it, that no climate data ships, the units, the north direction's reader and its parallel-to-up refusal, the instant ordering contract and its reason, and the occluders' read-only role.
