# src/validation/IAutoMovieValidateScriptTree.ts#IAutoMovieValidateScriptTree.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate the screenplay refinement tree against its script's flat beats, the structural gate a script with a `tree` must pass before commit. Member documentation states the supplied records, units and absence meanings used by validateScriptTree.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Canonical node kinds and parent ids carry authored structure; the validator enforces graph/refinement joins without pretending to evaluate later feedback propagation.

## @evidence contracts/development/design.md#principled-representation

tree and beats express the refinement graph and its flat beat inventory; logline and theme preserve the script header that the intent root must match.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateScriptTree.IProps, used by validateScriptTree. Its tree, beats, logline, theme members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
