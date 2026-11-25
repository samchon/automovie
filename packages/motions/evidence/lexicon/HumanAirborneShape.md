# src/lexicon/HumanAirborneShape.ts#HumanAirborneShape.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the layer and what it claims.

## @evidence contracts/development/implementation.md#principled-implementation

The shape's joints are set over the posture's; a claimed limb's held goal is moved to the end joint the resolver poses for those joints, before the whole-body turn the goals are stated under, bending toward the middle joint's side of the limb's line (or as the goal bent, for a limb straight to rounding), so the layer's weight carries the goal continuously; a claimed limb with no goal is posed by the joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The claimed limbs' bone sets are built once per layer; each application sets the joints, resolves the shaped posture once for the held limbs' chains and moves each held goal's point and bend there, every other field of the goal kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Claims only the table's limbs and keeps a held goal's rotation, contact, planting and attachment; the angles are the table's provisional ones.

## @evidence contracts/development/implementation.md#efficient-algorithms

With no claimed limb holding a goal, no resolution; otherwise one posture resolution limited to the held chains' three bones each and their ancestors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bone sets depend on the shape alone and are shared by every application; the caller's forward-kinematics reader and range-of-motion projector serve the resolution.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer holds one table entry, its claimed limbs and three bone sets of at most six names; each application's resolution ends with it.

# src/lexicon/HumanAirborneShape.ts#HumanAirborneShape.Assembly

## @evidence contracts/development/common.md#meaningful-documentation

Documents which assembly is received and when the receiver may use it.

## @evidence contracts/development/design.md#principled-representation

The callback receives the resolver's assembled pose and joint rotations in their existing frames. The native blend supplies it from the current evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanSegmentLayer uses this receiver to pass one live assembly to its leaf. The caller gives the receiver no independent pose inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback uses the resolver's assembly type without a widened payload or a validity flag.

# src/lexicon/HumanAirborneShape.ts#HumanAirborneShape.ShapeBlend

## @evidence contracts/development/common.md#meaningful-documentation

Documents the timebase, blend weight, reading context, output frame and optional assembly receiver.

## @evidence contracts/development/design.md#principled-representation

Reuses the authored posture, layer context and resolver assembly contracts. Callable provenance is checked at runtime by prepared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The airborne shape owns the callable. HumanSegmentLayer uses the four standard blend arguments and the optional receiver during its current evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The independent optional receiver does not change the input or result type and carries no fixture-specific branch.

# src/lexicon/HumanAirborneShape.ts#HumanAirborneShape.prepared

## @evidence contracts/development/common.md#meaningful-documentation

Specifies which native shape can lend its direct assembly and the ordinary fallback for foreign, wrapped or edited layers.

## @evidence contracts/development/implementation.md#principled-implementation

The constructor accepts only a shape name and creates its own blend. A private field establishes provenance and the current own data property must still name that exact function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private-field admission precedes one own-property comparison; foreign layers and proxies are never inspected.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A caller cannot register a callback, supply a readiness flag, recover a stored pose, or pass a copied native callback as another layer.

## @evidence contracts/development/implementation.md#efficient-algorithms

The constant-time identity test allows the next leaf to fit its actual new goals on the same projected joints, avoiding one direct assembly per accepted evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the exact factory blend can supply its actual authored posture and direct pose; the leaf verifies that same posture before the single fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner holds its own callable for its layer lifetime. The receiver and assembly remain on one displayed evaluation, with no global registry or history.
