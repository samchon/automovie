# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.Parent

## @evidence contracts/development/common.md#meaningful-documentation

Names the two existing axial parent parts.

## @evidence contracts/development/design.md#principled-representation

A closed union retains the quadruped hierarchy's fore/hind ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by capsule definitions and fixed attachment metadata.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No free-text or humanoid substitute selects a parent.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.ICapsule

## @evidence contracts/development/common.md#meaningful-documentation

Defines cap centres rather than total capsule extrema, with the common positive radius in metres.

## @evidence contracts/development/design.md#principled-representation

The same finite segment and radius define the constructed torso rod and its closed solid for connection admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by neutral geometry and the admitted parent reader; no mesh or material data are repeated.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A radius is not expanded to cover a detached joint, and unknown geometry cannot become a zero-height bar.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.IParent

## @evidence contracts/development/common.md#meaningful-documentation

The reader supplies cap centres/radius and the finite unit rigid part frame, not a joint-origin FK frame.

## @evidence contracts/development/design.md#principled-representation

Geometry and its model transform together define the owning parent coordinate system.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds only the frame needed to express the attachment in the parent's local coordinates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Frames originate from admitted source parts and never from a species proportion table or an inferred humanoid bone.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.IAttachment

## @evidence contracts/development/common.md#meaningful-documentation

Defines source model-space point and primitive-centre parent-local point in metres; these are distinct from the skeleton's upper-joint origin.

## @evidence contracts/development/design.md#principled-representation

The closed parent identity and one rigidly transformed point represent the same fixed skeletal connection in both useful spaces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies the ride and independent observers only the fixed connection they need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No allowed travel, inferred scapular translation, tolerance-sized gap or mutable producer record accompanies the connection.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.solids

## @evidence contracts/development/common.md#meaningful-documentation

Defines the trunk/rump cap centres from the same rest landmarks and shared barrel radius.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk spans its declared half-length at back-minus-radius; the rump shares its rear cap and ends at the declared quarters centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the shared rear endpoint once and return the two named capsule records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No attachment fit changes these body dimensions or adds an invisible connection primitive.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant coordinate work and two small records, outside motion sampling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Layout and neutral conformation consume this same owned definition instead of separate torso formulas.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent scalar points and retains no rig or external resource.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.conform

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact flat-cylinder grounding, explicit neutral connection, parent section, preserved source lengths/footprint/distal carriage and refusal for incompatible geometry; terminalRadius is the same metre radius used by the body layout's fourth rods.

## @evidence contracts/development/implementation.md#principled-implementation

The terminal cylinder requires distal endpoint Y=r*hypot(axisX,axisZ)+height*max(0,axisY), including an upward terminal's axial extent. Ground the initial chain without moving the body; a capsule's fixed-X section and the existing exact proximal fit then connect any outside root.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Apply the same pure connection rule to the two fore and two hind chains, without a breed or speed branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Body measurements, parent solids, four lengths, footprint and distal carriage stay fixed; only the explicitly constructed terminal-centre height follows its real sole geometry. No whole-model rise changes measured withers height and no requested motion goal is clamped; impossible neutral reach refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four fixed-size geometric projections and at most four closed-form two-circle fits take O(1) time and storage during construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the common torso definitions and QuadrupedRestLimb's admitted exact length-preserving fit, not a second IK implementation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every returned chain/point is independently owned; no caller array, completed pose cache or handle is retained.

# src/animals/QuadrupedAttachments.ts#QuadrupedAttachments.read

## @evidence contracts/development/common.md#meaningful-documentation

Consumes source chains and already admitted parent capsules, rejects disconnected roots and states the primitive-centre coordinate convention.

## @evidence contracts/development/implementation.md#principled-implementation

Compare each proximal point to its closed capsule, then invert that parent's unit rigid frame to record the same point locally.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four bindings use one physical membership and coordinate conversion owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reading never repairs source geometry or moves roots. Only scale-derived binary64 roundoff admits a calculated boundary; a real gap refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four constant-size point/segment distances and rigid conversions, once per prepared animal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parent axes and frames prepared by AutoMovieArchetypeQuadrupedJoints serve both membership and parent-local coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned points are independent scalar copies and retain no part, geometry buffer or mutable source array.
