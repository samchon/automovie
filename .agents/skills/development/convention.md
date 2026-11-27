# Conventions

## Names

Publish runtime APIs as classes or non-callable namespaces.

Use PascalCase for top-level public names and include the owning package in the prefix, as in `AutoMovieEngine`. Only `@automovie/interface` omits the package name.

Use camelCase for methods and standalone functions.

## Folders

Use `src/<topic>/` for public API files and `src/<topic>/<subfolder>/` for internal implementation, including private functions. Group shared types and values under their owning topic.

Outside barrels, export one symbol named after its file. Export internal declarations only for cross-module imports and keep them out of public entry points.

## Coding style

Put exports above private declarations in files and namespaces.

Annotate variable, parameter and return types explicitly. Declare named functions with `function` and write each signature once. Infer the function type only for rare curried arrows, with explicit parameter and final return types.

Use named object types. Tag variants with a literal `type`.

## JSDoc

Document public exports and members with JSDoc. Apply the [writing rules](../documentation/SKILL.md) to all JSDoc.
