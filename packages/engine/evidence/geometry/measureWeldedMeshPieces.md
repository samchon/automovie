# src/geometry/measureWeldedMeshPieces.ts#measureWeldedMeshPieces

## @evidence contracts/development/implementation.md#principled-implementation

Runs the ordinary piece algorithm on the welded corner and identity count components of one mesh. Ordered corner triples give the original face ordinal and directed incidence for every nondegenerate triangle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The standalone and paired reports both enter the same census at this point. The census takes just the corner identities and their range.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The supplied input is one complete admitted weld. The census retains the ordinary degeneracy sentinel, first-triangle order and directed edge uses from that weld.

## @evidence contracts/development/implementation.md#efficient-algorithms

No index admission or corner key reconstruction occurs here. The ordinary near-linear edge and union-find passes use the welded numbering.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the existing weld so a paired caller can reuse the topology inspection's admitted corners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reads the corner array for this call. Only independent piece records survive it.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies that measurement starts with an already completed corner weld and reports incidence and winding.
