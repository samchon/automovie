# src/architecture/IAutoMovieBuiltSupportQuery.ts#IAutoMovieBuiltSupportQuery

## @evidence contracts/development/design.md#principled-representation `builtEnvironmentSupportStatus` delegates to `propSupportGap`'s subject footprint corners/centre and face ring corners, taking the minimum sampled underside-minus-height. Missing edge-intersection probes can miss thin overlap or a deeper planar point, and curved relief between probes is unread; this finite static proxy measurement does not prove continuous mesh contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A claim is subject, support, kind, and optional tolerance; the query reuses the prop placement kernel's support gap rather than carrying a building-specific probe rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A negative or non-finite tolerance throws a `RangeError` instead of being replaced by the default, and `suspended` is accepted without measurement as the documented limit rather than faked with a hanging test.

## @evidence contracts/development/common.md#meaningful-documentation

States what each kind measures, that the result is not structural analysis, the metre unit and default of the tolerance, and that an invalid tolerance throws.
