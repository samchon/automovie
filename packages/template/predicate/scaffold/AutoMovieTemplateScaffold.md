# src/scaffold/AutoMovieTemplateScaffold.ts#AutoMovieTemplateScaffold.create

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the three installation outputs, the relative forward-slash keys, the caller's write ownership and the refused-name, unreadable-input and collision failures. The input type defines the name trim and workspace child depth.

## @evidence contracts/development/implementation.md#principled-implementation

The generator admits the name before reading any layer. Standalone and workspace roots use the shared instructions. The content layer comes from the requested kind. The generator then adds workspace settings to roots and Evidence settings to production projects, with a skills path that matches each installation's layout. It expands shared skills from prepared package inputs and refuses two sources with the same target path. One replacement callback copies either the admitted name or the skills path as literal text. A name that contains a dollar replacement or another token therefore survives the generated manifest.

## @evidence contracts/development/implementation.md#efficient-algorithms

The generator walks the selected layers in deterministic order once per request. It prepares one returned map, reads and normalizes each included file once and reads a prepared section only when the current skill transcludes it. File traversal and text volume dominate work. The synchronous reads close their files and the returned map retains the generated strings. The generator keeps no result or open handle between calls.

# src/scaffold/AutoMovieTemplateScaffold.ts#AutoMovieTemplateScaffold.renderWorkspace

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc distinguishes initial settings from completion of existing YAML. It names the new-workspace globs, missing-entry policy, linked SDK fallback, byte-stable no-change case and the file and mapping failures.

## @evidence contracts/development/implementation.md#principled-implementation

New roots serialize the prepared catalog ranges and build policy. A workspace adds member globs for shorts, series and shared packages. For existing settings, the updater parses YAML with merge support and validates maps before editing them. It copies only the required inherited or shared map nodes before adding missing entries. An explicit override prevents guessing a linked sibling. Otherwise a link is used only when a discovered sibling's manifest identifies the requested package. Existing member lists, overrides and populated catalog values keep their meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

New roots read the prepared settings and template version once. Existing settings parse one document and collect linked-package directories once. Only missing scoped SDK catalog entries search those directories. The updater serializes only when it inserts entries. Its document, candidate links and synchronous file reads belong to the call and it returns the text without retaining a cache.

# src/scaffold/AutoMovieTemplateScaffold.ts#AutoMovieTemplateScaffold.assertProjectName

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines trimming and the directory-segment refusal conditions. The caller receives the admitted name used by the scaffold, whose check covers path syntax.

## @evidence contracts/development/implementation.md#principled-implementation

The name check trims first. It rejects an empty result, relative dot segments, a trailing dot, reserved path characters, controls below U+0020 and the device-name pattern. Applying the checks after trimming closes the same admission boundary for a raw name and its whitespace-padded form.

## @evidence contracts/development/implementation.md#efficient-algorithms

Trimming and the bounded set of syntax checks scan the input string, with work proportional to its length. The function returns one string and does not access files or retain state.
