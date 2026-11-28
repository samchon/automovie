# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.describe

## @evidence contracts/development/common.md#meaningful-documentation

Explains inclusive ranges, one-sided bounds, choice lists and the two empty cases.

## @evidence contracts/development/implementation.md#principled-implementation

Dispatches by the feasible set discriminator, then chooses text from the available bounds. Unitless ranges omit the unit suffix, and empty alternatives become `none`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Range rendering is constant work. Alternatives are joined in one traversal with their input order preserved.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IAlternatives.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the discriminator for the choice-list formatter branch.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IAlternatives.values

## @evidence contracts/development/common.md#meaningful-documentation

Defines the preserved ordered author choices and the empty case.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.archetype

## @evidence contracts/development/common.md#meaningful-documentation

Names the producer to be copied into the error and message.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.axis

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the failed parameter or contact in the error message.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.feasible

## @evidence contracts/development/common.md#meaningful-documentation

Defines the optional acceptable range or set of alternatives.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.fix

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the repair text for the operation that failed.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the category supplied by the refusing operation.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.reason

## @evidence contracts/development/common.md#meaningful-documentation

Names the condition that should be stated for the rejected value.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps.value

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the unparsed submitted value, including malformed runtime representations.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the discriminator consumed by the numeric formatter branch.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange.maximum

## @evidence contracts/development/common.md#meaningful-documentation

States inclusion of the upper endpoint and the meaning of null.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange.minimum

## @evidence contracts/development/common.md#meaningful-documentation

States inclusion of the lower endpoint and the meaning of null.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange.unit

## @evidence contracts/development/common.md#meaningful-documentation

Names the display unit and empty unitless form.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.archetype

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the reporting producer.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.axis

## @evidence contracts/development/common.md#meaningful-documentation

Names the scalar, catalogue or contact axis that failed.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.feasible

## @evidence contracts/development/common.md#meaningful-documentation

Defines range, alternatives or null as the feasible-set contract.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.fix

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the actionable change provided by the refusing operation.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.kind

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the four categories used by producer, contact, mechanism and site admission.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.reason

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the refusing operation's explanation.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.prototype.value

## @evidence contracts/development/common.md#meaningful-documentation

States that the raw received value is retained for recovery.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.Feasible

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two representations of acceptable values.

## @evidence contracts/development/design.md#principled-representation

The `kind` discriminator confines a payload to inclusive numeric bounds with a unit or enumerated author spellings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both producer rejection and its formatter share this one payload shape.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IAlternatives

## @evidence contracts/development/common.md#meaningful-documentation

States that recovery uses authored choice labels.

## @evidence contracts/development/design.md#principled-representation

The choice list contains author spellings under its own discriminator. An empty list means the operation has no accepted choice here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves caller-supplied choice order for both recovery and readable formatting without another representation.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Names the complete structured error inputs supplied by the refusing operation.

## @evidence contracts/development/design.md#principled-representation

The operation supplies its producer, kind, failed axis, raw value, reason and repair together. `feasible` is optional and normalizes to null in the resulting error.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the same feasible and kind types as the public error fields and keeps message construction in the error class.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Defines included endpoints, unbounded sides and their common unit.

## @evidence contracts/development/design.md#principled-representation

A null side represents no bound, so producers can state lower, upper, both or neither without sentinel infinities. The unit applies to whichever endpoints are supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The formatter handles all four bound combinations from this one shape.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the four admission contexts and their use.

## @evidence contracts/development/design.md#principled-representation

The alternatives correspond to different owners. Parameter rejection belongs to a producer, affordance rejection to lookup, articulation rejection to moving contacts and site rejection to location on an affordance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A common kind label lets all consumers handle their specific recovery without separate error classes.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal

## @evidence contracts/development/common.md#meaningful-documentation

Describes the structured error fields and human-readable message.

## @evidence contracts/development/design.md#principled-representation

Error properties preserve the category, producer, failed axis, received value, optional feasible set and authored explanation. Range and alternatives are explicit variants. The constructor converts an omitted feasible set to null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same typed fields serve production recovery and diagnostic presentation. The producer tracks rejection details and the error owns their shared format.
