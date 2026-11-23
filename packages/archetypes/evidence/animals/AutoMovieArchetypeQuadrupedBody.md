# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.Limb

## @evidence contracts/development/common.md#meaningful-documentation

States what it names.

## @evidence contracts/development/design.md#principled-representation

A closed union of the four limbs by side and end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the key of every limb table and of the rig's joints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.Bone

## @evidence contracts/development/common.md#meaningful-documentation

States each bone and what it includes.

## @evidence contracts/development/design.md#principled-representation

A closed union of the trunk, the head and tail and four bones a limb, as template literals over the limbs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the ids of the parts the body lays and the ride poses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No humanoid bone stands in for a quadruped's, the defect #2805 removed.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States each dimension's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

A closed union of the four dimensions every quadruped draws.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; what the rig and the ride read of any species.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.IBody

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Fractions of withers height, degrees from straight down and percentages of body mass, the forms the anatomical studies report.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; each species states its own, read by `rig` and `lay`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; every member is a proportion a species states with its source or as an estimate.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.IRig

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

Points in the model's space and lengths in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `rig`, read by the producers' tack and the ride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.rig

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Initial chains define body landmarks from declared lengths/directions without changing sourced dimensions. The common neutral construction then grounds the terminal cylinders by their support clearance and connects detached roots to the unchanged torso capsules with an exact length-preserving proximal fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Construct initial chains and body landmarks, then connect the neutral chains using the same capsule definitions the body layout emits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No species, speed or screenshot selects a correction. Parent solids, measured dimensions, all four lengths, footprints and distal carriage remain fixed; the terminal-centre height follows the real sole rather than a whole-model offset, and impossible connection refuses instead of stretching or hiding a motion-goal clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen initial links and at most four closed-form neutral proximal fits take O(1) time/space; no mesh search, iteration history or motion sampling occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Layout and conformation share the torso capsule definition, and neutral fitting reuses the existing exact four-bar owner while preserving already grounded and connected coordinates.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedBody.ts#AutoMovieArchetypeQuadrupedBody.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and what it reads.

## @evidence contracts/development/implementation.md#principled-implementation

Each bar joins the rig's endpoints. Known mass shares are normalized by their printed sum (Kubo's horse sums to 100.4); the torso's share is divided by drawn capsule volumes. With no segment study the shares remain absent and the existing builder uses solid volume under the authored total mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The trunk and hindquarters, withers, neck, shared head/pinna assembly, tail and limbs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scapula's and pelvis's mass remain in the source torso allocation; each shoulder blade's bar is massless. Optional explicitly sourced pinnae divide the unchanged whole-head share with the head capsule by solid volume; no biological ear density or mass fraction is invented. Mane and detailed hooves remain unmodelled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twenty-three bone bars, the withers and at most two prepared ear plates take constant construction work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared torso definition serves conformation/layout and AutoMovieArchetypeQuadrupedHead owns the complete capsule/pinna geometry and source-budget allocation without duplicate ear planning.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
