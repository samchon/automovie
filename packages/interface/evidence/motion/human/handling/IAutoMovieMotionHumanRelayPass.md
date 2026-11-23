# src/motion/human/handling/IAutoMovieMotionHumanRelayPass.ts#IAutoMovieMotionHumanRelayPass

## @evidence contracts/development/common.md#meaningful-documentation

baton: The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. hand: The passing hand of both runners; `right` when absent. zone: The takeover zone's entry and exit lines, world metres; the pass at `at` must fall between them (TR24.19); unchecked when absent.

## @evidence contracts/development/design.md#principled-representation

baton: The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. hand: The passing hand of both runners; `right` when absent. zone: The takeover zone's entry and exit lines, world metres; the pass at `at` must fall between them (TR24.19); unchecked when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/relayPass.ts (relayPass.plan, context); handling/relayPass.ts (relayPass.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanRelayPass.ts#IAutoMovieMotionHumanRelayPass.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The role, the partner, the baton and the shared instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The instant is stated, so both roles agree without reading each other's plan.

# src/motion/human/handling/IAutoMovieMotionHumanRelayPass.ts#IAutoMovieMotionHumanRelayPass.IZone

## @evidence contracts/development/common.md#meaningful-documentation

States both lines, their frame and the rule they carry.

## @evidence contracts/development/design.md#principled-representation

Two world-metre floor points on the lane's middle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two points `relayPass.plan` projects the runner onto.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No zone length is stated: it is the distance between the lines the author places.
