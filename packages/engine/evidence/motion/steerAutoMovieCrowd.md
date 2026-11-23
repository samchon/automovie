# src/motion/steerAutoMovieCrowd.ts#steerAutoMovieCrowd

## @evidence contracts/development/implementation.md#principled-implementation

The social force driving term plus the power-law interaction's exact spatial gradient: the time to collision of two discs solves `|p - u t| = R`, and implicit differentiation gives `grad t = n / -(n . u)` at the contact normal `n`, the same expression for an offset edge or a corner of a convex obstacle. The position's rate is the ORCA velocity, the cited paper's reciprocal half-planes solved by its linear program. Each obstacle adds its velocity obstacle's half-plane at the agent's full share, kept hard in the program's fallback as the paper keeps its obstacles'. The horizon cut is exact for the cut law: a pair outside `d - R <= |v_i - v_j| t0` has a time to collision beyond `t0` or none. The cut leaves the force discontinuous where a predicted contact crosses `t0`, by the energy's gradient there. Classical RK4 on the stacked state through `integrateMotionTrajectory`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the agents, fix the canonical order, define the right-hand side, integrate, then read the courses; the neighbour grid (`steerAutoMovieCrowdNeighbours`) and the arrivals and contacts at the knots (`steerAutoMovieCrowdContacts`) have their own owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No agent is moved apart after the fact: overlaps are reported, not repaired. The force cap is named and provisional, documented as the cure for the gradient's grazing singularity the implicit-crowds work describes, not a tuning of one scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each evaluation buckets the N agents in O(N) and reads each agent's grid block of m candidates in O(m log m), then O(m + M) contacts for M obstacle edges and one half-plane program of at most m + O half-planes for O obstacles, expected linear; a dense crowd whose every agent lies within one reach of all others still costs O(N^2), the full scan. Four evaluations per step over `(to - from) / step` steps; each pair's contact, avoidance change and capacities are computed once an evaluation, the second agent reading them negated, which is exactly its own reading wherever no component is zero (it computes them otherwise); a new film second reads the stacked state in O(N), after which each course at that same second projects its own state in O(1).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One integration serves every agent's course and every read of it; successive course reads at the same second share one private state read, within an evaluation one reading of a pair serves both its agents, and the knot pass (`steerAutoMovieCrowdContacts`) places each obstacle's footprint once a knot for every agent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the trajectory's knots, 4 N numbers per step, for as long as the caller keeps the courses; the integration also holds 13 numbers a pair of agents, rewritten every evaluation and dropped with it, and each evaluation's grid holds N indices until it returns. Course readers share one additional 4 N number snapshot.

## @evidence contracts/development/common.md#meaningful-documentation

States the law with its sources, the gradient's closed form, the goal following, herding, the speed cap, the integration, the order independence, the coupling, the contacts and the provisional constants with the search recorded.
