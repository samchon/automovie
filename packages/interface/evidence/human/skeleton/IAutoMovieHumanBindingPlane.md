# src/human/skeleton/IAutoMovieHumanBindingPlane.ts#IAutoMovieHumanBindingPlane

## @evidence contracts/development/common.md#meaningful-documentation

A plane across a joint: a point's share climbs from behind it to before it.

## @evidence contracts/development/design.md#principled-representation `at`: Point on the plane, metres. `normal`: Unit normal toward the child. `half`: Half of the ramp's width, metres; the widest sector's where sectors are read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCrotchBinding.start. Also types AutoMovieHumanCrotchBinding.clear.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `sectors`: The half width by sector round the normal, or none for one half all round.
