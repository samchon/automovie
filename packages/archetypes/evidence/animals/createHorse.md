# src/animals/createHorse.ts#createHorse

## @evidence contracts/development/implementation.md#principled-implementation

The shared equid builder (`AutoMovieArchetypeEquine.equid`) on the horse's profile, laying the shared body (`AutoMovieArchetypeQuadrupedBody.lay`) from the horse's proportions: segment lengths as fractions of withers height from Kubo et al. 1992 and Matsuura et al. 2008, and segment mass shares from Kubo et al. 1992, Table 5, stated per part so the mass properties follow the measured distribution; the tack is placed on the rig's landmarks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `AutoMovieArchetypeEquine.equid` on `PROFILE`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body's simplifications are `AutoMovieArchetypeQuadrupedBody.lay`'s and the tack's estimates `EquineSaddle`'s, `EquineHarness`'s, `EquinePack`'s, `EquineSideSaddle`'s and `EquineSurcingle`'s, stated there; `EquineTack` lays the selected tack.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twenty-one bones, the withers and a few tens of tack parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeEquine.equid`, which the pony shares; each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the horse stands, that its parts are the shared quadruped's bones, how it is posed, where the body ends and where each tack's contacts are.
