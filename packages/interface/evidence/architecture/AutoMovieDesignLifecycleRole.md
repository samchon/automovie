# src/architecture/AutoMovieDesignLifecycleRole.ts#AutoMovieDesignLifecycleRole

## @evidence contracts/development/design.md#principled-representation

The four literals are the product of two booleans, predating and surviving, which `designLineagePhaseSnapshot` reads from `introducedIn === null` and `removedIn !== null`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed union for the plan-wide role kept separate from the per-phase presence, so a reader never mixes "what this subject is" with "whether it stands now".

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No role is inferred from a subject's kind or name; the two lifecycle fields alone decide it, and a temporary installation is never folded into `new`.

## @evidence contracts/development/common.md#meaningful-documentation

States that the role spans the whole plan, what each of the four roles means, where to ask for the per-phase answer, and the two fields it is derived from.
