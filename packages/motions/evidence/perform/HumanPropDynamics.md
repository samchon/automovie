# src/perform/HumanPropDynamics.ts#HumanPropDynamics.hingeProp

## @evidence contracts/development/common.md#meaningful-documentation

States the starting and held states, authored input, track result and failures.

## @evidence contracts/development/implementation.md#principled-implementation

Integrate angular acceleration equal to torque divided by inertia on the track clock, from zero angle and speed in radians. Convert travel to degrees for the prop's named articulation and use engine admission at each knot and requested sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the drive, integrate once, and attach a reader using the established prop track scheduler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the provided torque and inertia, and rejects travel outside articulation admission. It preserves other tracks and uses no performer pose to drive the hinge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one affordance index and integrates for the duration at the fixed hinge step. Admission runs once per knot and requested sample and traverses only the selected articulation's coupling chain and its inverse tables.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All reads of the returned track share the one integrated trajectory and the prop's indexed affordances. Torque is sampled during planning.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The track retains the path knots and affordance index for its lifetime. It acquires no external resources.

# src/perform/HumanPropDynamics.ts#HumanPropDynamics.slideProp

## @evidence contracts/development/common.md#meaningful-documentation

States the source of mass and contact coefficients, film-clock boundaries, preserved orientation and how the returned prop plugs into normal performance placement.

## @evidence contracts/development/implementation.md#principled-implementation

The Coulomb trajectory gives displacement along a horizontal unit vector from the prop's original world translation. The engine's body admission validates the contact coefficients before planning.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the prop and direction, plan the slide once, and read its distance as a world offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown friction is refused. The supplied force is independent of the displayed performer, so reading the prop does not solve a pose or call its force provider.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning has the slide's integration cost. Each frame read selects one trajectory sample and translates three coordinates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the numerical slide and the normal moving-prop placement path; all readers of the returned prop share the planned trajectory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prop reader retains the trajectory, starting frame and direction for the prop's lifetime. It opens no handles or processes.
