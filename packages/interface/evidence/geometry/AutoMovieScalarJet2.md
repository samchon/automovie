# src/geometry/AutoMovieScalarJet2.ts#AutoMovieScalarJet2

## @evidence contracts/development/common.md#meaningful-documentation

Specifies derivative order, unscaled second derivative, component units, parameter ownership and mutability.

## @evidence contracts/development/design.md#principled-representation

Three labelled entries encode a univariate order-two jet; finiteness, differentiability and the parameter domain remain the producing numerical operation's obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Human ArmJet arithmetic, FootConnection physical-station derivatives and TrunkQuadrant scalar derivatives use this common mathematical representation while their APIs retain the independent-parameter meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tuple does not hide Taylor normalization or reinterpret three independent coordinates as derivatives; no dimension tag or numerical validator is invented.
