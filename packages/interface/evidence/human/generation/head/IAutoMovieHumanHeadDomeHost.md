# src/human/generation/head/IAutoMovieHumanHeadDomeHost.ts#IAutoMovieHumanHeadDomeHost.IHost

## @evidence contracts/development/design.md#principled-representation

Carries the complete admitted source, query point, actual station/frame and an explicit distinction between plane incidence and a bracketed surface contact. `part`: Identical original parent, never a realized mesh. `source`: Complete original signed-support/fullness/cap family. `point`: World query point; only a non-null parameter certifies a bracketed native surface contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the parent-plane datum separate from the child's nominal base and embedding offset. Returned by AutoMovieHumanHeadDomeHost.attachment, AutoMovieHumanHeadDomeHost.contact, AutoMovieHumanHeadDomeHost.locate. Read by AutoMovieHumanHeadDomeHost.radius. Also types AutoMovieHumanHeadDomeHost.fixed, AutoMovieHumanHeadDomeHost.read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

World height and a buried child-base coordinate are not implicitly parent stations. Required fields are `part`, `source`, `point`, `station`, `frame`, `parameter`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

All positions and physical source stations use calibration mm. An original parent section selected by a plane query or actual cap contact.
