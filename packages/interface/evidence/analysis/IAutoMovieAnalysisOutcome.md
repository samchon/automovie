# src/analysis/IAutoMovieAnalysisOutcome.ts#IAutoMovieAnalysisOutcome

## @evidence contracts/development/design.md#principled-representation

A discriminated union on status exposes results only on the solved arm; run validation requires at least one metric with unique keys, at most AUTOMOVIE_ANALYSIS_MAX_SAMPLES samples keyed to present-valued metrics, and nonblank reason/remedy on negative arms. Solved may contain only gapped metrics and therefore need not represent a successful numerical measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three inline arms with no shared base type, since the negative arms share only two strings and the run digest serializes them as one reason-remedy pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty solved result and unknown status are refused; missing resident result slots are visited explicitly. The validator assumes declared nested containers and does not reject extra properties, so negative-arm result exclusion is a type contract rather than exact-key runtime admission.

## @evidence contracts/development/common.md#meaningful-documentation

Gives what each arm means, which arm may hold results, the metric, sample and warning bounds of a solved run, and the relation to the design-observation outcome.
