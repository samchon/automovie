# src/animals/EquineObstacle.ts#EquineObstacle.IObstacle

## @evidence contracts/development/common.md#meaningful-documentation

States the course distances and the top height.

## @evidence contracts/development/design.md#principled-representation

An interval of course distance in metres and a height above the leg's ground.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the jump's admission and flight.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineObstacle.ts#EquineObstacle.read

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the order.

## @evidence contracts/development/implementation.md#principled-implementation

Intersect each pole's horizontal segment with the leg's line: its course interval is its radius over the sine of the crossing angle about the crossing, and its top the pole's higher end plus its radius above the leg's start. A ditch is an interval of the line no authored plane covers, between covered ones, each plane's cover read by the slab method.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rails, then ditches, then one sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pole parallel to the leg or off its segment is not an obstacle; none is widened.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K + S log S) for K poles and S planes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's placement at the leg's start.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list.

# src/animals/EquineObstacle.ts#EquineObstacle.shortfall

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, units and the zero result.

## @evidence contracts/development/implementation.md#principled-implementation

Each part's exact lowest point and extent along the leg are read in the leg's own frame every 5 ms of the flight; a part overlapping an obstacle short of its top plus the clearance by h at a time τ after takeoff asks the arc b = g/2 (t − t_T)(t_L − t) to rise by h there, which a later landing gives at the rate g τ / 2.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample, measure, take the largest request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The measured parts are the ride's own displayed solids; nothing is padded.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N·P·O) for N samples, P parts and O obstacles, once per planning round.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the exact primitive floor reader for each rotated frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.

# src/animals/EquineObstacle.ts#EquineObstacle.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States the frames.

## @evidence contracts/development/design.md#principled-representation

Model-space parts and their world placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by the ride to `shortfall`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
