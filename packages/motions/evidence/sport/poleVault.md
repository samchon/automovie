# src/sport/poleVault.ts#poleVault.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan, its sources and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The plant from the arm's reach and the pole's length. The swing is Linthorne 2000's flexible-pole model (`poleVaultSwing`), the vaulter a point mass at the top hand's grip, its stiffness the pole's rating (NFHS Rule 7-5-3: the vaulter's weight at or below it). The pole shows that swing's elastica on its hinged chain (`poleVaultBend`, Timoshenko and Gere 1961 §2.7; Bergou et al. 2008 §4.1), the body turned with the chord as the point mass's pole turns, its grip on the shown chain's chord so the tip stays planted, and the hands on the held link, the arms deflected back relative to the shoulders as Linthorne describes and as the multi-segment vaulters of Hubbard 1980 and Ekevad and Lundberg 1997 hang from the pole by the hands. The hinges turn the way that bows the pole away from the vaulter. The flight is ballistic from the grip's release state; the touchdown is bisected on the lowest shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pole, the take-off, the plant, the swing and its bend, the flight, the landing, the drives, then the posture by phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound refuses with its numbers, and a pole with no hinge is refused rather than vaulted rigid; the wrist goal is corrected by the solved end's height so the end is on the floor, and the pivot is the end where the solved hand actually puts it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four jump plans, one swing integration at 0.01 s with one elastica parameter per step, and the touchdown bisection; a swing reading is one interval's closed form and a hinge's travel two elastica slopes. Shoulder/grip FK request actual dependencies while wrist goals fit fully. One native floor demand/profile selection serves every actual bisection station; fixed flight COM/joints and scalar easing omit unused work. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses held prop, take-off, flight, mat and support owners. The unchanged run fixes requested launch components; every original aim call receives a fresh copy. One fixed take-off raw query supplies shoulder/raw root with local FK/projector loans. The entered grip/root displacement, the planting line and the holds (`walkPoleFrame`) prepare once; the corrected wrist height stays current. The swing and its bend prepare once and every reading reads them; one released raw supplies COM/checked flight preparation. Wrist trials retain real solves/grip demand; push/landing forward synchronous loans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns take-off, the swing's samples and the bend's parameters, mass model, the holds and the grip's path, raw take-off root and one released articulation/local COM. Initial raw posture/shoulder map and its local FK/projector end with their IIFE, leaving two owned vectors. Grip demand ends with construction; native floor reader/FK/projector end with the local touchdown operation, leaving one second. Borrowed query loans never enter the plan or output evidence.

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

States the model, its source, the monotone search and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The vault's own plant and its swing (`poleVaultSwing.integrate`, Linthorne 2000) from the grip at its plant height; bisection on a condition monotone in the grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition per grip, one bracket, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A run no grip serves is refused with the speed asked; nothing is padded.

## @evidence contracts/development/implementation.md#efficient-algorithms

The grip takes `SPLITS` halvings of the pole's length, each one swing integration at 0.01 s.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
