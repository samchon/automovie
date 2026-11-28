# src/props/AutoMovieArchetypeWatch.ts#AutoMovieArchetypeWatch.create

## @evidence contracts/development/common.md#meaningful-documentation

Locates the dial's head direction, grip and wrist socket, and states the actual seedless case and strap measures.

## @evidence contracts/development/implementation.md#principled-implementation

The strap lies below the case. The measured top face matches the case footprint and faces upward with its head toward negative Z.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw, one strap box, one case box and three contact frames form the watch.

# src/props/AutoMovieArchetypeWatch.ts#AutoMovieArchetypeWatch.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Side case `hold`, upward readable `face` and a downward wrist `wear` socket.

## @evidence contracts/development/design.md#principled-representation

A wrist socket is below the strap and the dial surface sits on top of the case. The hold uses the actual width at mid-case height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three IDs distinguish wrist placement, holding and reading.

# src/props/AutoMovieArchetypeWatch.ts#AutoMovieArchetypeWatch.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Case width and thickness, and strap length along Z, in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

Width and height describe the case, while depth describes the separate straight strap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output uses the four measurements that determine the watch's geometry and mass.
