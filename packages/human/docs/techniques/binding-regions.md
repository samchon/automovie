# Binding and neutral regions

The binding model reads a person's bind skeleton, soft-tissue envelope and joint ranges. The anatomical neutral places the bone chain before the binding weights are read.

## Fixed inputs

`AutoMovieHumanBindingInputs.derive(calibration, scale)` gathers the bind skeleton and segment girths, skin rings, anatomical neutral, joint turn limits, crotch height and lip contact line. The input is `IAutoMovieHumanBindingInputs.IInputs`. Binding weights depend on a point and these observations, so tests can supply a made skeleton and its own skin rings. The source defines ring resolution through `AutoMovieHumanBindingInputs.PHASES` and `SAMPLE_PHASES`.

## Binding regions

Use the capsule and cut plane of the owning joint when reading the skin envelope. A hinge can share the same transition law with other hinges while its capsule and skin depth come from its own region. `AutoMovieHumanLimbCapsule` reads capsule height and depth. `AutoMovieHumanJointTransition` and `AutoMovieHumanSkinStep` read the transitions. `AutoMovieHumanCrotchBinding` reads the crotch height.

The trunk, jaw, girdle, axilla, hand and pelvis use regional geometry. At the shoulder, locate the arm's transition relative to the trunk and deltoid. At a knuckle, distinguish the digit's own skin from the shared web. At the lip seal, keep the contact line available to both lips.

## Neutral pieces

`AutoMovieHumanNeutral` places parents before children. The shoulders move far enough for the arm to clear the trunk and leg. The forearm turns the thumb forward. The thumb and fingers take their positions from clearance against adjacent skin. The hip adjusts until the thighs occupy their respective sides of the midline, and the ankle places the foot forward. These operations use the region's own skin rings and the parent-to-child turns from `AutoMovieHumanNeutralTurn`. The skeleton's public bind is `AutoMovieHumanCanonicalBind`.
