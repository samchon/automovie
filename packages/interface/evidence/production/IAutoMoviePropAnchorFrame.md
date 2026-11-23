# src/production/IAutoMoviePropAnchorFrame.ts#IAutoMoviePropAnchorFrame.IProps

## @evidence contracts/development/design.md#principled-representation

Targets select prop-local affordance frames or building rest frames, returned in world metres with decomposed rotation/scale. Operating states are intentionally absent from this rest-frame query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

propAnchorFrame consumes only the target and relevant environment/prop/set registries; validatePropPlacements owns duplicate-id and placement admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional props/set are empty registries when omitted, making prop-affordance targets unresolved. A space has no frame; absent/cyclic references return null rather than an invented transform.

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed placement registries used to resolve a relation's rest-world anchor. Targets select prop-local affordance frames or building rest frames, returned in world metres with decomposed rotation/scale. Operating states are intentionally absent from this rest-frame query.
