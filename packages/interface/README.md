# @automovie/interface

The authoring AST of AutoMovie: the TypeScript types an LLM fills in through function calling or structured output, and that every other package reads. It contains types only, with no runtime code and no dependency.

The types are rough on purpose. Fields are plain `string` and `number` with their units and ranges written in JSDoc, and a value from a fixed set is a closed `AutoMovie*` union. `@automovie/engine` enforces the ranges at runtime.

```bash
npm install @automovie/interface
```

```ts
import type { IAutoMovieModel, IAutoMovieShot } from "@automovie/interface";
```

## Conventions

- Space is right-handed and y-up, as in glTF 2.0 and VRM 1.0. Lengths are metres, time is seconds, and normalized weights run from 0 to 1.
- Authored angles are semantic degrees (flexion, abduction, twist). The engine converts them to bone-local quaternions.
- Interfaces are named `IAutoMovie*` and closed unions `AutoMovie*`. An absent value is `T | null` with its meaning in JSDoc, not an optional field.

## Where to look

The source has one folder per domain, all re-exported from the root. Start from `IAutoMovieModel` for a figure or prop and `IAutoMovieShot` for a shot.
