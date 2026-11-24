# src/physics/physicalGlitchFilter.ts#physicalGlitchFilter

## @evidence contracts/development/common.md#meaningful-documentation

States the window rule, the count's reset on a change, that the state is plain caller-kept data and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

A port of IHMC's `GlitchFilteredYoBoolean.update(boolean)` (201903 ihmc-robotics-toolkit l.77-89, the same in develop's ihmc-yovariables): count while the input differs from the value, clear on agreement, set the value and clear the count at the window. The window is a count of controller updates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One count and one comparison; the reference's `set` is the namespace's `set`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions; the window is the caller's reference value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per update.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the state.

# src/physics/physicalGlitchFilter.ts#physicalGlitchFilter

## @evidence contracts/development/common.md#meaningful-documentation

Documents the state the filter advances and its constructor.

## @evidence contracts/development/design.md#principled-representation

A filtered boolean and its count of differing updates, plain data so a checkpoint carries it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the foot switch, the push recovery and the capture-point integrator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members, casts or test-only members.

# src/physics/physicalGlitchFilter.ts#physicalGlitchFilter.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents the value and the count.

## @evidence contracts/development/design.md#principled-representation

The reference's YoBoolean value and its YoInteger counter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the filter and `set`; kept by its callers' states.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members are required.

# src/physics/physicalGlitchFilter.ts#physicalGlitchFilter.set

## @evidence contracts/development/common.md#meaningful-documentation

States that the count is cleared and that a new filter is false.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `set(boolean)` (l.68-75) and its constructor's `set(false)` (l.65).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
