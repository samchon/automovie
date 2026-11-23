# src/production/IAutoMovieCompileDefinedShot.ts#IAutoMovieCompileDefinedShot.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Compile one {@link defineShot} registration into shot source, continuity and a contract realization, or into the diagnostics of the first phase that failed. Member documentation states the supplied records, units and absence meanings used by compileDefinedShot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source callbacks are typed against their supplied Context instead of widened casts; compilation admission and diagnostics remain the engine's responsibility.

## @evidence contracts/development/design.md#principled-representation

shot is the registered source, context is its single build call's input and runtime supplies motion, rig, scene and continuity services; generic Context keeps the registration and input types identical.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieCompileDefinedShot.IProps, used by compileDefinedShot. Its shot, context, runtime members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
