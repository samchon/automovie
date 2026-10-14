# Core gaps are fixed in core

## Decision

When `interface`, `engine` or `viewer` lacks what Human needs, it is never worked around inside Human. The gap is fixed from `../automovie@core` as its own pull request, merged to `master`, and taken into the campaign branch with `git pull origin master`.

## Reasons

- `interface` and `engine` grow toward representing every object and motion; a capability Human needs (morph targets, a skinning method, joint axes for fingers) is one every generated or imported figure can use.
- A workaround inside Human would make films depend on Human-specific behaviour, which breaks the rule that the only contract is the `IAutoMovieModel` output.
- A separate core pull request keeps the campaign pull request about Human and lets core review judge the general change on its own.

## Consequences

- `../core/gaps.md` lists each gap with its file, what is missing, why Human needs it and the smallest orthodox change. Each is filed as a core candidate and landed before the Human stage that needs it.
- The archetype recipe retirement (#2805) is already such a core change and is not repeated in the gap list.
