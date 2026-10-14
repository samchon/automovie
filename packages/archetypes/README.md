# @automovie/archetypes

The catalogue of primitive model archetypes and gait tables that a production may register. Each archetype is a parameter schema with bounds and a deterministic geometry builder; each gait table is data the engine's gait machinery binds onto a skeleton.

Shipped figure and prop definitions belong here. `interface`, `engine`, and `viewer` stay independent of this catalogue; `production` registers it as the default and accepts a host's replacement registry.

## Use

```bash
npm install @automovie/archetypes
```

```ts
import {
  AUTOMOVIE_PRIMITIVE_ARCHETYPES,
  type AutoMovieModelArchetypeRegistry,
  createAutoMovieArchetypeRegistry,
} from "@automovie/archetypes";

const registry: AutoMovieModelArchetypeRegistry = createAutoMovieArchetypeRegistry(
  AUTOMOVIE_PRIMITIVE_ARCHETYPES,
);
```

## What may enter

An entry is a definition (a schema with a builder, or a table the engine reads), never finished content for one production's subject, and never a stand-in for a capability the engine lacks. Removing it must cost a production only its own choice.
