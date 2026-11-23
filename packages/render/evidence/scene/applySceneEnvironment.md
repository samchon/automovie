# src/scene/applySceneEnvironment.ts#applySceneEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Applies admitted image lighting/background, intensity and degree-to-radian yaw through native scene fields; unsigned-byte texture storage selects the sRGB convention and other storage selects linear, relying on decoder agreement rather than proving image radiometry. The exclusive texture ownership helper validates/retire-converts before image assignment. Unresolved image uses the declared solid/null background and no image lighting.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns scene-field realization and delegates texture compatibility/conversion retirement to AutoMovieEnvironmentTextureOwnership; renderer tone/shadow policy stays with applyRendererEnvironment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses decoded texel representation rather than guessed file extension or fixture sky; null/unresolved image behavior is explicit, and no missing image is silently replaced with a successful stock environment.

## @evidence contracts/development/common.md#meaningful-documentation

Gives no-child scene attachment, image handoff exclusivity, actual decoding role, stable-input conversion reuse and resolved versus solid/transparent fallback semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs fixed-size scene/color/rotation assignment plus ownership helper validation/tuple comparison and any required conversion retirement; no scene-population or image-pixel scan is performed by this adapter.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stable texture/source/content-generation/sampling tuples reuse native conversion state; changed valid tuple is retired through the ownership helper, while scene scalar changes do not manufacture new decoded image data.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scene holds the supplied environment/background texture and the exclusive ownership registry tracks it; clearing scene fields does not retire that texture or remove its ownership record, so the host must invoke its supported release boundary. The adapter owns no worker or render loop.
