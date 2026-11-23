# src/motion/human/skill/IAutoMovieProficiency.ts#IAutoMovieProficiency

## @evidence contracts/development/common.md#meaningful-documentation

Gives the named levels' values, every axis with what it measures, the default for an absent axis and what proficiency never changes. The ten independent motor-skill dimensions used for proficiency overrides and HumanSkill axis lookup.

## @evidence contracts/development/design.md#principled-representation

A named level or a continuous value, with per-axis overrides along the dimensions motor-learning studies measure separately. Closed choices "timing", "path", "balance", "guard", "power", "speed", "recovery", "reaction", "anticipation", "sequencing" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

States skill only; how each axis changes a motion belongs to the laws that read it. Public boundary formerly declared in skill/IAutoMovieProficiency.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps skill apart from the range of motion, so proficiency cannot raise what a joint can do. The admitted literal values are declared here directly; runtime range admission and level-to-axis resolution remain in HumanSkill.of.

# src/motion/human/skill/IAutoMovieProficiency.ts#IAutoMovieProficiency.Axis

## @evidence contracts/development/common.md#meaningful-documentation

Each axis is described on {@link IAutoMovieProficiency}.

## @evidence contracts/development/design.md#principled-representation

One name per dimension that studies measure separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The names only; their effects belong to the laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union, so an unknown axis is a type error.
