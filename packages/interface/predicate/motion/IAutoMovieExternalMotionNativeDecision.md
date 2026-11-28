# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies an inspected take, the explicit source rig and the required node mapping. It states how the boundary compares mapped parents and rests and why the target and translation scale are omitted.

## @evidence contracts/development/design.md#principled-representation

The native mode fixes the execution rig to the supplied source rig. Optional never fields exclude retarget target and scale from typed intermediates. Ingest checks the same option boundary and verifies that the explicit map covers each animated node.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decision reuses the skeleton and semantic mapping contracts. Ingest owns admission and receipt copies. Playback, destination resolution and retarget scaling belong to later consumers of the admitted handoff.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.mode

## @evidence contracts/development/common.md#meaningful-documentation

The type comment establishes source-rig replay. The native literal selects that behavior at adoption.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.take

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies a take by its inspected clip ID and shows the ID format used by inspection.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.sourceRig

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the non-blank ID, unique bones including hips, and exact parent and rest comparison for mapped bones.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.mapping

## @evidence contracts/development/common.md#meaningful-documentation

The comment requires an explicit nonempty map with an entry for each animated node.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.target

## @evidence contracts/development/common.md#meaningful-documentation

The comment states that native replay uses its source rig and leaves target identity absent.

# src/motion/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision.translationScale

## @evidence contracts/development/common.md#meaningful-documentation

The comment states that native replay leaves retarget translation scaling absent.
