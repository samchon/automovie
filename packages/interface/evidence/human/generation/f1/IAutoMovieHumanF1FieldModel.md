# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel

## @evidence contracts/development/design.md#principled-representation

Owns primary field owners, catalogue layers and source membership, and documented unresolved quantities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Canonical declarations shared by AutoMovieHumanF1FieldModel and its published consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime owner retains the same admission and source coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the units and roles of the received and printed values.

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.IPrimary

## @evidence contracts/development/design.md#principled-representation

Skeleton first (segment lengths; the hip support rides in the tissue record's `hipJointCentreBreadth`), then tissue reach at the sites; no girth is a member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, each the record its applying owner already declares; nothing is duplicated.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No bone, muscle and fat split is declared, because one person's skin cannot identify it (`UNRESOLVED`).

## @evidence contracts/development/common.md#meaningful-documentation

Names both owners and the units their members carry (mm).

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.Layer

## @evidence contracts/development/design.md#principled-representation

The Layer declaration contributes to the anatomical field catalogue through primary field owners, catalogue layers and source membership, and documented unresolved quantities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The published producer and its callers consume this exact declaration through Interface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation preserves the source fields and leaves numerical admission to its runtime owner.

## @evidence contracts/development/common.md#meaningful-documentation

Each member describes its geometric or source role.

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.Identifiability

## @evidence contracts/development/design.md#principled-representation

The Identifiability declaration contributes to the anatomical field catalogue through primary field owners, catalogue layers and source membership, and documented unresolved quantities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The published producer and its callers consume this exact declaration through Interface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation preserves the source fields and leaves numerical admission to its runtime owner.

## @evidence contracts/development/common.md#meaningful-documentation

Each member describes its geometric or source role.

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.Member

## @evidence contracts/development/design.md#principled-representation

The Member declaration contributes to the anatomical field catalogue through primary field owners, catalogue layers and source membership, and documented unresolved quantities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The published producer and its callers consume this exact declaration through Interface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation preserves the source fields and leaves numerical admission to its runtime owner.

## @evidence contracts/development/common.md#meaningful-documentation

Each member describes its geometric or source role.

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.IField

## @evidence contracts/development/design.md#principled-representation

The attributes #3172 asks of every field: unit, definition, frame, posture, source, identifiability, driven controls and applying owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the documentation and the audits that list the model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `members` list is typed against the owners' records; a field with no typed member yet says so with an empty list.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

# src/human/generation/f1/IAutoMovieHumanF1FieldModel.ts#IAutoMovieHumanF1FieldModel.IUnresolved

## @evidence contracts/development/design.md#principled-representation

The quantity, why one person cannot identify it, what would, and the issue that receives it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by the handoff to the receiving issue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No estimate stands in for an unresolved quantity.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.
