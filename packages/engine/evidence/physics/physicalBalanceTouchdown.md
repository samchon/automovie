# src/physics/physicalBalanceTouchdown.ts#physicalBalanceTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

States when a swing foot lands, touches down early or fails, how a diagonal pair's feet land, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

Landing is the contact event (Coros, Beaudoin and van de Panne 2010, Section 3.1; Yin, Loken and van de Panne 2007, Section 3.1), counted after the minimum phase (Stephens 2011, Figure 4.6); an early touchdown is a cleared, descending foot the floor carries on two substeps (`physicalStanceBalance.touchdown`). A landed foot is seated at once with zero error where it stands and its share ramps in (Feng et al. 2013, Section II-E; Herzog et al. 2016, Section 5.3). The pair's partner is taken first so the swing's landing can leave it the swing (Chen et al. 2022, Section 2.1).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the pair's partner and the swing, each with its own clearance and touchdown record, then the landing or the failure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The minimum phase is a stated constant; the cast types the null-prototype copy of the offsets; non-null assertions read the swinging limb's own segment and the root target.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two feet per substep, each one support scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep's contacts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the landing record grows by one entry per landing, owned by the caller's state.
