# src/geometry/curve/tessellateAutoMovieCurveGrid64.ts#tessellateAutoMovieCurveGrid64

## @evidence contracts/development/implementation.md#principled-implementation

De Casteljau restrictions preserve each supplied cubic; shared Fritsch-Butland derivative fields construct complete Hermite tensor coefficients, evaluated by engine Bernstein operators into new mesh buffers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The operator owns geometry, admission, sampling and actual construction; source observation and fitting remain caller responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source vertex/index/normal arrays, anatomy branches, clamped overshoot or through-point refit supply the surface; independent contact sheets retain explicit topology domains.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate conversion, periodic derivative ownership, coefficientwise interpolation, sampling limits and failure behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission and partition union cost O(K log K) for K input boundaries; O(S U) support probes use logarithmic source-span lookup. Each sampled common span restricts S courses with logarithmic lookup and constructs O(S) tensor data. Guide membership is prepared once in O(G) storage and queried in constant expected time. Output evaluation and face-normal accumulation are linear in requested vertices and triangles; the explicit vertex budget rejects excess before buffer allocation, with the unavoidable station-row lower bound checked before displacement probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sorted course sampling retains only the current common-span tensor family, reused across every station sample and guide at that parameter; station PCHIP coefficients are constructed once per visited common span.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary tensor storage is O(S), partition and guide storage O(K+G), and returned mesh/construction storage O(V+S U); no process-wide cache or external handle survives the invocation.
