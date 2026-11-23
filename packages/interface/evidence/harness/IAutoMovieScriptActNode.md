# src/harness/IAutoMovieScriptActNode.ts#IAutoMovieScriptActNode

## @evidence contracts/development/design.md#principled-representation

An inner node of the refinement tree whose allowed parents come from the validator's parent-kind table, so an act can never hang under a scene or a beat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Dramatic purpose lives in the act payload; graph identity and refinement edges are inherited, so a screenplay heading adds no staging or timing fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Acts are optional structure; a short film may refine the intent straight into beats, and no stage requires or infers an act.

## @evidence contracts/development/common.md#meaningful-documentation

States the allowed parents, how the screenplay prints it, and that no compiler stage reads it; members give the discriminator and payload roles.
