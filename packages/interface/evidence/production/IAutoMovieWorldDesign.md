# src/production/IAutoMovieWorldDesign.ts#IAutoMovieWorldDesign

## @evidence contracts/development/design.md#principled-representation

The typed world declares meter-based landmarks, surface height laws, route constraints, effect recipes/zones and instance placement laws. Engine callers query or materialize those records explicitly; unique identities, valid numeric domains and complete references remain caller premises after whole-production admission retirement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each spatial population keeps its own shape and responsibility, separating terrain lookup, navigation width, effect regions and non-formation placement from shot performance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional instanceSets preserves older world records as an empty population. Missing instance routes refuse during regeneration, while materializeCompiledEffects drops unresolved zone or recipe cues; this type supplies no universal missing-reference refusal or invented geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world identity and meter units, every spatial population and the backward-compatible empty instance-set omission.
