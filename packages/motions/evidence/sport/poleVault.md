# src/sport/poleVault.ts#poleVault

## @evidence contracts/development/common.md#meaningful-documentation

States the figure, the pole, the three phases with their physics, the refusal, the first pass and the events.

## @evidence contracts/development/design.md#principled-representation

The jump's push-off, a pendulum table from the take-off's own centre and velocity, and a parabola; the hand on the pole is its held frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The name, the cancel and accept tables, the angles, the parameters and the plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pole's length is the prop's; speeds follow from the run.

# src/sport/poleVault.ts#poleVault.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The plant from the arm's reach and the pole's length; the swing from the kept angular momentum and the pendulum's energy; the flight ballistic; the touchdown bisected on the lowest shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pole, the take-off, the plant, the pendulum table, the flight, the landing, then the posture by phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound refuses with its numbers; the wrist goal is corrected by the solved end's height so the end is on the floor, and the pivot is the end where the solved hand actually puts it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four jump plans, STEPS stations and touchdown bisection remain. Station rates serve admission/trapezoids and monotone seconds use O(log STEPS) lookup. Shoulder/grip FK request actual dependencies while wrist goals fit fully. One native floor demand/profile selection serves every actual bisection station; fixed flight COM/joints and scalar easing omit unused work. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses held prop, take-off, flight, mat and support owners. The unchanged run fixes requested launch components; every original aim call receives a fresh copy. One fixed take-off raw query supplies shoulder/raw root with local FK/projector loans. The entered grip/root displacement, the planting line and the holds (`walkPoleFrame`) prepare once; the corrected wrist height stays current. Adjacent trapezoids share initial rate squared/endpoint rates; one released raw supplies COM/checked flight preparation. Wrist trials retain real solves/grip demand; push/landing forward synchronous loans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns take-off, pendulum table, mass model, the holds and the grip's path, raw take-off root and one released articulation/local COM. Initial raw posture/shoulder map and its local FK/projector end with their IIFE, leaving two owned vectors. Rate arrays and grip demand end with construction; native floor reader/FK/projector end with the local touchdown operation, leaving one second. Borrowed query loans never enter the plan or output evidence.

# src/sport/poleVault.ts#poleVault.plants

## @evidence contracts/development/common.md#meaningful-documentation

States what is planted and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The pole and its end are the parameters the plan reads; the lean is the plan's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The default end is the plan's default.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.

# src/sport/poleVault.ts#poleVault.grip

## @evidence contracts/development/common.md#meaningful-documentation

States the physics, the source of every body figure, the monotone search and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The vault's own plant and pendulum condition on a centre placed by the cited take-off measures; bisection on a condition monotone in the grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition per grip, one bracket, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A run no grip serves is refused with the speed asked; nothing is padded.

## @evidence contracts/development/implementation.md#efficient-algorithms `SPLITS` halvings of the pole's length, each a closed form.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
