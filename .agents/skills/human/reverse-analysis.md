# Reverse Analysis

Identify shape from the complete [curve inventory](references.md), then derive a generating family.

## Axes And Principal Layers

1. Match body features and neighboring curves using source identity, frames and actual curve/plane bindings.
2. Identify the source bone/rig chain and coordinate conversion. Rig axes define support; skin-centre curves follow measured shape and may differ.
3. Place principal layers at silhouette, volume, directional-feature and topology changes, independently of observation spacing and tessellation.
4. Identify which existing input moves each axis and reference curve; retain achieved pose and supported asymmetry.

Equal loop counts, indices or phases do not establish correspondence. Arbitrary world-Y regression, coordinate averages and inherited skeleton ratios cannot supply missing axes.

## Source Domain Admission

Before choosing or changing a surface representation, classify every affected join as a regular loft boundary, critical event, opening, crease or inferred closure. Bind each classification to source-graph nodes and edges, directed raw spans and one-sided support. Check saved one-sided jets and source incidence together; graph degree or a normal-angle threshold alone does not classify a critical event or crease.

Compare literal parent restrictions with the proposed shared endpoints and jets. A positional fit bound does not authorize flattening a saved corner or replacing a parent endpoint by a separately projected point. Distinguish jets at one physical position from jets at different fitted positions; tangent-plane constraints need a common point or justified transport. Record inconsistent observations and their approximation bounds before reconciling them.

Establish physical correspondence through shared source features and lineage, including narrow necks and contacts. Equal arclength, nearest points and a common tangent plane alone are insufficient. Keep synthetic closing chords and internal oral arcs separate from observed external skin. Consume this admitted domain through [Construction](construction.md#geometry-and-joins) before fitting an interior.

## Specimen Reproduction

- Establish source-conditioned principal positions, complete curves, endpoint jets and shared boundaries first.
- Generate skin independently and separate Recovery, frame-transport and assembly errors.
- Replace measured conditions with common coefficients only after that path reproduces the specimen.
- Keep source conditions in observation inputs, outside the product generator; follow [construction exclusions](construction.md#ownership-and-scope).

## Intermediate Curves And Solvers

Use `C(s,u;q,theta)`: physical station s, curve parameter u, physical inputs q and unknown common coefficients theta.

1. Solve each intermediate axis/curve from endpoint positions, one-sided tangents, guides, shape and continuity constraints.
2. Recurse into both child intervals, inheriting the same boundaries and actual evaluator.
3. Choose direct solving, linear least squares or constrained nonlinear optimization according to the equations.

- Report rank, gauge, conditioning, initialization, convergence and supported ranges.
- A midpoint average or extra layers supplies no missing shape; restriction adds no anatomical evidence.
- Subdivision of construction is not a requirement to use scalar bisection for every solve.
- On failure, reconsider correspondence and representation before adding coefficients.

## Acceptance

Check original curves, held sections and rendered neighbors separately. Solver termination is neither geometric acceptance nor a global optimum; correlated specimens do not identify independent causal responses or unseen-shape prediction. [Hierarchical fitting](https://www.cs.ubc.ca/sites/default/files/tr/1995/TR-95-33_0.pdf) and [curve networks](https://arxiv.org/abs/1312.5533) apply only under their correspondence and compatibility premises.
