# @automovie/archetypes

Ready-made figures and props for AutoMovie scenes. Each function takes a few named dimensions and returns one `IAutoMovieModel` that a film references directly, so a production can stage and move something before it has modelled anything of its own.

```bash
npm install @automovie/archetypes
```

```ts
import { createAutoMovieStickman } from "@automovie/archetypes";
import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

const figure: IAutoMovieModel = createAutoMovieStickman({
  id: "figure",
  height: 1.8,
  headRadius: 0.16,
  limbRadius: 0.06,
  material: {
    id: "body",
    name: null,
    baseColor: srgbHexToLinearColor("#d7b56d"),
    metallic: 0,
    roughness: 0.8,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
  },
});
```

| Function | Returns |
| --- | --- |
| `createAutoMovieStickman` | A stick figure of thirteen bones and thirteen primitive parts, sized by height, head radius and limb radius |
| `createAutoMoviePrimitiveProp` | A model without a skeleton, made of one primitive shape |

Dimensions are in metres. A value outside its range is refused; `IAutoMovieStickmanProps` and `IAutoMoviePrimitivePropProps` state the ranges.

Human motion tables are not here. `@automovie/motions` owns them.
