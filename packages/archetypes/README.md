# @automovie/archetypes

Typed producers of shipped model groups. Each producer takes named dimensions and returns one `IAutoMovieModel`, the group a film references directly. The humanoid gait tables moved to `@automovie/motions`.

Shipped figure and prop definitions belong here. `interface`, `engine`, and `viewer` stay independent of this catalogue.

## Use

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

| Export | Returns |
| --- | --- |
| `createAutoMovieStickman` | A thirteen-bone primitive figure scaled by height, head radius and limb radius. |
| `createAutoMoviePrimitiveProp` | A skeletonless model of one primitive shape. |

## What may enter

An entry is a typed producer or a table the engine reads, never finished content for one production's subject, and never a stand-in for a capability the engine lacks. Removing it must cost a production only its own choice.
