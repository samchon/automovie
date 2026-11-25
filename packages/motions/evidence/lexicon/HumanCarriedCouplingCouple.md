# src/lexicon/HumanCarriedCouplingCouple.ts#HumanCarriedCouplingCouple.IContacts

## @evidence contracts/development/common.md#meaningful-documentation

Names the role and grip data read by the solve.

## @evidence contracts/development/design.md#principled-representation

Each supported carry supplies a default pair of grips and may provide ordered nearer alternatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reads just the meeting's roles and grip tables; `HumanCarriedCoupling` owns their values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing carry and region vocabularies with no per-body overrides.

# src/lexicon/HumanCarriedCouplingCouple.ts#HumanCarriedCouplingCouple.couple

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frame of the result and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The key pose places the borne resting region on the bearer's at the bearer's fitted stance and turns it about that point to the row's hold places, a lone bearer's stance and the borne legs changed least so the arms reach (`HumanCarriedCouplingFit.fit`) by the described grip or, where it misses, the first nearer one that reaches, each tested for feasibility in the carry's order (`AutoMovieMotionHumanTarget.feasible`, Miller and Allen 2004), and the record keeps both so the bearer takes that stance and the borne body those legs; each contact is read on both key bodies; the bearing shares are the least-norm solution of the three equilibrium equations (the shares sum to one and their centre lies under the borne centre) with none a pull; the capacity is the moment-balance bound of `HumanLoad.lean`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Key pose, contacts, centre, shares, capacity, record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A contact the least-norm solution would have pull the borne body down, which a resting contact cannot, bears nothing and the rest are solved again in balance; collinear bearing contacts share by the lever rule along their line (`HumanCarriedCouplingLoad.shares`).

## @evidence contracts/development/implementation.md#efficient-algorithms

One mass model and load-share solve per meeting. A nearer grip requires another stance fit only where every earlier grip missed; a second helper checks one reach gap per held region tried.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The contact and mass calculations read the exact bearing stance and borne key bones already resolved for the successful reach check. The region places and the centre use the engine's surface resolution and mass model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function; the record keeps no body or bone.
