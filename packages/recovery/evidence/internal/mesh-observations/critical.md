# src/internal/mesh-observations/critical.ts#critical

## @evidence contracts/development/implementation.md#principled-implementation

Lower and upper link connectivity classify generic PL vertices; ties retain the legacy symbolic order. The optional boundary policy admits only a simple path whose incident faces are unique, canonically noncollapsed and finite nonzero-area, whose radial edges have one boundary use or two opposite interior uses, and whose strict lower/upper portions and boundary restriction are regular. Binary64 area checks do not certify geometric embedding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One versioned policy adds conservative boundary regularity to the existing link owner. Returned manifold flags retain their original closed-cycle meaning; positions, event order and default behavior are unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lower/upper pair of one alone never removes a boundary event. Every failed incidence, duplicate, degeneracy, flat or endpoint check retains its legacy event; no specimen identity or expected population enters the policy.

## @evidence contracts/development/common.md#meaningful-documentation

States both policy versions, sufficient-condition scope, symbolic ties, binary64 limitations and the unchanged meaning of returned closed-manifold observations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V positions, T faces and E returned events, construction and local-link traversals cost expected O(V+T), followed by O(E log E) event sorting, with O(V+T+E) storage. The boundary policy adds one source admission scan, one face-incidence scan and linear local degree checks; each face contributes a constant number of link entries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Heights and link connectivity are reused for classification. Only the opt-in policy builds shared face-uniqueness and radial-incidence maps, which every boundary candidate reuses during this call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All source qualification maps and link graphs are call-local and released after returning private events. No cross-call cache exists; callers discard source addresses before serialization.
