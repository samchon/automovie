# src/posture/HumanArmJacobian.ts#HumanArmJacobian.columns

## @evidence contracts/development/common.md#meaningful-documentation

Specifies actual placed FK, original coordinate order and the free-column result.

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the geometric joint-axis reading for elbow/wrist coordinates and the existing two-sided shoulder-chart angular difference; clamped coordinates still produce zero columns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Supply three actual world segment frames, read joint motions and their exact projections together, then map each requested free coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all six joint-axis queries, numerical clamp values, STEP, quaternion multiplication order and near-zero angular threshold; no analytical chart approximation replaces the existing central difference.

## @evidence contracts/development/implementation.md#efficient-algorithms

One joint-axis reading per candidate borrows the setup's canonical clamp metadata while retaining actual joint projections, then two chart evaluations per shoulder coordinate use one perturbation array. Fixed variable labels, world-only bone fields and at most two lazy placed-chain offsets avoid repeated temporary records; every returned column and cross product remains fresh.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows already placed world fields and the setup's actual engine clamp factory for this same unchanged body/skeleton/axes/domain operation; every requested joint is still actually projected. The lower/hand readings supply clamp-status checks, and shoulder columns share only the same unchanged placed elbow/hand displacement from the shoulder after its first actual use.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh column records and releases its coordinate scratch and two optional private displacements after the call; those inputs are not returned by the cross products. Two fixed six-entry variable-label tables retain only canonical bone names/axes; noncanonical pairs allocate call-local labels instead.

# src/posture/HumanArmJacobian.ts#HumanArmJacobian.read

## @evidence contracts/development/common.md#meaningful-documentation

Defines arm encoding, optional coordinate offsets and the returned chain function's world-frame result.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the original arm setup/frame, encodes actual clamped clinical triples, applies each supplied offset and reads the same FK differentiated by columns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One setup, frame, coordinate list and free list create the columns and a chain closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not remove out-of-range offsets or locked-coordinate behavior; the frame's actual body/external probe and admission rules remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame preparation, one current arm-chain FK and columns reading, then one actual FK per requested chain query, without allocating unused tip or collision probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned chain closure shares the same unchanged setup and frame as its columns; every supplied coordinate is evaluated independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned coordinates, columns and closure; the closure retains only its operation's setup/frame and no history of queried candidates.
