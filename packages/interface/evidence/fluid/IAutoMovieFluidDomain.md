# src/fluid/IAutoMovieFluidDomain.ts#IAutoMovieFluidDomain

## @evidence contracts/development/design.md#principled-representation

The explicit linearized shallow-water field uses an Arakawa C grid, with centre depths/beds and face velocities. Flux-form updates target conservation except declared sources, drains and open edges; the design-depth Courant premise and finite representable arithmetic are necessary, while current validation and integration leave the numerical gaps documented on the solver/state types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The domain owns only lattice, solver settings, edges, per-cell arrays and declared flows; its placement in a building is a separate `IAutoMovieWaterFeature` binding, so the same record serves a building basin and a building-free world.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Initial face velocities are zero and motion derives from surface/flow inputs. Caller-run validation rejects its stated field violations without rewriting them, but the integrator assumes admission, clamps nonpositive depth and does not independently close every derived-arithmetic gap.

## @evidence contracts/development/common.md#meaningful-documentation

States why the domain is independent of architecture, the model and what it does not resolve, the normative CPU state, the row-major layout, the at-rest initial state, and the validation preconditions; members give units, lengths, datums and caps.
