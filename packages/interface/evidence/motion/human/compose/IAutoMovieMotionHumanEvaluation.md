# src/motion/human/compose/IAutoMovieMotionHumanEvaluation.ts#IAutoMovieMotionHumanEvaluation

## @evidence contracts/development/common.md#meaningful-documentation

States what one evaluation of a plan's posture and its primitives' writes is lent beyond the second, the channels, the resolution and the projection, that readers pass it on unchanged, and that its absence borrows nothing.

## @evidence contracts/development/design.md#principled-representation

The context an evaluation shares with its caller is an argument of that evaluation, as the resolution and the projection are, so no posture or write has a hidden counterpart that receives it some other way.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two optional members, the bend loan a numerical trial lends its arm writers and the loan a plan lends its own writers for one evaluation; the plan's posture and the primitive's write each take the context as their one trailing argument.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The loan changes no posture: a bend reused from it is the bend a fresh solve returns, so an evaluation without it reads the same posture.

# src/motion/human/compose/IAutoMovieMotionHumanEvaluation.ts#IAutoMovieMotionHumanEvaluation.IBendLoan

## @evidence contracts/development/common.md#meaningful-documentation

States who makes a bend loan, for which plan, and who reads it.

## @evidence contracts/development/design.md#principled-representation

A loan is identified by the plan it was made for; its completed bends belong to the motions package's bend owner, which recognizes only loans it made.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the owner plan is public; the completed bends stay with their owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No bend, solve state or trial history is exposed, and no consumer outside the bend owner reads a loan.

# src/motion/human/compose/IAutoMovieMotionHumanEvaluation.ts#IAutoMovieMotionHumanEvaluation.ILoan

## @evidence contracts/development/common.md#meaningful-documentation

States who makes a plan's loan, for which evaluation, and that only that plan's writers read it.

## @evidence contracts/development/design.md#principled-representation

A value solved once at an evaluation's second and read by every writer of the same plan travels in the evaluation it belongs to, identified by the plan that made it, instead of in state the plan sets around its writers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the owner plan is public; each lending plan's writers recognize their own loan's contents.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A loan lives for one evaluation only and changes no posture: it carries what the plan's writers would otherwise solve again at the same second.