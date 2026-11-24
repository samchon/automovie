# src/production/sound/IAutoMovieLoudnessIntent.ts#IAutoMovieLoudnessIntent

## @evidence contracts/development/common.md#meaningful-documentation

States the measurement each value refers to and its unit, who applies the targets and checks them, the EBU R 128 fallback, the dialogue default and the runtime refusals.

## @evidence contracts/development/design.md#principled-representation

Loudness in LUFS, tolerance in LU and true peak in dBTP, all BS.1770-5 quantities. The required members are the three a release specification states; `dialogueLufs` is optional because most specifications set one programme target. Non-finite values and a negative tolerance are refused at runtime by engine's `resolveProductionLoudness` and render's delivery audit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns it. The delivery intent declares it; engine's mixer levels dialogue to it and the master stage meets it; the delivery audit checks the decoded file against it; the render report records it. Every member has a reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record serves the mix and the delivered check, so the two cannot disagree; no member names one specification.
