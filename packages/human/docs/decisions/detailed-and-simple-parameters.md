# Detailed parameters model; simple parameters convert

## Decision

Modeling reads only detailed parameters: named measurements, pigmentation, eye colour, named physiological motions and closed-set choices. Simple parameters for beginners (sex, age, stature, ancestry, cuteness, slimness, fatness, muscularity and similar) are deterministic, documented, replaceable converters into detailed parameters and never reach modeling. A saved document stores the resolved detailed parameters as the canonical state and keeps the simple inputs as editing history.

## Reasons

- Any ancestry or look must be reachable by detailed parameters alone; a modeling path keyed by ancestry or by a vague trait would make some people unreachable and hide its assumptions.
- A detailed parameter is checkable: the measured result can be compared with the requested measurement.
- Population correlations (taller people tend to have longer legs) belong in a converter built from population statistics, where they can be cited and replaced, not inside geometry.
- Storing resolved detailed parameters means a later converter revision never changes a saved person.

## Consequences

- No vertex, curve, cage, basis, topology or solver field appears in a public type.
- Static bounds live in typia tags; bounds that depend on other values are checked at admission and refused with their cause, leaving the caller's values unchanged.
