# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.branches

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the stops, the extended branch's rest choice and the null.

## @evidence contracts/development/implementation.md#principled-implementation

The span is an exact sinusoid in the hinge angle, so its two arccos roots are the only hinge angles reaching the distance. Outside the span the extended branch is the sinusoid's maximum; when the rest angle's evaluated span equals the maximum's, every hinge angle between them is a maximum of the computed span, and the fit's own effort tie-break (least clinical articulation) chooses the rest angle among them. Without it a rest offset's rounding residue (2e-16 radian on the average man's arms) chose the bend's sign, which mirrored bones read opposite, so one arm stood straight at its range's edge and the other bent by the residue.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sinusoid, its roots, then the range.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The degeneracy thresholds are the engine's shared length scale.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.pose

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the turns and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel about the root-to-effector line is an exact null space of the effector's position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hinge, the line and the aim once, then the swivel per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Mid direction/aim and the lazy swivel-axis magnitude/norm are read once for a branch; each swivel retains its actual half-angle sine/cosine and original quaternion product.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares aimRotation and Quaternion.prepareAxisAngle's actual fixed-line arithmetic, with no prior angle or rotation result reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned branch closure owns its mid rotation, line, aim and bounded lazy axis reader until caller release, with no target history or handles.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.IPreparedTarget

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.IHarmonic

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines borrowed immutable source scope, lazy original-use geometry, independent target/range scope and caller release.

## @evidence contracts/development/implementation.md#principled-implementation

The hinge-span sinusoid depends only on source offsets/rest/axis, and the lowered goal depends only on source root and target; their unchanged completed arithmetic can serve both bend branches and all target swivel probes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct and prepared entries share branchStops, geometry, aimed and poseBranch, keeping the exact hinge law with one owner and leaving all search/ROM policy to callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps root/segment/hinge/span degeneracy thresholds, root order, range wrapping, shortfall formula and actual branch/quaternion formulas; no reached-point proxy or cached answer replaces a demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

One constant source sinusoid/inverse preparation serves all targets, and one constant lowered goal serves each target's branches. Every requested root, branch aim and swivel still runs; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only source-fixed scalars/vectors and a target's unchanged local goal are shared. Each target owns its own point/range and outputs, with no seed, score, clamp or user callback cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One source owns a boolean, optional fixed geometry and inverse frame; each target owns one borrowed chain request and optional goal until caller release, with no growing collection, handles or tasks.

# src/kinematics/hingedArmSwivel.ts#hingedArmSwivel.read

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and its range.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of `pose`: the aim removed, the rest is a turn about the line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The aim, the remainder, its angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `pose`'s aim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
