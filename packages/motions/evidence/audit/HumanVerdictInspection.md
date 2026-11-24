# src/audit/HumanVerdictInspection.ts#HumanVerdictInspection.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the packet it returns and the failure for a performer without a path.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the report once with HumanVerdicts.of and maps it with the performers' paths and airborne flags.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One report read, one performer list, one mapping.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No performer is skipped and a missing path throws instead of being invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

One report per call and a linear pass over the performers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The report and the airborne reading are HumanVerdicts' own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the report for the call and returns only the packet.

# src/audit/HumanVerdictInspection.ts#HumanVerdictInspection

## @evidence contracts/development/common.md#meaningful-documentation

States the report and performers it takes, the identity of a finding, the collapse, the coverage rows and the failure for an unknown subject.

## @evidence contracts/development/implementation.md#principled-implementation

Identity is bound, subject and paths; a bound read in several spans keeps its worst reading and timing faults are counted, so the reducer's one-finding-per-identity rule holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Coverage rows first, then one pass collapsing findings into groups, then one mapping to the shared type.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound of every performer has a row, and an unread bound is excluded with its reason rather than left out.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the report's findings and the performers and their pairs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Units and bounds are the audit owners' own, held once in this file.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the groups of one call and returns only the packet.
