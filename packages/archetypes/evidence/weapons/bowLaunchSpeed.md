# src/weapons/bowLaunchSpeed.ts#bowLaunchSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' admitted ranges, units, brace zero, numerical underflow and explicit refusal cases.

## @evidence contracts/development/implementation.md#principled-implementation

Kooi's energy balance, `A = (m + K) v^2 / 2` (eq. 3.89, p. 77), with `A` the stored energy, the draw-force curve's integral from brace to the travel, and `K` the virtual mass of limbs and string, `m0 (1 - eta) / eta` from his efficiency `eta` at his arrow mass `m0` (eq. 3.90). The authored prototype curve is the one-parameter power law `F (x / X)^p` whose full-stroke energy is the prototype's stroke factor `q` times `F X`, `p = 1 / q - 1`, so `A(x) = q F X (x / X)^(1 / q)`; the source's native q instead normalizes by full draw D, so reusing its number for stroke X is an explicit uncalibrated prototype assumption. The curve and borrowed efficiency are provisional. If energy, squared speed or the travel ratio loses representability, the identical positive speed law is evaluated in logarithms of the original force, stroke, mass and travel, exponentiating only the final speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit mass and source mechanics, admit travel, then compute the stored energy, virtual mass and speed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid or out-of-range inputs are refused rather than clamped, and unread draw weight stays unknown. Kooi shows the virtual mass is not constant across arrow masses (pp. 78, 123); it is held at his arrow's, provisional for others. No force, efficiency or travel limit is tuned to a speed band.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
