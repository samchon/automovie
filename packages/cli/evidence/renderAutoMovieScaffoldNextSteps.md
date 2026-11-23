# src/index.ts#renderAutoMovieScaffoldNextSteps

## @evidence contracts/development/implementation.md#principled-implementation

The steps are fixed text derived from each layer's first-run contract: the production README's pnpm install and checks, and the workspace README's pnpm install and add.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function returns the text for every installation kind and leaves writing to `run`, so the message has a single owner and no terminal effect.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The text names no fixture or particular directory and is not altered by any caller; a closed union selects the variant.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states how `directory` is printed, why the text opens with a blank line, what each kind means and what must change with the scaffold.

## @evidence contracts/development/implementation.md#efficient-algorithms

One concatenation of constant lines with one interpolation, linear in the directory's length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `run` calls this once per successful installation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns a new string and holds no state, handle, or task after it returns.
