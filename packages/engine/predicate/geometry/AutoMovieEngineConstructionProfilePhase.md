# src/geometry/AutoMovieEngineConstructionProfilePhase.ts#AutoMovieEngineConstructionProfilePhase.create

## @evidence contracts/development/common.md#meaningful-documentation

Identifies millimetre and normalized chart inputs, the phase and jet fallback boundary, and the nullable second derivative of a finite world result.

## @evidence contracts/development/implementation.md#principled-implementation

Each read checks the original piece's retained interval before invoking its callback. The complete phase operands and the plane rows must supply finite components. At fixed station the clock derivative scales the original tangent, and its square scales the second derivative when present. Checks catch invalid operands and final arithmetic overflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation indexes each named piece once. A read uses one indexed curve query and a single frame read. The fixed-size products allocate only their result vectors, and none are kept in the reader.
