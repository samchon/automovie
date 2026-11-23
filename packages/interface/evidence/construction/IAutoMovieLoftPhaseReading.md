# src/construction/IAutoMovieLoftPhaseReading.ts#IAutoMovieLoftPhaseReading

## @evidence contracts/development/design.md#principled-representation

Both vectors use the chain's world frame, with position in mm and derivative in mm per radian of its declared polar or correspondence phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Cap, LoftPoint and LoftChain readers publish this same world point/tangent pair without implying a physical-station jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero tangent at a true pole describes its constant phase value and supplies no invented station jet or regularity certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States world units, fixed station, result ownership, collapsed-tip behavior and numeric failure ownership.
