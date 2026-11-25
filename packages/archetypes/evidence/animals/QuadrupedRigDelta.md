# src/animals/QuadrupedRigDelta.ts#QuadrupedRigDelta.between

## @evidence contracts/development/common.md#meaningful-documentation

States complete same-rig maps, world metre units, independent output and rigid/nonfinite refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Current rotation times inverse-neutral rotation gives the carrier turn; current origin minus that turn applied to the neutral origin gives the rigid translation, preserving every carrier-local point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit both complete twenty-three-frame maps, then compute one quaternion/vector pair per bone through the engine owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No omitted frame, scaled geometry, nearest-bone guess, alternate root or species branch substitutes for the admitted rigid maps.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) admission, work and fresh output for the fixed vocabulary; no source model, geometry buffer or FK traversal is rebuilt.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each consumer shares the returned delta per carrier across all its attached parts/contacts; queries at other frames are evaluated afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned map owns scalar motion records; the operation retains no caller frame map, completed result or external resource.

# src/animals/QuadrupedRigDelta.ts#QuadrupedRigDelta.move

## @evidence contracts/development/common.md#meaningful-documentation

Defines source/current metre frames, explicit binding, preserved diagnostic identity and independent output.

## @evidence contracts/development/implementation.md#principled-implementation

The shared AutoMovieArchetypeFrame.move applies the admitted current-times-inverse-neutral rigid map, preserving source carrier-local coordinates and unit scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the source frame, resolve the declared delta, move through the shared rigid owner and admit its finite result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No absent binding is guessed, nonunit scale is not ignored and an overflowed transform cannot escape as current geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work/storage per frame with one map lookup, one rigid placement and finite/unit checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's already admitted delta instead of inverting the same carrier for each attached part or contact.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new transform escapes; no source frame, model, map, geometry buffer or external handle is retained.
