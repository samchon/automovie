# src/IViewerCameraStateSnapshot.ts#IViewerCameraStateSnapshot

## @evidence contracts/development/design.md#principled-representation

The record contains copied native lens, TRS, layers and projection state for detached auto-updating PerspectiveCamera or OrthographicCamera. Restore takes this typed record and checks only its values (finite, nondegenerate, native projection parity) against a native candidate; the compiler owns its shape, so no runtime type check reads it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named transfer record exposes the existing camera payload so another exported transfer can name its return type. It introduces no alternate camera solver or new fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Lens discriminants retain the two supported native classes; projection arrays are not accepted as a shortcut around lens parity, and parent relationships are not guessed.

## @evidence contracts/development/common.md#meaningful-documentation

Fields state local vector and quaternion order, metre/millimetre/degree units, layer mask and view offset optionality. The comment identifies the runtime admission owner.
