# src/render/IAutoMovieRenderTargetAsset.ts#IAutoMovieRenderTargetAsset

## @evidence contracts/development/design.md#principled-representation

Target construction records the supplied asset path and SHA-256 digest, sorting and rejecting duplicate paths before binding the complete dependency population into target identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Path and byte digest are sufficient for portable dependency identity without retaining asset buffers or absolute project paths.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sealing checks a nonblank unique path and lowercase sha256: digest spelling; it does not canonicalize paths, read bytes or prove a complete dependency closure. The acquiring caller supplies canonical paths and current byte-grounded facts, and shared asset records must remain unchanged while their sealed digest is reused.

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical project-relative addressing and exact consumed-byte SHA-256 identity.
