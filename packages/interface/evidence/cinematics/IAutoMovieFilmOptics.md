# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics

## @evidence contracts/development/design.md#principled-representation

Exposure is stated as EV100, the unit a light meter and #4077's incident meter speak, and its mapping to scene luminance in nits is the ISO 12232:2019 saturation-based one; white balance is a colour temperature in kelvin on the Planckian locus; glare is a fraction of energy and the grade is the ASC CDL v1.2 operator set, so each field is the quantity a cinematographer states. Optional fields skip their step. The shutter is an angle in degrees and the lens a stop and a focused depth in metres, with the sample count that integrates them; the issue's pairing rule (samples present exactly with a shutter or a lens) is not expressible as a type without a discriminated union that would double every combination, so it is stated in the field documentation with the ranges. The tuple types fix three channels; finiteness, the kelvin range, the glare range and the positive power are the author's documented contract, and the engine runs no runtime check of them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface package owns the contract; the engine admits it and computes its closed forms, and render's film response stage, the draw host and the inspector read it through `IAutoMovieDrawScene.optics`. The curve reuses `IAutoMovieSceneEnvironment["toneMapping"]`, so one curve name means one curve in both passes. The final pass reads the response fields; the draw host reads samples, shutter and lens through `planAutoMovieFilmSamples`, and the film fills lens from `resolveAutoMovieLensAt`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a film, a scene or a test case. Absent optional fields, rather than neutral sentinel values, mean that a step is skipped, which is how an absent grade and an identity grade stay distinguishable to a reader while drawing the same frame.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it and when, the order of the final pass, which draws sample a shutter and a lens and how, each field's unit, range and absent meaning, the cited standards, and which runtime owner refuses a value.

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

# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics.IShutter

## @evidence contracts/development/design.md#principled-representation

The shutter angle in degrees within (0, 360], the quantity a film camera states; the open interval follows from it and the frame rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sample planner reads `angle`; no phase or curtain shape is exposed, since the interval always trails the frame's second.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present; the range is checked at runtime.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the range and its meaning as a share of the frame interval.

# src/cinematics/IAutoMovieFilmOptics.ts#IAutoMovieFilmOptics.ILens

## @evidence contracts/development/design.md#principled-representation

The f-number and the focused depth along the camera's forward axis in metres, the two values a thin lens's blur needs beside the field of view.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sample planner reads `fNumber` and the draw host's shear reads `focusDistance`; `resolveAutoMovieLensAt` produces it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The authored focal length is deliberately absent: the aperture follows the camera's actual field of view.

## @evidence contracts/development/common.md#meaningful-documentation

States both units and ranges and the depth's axis.