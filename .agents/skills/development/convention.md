# Conventions

These conventions apply to `packages/`.

## Names

Use PascalCase for top-level public names with the owning package in the prefix, as in `AutoMovieEngine`. Only `@automovie/interface` omits the package name.

Use camelCase for methods and utility functions, and PascalCase for React components.

Prefix interfaces and other public object contracts with `I`.

## Folders

- Put public declarations in `packages/*/src/<topic>/<name>.ts`.
- Put private code and types in `packages/*/src/<topic>/<folder>/<name>.ts`.

## Exports

Outside barrels, export one symbol named after its file.

Export private declarations only for cross-module imports. Keep them out of public entry points.

Use `export *` in public barrels for matching single-export files.

## Owners

Publish SDK operations in classes or non-callable namespaces. Use one namespace block per owner, with no nesting. Put related methods and types directly on their owner or in a separate named owner.

## Declarations

- Put exports above private declarations.
- Annotate variable, parameter, and return types.
- Declare named functions with `function` and write each signature once.

Rare curried arrows may infer the function type. Annotate their parameters and final return type.

Name object types. Give each object variant in a union a named interface with a literal discriminant. Use `type` for a new tag.

## Comments

Document public exports and members with JSDoc. Public exports are reachable through the package export map or a public barrel.

Apply the [writing rules](../documentation/SKILL.md) to all JSDoc.

Internal implementations and import-only exports require neither JSDoc nor Evidence.

Use ordinary comments for necessary internal explanations and upstream provenance.
