# src/scene/renderFadeToBlackFrame.ts#renderFadeToBlackFrame

## @evidence contracts/development/implementation.md#principled-implementation

Admits finite weight inside0..1 before effects, acquires/resizes the actual renderer-keyed fade compositor and renders the original source over opaque black with alpha1-weight, or with `transparent` toward a fully transparent pixel, the compositor's associated-alpha fade (Porter and Duff 1984), which lowers alpha and keeps the straight colour.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lifetime dispatcher leaves source tone/exposure and destination/state ownership with the existing callback/compositor owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No weight clamp or assumed device precision invents a successful frame; transparent premultiplied canvas output is presentation and a failed terminal compositor retains its original refusal.

## @evidence contracts/development/common.md#meaningful-documentation

Documents byte-domain fade toward black or toward transparency, source-local tone, destination restoration, opaque rounding/endpoint bound and straight transparent delivery through an unassociated target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dispatch/size lookup is fixed while original source draw/copy and per-pixel composition dominate; unchanged extents reuse live storage and changed extents delegate retirement to the compositor.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One actual WeakMap owner per renderer reuses equivalent live copy extent; a requested source frame still executes its original callback and failed owner state cannot be silently replaced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The renderer owner retains three potential copy extents plus compositor resources until successful disposal; failed resize/dispose remains terminal with uncertain old extent and no new draw or native retry.
