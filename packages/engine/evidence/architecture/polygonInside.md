# src/architecture/polygonInside.ts#polygonInside

## @evidence contracts/development/implementation.md#principled-implementation

For simple rings, ideal containment has contained vertices and no exterior boundary interval. Shared approximate predicates classify crossings/contacts and midpoint intervals under their finite-intermediate and scale premises; this is not an exact robust containment certificate. An empty inner ring passes vacuously; a nonempty inner ring with empty outer ring fails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the shared `pointInPolygon` and `segmentsCross` predicates, so opening-in-face, panel fit, service and support-surface containment all apply one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no void, wall or caller; flush edges pass through boundary-inclusive predicates, and vertex-only exits are judged by their exterior intervals rather than tolerated for a shape family.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states allowed contact, the shared frame and simple-ring premises, and why midpoint classification is needed for concave vertex contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n inner and m outer edges, the usual scan costs O(n*m); sorting k vertex contacts and classifying their intervals adds O(k*log(k) + k*m) per touched inner edge, bounded by O(n*m*m) time and O(m) transient space. The midpoint scans resolve contacts that proper-crossing tests cannot classify.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure containment answer for one pair of rings; each validator asks once per void and face pair.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each edge's contact parameters and midpoint records are local, bounded by the outer corner count, and released before the next edge; nothing is retained across calls.
