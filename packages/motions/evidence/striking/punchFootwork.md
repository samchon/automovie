# src/striking/punchFootwork.ts#punchFootwork.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The punch's context and timing with the contact solution's line, step, turn and dip in metres and degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the values the feet and the trunk read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the context and timing types.

# src/striking/punchFootwork.ts#punchFootwork.IProps.advance

## @evidence contracts/development/common.md#meaningful-documentation

States the argument, the unit, the sign and what decides the stepping.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.

# src/striking/punchFootwork.ts#punchFootwork.IFootwork

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it returns.

## @evidence contracts/development/design.md#principled-representation

A posture per second with the trunk's turn on its own clock, and the feet's contact windows as shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the punch's geometry reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture and contact window types.

# src/striking/punchFootwork.ts#punchFootwork.drag

## @evidence contracts/development/common.md#meaningful-documentation

The namespace states the drag's window.

## @evidence contracts/development/implementation.md#principled-implementation

A minimum-jerk profile from mid-delivery to mid-return.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the window.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/punchFootwork.ts#punchFootwork.carried

## @evidence contracts/development/common.md#meaningful-documentation

States what the share measures.

## @evidence contracts/development/implementation.md#principled-implementation

The root travels with the mean of the two feet: the lead foot's whole step and the rear foot's drag so far.

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

# src/striking/punchFootwork.ts#punchFootwork.create

## @evidence contracts/development/common.md#meaningful-documentation

States its input and result; the namespace states the method.

## @evidence contracts/development/implementation.md#principled-implementation

The feet slide along the line on minimum-jerk shares, a step into a met body is arrested from the speed it had, and the legs are solved onto the placed feet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The feet's travel first, then the posture per second, then the contact windows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A planted foot is never moved by the trunk's clock; the stance keeps its length when a step is arrested.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per posture beyond the lower body's fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The geometry is built once; each actual posture shares its repeated opening/dragging phase factors. One actual advance(s) read feeds the position/speed arithmetic within each arrest or post-stop follow invocation; later frames still query their actual correction state. All derivative clocks and the existing arrested-state memo remain unchanged, with no new phase or pose history.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the original entry feet, timings, advance callback and lazy three-scalar arrested state until geometry release. New phase/advance scalars and any borrowed FK supplier end within the current synchronous evaluation; no new time history, pose or query workspace is retained.
