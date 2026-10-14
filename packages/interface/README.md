# @automovie/interface

The authoring AST of AutoMovie: the pure TypeScript types an LLM emits through function calling and structured output, and that every other package reads. It has no runtime code and no dependency.

Types stay rough on purpose: plain `string` and `number` fields with units and ranges stated in JSDoc, and closed `AutoMovie*` unions where a value comes from a fixed set. `@automovie/engine` enforces the ranges at runtime.

## Use

```bash
npm install @automovie/interface
```

```ts
import type { IAutoMovieShot, IAutoMovieModel } from "@automovie/interface";
```

## Conventions

- Space is right-handed and y-up, as in glTF 2.0 and VRM 1.0; lengths are metres, time is seconds, and normalized weights run from 0 to 1.
- Authored angles are semantic degrees (flexion, abduction, twist); the engine converts them to bone-local quaternions.
- Interfaces are named `IAutoMovie*` and closed unions `AutoMovie*`; an absent value is `T | null` with its meaning in JSDoc, not an optional field.

## Domains

`core`, `geometry`, `skeleton`, `pose`, `motion`, `model`, `material`, `expression`, `scene`, `cinematics`, `authoring`, `harness`, `production`, `render`, `validation`, `architecture`, `service`, `analysis`, `drawing`, `soft`, `fluid`, and `color`, one folder per domain.
