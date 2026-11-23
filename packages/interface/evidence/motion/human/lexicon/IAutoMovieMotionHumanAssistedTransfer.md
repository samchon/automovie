# src/motion/human/lexicon/IAutoMovieMotionHumanAssistedTransfer.ts#IAutoMovieMotionHumanAssistedTransfer

## @evidence contracts/development/common.md#meaningful-documentation

Names the real source and destination, common world grip and timed phases.

## @evidence contracts/development/design.md#principled-representation

The seat references identify staged rigid contacts. A separate grip point is in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two actors share one meeting point and phase time. The support law handles ordinary contact fitting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The supports and hands retain their own identities and each actor's anatomical solve.

# src/motion/human/lexicon/IAutoMovieMotionHumanAssistedTransfer.ts#IAutoMovieMotionHumanAssistedTransfer.Role

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the helper and the actor departing the source seat.

## @evidence contracts/development/design.md#principled-representation

The two distinct roles add to the same mutual cast.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each value is used to choose one law's support sequence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each role names a performer in the actual cast.

# src/motion/human/lexicon/IAutoMovieMotionHumanAssistedTransfer.ts#IAutoMovieMotionHumanAssistedTransfer.ISeatReference

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the seat and the optional distance along its front edge.

## @evidence contracts/development/design.md#principled-representation

The names resolve to one placed seat frame and the offset stays within its width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the named prop and contact plus an optional station along that contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law refuses a missing seat or a point past the edge.

# src/motion/human/lexicon/IAutoMovieMotionHumanAssistedTransfer.ts#IAutoMovieMotionHumanAssistedTransfer.IRoleParams

## @evidence contracts/development/common.md#meaningful-documentation

Names one role and the other actor of the cast.

## @evidence contracts/development/design.md#principled-representation

Both in-progress role plans share the same source, destination and timing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mutual law only adds the actor's role and the other's identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The partner identifies an actual performer, whose pose the helper reads.

# src/motion/human/lexicon/IAutoMovieMotionHumanAssistedTransfer.ts#IAutoMovieMotionHumanAssistedTransfer.ILaw

## @evidence contracts/development/common.md#meaningful-documentation

States the role law and the mutual that joins helper and helped.

## @evidence contracts/development/design.md#principled-representation

One law plans either role from `IRoleParams`; the mutual maps the shared parameters and cast to each role's act.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vocabulary registers the law and the chain joins the pair through the mutual, so both live on one value.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both roles read the same parameters; no role-specific copy exists.
