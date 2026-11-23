# src/human/generation/IAutoMovieHumanBranchEvent.ts#IAutoMovieHumanBranchEvent

## @evidence contracts/development/common.md#meaningful-documentation

Split of a parent's end ring into its children's adjacent end rings.

## @evidence contracts/development/design.md#principled-representation `parent`: Parent chain whose end layer is the contact section. `direction`: `down`: the contact is the parent's bottom layer and the children lie below it; `up`: the contact is the parent's top layer and the children lie above it. `splits`: Children and the parent-phase arcs that form their adjacent end rings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandEvents.events. Read by AutoMovieHumanApertureSpan.of, AutoMovieHumanApertureSpan.shared, AutoMovieHumanBodySurfaceContact.contact. Also types AutoMovieHumanArmScye.event, AutoMovieHumanLegCrotchRoot.event.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `fillet`: Length over which a child turns onto the parent's tangent plane, in radii of its end ring. `shared`: The children already leave the contact in the parent's tangent plane, by their own construction, so the join leaves them as built. `web`: Whether the children start apart from the parent's ring, joined to it by the webs' own surface (`AutoMovieHumanBodyWeb`): each child's adjacent end is its own section past the webs' crests, and the skin from the parent's ring to those sections, the saddle of every web included, is built by the surface.
