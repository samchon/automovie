# src/production/IAutoMovieEngineShotRuntime.ts#IAutoMovieEngineShotRuntime

## @evidence contracts/development/design.md#principled-representation

Capabilities are injected as lookups keyed by scene node id rather than imported, so the engine composes and validates motion against whatever rig, model and gait table the host actually renders with, and the same compile is deterministic for the same runtime answers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record for everything outside the shot program, so `compileDefinedShot` keeps a three-argument signature and routes each member to the one phase that reads it; members are optional exactly where a host can lack the fact and the phase has a defined behavior without it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is defaulted to an invented rig, gait list or raster: an absent `skeleton` answer skips ROM for that node by contract, an absent `gaits` lookup skips only the gait check, an absent delivery `fps` refuses a moving camera instead of keying it at an assumed rate, and a clearance-declaring camera without `cameraClearance` is a violation rather than a pass.

## @evidence contracts/development/common.md#meaningful-documentation

States the consumer and where each member is routed, and per member its owner, what it is measured against, what omission does, and the units or keys of its answers.
