# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.IKnot

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The second, the frozen posture and its turned root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read only by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fit's own records.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame.

## @evidence contracts/development/design.md#principled-representation

A posture and two world quantities of its root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanCarriedLift` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture and vector records.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

A binary refinement over knot pairs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read only by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The split is decided once from the interval's own ends.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

The phase's span and its refinement, made on first read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `course`, read by `read`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fit is made before a second of the phase is read.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.Frozen

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns and at which second.

## @evidence contracts/development/design.md#principled-representation

A plan second in, the posture written by its solved angles out.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one callback `read` fits knots with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fit is the caller's.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.course

## @evidence contracts/development/common.md#meaningful-documentation

States the span and that nothing is fitted yet.

## @evidence contracts/development/implementation.md#principled-implementation

A phase's knots depend on its span and the carry's posture alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No input is judged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share yet.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record holds its knots once read, for its plan's life.

# src/lexicon/HumanCarriedLiftKnots.ts#HumanCarriedLiftKnots.read

## @evidence contracts/development/common.md#meaningful-documentation

States what is read where.

## @evidence contracts/development/implementation.md#principled-implementation

A binary refinement judged at middles against the solver's millimetre on every joint centre, down to the frame grid, read by descent and per-field interpolation; a knot reads its own fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fit the ends, descend judging each interval once, interpolate at the leaf.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every knot is the caller's full fit; an interval is kept whole only where its middle's fit is within the tolerance of the interpolation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fit and two joint-only assemblies with their forward kinematics a judged interval, at most the phase over the frame grid's halvings deep; a read past the judged intervals costs a descent and one interpolation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Knots and judgements are kept by the course and shared by every read of the phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The course keeps its knots, at most two a frame-grid interval of the phase.
