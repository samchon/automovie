# src/physics/preparePhysicalDisturbanceSpan.ts#preparePhysicalDisturbanceSpan

## @evidence contracts/development/common.md#meaningful-documentation

States the branch points, each closed form between them with its IHMC source, the controller's law and constraint, the centre of mass's integration and the swing curve.

## @evidence contracts/development/implementation.md#principled-implementation

The capture point under a held pivot is `CapturePointTools.computeDesiredCapturePointPosition`; the centre of mass under a constant pivot and under a cubic is `CoMIntegrationTools.integrateCoMPositionWithConstantCMP` and `integrateCoMPositionOverPolynomial` (201903 l.355-370); the plans are the ported `physicalIcpPlanner` builders read as their closed forms; the trigger and footstep are the ported push recovery's; the gains are Zulu's (`physicalIcpController.ZULU`).

## @evidence contracts/development/implementation.md#efficient-algorithms

Every piece and branch point is laid once when the span is prepared; a sample finds its piece and evaluates exponentials and polynomials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plans are built once per span and their closed forms are evaluated, never rebuilt.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains only the prepared pieces the returned span closes over.

# src/physics/preparePhysicalDisturbanceSpan.ts#preparePhysicalDisturbanceSpan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the input, the feet, the branch points, the sample and the span.

## @evidence contracts/development/design.md#principled-representation

The state after the push as world floor points and the response as a pure function of time.