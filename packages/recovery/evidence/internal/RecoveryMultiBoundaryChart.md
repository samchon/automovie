# src/index.ts#RecoveryMultiBoundaryChart

## @evidence contracts/development/implementation.md#principled-implementation

Coherent edge incidence, connected faces and path/circle vertex links establish an orientable surface; V-E+F=2-b admits the supplied genus-zero boundaries. Positive measured edge lengths give Dijkstra paths; each path joins the existing boundary tree to one new cycle. Cutting face links and revalidating one boundary, Euler one and unchanged per-face coordinates establishes a private disk without changing PL geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper owns topology admission, deterministic cut selection and private fan duplication. A shared local incidence analysis admits both source and result; field fitting and public boundary authority remain caller responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All decisions use coherent incidence, measured edge lengths and stable source keys. No coordinate welding, anatomical data, source-normal transfer, guessed closure, hidden fallback or reconstruction geometry is supplied.

## @evidence contracts/development/common.md#meaningful-documentation

States input cycle orientation, physical units, root and path policies, duplicated-key semantics, immutable arrays, private geometry lifetime and explicit unsupported conditions and continuity limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices, F faces and b boundaries, two incidence/link analyses and fan splitting take O(V+F) storage; stable key ordering costs O((V+F)log(V+F)), and b-1 heap Dijkstra rounds cost O(b(V+F)log(V+F)). Revalidating the remapped surface is required because the cut result must actually be a disk.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source incidence and measured adjacency are built once and reused across all cut rounds and fan traversals. Each new search reuses the completed connected boundary/seam population as its zero-distance sources; no fitting or source extraction is repeated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Graphs, heaps and fan labels are invocation-local and expire on return or failure. At most 3F private vertex occurrences and F triangles transfer to the caller; no handles, retained cache or consumer topology are created.
