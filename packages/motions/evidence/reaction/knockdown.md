# src/reaction/knockdown.ts#knockdown.rest

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the ignored input and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of the posture with its root at zero height, then the lowest point of every collision shape's exact world bounds (`physicalShapeBounds`), negated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One trunk resolution and one pass over the shapes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the height follows from the body's own shapes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in bones and shapes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the unchanged floor measurement and optional exact FK/projector loans to KnockdownFloor.rest; scalar FK checks and genuine projector provenance share only transform prerequisites/static ROM metadata while each actual posture and joint is still read normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains neither geometry nor optional FK/projector loans, which stay with their synchronous planning caller through return or throw.

# src/reaction/knockdown.ts#knockdown.prepareRest

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-body premise, changing posture/metadata inputs, root-Y-zero convention, metre output and plan-owned reader lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to KnockdownFloor.prepareRest, preserving complete current trunk admission and the exact lowest-collider floor law used by rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direct function wrapper exposes the existing floor owner's prepared reader; collider selection, placement and numeric bounds keep one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no posture, collider, contact, bound or tolerance, and provides no caller-authored posed map, cached floor or success flag.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant facade work; the native owner binds fixed demand/profile entries once while every query retains full current admission/fits, required FK, placement and exact shape bounds. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit unchanged body/rig/profile establish only static selection equivalence. Each actual posture and current-call FK/ROM source reaches the native owner normally, with original dependency/provenance checks and no fitted result reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the native reader and its bounded body/profile metadata until its plan or interval releases it. Invocation FK/ROM loans, posed maps and scalar heights are never retained in that reader or returned data.

# src/reaction/knockdown.ts#knockdown.plan

## @evidence contracts/development/common.md#meaningful-documentation

States its input, its plan and its refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Overlapping minimum-jerk sit and roll-back profiles over one pose function, the root height solved each posture by the floor rest and the root's travel by the pose's own ankles and hips, so the feet and then the seat stay in place on any body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fits the body and reads the blow's heading once, then evaluates each posture in closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative lying time throws; the knee and the lying arm are solved on the body's shapes instead of stated, and the recline and the hip's fold are named provisional values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Changing articulation retains its original fold and floor measurements. The prepared default lying hold reads a constant posture, without measuring the colliders again.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The floor reader retains its actual current FK/ROM input on changing shapes. With the default source and both folds complete, the native display reuses the unchanged down-event posture. Public authoring and directed reactions keep their original evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed fit and measurement data, one heading cleared on settle, and one owned down-event source release with the plan. FK/ROM loans stay in their own calls.
