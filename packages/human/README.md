# @automovie/human

Prepare a person's skeleton, joints and contact profile from typed measurements. Use that body with `@automovie/motions` to perform actions and `@automovie/render` to draw them.

## Start

Use Node.js 22.23.2 or later.

```powershell
npm install @automovie/human @automovie/interface
```

Import Human input and vocabulary types from `@automovie/interface`. Pass `IAutoMovieHumanParameters` to `AutoMovieHumanCanonicalBody.prepare`. Use `place` to read joint placements for a pose. The parameter types describe the required body and head measurements. For typia, use the [schema types](https://github.com/samchon/automovie/blob/master/packages/human/src/schema/README.md).

## Polygon man

Use `AutoMovieHumanCanonicalBody.display` to supply the rest or posed body to `AutoMovieRenderHumanPolygon.build` from `@automovie/render`. Apply `AutoMovieHumanCanonicalBody.REFLECTION` to the returned figure's parent to place the drawing in canonical world coordinates.

## Inspection

The checkout's Human subject module is `src/executable/subjects.ts`. From `packages/human`, run `pnpm inspect --subject f1` to open it in the inspector. For stills, install Chromium once from the checkout root with `pnpm exec playwright-core install chromium-headless-shell`.

Capture builds the full mesh before drawing. From `packages/human`, give it a ten-minute per-call budget.

```powershell
pnpm capture --subject f1 --at 0 --timeout-ms 600000
```

See the [Human selector reference](https://github.com/samchon/automovie/blob/master/packages/human/docs/inspection.md) for part paths and construction marks.

See the [research notes](https://github.com/samchon/automovie/tree/master/packages/human/docs) for the anatomy and geometry behind the generator.
