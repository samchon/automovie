# src/pose/IAutoMovieScanJointRom.ts#IAutoMovieScanJointRom.Part

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieScanJointRom.Part: What a fault is measured on.

## @evidence contracts/development/design.md#principled-representation

One named type, so its readers share one spelling of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieScanJointRom contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
