# src/posture/HumanFlatThumb.ts#HumanFlatThumb.angles

## @evidence contracts/development/common.md#meaningful-documentation

States the measurement, its tables and values, the composition and its source equation, how the senses are read, that the whole measured frame is taken, the neutral of the two distal joints and the rig metacarpal's ISB frame the rotation is read from.

## @evidence contracts/development/implementation.md#principled-implementation

Cooney, Lucca, Chao and Linscheid 1981, J Bone Joint Surg 63-A:1371, Table III (extension) and Table I (the trapezium), composed by the ISB joint coordinate system on Cooney's axes (Wu et al. 2005, J Biomech 38:981, sections 4.3.4 and 4.4.1; Grood and Suntay 1983) as the Cardan sequence Wu et al. state it equals (section 1: the floating axis the second, rotated axis; section 2.1: first about a proximal axis, then about the moving frame's rotated axes), `Rz(flexion) Rx(abduction) Ry(rotation)`, the senses those of Cooney's descriptions. The whole measured frame is taken, its direction (39.7 degrees radial of the third metacarpal, 8.6 degrees palmar of the palm's plane, inside the 20 degrees Cooney's definition allows) and its roll. The rig metacarpal's own ISB frame (Wu et al. 2005, section 4.3.4: Y along the shaft, proximal; Z the next joint's flexion axis; X = Y x Z, volar; a left hand mirrored) is read from the rig's rest data: Y opposite the rest offset to the proximal phalanx, Z the rig's flexion axis of that joint (`HUMANOID_JOINT_AXES`) made perpendicular to Y. The joint's rotation carries that rest frame onto the measured one (`quaternionFromAutoMovieBasis` of the carried hand axes) and is read in the joint's chart (`decomposeJointRotation`). The metacarpophalangeal and interphalangeal joints are at the ISB neutral.
## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the flat thumb: the measured frame, the rig metacarpal's frame and the rotation between them in one function; the consumers read it in place of a clearance search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every angle is the study's; no tuned value, no search, no clearance bisection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three 3x3 products, one frame construction, one basis-to-quaternion conversion and one decomposition per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the body and side.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the angles and retains nothing.

# src/posture/HumanFlatThumb.ts#HumanFlatThumb.IJcs

## @evidence contracts/development/common.md#meaningful-documentation

States each angle's axis.

## @evidence contracts/development/design.md#principled-representation

A joint coordinate system's three angles in degrees, as Cooney tabulates them and the ISB composes them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the flat thumb; holds the two measured rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The study's three angles, named by the study's motions.

# src/posture/HumanFlatThumb.ts#HumanFlatThumb.TRAPEZIUM

## @evidence contracts/development/common.md#meaningful-documentation

States the table, the statistic and the unit.

# src/posture/HumanFlatThumb.ts#HumanFlatThumb.EXTENSION

## @evidence contracts/development/common.md#meaningful-documentation

States the table, the statistic and the unit.

# src/posture/HumanFlatThumb.ts#HumanFlatThumb.IThumb

## @evidence contracts/development/common.md#meaningful-documentation

States what it maps.

## @evidence contracts/development/design.md#principled-representation

Each thumb bone's clinical angles in degrees, the joints table's own shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three thumb joints a flat hand writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The posture's joint record, not a new shape.