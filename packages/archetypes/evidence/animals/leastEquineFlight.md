# src/animals/leastEquineFlight.ts#leastEquineFlight

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the posture read, the two stages and the cases without a flight.

## @evidence contracts/development/implementation.md#principled-implementation

With push-off P and landing stance A, the centre of mass, and with the trunk level the root, rises Y(τ) = v (P/2 + τ) − g τ²/2 a time τ after takeoff, where the takeoff velocity v = g T (T + A) / (2T + P + A) grows with the flight T. A part whose lowest point is y and whose extent along the path is [z⁻, z⁺] overlaps an obstacle [a, b] of top h while the root is in [a − z⁺, b − z⁻] and needs Y ≥ R = h + clearance − y there. Y is concave in τ, so each window end after takeoff, reached τ = (e − s_T)/u after it at ground speed u, needs v ≥ (R + g τ²/2)/(P/2 + τ); the largest such v gives the level bound T as the positive root of g T² + (g A − 2v) T − v (P + A) = 0. The trunk turns nose-down at `EquinePitch.TURN` about the centre, level at the flight's middle, which raises a point d ahead and e above the centre by e (cos φ − 1) + d sin φ; 40 halvings between the unheld flight and the level bound find the least flight whose parts clear at each window's ends and middle. A window may begin in the push-off, where the centre has risen v (P + τ)² / (2P) and the trunk turned up by the takeoff angle times ((P + τ)/P)², a lower bound of its Hermite turn. A gap (a ditch) is crossed when the landing fore, read where the unheld ride lands it and moved on by the shift's and the hold's distance, lands past its far edge by the clearance. A shift moves the takeoff and every later event at the same ground speed; the push-off and landing stance keep their seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the contacts and windows, invert the level bound once, then halve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate whose body is over an obstacle before the push-off, or that lands past the leg, is discarded, never adjusted; a part over it during the push-off must clear it there too.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P·O) for P parts and O obstacles, times 40 halvings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The extents reuse the exact primitive floor reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.
