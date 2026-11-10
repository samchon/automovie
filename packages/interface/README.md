# @automovie/interface

The authoring AST of AutoMovie: the TypeScript types a coding agent fills in, through function calling or structured output, and that every other package reads. It has no runtime code and no dependency.

The types are loose on purpose, because the agent has to be able to fill in every one of them. Fields are plain `string` and `number` with their units and ranges written in JSDoc, and a value from a fixed set is a closed union. `@automovie/engine` enforces the ranges at runtime.

## Use

```bash
npm install @automovie/interface
```

```ts
import type { IAutoMovieModel, IAutoMovieShot } from "@automovie/interface";
```

## Conventions

- Space is right-handed and y-up, as in glTF 2.0 and VRM 1.0. Lengths are metres, time is seconds, and normalized weights run from 0 to 1.
- Authored angles are degrees of an anatomical movement (flexion, abduction, twist). The engine converts them to bone-local quaternions.
- Interfaces are named `IAutoMovie*` and closed unions `AutoMovie*`. An absent value is `T | null` with its meaning in JSDoc, not an optional field.

## Where to look

All types are exported from the package root. Start from `IAutoMovieModel` for a figure or prop and `IAutoMovieShot` for a shot.
