# Common

Every exported declaration answers this item in its doc comment: types, interfaces and classes beside [design](design.md), functions and class methods beside [implementation](implementation.md), and test functions beside [testing](testing.md).

## Meaningful documentation

Document each public declaration and member with its purpose and the non-obvious facts needed to use it, such as ownership, units, frames, timebases, defaults, failure effects, side effects, or the meaning of an optional or absent value, not a restatement of its name and type. Document each test with the scenarios it runs and the behavior each one pins.

Explain non-obvious calculations in nearby implementation comments: their premises, derivation, units and frames, and how their outputs feed dependent calculations or parts. Cite the basis of a fitted or conventional coefficient, such as the study section, measurement or convention it comes from, and distinguish it from a measured quantity, so a new reader can change the formula without breaking its meaning.

Write it to the [documentation skill](../../documentation/SKILL.md)'s rules, with a blank comment line between prose and tags and a blank line between documented properties.

State which facts the documentation gives.
