# Parameters

## Physical Meaning

Expose named measurements, physiological motions, facial controls and closed-set appearance choices. Geometry consumes resolved detailed inputs, never user-authored vertices, curve controls, cages or patches. Each channel changes one named trait with a declared direction, neutral and supported range; paired features have explicit left and right meanings.

Use millimetres for lengths, breadths, depths, girths and spatial offsets. State other dimensions explicitly, such as angle units or dimensionless ratios; do not label every quantity millimetres. Keep independent physical measurements independent instead of deriving them all from stature or a single build control.

Compare the reference control's meaning, unit, neutral, range, affected region and dependencies with the proposed Human control. Preserve useful semantics without duplicating inefficient reference nesting or storage. Separate requested values, saved controls, resolved detailed inputs, measured geometry and unknowns. Do not reconstruct an unrecorded control from the resulting shape.

## Structure And Storage

Keep the current Human surface limited to pure parameter and type declarations, excluding runtime implementation, arbitrary string-keyed `Record` contracts, unnecessary catalogues or version fields, qualification records, regression-coefficient helpers and contracts used only by discarded implementations.

Define named interfaces in `structures`, with major parts such as eye, nose and eyebrow each owning one file and interface rather than hiding under a namespace, and use actual concepts such as `Eye`, `Nose` or `Surface` instead of mechanically appending `Measurements`; inline object-literal types and property-index expressions standing in for named domain types are forbidden.

Use the shared `IAutoMovieHumanPair<T>` interface with `left: T` and `right: T`, name paired properties explicitly such as `eyePair`, and place coupled physical quantities such as inter-eye distance separately on the parent rather than introducing redundant part-specific pair aliases.

Put required closed domain choices in `typings` as `export const enum`, and reserve `constants` for genuinely required fixed values without adding unused constant catalogues.

Simple traits are deterministic converters into detailed parameters and do not reach modeling. Save the resolved detailed state needed to reproduce the model. Human exposes its output model to `interface`, rather than embedding Human modeling recipes in films.

## Admission And Influence

State physical bounds and dependencies from supported evidence. Reject an impossible combination with its cause while preserving the caller's requested state; retain uncertainty where a physiological bound is not established instead of inventing one.

Map each geometric control to the principal axes, layers, features and common rules it affects. Verify the resulting measurement, neighboring boundaries, interactions and return to the starting state through [Verification](verification.md). A parameter type or converter alone does not establish an implemented shape response.
