# src/actions/walkLeg.ts#walkLeg.prepareBehind

## @evidence contracts/development/common.md#meaningful-documentation

States fixed measured lengths, varying metre reach and radian result used by trailing and swing extension.

## @evidence contracts/development/implementation.md#principled-implementation

Uses behind's original capped reach and cosine law, retaining its one-nanometre denominator floor and signed cosine clamp before acos.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measured-length preparation supplies the actual scalar reader shared by raw behind, fixed-yaw trailing and prepared swinging-foot constraints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the same exponentiation, addition/subtraction and denominator grouping, reach cap and angle clamp; no queried angle or distance is replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation hoists the two length squares, leg span and fixed denominator factor; every actual reach retains its square, division, clamp and acos.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One unchanged measured body fixes those scalar prerequisites for the stance/swing reader; geometry edits require new preparation and every changing reach is evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns a closure over four scalar terms until its stance/swing releases it, without a body pose, distance, angle, time history or handle.

# src/actions/walkLeg.ts#walkLeg.prepareTrailing

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/yaw, varying world-space joints and trailing-positive angular result.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps trailing's original heading-plane hip-to-ankle angle minus behind's cosine-law knee angle, then the same degree conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed forward axis precedes the shared actual-joint reader; raw trailing delegates here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No reach clamp, degeneracy threshold, heading convention or arithmetic grouping changes; each actual hip and ankle is read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation avoids repeating heading trigonometry through the stance's original bounded trail-room search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A stance fixes body and pelvis yaw through all its trial hips/pitches; changing either requires a new reader, without caching a trial result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One stance-owned closure holds its body and private forward axis until released, without joint, angle or query history.

# src/actions/walkLeg.ts#walkLeg.prepareAnkleRange

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed body and heading, the hip/ankle/rotation inputs and the exact-heading check made on every rotation.

## @evidence contracts/development/implementation.md#principled-implementation

Decomposes the rotation by HumanFoot.headingPitch and clamps its pitch between the shank's lean less the plantar limit and the lean less the unloaded dorsal limit, each `ANKLE` inside, then rebuilds the rotation at the clamped pitch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measured-body/heading lean reader precedes the rotation reader; the constraint formula lives once in ankleRangeAt.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual heading is decomposed and compared exactly; changed quaternion-derived headings use their own cold lean. No rounded angle, omitted pass, reused shank/result or altered bound is accepted.

## @evidence contracts/development/implementation.md#efficient-algorithms

A same-heading eight-pass foot correction computes fixed heading axes and length squares once; every hip/ankle still runs the original bounded knee geometry and actual clamp. A changed exact heading retains the ordinary preparation cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body and exact heading alone fix the shared shank prerequisites; current hip, ankle and pitch remain query inputs, and exact mismatch selects ordinary current-heading work rather than an approximate cache hit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One correction-owned reader retains fixed scalar/axis geometry only until that synchronous foot correction returns or throws; it stores no rotation, limb result, queried angle history or external resource.

# src/actions/walkLeg.ts#walkLeg.heelRise

## @evidence contracts/development/common.md#meaningful-documentation

States rocker contact, world frame, angular inputs and returned pitch bound.

## @evidence contracts/development/implementation.md#principled-implementation

Runs rise's folded-room search on the two-bone shank geometry, with a fixed sole pivot and forward heading prepared outside pitch trials.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to prepareHeelRise, whose prepared rigid pivot supplies each trial ankle and whose roomValue owns the dorsal-room rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every search step, tolerance, room formula and range; only fixed socket and heading work is shared.

## @evidence contracts/development/implementation.md#efficient-algorithms

The unchanged bounded rise search evaluates constant-size leg geometry per pitch; fixed socket lookup and yaw quaternion construction run once per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hip, body, heading and world contact stay fixed throughout this synchronous rocker search and define its shared preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Owns no state beyond the synchronous search.

# src/actions/walkLeg.ts#walkLeg.dorsal

## @evidence contracts/development/common.md#meaningful-documentation

States the two limits, their sources, why no partial-load value is drawn and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The two measured limits by contact state: Konor, Morton, Eckerson and Grindstaff 2012 weight-bearing (39) for a foot bearing any weight, the AAOS passive norm (20) for one bearing none, as the range audit reads them; no study gives a limit under a partial load.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limits are the engine's measured ones; a share above zero is bearing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkLeg.ts#walkLeg.prepareHeelRise

## @evidence contracts/development/common.md#meaningful-documentation

States each fixed input, its unit and the varying hip/pitch reader.

## @evidence contracts/development/implementation.md#principled-implementation

Runs rise's folded-room search on roomValue's dorsal room, a pitch whose ankle lies beyond the leg's reach reading no room (`prepareWalkLegLean.bounded`), sharing only the fixed sole pivot and forward direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared pivot and heading precede the unchanged scalar search for each hip and pitch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every room trial and search bound remains; no hip, pitch or chosen result is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation followed by the original bounded pitch search; callers varying the hip avoid repeating socket and fixed-heading setup, and each room trial shares one actual hip-to-ankle length between its reach screen and shank geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body, side, world pivot, heading and onset width fix the shared geometry; changing any requires another reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A reader retains its fixed pivot transform and axis until its owning stance solve releases it, with no query history.
