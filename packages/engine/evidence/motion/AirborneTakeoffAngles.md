# src/motion/AirborneTakeoffAngles.ts#AirborneTakeoffAngles

## @evidence contracts/development/implementation.md#principled-implementation

Reads the long axis of M to obtain theta and phi, then the lateral axis after undoing Rx(phi) Rz(theta) to obtain psi. Unit input orientations and the shooting solver's existing chart are the premises; chart singularity is retained. Companion unwrapped: The nearest principal branch follows continuity under the stated pi bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Form the relative orientation, read two long-axis angles, undo those two turns and read the lateral-axis twist. Companion unwrapped: Invert once, read the existing chart, accumulate the two cyclic angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves the existing arithmetic into one owner, retaining its asin clamp and atan2 branches without a new tolerance, normalization or alternative attitude chart. Companion unwrapped: Retains the original default-step observer without a new angle tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per orientation. A flight's repeated reads supply one precomputed reference inverse, and three fixed basis records replace four axis literals per read. No wall-time speedup is inferred from these source-level work and allocation removals. Companion unwrapped: Linear reads in flight duration over the original observation step.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The public single-angle wrapper and the flight's unwrapping loop share this calculation. The caller's unchanged inverse reference frame is reused across orientations; quaternion rotation and axis-angle construction only read the three private unit axes. Companion unwrapped: Both public and shooting paths share this unchanged branch calculation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Three fixed unit-axis records live with the module. All computed quaternion/vector temporaries are call-local; only three numeric angles escape, with no input mutation, computed-value cache, callback or handle. Companion unwrapped: Only current numeric angles survive each read; no history is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States the inverse-frame input, quaternion convention, chart factorization, radian outputs and principal branches.
