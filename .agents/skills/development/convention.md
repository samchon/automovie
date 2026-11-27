# Conventions

These conventions apply to `packages/`.

## Names

Use PascalCase for top-level public names with the owning package in the prefix, as in `AutoMovieEngine`. Only `@automovie/interface` omits the package name.

Use camelCase for methods and utility functions, and PascalCase for React components. Prefix interfaces and other public object contracts with `I`.

## Layout

- Put public declarations in `packages/*/src/<topic>/<name>.ts`.
- Put private code and types in `packages/*/src/<topic>/<folder>/<name>.ts`.

Group public SDK operations in classes or namespaces. Use one namespace block per owner. Put related methods and types directly on their owner or in a separate named owner.

## Declarations

- Put exports above private declarations.
- Annotate variable, parameter, and return types.
- Declare named functions with `function` and write each signature once.

Rare curried arrows may infer the function type. Annotate their parameters and final return type.

Name object types. Give each object variant in a union a named interface with a literal discriminant. Use `type` for a new tag.

## Comments

Document public declarations and public members with JSDoc.
[Documentation](../documentation/SKILL.md) applies to all JSDoc.

Private declarations need neither JSDoc nor Evidence. Use ordinary comments
to explain non-obvious logic and why it takes that approach. Record the
assumptions and invariants future changes must preserve.

Keep upstream references next to the code that uses them.
