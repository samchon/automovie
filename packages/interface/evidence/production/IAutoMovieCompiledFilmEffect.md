# src/production/IAutoMovieCompiledFilmEffect.ts#IAutoMovieCompiledFilmEffect

## @evidence contracts/development/design.md#principled-representation

A film-owned timeline-frame envelope binds the inner deterministic stream to production, film, compile and edit fingerprints plus a reduced rational frame rate and half-open integer frame interval; persisted-runtime validation recomputes both digests and the exact inner clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The existing effect stream remains the simulation input, while the envelope owns global edit authority and frame mapping, preventing preview proxies from introducing another effect clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A content-valid runtime still needs current owner and edit identities; changing the frame rate or inner step cannot be hidden by replaying a digest from another timeline.

## @evidence contracts/development/common.md#meaningful-documentation

States explicit film authority, full-rate timeline clock, current builder identities, reduced rational rate, inclusive/exclusive frames and inner-plus-envelope digest coverage.
