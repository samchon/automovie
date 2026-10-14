import { deriveAutoMovieDrawing } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieDrawing,
  IAutoMovieDrawingLine,
  IAutoMovieDrawingView,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingPlace } from "./drawingFixtures";
import { nclose } from "./predicates";

/** Original sheet-set scenarios 7 and 8, with their existing operating-state and owner fixtures. */
export function test02DrawingSheetOperation(
  environment: IAutoMovieBuiltEnvironment,
  views: [string, IAutoMovieDrawingView][],
  facadeSpan: (
    drawing: IAutoMovieDrawing,
    owner: string,
  ) => { min: number; max: number },
): void {
  // 7. The operating state the scene stages is the one the sheet draws.
  const elevation: IAutoMovieDrawingView = views.find(
    ([name]: [string, IAutoMovieDrawingView]): boolean =>
      name === "north-elevation",
  )![1];
  const leafSpan: (travel: number) => { min: number; max: number } = (
    travel: number,
  ): { min: number; max: number } =>
    facadeSpan(
      deriveAutoMovieDrawing({
        environment: slidingDoor(environment, travel),
        view: elevation,
      }),
      "door-leaf",
    );
  TestValidator.predicate(
    "a leaf slid by its current state is drawn by exactly its travel",
    ((): boolean => {
      // The slide runs along the leaf's own x, which is world x here, and the
      // elevation's page right axis runs against world x.
      const rest: { min: number; max: number } = leafSpan(0);
      const slid: { min: number; max: number } = leafSpan(0.3);
      return (
        nclose(rest.min, -1.95) &&
        nclose(rest.max, -1.05) &&
        nclose(slid.min - rest.min, -0.3) &&
        nclose(slid.max - rest.max, -0.3)
      );
    })(),
  );

  // 8. A stroke's identity cannot be confused by text inside its fields.
  const ambiguous: IAutoMovieDrawing = deriveAutoMovieDrawing({
    environment: withAmbiguousOwners(environment),
    view: views[0]![1],
  });
  TestValidator.equals(
    "owners whose names share a separator keep their own strokes",
    ["y", "x|y"].map(
      (owner: string): boolean =>
        ambiguous.lines.filter(
          (line: IAutoMovieDrawingLine): boolean => line.owner === owner,
        ).length > 0,
    ),
    [true, true],
  );
}

/**
 * The same design with the front door's leaf on a slide, standing in a current
 * state that moves it `travel` metres along its own x.
 */
const slidingDoor: (
  environment: IAutoMovieBuiltEnvironment,
  travel: number,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
  travel: number,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  openings: environment.openings.map(
    (opening: IAutoMovieBuiltOpening): IAutoMovieBuiltOpening =>
      opening.id === "front-door"
        ? {
            ...opening,
            operation: {
              panels: [
                {
                  // The panel rectangle runs from the leaf's own origin, its
                  // centre, so the quarter that fits the void is declared.
                  id: "slide",
                  element: "door-leaf",
                  width: 0.4,
                  height: 1,
                  motion: {
                    kind: "prismatic" as const,
                    axis: { x: 1, y: 0, z: 0 },
                    min: 0,
                    max: 0.5,
                  },
                },
              ],
              states: [
                { id: "shut", panels: [{ panel: "slide", value: 0 }] },
                { id: "ajar", panels: [{ panel: "slide", value: travel }] },
              ],
              state: "ajar",
              hardware: [],
            },
          }
        : opening,
  ),
});

/**
 * The same design with two leaves standing in one place, whose kind and id
 * spell `w|x` + `y` and `w` + `x|y`: joined with `|`, both read `w|x|y`.
 */
const withAmbiguousOwners: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  elements: [
    ...environment.elements,
    ...[
      { id: "y", kind: "w|x" },
      { id: "x|y", kind: "w" },
    ].map(
      ({
        id,
        kind,
      }: {
        id: string;
        kind: string;
      }): {
        id: string;
        kind: string;
        parent: string;
        transform: IAutoMovieTransform;
        model: string;
        space: string;
      } => ({
        id,
        kind,
        parent: "shell",
        transform: drawingPlace(5, 1, 3),
        model: "leaf",
        space: "hall",
      }),
    ),
  ],
});
