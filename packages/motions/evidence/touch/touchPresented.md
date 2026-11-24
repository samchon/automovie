# src/touch/touchPresented.ts#touchPresented.carry

## @evidence contracts/development/common.md#meaningful-documentation

States entry ownership, presented goal, clock and explicit transport/hold/return span.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's existing carried primitive blends its entry angles toward the presented goal on the same start/ready/relax/end envelope as the touch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps presentation's primitive construction beside its presentation goal and delegates actual transport/fitting to the arm owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the exact original side, goal, angles, span and envelope without another solve or altered contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup plus the existing arm-angle scan; runtime work remains the carried primitive's actual planning/evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the already-planned presentation instead of rebuilding its goal or entry pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The resulting primitive keeps only its existing body, goal, clock and arm data for the plan lifetime; this wrapper adds no cache or resource.

# src/touch/touchPresented.ts#touchPresented.IPresented

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and its frame.

## @evidence contracts/development/design.md#principled-representation

The arm, the goal that holds it up and the body's bones with it there, which a region on that arm is read on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by the touch law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bones are resolved from the goal, never a second pose.

# src/touch/touchPresented.ts#touchPresented

## @evidence contracts/development/common.md#meaningful-documentation

States where the arm is held, on what it is read and when the result is null.

## @evidence contracts/development/implementation.md#principled-implementation

A person scratching or patting their own forearm brings it up first; the place is the body's own midline, half way from the hips to the shoulders and a forearm ahead, so it scales with the body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The region's bone, the place, the goal, the bones with the arm there.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a region on the other arm presents it; every length is the body's measure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the effector's goal, the bend preset and the posture resolver.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One posture solve per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
