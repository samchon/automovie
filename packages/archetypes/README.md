# @automovie/archetypes

Build coarse objects for an AutoMovie scene. Each model includes named affordances such as seats, grips and surfaces so a motion can target the same geometry the viewer draws.

## Start

Use Node.js 22.23.2 or later.

```powershell
npm install @automovie/archetypes
```

```ts
import { AutoMovieArchetypeSeat } from "@automovie/archetypes";

const chair = AutoMovieArchetypeSeat.create({ kind: "dining" }, 31);
console.log(chair.affordance("seat").frame);
```

A seed selects dimensions within the producer's documented ranges. Keep the seed and package version to reproduce the model.

## Entry points

Find the object and the contact your scene needs.

- Choose a producer in the [object catalogue](https://samchon.github.io/automovie/archetypes/).
- Use `affordance` or `site` to read a named contact and `articulate` to apply joint travel.
- Use `AutoMovieMotionHumanObject` from [`@automovie/motions`](https://github.com/samchon/automovie/tree/master/packages/motions) to place a contact in a performance.

Producer types and JSDoc describe the dimensions, frames and available sites. [API reference](https://samchon.github.io/automovie/api/).
