# src/motion/human/law/IAutoMovieMotionHumanPerformerReader.ts#IAutoMovieMotionHumanPerformerReader

## @evidence contracts/development/common.md#meaningful-documentation

A capability for reading another performer's body, resolved bones, root and optional posture at film instants. Action planning uses this resolved view separately from authored performer configuration.

## @evidence contracts/development/design.md#principled-representation

posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ActionContext.performer supplies resolved body/bones/root/posture queries to interaction laws, while IAutoMovieMotionHumanPerformer remains the authored configuration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Queries take film seconds and expose the original Map ownership; the performance reader owns evaluation and recursion handling. No SDK skeleton handle enters the contract.
