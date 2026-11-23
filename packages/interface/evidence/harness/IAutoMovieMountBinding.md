# src/harness/IAutoMovieMountBinding.ts#IAutoMovieMountBinding

## @evidence contracts/development/design.md#principled-representation

The baker composes parent translation/rotation with the sampled FK bone frame, using a previously baked parent path for chained couplings. It shares `attachTo`'s sampled fixed-joint model, safe advancing interval-count guard and caller-owned feasible memory/distinct-key-time premises; it does not solve continuous rigid-body contact or apply parent scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A parent id and a semantic bone are the whole binding; the rider is the staged actor that declares it, so the same record serves staging, the shot coupling and the beat-end state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No seat offset or per-mount correction is applied, so a rider whose origin is not its seat shows the mismatch, and a rig-less parent or absent bone is refused rather than coupled to the parent's root.

## @evidence contracts/development/common.md#meaningful-documentation

States where it is declared, every refusal and its owner, how and over what span the rider is baked, the `attachTo` override, how it carries to the next beat, and the absent events; members name the parent and bone requirements.
