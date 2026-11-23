# src/weapons/buildFieldGun.ts#buildFieldGun

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and how the weights are shared.

## @evidence contracts/development/implementation.md#principled-implementation

The tube lies level with its axis on the trunnions' axis (Gibbon, p. 62: "In all our pieces, the axis of the trunnions is in the same plane with the axis of the piece"), the trunnions 43.1 in up and 0.5 in behind the axle, so its muzzle stands 5.91 in ahead of the wheels as p. 74 reads; the trail's underside runs from the top of the axle arm to its ground contact 74.4 in behind the wheels', and lies on the ground to its end 116.6 in behind their front; the elevation is a hinge on the trunnions' axis, and the elevating screw under the base ring rises and sinks with the ring's own path as the tube turns, its handle turning once for every pitch of travel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tube, the carriage, the wheels, then the affordances, the service contacts last, each placed from a read length: the primer the friction tube's 1.75 in out along the vent, the toggle the lanyard's 12 ft behind it, the handspike its read 53 in's `FIELD_GUN.ESTIMATES.handspike` share behind the trail.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tube is two rods at the base-ring's and the swell's diameters meeting at the trunnions, the cheeks and stock are boxes, a wheel is a disc of its tire's width with its spokes. The screw's translation follows a rotating ring reference point's height at a fixed longitudinal screw axis; the ring's breadth and the head's full contact geometry remain unread, so this is not a three-dimensional support-contact solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

About twenty parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
