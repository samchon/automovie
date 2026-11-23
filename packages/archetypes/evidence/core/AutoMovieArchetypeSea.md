# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A significant height in metres, a heading in degrees and a seed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.IComponent

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Frequency in hertz, wavenumber in radians a metre, amplitude in metres and phase in radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `of` and read by its readers and the swell test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.ISea

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Its components and heading with the two closed-form readers and their bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `of` and read by `motion`, `float` and the swell test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.ISea.elevation

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each component a cosine of its wavenumber times the distance along the heading less its angular frequency times the second, plus its phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum over the components.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the components.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.ISea.slope

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The elevation's gradient: each component's derivative along the heading, resolved on X and Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum over the components.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the components.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.of

## @evidence contracts/development/common.md#meaningful-documentation

States the measured spectrum, angular periodicity and scalar or derived-representation refusals.

## @evidence contracts/development/implementation.md#principled-implementation

WMO-No. 702: a fully developed sea of significant height H has the wind at 10 m u10 = (H / 0.0246) ^ 0.5 (eq. 1.30), the wind at 19.5 m 1.075 times that (the eq. 1.28 note), the peak frequency 0.877 g / (2 pi u19.5) (eq. 1.29), and the spectrum E(f) = 0.0081 g^2 (2 pi)^-4 f^-5 exp(-0.74 (g / (2 pi u19.5 f))^4) (eq. 1.28). Substituting r=f/peak before taking the amplitude avoids dimensional fifth powers and H squared; each amplitude is H times a dimensionless factor. Deep-water wavenumber is (2 pi f / sqrt(g)) squared. Only representable components and summed bounds are admitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit scalar inputs, form the peak-relative components and their bounds, then expose the two closed-form readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Long-crested: the directional spread no source here gives is left out; a calm sea of zero height has no components.

## @evidence contracts/development/implementation.md#efficient-algorithms `COMPONENTS` cosines per reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent sea.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sea holds its components for as long as its caller keeps it.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Heave in metres, pitch and roll in radians about the support's own axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `motion` and read by `float`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.motion

## @evidence contracts/development/common.md#meaningful-documentation

States the level-support premise, axes and order of the coupled rotations.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve the gradient along the level support's forward and left axes as f and l. Rx(-p)Rz(r) maps up to (-sin(r),cos(p)cos(r),-sin(p)cos(r)); matching the plane normal (-l,1,-f) gives p=atan(f) and r=atan2(l,hypot(1,f)), including oblique waves. Heave is the elevation under the root.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One elevation, one slope, two projections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hull follows the surface at its root, its own response to waves of its length's order left out, as `AutoMovieArchetypeSea` states.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two sums over the components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the sea's readers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.floated

## @evidence contracts/development/common.md#meaningful-documentation

Returns the root world frame from the sea, level course placement and film second.

## @evidence contracts/development/implementation.md#principled-implementation

Apply heave, pitch about local minus X and roll about local Z from the same motion reader as a floating ride.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sea motion and one transform.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

All headings use the same tangent-plane construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sea evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by floating whole rides and selected sockets.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSea.ts#AutoMovieArchetypeSea.float

## @evidence contracts/development/common.md#meaningful-documentation

States what changes and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

Each sample's placement is raised by the heave and turned by the pitch about its own `-X` and the roll about its own `+Z` (`motion`), the course state's placement replaced likewise, so what is carried reads the moving deck.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sampler wrapping the ride's.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond `motion`.

## @evidence contracts/development/implementation.md#efficient-algorithms

One motion per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the ride's own sampler.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the ride and the sea for as long as its caller keeps the result.
