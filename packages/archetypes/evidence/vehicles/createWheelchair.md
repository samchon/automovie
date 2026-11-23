# src/vehicles/createWheelchair.ts#createWheelchair

## @evidence contracts/development/implementation.md#principled-implementation

Boxes and rods from the maker's figures: the seat at its front-edge height and tilted back by the seat plane angle, the back at the backrest angle from upright, the armrests their height above the seat, the footplates their distance below it with their front edge at the overall length ahead of the rear wheels' back, the rear wheels at the overall width, the casters under the seat's front and the push handles at the overall height; grips state no aperture, so a grasp reads the drawn colliders; each armrest runs the seat's depth over the seat's side, each push handle's grip is on its top where it leaves the back, at the overall height, the handle's rearward length drawn as a construction estimate, and the two footplates share the seat's width, their front edge at the overall length; part thicknesses are construction estimates no act reads; and the handrim is not drawn (no ring primitive), so a hand on it closes on the wheel; the rim spins about the axle with the wheel's knob.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the read model whole (`MODELS`), draw its row's ranges, then the seat and back, the arms and handles, the footplates, and the wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The handrim's radius is the 540 mm rim's, read in search results only and marked provisional; the casters do not swivel.

## @evidence contracts/development/implementation.md#efficient-algorithms

About twenty parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the chair's origin and front, the recognising parts, what turns, and which act has no law.
