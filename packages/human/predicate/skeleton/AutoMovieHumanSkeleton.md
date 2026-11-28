# src/skeleton/AutoMovieHumanSkeleton.ts#AutoMovieHumanSkeleton.generate

## @evidence contracts/development/common.md#meaningful-documentation

The source identifies the one-shot entry, neutral default, clamping mode and returned bind and posed snapshots.

## @evidence contracts/development/implementation.md#principled-implementation

Compose the existing preparation and evaluator with params.pose or an empty neutral request. The same forward-kinematics and clamp rules serve both one-shot and prepared callers.

## @evidence contracts/development/implementation.md#efficient-algorithms

A one-shot request prepares one body and evaluates one pose. Repeated poses can reuse the public prepared evaluator.

# src/skeleton/AutoMovieHumanSkeleton.ts#AutoMovieHumanSkeleton.prepare

## @evidence contracts/development/common.md#meaningful-documentation

The source states body ownership, scale and optional surface work, as well as the independent snapshot and selected-bone capabilities.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve a positive stature, calibrate the same body and derive bind and neutral joints before preparing their clinical evaluator. Body scale is resolved stature over calibration stature, and position scale converts millimetres to metres. Full and projected callers use the same kinematic rules.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation computes body geometry and indexes once. Full evaluation copies rest and mutable placement snapshots. Projected evaluation reuses compiled selections and omits unused rest and exterior copies. Immutable foot courses can be shared.
