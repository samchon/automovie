# src/render/capture/IAutoMovieCaptureFolderOpenProps.ts#IAutoMovieCaptureFolderOpenProps

## @evidence contracts/development/design.md#principled-representation

AutoMovieCaptureFolder.open removes trailing slashes from root and rejects an empty result. It checks the compared complete record and foreign entries before deleting prior owned files.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieCaptureFolder.open exchanges storage, root, round, compare; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Round-name admission belongs to capture request parsing; the factory does not independently validate round path syntax.

## @evidence contracts/development/common.md#meaningful-documentation

Storage and round identities used to prepare one capture folder. The prose and members document how AutoMovieCaptureFolder.open interprets and admits these values.
