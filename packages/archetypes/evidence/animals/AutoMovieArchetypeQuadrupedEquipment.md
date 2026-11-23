# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.ISphere

## @evidence contracts/development/common.md#meaningful-documentation

Names the emitted part identity, centre and positive primitive sphere radius, distinct from the ordinary rig envelope.

## @evidence contracts/development/design.md#principled-representation

The same producer record supplies sphere emission and physical equipment admission; this is geometry rather than a species-specific fit proxy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Represents the live additional spherical body solid consumed by shared equipment support and collision checks; ordinary rig geometry keeps its existing owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No guessed anatomical radius, renderer-only obstacle or hardcoded species clearance enters the contract.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes this owner's three hooks from the existing lead contact.

## @evidence contracts/development/design.md#principled-representation

Closed identities distinguish left/right pack loads and the yoke's hitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owns the single non-equid contact vocabulary imported by the cohort producer; its lead geometry remains with AutoMovieArchetypeQuadrupedLead.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown or free-text attachment identities cannot enter the builder through this contract.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.IHook

## @evidence contracts/development/common.md#meaningful-documentation

Defines tube radius and the clear opening/depth that the physical bars leave around their bearing point.

## @evidence contracts/development/design.md#principled-representation

Three independent positive lengths define the coarse U; its lower inside surface has outward normal +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same hook construction serves hitch and both pack loads; no separate contact-only geometry is introduced.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These are authored dimensions rather than a claimed rated commercial fitting; a point-only hook cannot replace the real bearing bars.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Every member names a physical metre length or clearance and the neck/trunk limit that admits it; pack width is explicitly vertical pad width.

## @evidence contracts/development/design.md#principled-representation

An absent assembly adds nothing; a present one requires its complete geometry and hook. Clearances are nonnegative and other dimensions positive, checked before any builder mutation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two requested equipment assemblies are represented. Lead, total mass, material coefficients and species anatomy stay with their current owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No dimension is guessed from a species name, no partial hook can be written and no manufacturer or safe-load promise is encoded.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.IYoke

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member's unit, the neck-axis reference of its placement and the limits that admit it.

## @evidence contracts/development/design.md#principled-representation

Positive lengths in metres, a nonnegative clearance and the shared hook record; the fit to the neck and the hook radius limit are checked at runtime before any builder mutation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by this namespace's yoke builder and by QuadrupedEquipmentBearing's yoke rail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required, so a present yoke is complete; no dimension defaults from a species.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.IPack

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member's unit, the pad's vertical width and the fit each member must meet.

## @evidence contracts/development/design.md#principled-representation

Positive lengths in metres, a nonnegative clearance and the shared hook record; the fits to the trunk, pad and ground are checked at runtime before any builder mutation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by this namespace's pack builder and by QuadrupedEquipmentBearing's pack rails; both load hooks share one hook record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required, so a present pack is complete; no dimension defaults from a species.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.lay

## @evidence contracts/development/common.md#meaningful-documentation

Defines assembly admission, no-op absence, rest-frame ownership, geometry/contact equivalence, all units and failure behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Plan the clear frame against the neck axis and circular barrel, then connect it to tangent body-bearing rails using the same body boundaries and frame endpoints. Additional spheres raise connected pack bridges; every rod/box retains authored clearance from those additional solids. Bearing rails touch their declared neck/trunk surface. U-hook contacts remain on the real bearing bar with outward normal +Y.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit and plan both assemblies completely, then append their real primitives and contact records; one hook planner owns all three sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No guessed equipment size, floating contact, copied horse rig, patched builder, hidden mass share or contact coefficient is used. An invalid second assembly leaves no first assembly partially appended. A brace of exactly zero length is omitted because the crossbar already joins the rail there.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed assembly sizes require O(S) planning and copied-sphere storage for S additional body spheres, with O(1) equipment records. Append cost includes the builder's existing O(P) id scan per fixed part for P already-built parts; no fitting or mesh search occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One planned bearing point supplies each hook and its contact; both pack sides share their authored dimensions and the same hook owner. No species branch or duplicate lead implementation exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary plan owns fixed equipment records and O(S) independent sphere copies, released after appending. The builder owns emitted data; no producer sphere input, query, cache, process or external handle is retained.

# src/animals/AutoMovieArchetypeQuadrupedEquipment.ts#AutoMovieArchetypeQuadrupedEquipment.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines non-emitting rig admission, whole assembly inputs and the independent builder-emission boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Admit complete equipment against the rig and copied additional spheres before emission. Connected pack bridges use conservative sphere-top clearance. All cylinders/boxes retain authored clearance from additional spheres, while visible bearing rails touch only their declared neck/trunk course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Create one plan, populate requested assemblies through their existing owners and return that same admitted plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No probe builder, partial emitted model, guessed source dimensions or repeated random construction establishes eligibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two fixed assemblies require O(S) work and sphere-copy storage for S additional spheres, plus fixed equipment records. Repeating preflight for K candidate cohorts costs O(KS); no full model or mesh is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordinary lay operation and whole-cohort preflight share these exact geometry/admission routines; the selected prepared plan is emitted without replanning.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fixed primitive/contact records and O(S) copied spheres until releasing the plan. No builder, producer sphere record, input model, cache or external handle is retained.
