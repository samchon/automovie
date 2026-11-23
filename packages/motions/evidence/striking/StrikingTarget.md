# src/striking/StrikingTarget.ts#StrikingTarget.lead

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and its default.

## @evidence contracts/development/implementation.md#principled-implementation

The right ankle's lead over the left along the heading's forward; more than 2 cm makes the right side lead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 2 cm threshold keeps level feet orthodox against rounding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.line

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the fallback.

## @evidence contracts/development/implementation.md#principled-implementation

The normalised horizontal difference, or the heading's forward when shorter than 1 µm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.heading

## @evidence contracts/development/common.md#meaningful-documentation

States the convention.

## @evidence contracts/development/implementation.md#principled-implementation

The two-argument arctangent of the x and z components, 0 facing +Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.feet

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Copies each entry foot's ankle and rotation into a placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One object.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.slide

## @evidence contracts/development/common.md#meaningful-documentation

States every unit and that the rotation is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle translated along the line and raised, the rotation unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States what stays fixed and every angle's sense.

## @evidence contracts/development/implementation.md#principled-implementation

The foot's rocker pivot about its ball point: the heading turned and the pitch raised with the ball held.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ball read and one pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingTarget.ts#StrikingTarget.aim

## @evidence contracts/development/common.md#meaningful-documentation

States both cases, each line's height and the range's source.

## @evidence contracts/development/implementation.md#principled-implementation

The context's aim for a real target; for none, a point on the stance's line at the line's height measured on the performer and at the technique's range or the named one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch for a real target, then the virtual point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The virtual opponent is built from the performer's own measure, not a fixed scene; a 5 cm stagger decides whether to turn back by the stance turn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time beyond the context's aim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; callers memoise.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
