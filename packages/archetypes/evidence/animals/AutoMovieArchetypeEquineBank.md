# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.ITail

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

The end that hangs lowest and the bar's radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `tail`, read by `admit`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.ISlide

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and source.

## @evidence contracts/development/design.md#principled-representation

The face's friction with its source and the two blends in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `EquineFootwork.Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default friction: the face's author states it.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

The leg's film interval and the two blends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `admit`, read by `sit` and `goal`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The face's grade is the leg's own rise over its length; a loaded hoof slides once that tangent exceeds the friction coefficient. The sit begins once the hindquarters are REAR hind-hoof distances down the face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leg shape, face, run-out, blends, then the window.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A face outside the technique's bounds is refused, never flattened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two plan reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course plan's own leg span and clock.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one window.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.share

## @evidence contracts/development/common.md#meaningful-documentation

States the range and the blends.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum jerk in, held, minimum jerk out, so the pitch and the hooves change smoothly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One window lookup and one blend.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few windows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.pitch

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and sign.

## @evidence contracts/development/implementation.md#principled-implementation

The window's own sit, bounded by its tail, by the sit's share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few windows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.tail

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

The bar's two axis ends from its transform and length; the lower one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and two ends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing tail refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, once per ride.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one record.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, units and when the gait's goal is kept.

## @evidence contracts/development/implementation.md#principled-implementation

A hoof fixed in the body's frame moves with the body, which descends the face; the face's own landing at the hoof's world point gives its support plane and turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Blend the model position, land it on the face, express the plane in model space.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hoof is laid on the authored face, never at a nominal floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

One landing query per sliding hoof.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The footing's own landing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.

# src/animals/AutoMovieArchetypeEquineBank.ts#AutoMovieArchetypeEquineBank.step

## @evidence contracts/development/common.md#meaningful-documentation

States what changes and when.

## @evidence contracts/development/implementation.md#principled-implementation

The gait keeps the footfalls and their world footholds; only the swing's clearance and fold grow with the sit's share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two scalings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A standing hoof, lift zero, is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `share`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.
