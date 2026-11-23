# src/pose/IAutoMovieScanJointRom.ts#IAutoMovieScanJointRom

## @evidence contracts/development/common.md#meaningful-documentation

States the two kinds of part a fault can name.

## @evidence contracts/development/design.md#principled-representation

A closed union of the three clinical axis names a joint pose carries and `swing`, the coupling of flexion and abduction that belongs to no single axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four literals, one for each check the scan runs; the gate maps each to its message and the ranking ignores it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

String literals rather than `string`, so a caller's switch over the parts is checked for exhaustiveness.

# src/pose/IAutoMovieScanJointRom.ts#IAutoMovieScanJointRom.Part

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieScanJointRom.Part: What a fault is measured on.

## @evidence contracts/development/design.md#principled-representation

One named type, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieScanJointRom contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
