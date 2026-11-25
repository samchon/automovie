# src/geometry/construction/AutoMovieConstructionSeeds.ts#AutoMovieConstructionSeeds.create

## @evidence contracts/development/implementation.md#principled-implementation

Converts point stations from metres to mm or tries Armijo-Newton meetings from share endpoints/interior layers on each declared station line in turn (which line meets the host is a property of both surfaces, not of the part alone), accepting the original residual tolerance, part share interval and actual host.domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One seed-kind dispatch preserves point authoring, candidate/warm/cold order and the first accepted local meeting; lines are tried in the declared phase's order, ties going to the earlier line, and one line keeps the former search exactly. Foot failure does not suppress a joint meeting from the existing admitted coarse chart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Search never substitutes a sampled point for a meeting: coarse/foot charts only initialize the actual residual solve. Infeasible jets leave later candidates available, no source is clamped and bounded failure is not a no-intersection proof.

## @evidence contracts/development/common.md#meaningful-documentation

Search shares use the actual face domain, including explicitly retained original caps; absent domain retains supplied layer bounds. Gives metre input, mm surface/layer/tolerance units, point-mode meaning and bounded local failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

For M<=L+2 candidates on each of K declared lines, work is O(K*(L+M*(G+2F+N*B))) callback/constant-system steps, G=544 grid points, F=60 foot steps, N=40 Newton updates and B=20 trials, plus one initial meeting jet pair. No complete source or surface sampling is introduced.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the last successful foot as the next chart guess and retains one accepted meeting jet pair/residual between updates. A distinct cold fallback follows only a failed warm guess; no grid, source or effect is cached across requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Interior/ordered station arrays and current numerical jets have call lifetime; only the selected seed's chart scalars/face index or error string is returned.
