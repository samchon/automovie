# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Tack

## @evidence contracts/development/common.md#meaningful-documentation

Lists each tack and what it carries.

## @evidence contracts/development/design.md#principled-representation

A closed union, so an unknown tack fails the type check; `equid` refuses one at run time with `TACKS`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IParams.tack`, `equid`, `EquineTack` and each profile's names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No free-text tack.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Alternative

## @evidence contracts/development/common.md#meaningful-documentation

Names the alternative supports a profile may leave unnamed.

## @evidence contracts/development/design.md#principled-representation

A closed subset of `Tack`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `Unnamed`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second list of supports: it is a subset of the tack union.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Unnamed

## @evidence contracts/development/common.md#meaningful-documentation

Names the tacks a profile may leave unnamed.

## @evidence contracts/development/design.md#principled-representation

The union of `bare` and `Alternative`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `Named` and `Names`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Named

## @evidence contracts/development/common.md#meaningful-documentation

States that every profile names these tacks.

## @evidence contracts/development/design.md#principled-representation

The complement of `Unnamed` within `Tack`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `Names`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Names

## @evidence contracts/development/common.md#meaningful-documentation

States which names are required and which optional.

## @evidence contracts/development/design.md#principled-representation

A record of required and optional names by tack, so a profile cannot omit a named tack.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IProfile.names` and by `equid` for the model's name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unnamed tack falls back to the producer's name, never to another tack's.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Breed

## @evidence contracts/development/common.md#meaningful-documentation

Lists the horse cohorts with their own profile.

## @evidence contracts/development/design.md#principled-representation

A closed union of the warmblood default, the Icelandic horse and the ambling breeds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `createHorse.IParams.breed`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A pony's breeds stay `createPony.Breed`: read figures, not a profile change.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Lists each contact and the tack that offers it.

## @evidence contracts/development/design.md#principled-representation

A closed union, so a misspelt contact fails the type check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The contacts every equid producer's model offers; `EquineTack` lays them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A tack lacks the ids of the others; no contact is offered without its part.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States each dimension's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A closed union keyed by `UNITS`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by every equid producer's draw session and model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No dimension without a unit.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Derived

## @evidence contracts/development/common.md#meaningful-documentation

Names the dimensions that are not drawn from a band.

## @evidence contracts/development/design.md#principled-representation

A closed subset of `Dimension`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `Free`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Free

## @evidence contracts/development/common.md#meaningful-documentation

States that these dimensions are drawn from a band.

## @evidence contracts/development/design.md#principled-representation

The complement of `Derived` within `Dimension`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IParams`, the profiles' bands and `equid`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States each parameter and its default.

## @evidence contracts/development/design.md#principled-representation

Optional tack, seat, rein and id, and any free dimension fixed inside its band, which the draw session checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `equid` and extended by each equid producer's params.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No breed here: only the horse has breeds that change the profile.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.IRig

## @evidence contracts/development/common.md#meaningful-documentation

States each landmark's meaning and frame.

## @evidence contracts/development/design.md#principled-representation

Points in the model's space, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the tack (`EquineTack`), the harness and the carts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.rig

## @evidence contracts/development/common.md#meaningful-documentation

States the rig, its inputs and the horse default.

## @evidence contracts/development/implementation.md#principled-implementation

The shared quadruped rig, with the point of draft where the shoulder joint's height meets the barrel's circle and the hitch on the trunk's axis `SADDLE` behind the shoulder joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared rig plus two landmarks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SADDLE` is a named estimate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one rig.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.equid

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, what the mass includes and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Draw the free dimensions in the profile's bands, derive the girth and the mass, pick the seat and reins among their read sizes, lay the body (`AutoMovieArchetypeQuadrupedBody.lay`) and the tack (`EquineTack`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw, derive, lay the body, lay the tack, build.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body's simplifications are `AutoMovieArchetypeQuadrupedBody.lay`'s and the tack's estimates are stated by each tack's owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twenty-one bones, the withers and a few tens of tack parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every equid producer calls it; each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

States each member's role and unit.

## @evidence contracts/development/design.md#principled-representation

A name per tack, the bands of the free dimensions, optional read figures and mass, a girth law and the body's proportions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `equid` reads; each producer supplies its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A read mass replaces the mass law instead of being blended with it.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.IProfile.girth

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and their units.

## @evidence contracts/development/implementation.md#principled-implementation

Each profile supplies its law: the horse's keeps the warmbloods' girth-to-height proportion (`JENSEN`), a read breed or cohort keeps its own measured proportion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function per profile, called once per model by `equid`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted curve: each law is a stated proportion.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.IMeans

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

Three means in metres and kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The figures `mass` anchors on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No relation between the means is implied.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.mass

## @evidence contracts/development/common.md#meaningful-documentation

States the law, its source, its anchor and the units.

## @evidence contracts/development/implementation.md#principled-implementation

Carroll and Huntington's girth-squared-times-length law with the length isometric to the withers height, anchored on Jensen et al.'s means.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fitted coefficient: the only constants are the cited means.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Seat

## @evidence contracts/development/common.md#meaningful-documentation

States the sizes and where they are read.

## @evidence contracts/development/design.md#principled-representation

A closed union of read sizes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IParams.seat` and `SEATS`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No seat between the read sizes.

# src/animals/AutoMovieArchetypeEquine.ts#AutoMovieArchetypeEquine.Rein

## @evidence contracts/development/common.md#meaningful-documentation

States the widths and where they are read.

## @evidence contracts/development/design.md#principled-representation

A closed union of read widths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IParams.rein` and `REINS`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No rein between the read widths.
