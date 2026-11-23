# src/production/IAutoMovieShotPredicate.ts#IAutoMovieShotPredicate

## @evidence contracts/development/design.md#principled-representation

Joint-angle reads degrees on a declared rig bone and semantic axis, position reads one world-meter coordinate, and distance takes the Euclidean norm between spatial operands; all compose with the shared absolute-tolerance comparison.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three discriminated measurement arms reuse one scalar comparison contract, keeping operand-specific fields required only where their measurement consumes them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing nodes, rigs, bones, motions or formations, nonfinite measurements and any measurement exception produce a failing null result; the broad catch does not identify the underlying cause. A missing pose joint means zero rest only after the rig's bone existence is verified.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each measurement family, typed operands, joint axis and degree or world-meter units inherited by the scalar expectation.
