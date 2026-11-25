# src/validation/IAutoMovieValidateSceneEnvironment.ts#IAutoMovieValidateSceneEnvironment.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admit environment image/background, intensity, exposure and shadow policy. Member documentation states the supplied records, units and absence meanings used by validateSceneEnvironment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The context uses only id/type/castShadow from canonical lights; omission means policy-shape validation, not a claim that every scene-light combination was checked.

## @evidence contracts/development/design.md#principled-representation

environment carries radiometric image/background and rendering policy, while optional admitted light traits enable contextual shadow-profile checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateSceneEnvironment.IProps, used by validateSceneEnvironment. Its environment, lights members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
