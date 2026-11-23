# src/production/IAutoMovieCompiledDefinedShot.ts#IAutoMovieCompiledDefinedShot

## @evidence contracts/development/design.md#principled-representation

A discriminated union on the literal `success`; the success branch exists only after every phase passed, and continuity is sampled from the compiled scene, motions, mounts and plants by `resolveBeatOpening` and `resolveBeatEnd` rather than copied from the program, with the opening's gait phase, root velocity, foot plants and mount carried from the previous beat when one is supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The success branch groups what a caller such as `productionShotAssembly` reads after one compile, the source, its two continuity boundaries, the realization grade and the advice decisions, so the caller never recompiles to learn any of them; the failure branch carries diagnostics only, because no partial artifact is trustworthy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Advice is validated and deep-cloned, never applied to motion by the compiler, and a realization failure tells the author to correct the stage or camera rather than the contract prose, so no branch is reached by echoing the output into the contract.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the phase order, that exceptions become diagnostics, what each success field holds and how continuity and advice are derived, and that a failure lists every diagnostic of the first failing phase only.
