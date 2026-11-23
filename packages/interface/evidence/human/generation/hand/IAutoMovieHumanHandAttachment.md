# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment

## @evidence contracts/development/common.md#meaningful-documentation

Describes original parent section contacts, local material transfer and independently qualified source jets; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Original parent section contacts, local material transfer and independently qualified source jets. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHandAttachment; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HandAttachment contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.IConnection

## @evidence contracts/development/common.md#meaningful-documentation

One canonical geometric attachment and its explicit material-chart map.

## @evidence contracts/development/design.md#principled-representation `name`: Actual digit source name, shared with the construction tree and observer. `parent`: Whole final parent source, shared rather than reconstructed from a mesh. `joint`: Unchanged anatomical MCP/CMC; this is not the skin closure datum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyLane.handAttachments, AutoMovieHumanHandAttachment.dorsalChord.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `parent`, `joint`, `jointSection`, `root`, `section`, `chordV`, `dorsalChord`, `childFrame`, `quarterRays`, `phases`, `quarters`, `parameterMap`, `proximal`, `measuredShaft`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.ISection

## @evidence contracts/development/common.md#meaningful-documentation

A qualified local original section and the point in its chart.

## @evidence contracts/development/design.md#principled-representation `kind`: A declared zero pole is a known point, not a positive native section. `station`: Physical parent station, mm. `frame`: Actual parent plane and original scalar inputs at that station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandAttachment.locate. Read by chord, edge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `station`, `frame`, `local`, `values`, `jets`, `axisJet`, `margin`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.Frame

## @evidence contracts/development/common.md#meaningful-documentation

The actual original section plane, before any loft or mesh.

## @evidence contracts/development/design.md#principled-representation

The actual original section plane, before any loft or mesh. ReturnType<IAutoMovieViewPart["axis"]["at"]> retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandAttachment.Frame is the canonical exchange used by IAutoMovieHumanHandAttachment.ISection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by IAutoMovieHumanHandAttachment.ISection for the actual original section plane, before any loft or mesh.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

A source-field boundary bracket; no absent parent coordinate becomes a numeric value.

## @evidence contracts/development/design.md#principled-representation `direction`: World direction in which the signed ordinate and bracket are expressed. `ordinate`: Signed distance along that direction, mm. `bracket`: The actual inside and outside ray distances bracketing that boundary, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by edge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `direction`, `ordinate`, `bracket`, `inside`, `outside`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.Quarters

## @evidence contracts/development/common.md#meaningful-documentation

Four effective conic quarters in their declared material order.

## @evidence contracts/development/design.md#principled-representation

Four effective conic quarters in their declared material order. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHandAttachment.phases, AutoMovieHumanHandAttachment.shoulders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandAttachment.phases, AutoMovieHumanHandAttachment.shoulders, AutoMovieHumanHandAttachment.attachment for four effective conic quarters in their declared material order.

# src/human/generation/hand/IAutoMovieHumanHandAttachment.ts#IAutoMovieHumanHandAttachment.IAttached

## @evidence contracts/development/common.md#meaningful-documentation

A digit input retaining the same canonical connection consumed by its law.

## @evidence contracts/development/design.md#principled-representation `attachment`: Original parent, location, material map, fullness and jets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandAttachment.attach.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `attachment`; callers supply the complete record.
