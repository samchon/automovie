import { IAutoMovieCompiledInstanceSet } from "@automovie/interface";

/** Compact compiled set fixture with enough facts for exact slot regeneration. */
export const subjectInspectionInstanceSet: (props: {
  id: string;
  model: string;
  count: number;
  overrides?: Partial<IAutoMovieCompiledInstanceSet>;
}) => IAutoMovieCompiledInstanceSet = (props: {
  id: string;
  model: string;
  count: number;
  overrides?: Partial<IAutoMovieCompiledInstanceSet>;
}): IAutoMovieCompiledInstanceSet =>
  ({
    version: 1,
    id: props.id,
    count: props.count,
    modelRecipe: props.model,
    layout: {
      kind: "grid",
      rows: 1,
      columns: Math.max(1, props.count),
      spacing: { x: 1, z: 1 },
    },
    route: null,
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 17,
    variation: {
      scale: { min: 1, max: 1 },
      palette: ["#ffffff"],
      traits: [],
    },
    bounds: {
      min: { x: -(props.count - 1) / 2, y: 0, z: 0 },
      max: { x: (props.count - 1) / 2, y: 0, z: 0 },
    },
    centroid: { x: 0, y: 0, z: 0 },
    projectionRadius: 1,
    chunks: [],
    lod: [
      {
        tier: "near",
        maxDistance: null,
        recipe: props.model,
        recipeDigest: `sha256:${"1".repeat(64)}`,
        model: props.model,
      },
    ],
    digest: `sha256:${"2".repeat(64)}`,
    ...props.overrides,
  }) as unknown as IAutoMovieCompiledInstanceSet;
