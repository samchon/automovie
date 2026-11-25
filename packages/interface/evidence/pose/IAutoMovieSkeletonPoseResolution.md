# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.IJoints

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieSkeletonPoseResolution.IJoints: Clinical flexion, abduction and twist per bone, degrees or null, in their tuple order.

## @evidence contracts/development/design.md#principled-representation

One named type over the canonical AutoMovieHumanoidBone, IAutoMovieJointPose contracts, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.ITupleRead

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieSkeletonPoseResolution.ITupleRead: Root construction after tuple staging, before the ordered numerical admission.

## @evidence contracts/development/design.md#principled-representation

One named type over the canonical IAutoMoviePose, IAutoMoviePoseResolution, AutoMovieHumanoidBone, IAutoMovieResolvedBone contracts, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.ITupleReader

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieSkeletonPoseResolution.ITupleReader: Snapshot all current authored entries and scalars, without constructing intermediate joint records.

## @evidence contracts/development/design.md#principled-representation

One named type, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieSkeletonPoseResolution contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.IOverlayReader

## @evidence contracts/development/common.md#meaningful-documentation

States that each read applies complete joint edits to the fixed admitted source and returns fresh frames.

## @evidence contracts/development/design.md#principled-representation

Two reads of one fixed source: a name map and a parent-first list.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.preparePose` returns it for baseline-plus-edit queries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No source record or resolved flag is presumed valid; a source edit needs a new overlay.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States that reading admits nothing again and returns fresh frames.

## @evidence contracts/development/design.md#principled-representation

One read of the admitted articulations and root, not of the records.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.read` produces it and `IBoneDemand.read` consumes it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A later edit of the pose needs a new reading; none is inferred.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.IBoneDemand

## @evidence contracts/development/common.md#meaningful-documentation

States the three reads of the captured bones and what each admits.

## @evidence contracts/development/design.md#principled-representation

The demand fixes reachable output membership and order once; every read admits its own pose or reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IRig.prepareBones` produces it for attachment, foot planting and re-keying.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numeric indices and state stay private; a reading of another rig is refused.

# src/pose/IAutoMovieSkeletonPoseResolution.ts#IAutoMovieSkeletonPoseResolution.IRig

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its admission, its optional demand or lent operation and its fresh result.

## @evidence contracts/development/design.md#principled-representation

One rig answers complete poses, fixed-source edits, staged tuples, demanded bones and single joints, plus the merged raw axes its inverse kinematics reuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareSkeletonPoseResolution` produces it; staging, attachment, planting, digit fits and the motions body read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No numeric index or state row is accepted or exposed; source and table edits need a new rig.
