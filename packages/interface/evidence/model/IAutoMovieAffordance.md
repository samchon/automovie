# src/model/IAutoMovieAffordance.ts#IAutoMovieAffordance

## @evidence contracts/development/design.md#principled-representation

A model-local contact transform and optional convex XZ footprint separate point seating from support geometry; prop anchoring composes the frame with the staged model and propSupportFace uses full affine footprint placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contact identity, kind, frame and extent form one record beside the model's body; bone attachments use their own skeleton-based representation rather than mixing rig references into a model contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Point contacts require null extent. Stack-top admission checks finite XZ points and a noncollinear convex hull, without certifying the authored order as a simple convex polygon; propSupportFace constructs the transformed hull, so an authored concavity is not preserved as a support notch.

## @evidence contracts/development/common.md#meaningful-documentation

States model-local frame ownership, contact-axis convention, a graphic-bearing surface's reading direction (local `+X` right, local `-Z` toward the top, read from `+Y`), coincident seating, model-scoped ids, the stack-top convex XZ extent with null for point contacts, each optional dimension's unit and reader kinds, the seat's astride and mount flags, and what the articulation references name and require.
