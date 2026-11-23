# src/service/validateWetZones.ts#validateWetZones

## @evidence contracts/development/implementation.md#principled-implementation

Grade ordering determines full membrane and drier-space threshold obligations, while resolved drainage outlet media establish a declared discharge path; finite positive slope is a declaration check rather than a geometric gradient solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Production environment validation joins service and architecture names here, and ViolationCollector carries independent errors without rewriting the authored zones.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One space keeps its first grade while duplicate zones are reported; no room-name waterproofing policy or fabricated drain makes a missing obligation pass.

## @evidence contracts/development/common.md#meaningful-documentation

Describes membrane, threshold and drain obligations and the limit that slope/upturn data do not prove actual constructed geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Lookup maps are built once; each zone scans enclosing boundaries and its citations/drains, giving worst-case O(Z B plus P) work with linear network/environment maps and diagnostic output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Boundary, node, system and first-grade lookups serve every zone check in one call; no previous build's mutable declaration results are cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Collector and lookup maps are call-local; returned validation owns its findings while source geometry and service records remain unchanged and unretained by this gate.
