# src/scaffold/IAutoMovieTemplateScaffoldProps.ts#IAutoMovieTemplateScaffoldProps

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states what each kind installs and when the name is trimmed. It identifies the shared workspace location assumed by the child layout.

## @evidence contracts/development/design.md#principled-representation

The kind union names each distinct layout, and every layout supplies the same required name. The generator checks path syntax once before using the name in any generated file. The CLI chooses the workspace family and location before it requests a child map.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kind selects the files and the name supplies their metadata. The request carries no file writer, install directory or version override because the generator builds relative files from the installed template. The CLI owns destination and write policy.

# src/scaffold/IAutoMovieTemplateScaffoldProps.ts#IAutoMovieTemplateScaffoldProps.kind

## @evidence contracts/development/common.md#meaningful-documentation

The member lists the three accepted kinds and identifies the files or shared roots each supplies. The child documentation names the workspace depth that its generated relative path assumes.

# src/scaffold/IAutoMovieTemplateScaffoldProps.ts#IAutoMovieTemplateScaffoldProps.name

## @evidence contracts/development/common.md#meaningful-documentation

The member explains when the name is trimmed and that its remaining text is used as supplied. The generator documents the admission failure and the test checks literal metadata.
