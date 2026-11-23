# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics

## @evidence contracts/development/design.md#principled-representation

Exposure is stated as EV100, the unit a light meter and #4077's incident meter speak, and its mapping to scene luminance in nits is the ISO 12232:2019 saturation-based one; white balance is a colour temperature in kelvin on the Planckian locus; glare is a fraction of energy and the grade is the ASC CDL v1.2 operator set, so each field is the quantity a cinematographer states. Optional fields skip their step. The tuple types fix three channels; finiteness, the kelvin range, the glare range and the positive power remain for `admitAutoMovieFilmOptics` at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns the contract; the engine admits it and computes its closed forms, and render's film response stage, the draw host and the inspector read it through `IAutoMovieDrawScene.optics`. The curve reuses `IAutoMovieSceneEnvironment["toneMapping"]`, so one curve name means one curve in both passes. Every field is read by the final pass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a film, a scene or a test case. Absent optional fields, rather than neutral sentinel values, mean that a step is skipped, which is how an absent grade and an identity grade stay distinguishable to a reader while drawing the same frame.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it and when, the order of the final pass, each field's unit, range and absent meaning, the cited standards, and which runtime owner refuses a value.

# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics.IGlare

## @evidence contracts/development/design.md#principled-representation

One energy fraction within [0, 0.2]; the kernel shape is fixed by the contract, so the only authored quantity is how much light the lens spreads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The final pass reads `strength`; nothing else varies per film.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No per-kernel weights are exposed, because the kernel is a fixed approximation of a lens point-spread function rather than a look a film tunes.

## @evidence contracts/development/common.md#meaningful-documentation

States the kernel, its weights, the energy-preserving blend and the range.

# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics.IGrade

## @evidence contracts/development/design.md#principled-representation

The four ASC CDL v1.2 operators in their published order, on encoded values, with channels as red, green and blue tuples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the operators the decision list defines; the final pass reads all four.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No operator outside the decision list is added, so a grade adopted elsewhere as CDL values transfers unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the clamp, the luma weights, the channel order and each operator's range.
