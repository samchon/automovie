# src/human/generation/hand/IAutoMovieHumanHandPosture.ts#IAutoMovieHumanHandPosture.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Flexion ranges, degrees, AAOS (`docs/anatomy/joint-range.md`): finger MCP, finger PIP, thumb MCP, thumb IP.

## @evidence contracts/development/design.md#principled-representation `fingerMcp`: AAOS active flexion range at the finger mcp, degrees; the resting posture uses the observed resting share of this range. `fingerPip`: AAOS active flexion range at the finger pip, degrees; the resting posture uses the observed resting share of this range. `thumbMcp`: AAOS active flexion range at the thumb mcp, degrees; the resting posture uses the observed resting share of this range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandPosture.IRange is the canonical exchange used by AutoMovieHumanHandPosture.RANGE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `fingerMcp`, `fingerPip`, `thumbMcp`, `thumbIp`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPosture.ts#IAutoMovieHumanHandPosture.IThumbRestResult

## @evidence contracts/development/common.md#meaningful-documentation

The thumb's MCP and IP bind turns toward the palm, in degrees from each incoming segment. Their basis is the public HM08 rig recorded in the Human hand anatomy note.

## @evidence contracts/development/design.md#principled-representation `mcp`: Thumb MCP rest flexion, degrees. `ip`: Thumb interphalangeal rest flexion, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandPosture.IThumbRestResult is the canonical exchange used by AutoMovieHumanHandPosture.thumbRest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mcp`, `ip`; callers supply the complete record.
