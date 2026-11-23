# src/dressing/dressTurn.ts#dressTurn

## @evidence contracts/development/common.md#meaningful-documentation

States what is chosen, the miss it is judged by, the inputs with their frames and units, and the returned unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each turn places the wearable on the region (`HumanWorn`), undoes the rigid hold to find the wrist's goal (`dressTurn.carried`), fits the whole posture to it within the joints' ranges (`resolveHumanPosture.seeded`) and measures how far the achieved wear point lies from the region; the turn is a wrapped freedom chosen by the shared chooser (`HumanFreedomChoice`), so the arm's limits, not a typed angle, decide it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed site, one miss per turn and the chooser.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The miss is measured on the fitted pose against the region's own point; no tolerance or turn is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

The wear socket, the region and its alignment are read once (`HumanWorn.prepareSite`); each turn costs one elbow hint, one posture fit and one hand read, and a turn tried twice is judged once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The site is shared because the body, the posture, the wearable and the region are fixed for the call; the misses are keyed by the turn alone, the only input that varies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The site, the misses and the pose workspace live until return or throw; only the turn escapes.
