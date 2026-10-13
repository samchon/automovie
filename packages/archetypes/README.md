# @automovie/archetypes

The catalogue of primitive model archetypes and gait tables that a production may register. Each archetype is a parameter schema with bounds and a deterministic geometry builder; each gait table is data the engine's gait machinery binds onto a skeleton.

It is the one package where pre-made definitions live, and only because no product package depends on it: `interface`, `engine`, and `viewer` never import it, and `production` registers it as a default a host replaces.

## Use

```bash
npm install @automovie/archetypes
```

```ts
import {
  AUTOMOVIE_PRIMITIVE_ARCHETYPES,
  createAutoMovieArchetypeRegistry,
} from "@automovie/archetypes";

const registry = createAutoMovieArchetypeRegistry(AUTOMOVIE_PRIMITIVE_ARCHETYPES);
```

## What may enter

An entry is a definition (a schema with a builder, or a table the engine reads), never finished content for one production's subject, and never a stand-in for a capability the engine lacks. Removing it must cost a production only its own choice.
