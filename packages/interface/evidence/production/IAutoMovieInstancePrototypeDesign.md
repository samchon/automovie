# src/production/IAutoMovieInstancePrototypeDesign.ts#IAutoMovieInstancePrototypeDesign

## @evidence contracts/development/design.md#principled-representation

An admitted positive finite weight participates in deterministic seed-and-slot prototype selection, while an explicit slot can name the prototype id directly; `model` names an existing model group and lod orders its distance tiers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates selection identity and weight from the reusable model group, so a set shares prototype data without expanding one model per member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unique ids, existing model groups, LOD tier order, positive finite weights and a finite representable total weight are caller premises; compact materialization does not validate them. Explicit missing ids throw, while seeded selection uses table order and assigns floating residue to its last choice.

## @evidence contracts/development/common.md#meaningful-documentation

Defines set-local non-blank identity, existing model group reference, optional distance tiers and positive deterministic selection weight.
