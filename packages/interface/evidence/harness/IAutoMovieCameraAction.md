# src/harness/IAutoMovieCameraAction.ts#IAutoMovieCameraAction

## @evidence contracts/development/design.md#principled-representation

performShot sorts frame starts and checks overlap, then compileCameraMove fits supplied subject height/radius by the pinhole vertical/horizontal bounds along staged bearing. Orbit/push/truck use eight eased segments, follow samples at 4 Hz with optional future aim while translation uses the current sample, and whip turns within 0.2 seconds; linear keys approximate these paths, and opening rest/proxy extents are not a measured visible-pixel enclosure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Framing, move and subject are closed choices the solver understands; the lens intents are optional fields copied into `shot.cameraIntent` instead of a separate lens record the solve would also have to ignore.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Focus, focalLength and fNumber leave the deterministic solve unchanged; a directly rendered film draws depth of field from the recorded focus and fNumber through resolveAutoMovieLensAt, with an aperture taken from the camera's field of view rather than focalLength. Missing/invalid aspect uses a square-fit fallback at the low-level compiler, close keys within 1e-9 seconds merge with later values, and ordinary focus is resolved at the shot opening and a timed pull records its two marks without continuous lens tracking.

## @evidence contracts/development/common.md#meaningful-documentation

States the camera-as-actor model, every refusal about actor, live camera, overlap and target kind, what `"auto"` means here, and the owner of each move's path; members give the closed values, units, bounds and that the lens fields only reach `shot.cameraIntent`.
