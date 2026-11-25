# src/architecture/ServiceCabinet.ts#ServiceCabinet.ICabinet

## @evidence contracts/development/common.md#meaningful-documentation

States which part is already built and the sizes and mass that accompany it.

## @evidence contracts/development/design.md#principled-representation

Uses the same drawn metres and kilograms for the cabinet, details and contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only the builder and the dimensions or mass the selected producer reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The builder's typed contact identifiers preserve the caller's profile.

# src/architecture/ServiceCabinet.ts#ServiceCabinet.begin

## @evidence contracts/development/common.md#meaningful-documentation

Names the selected profile, dimensions and model admission.

## @evidence contracts/development/implementation.md#principled-implementation

Draw a whole model where available and lay its measured figures over the free ranges before drawing the cabinet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Open the saved draw, admit the model and dimensions and build one rectangular cabinet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reject a model or dimension the selected manufacturer profile does not own.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Draws four dimensions and builds one part.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three public service machine designs share the same rectangular cabinet construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the builder and the four values are returned.

# src/architecture/ServiceCabinet.ts#ServiceCabinet.FacesContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of faces.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only faces and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/architecture/ServiceCabinet.ts#ServiceCabinet.FacesChoice

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of faces.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only faces and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/architecture/ServiceCabinet.ts#ServiceCabinet.faces

## @evidence contracts/development/common.md#meaningful-documentation

Names the two surface contacts and what puts them in place.

## @evidence contracts/development/implementation.md#principled-implementation

The contact points and extents follow the same cabinet measurements as the box.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two surface frames at the corresponding face centres.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The frames use the face dimensions, not separate estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constructs two affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Defines the same rectangular face construction for each cabinet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Adds only the two faces to the given builder.
