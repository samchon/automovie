import { deriveAutoMovieDrawing } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawing,
  IAutoMovieDrawingFeature,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingView } from "./drawingFixtures";
import { namedFacts, nclose, throwsError } from "./predicates";
import { test12ValuesClose } from "./test12ValuesClose";

/** Original annotation scenarios 9 and 10 retain their digest and duplicate-id inputs. */
export function test02DrawingAnnotationIdentity(
  environment: IAutoMovieBuiltEnvironment,
  feature: (
    overrides: Partial<IAutoMovieDrawingFeature>,
  ) => IAutoMovieDrawingFeature,
): void {
  // 9. Selected endpoint and text-boundary changes distinguish these digests.
  const facade: (
    overrides: Partial<Parameters<typeof drawingView>[0]>,
  ) => ReturnType<typeof deriveAutoMovieDrawing> = (
    overrides: Partial<Parameters<typeof drawingView>[0]>,
  ): ReturnType<typeof deriveAutoMovieDrawing> =>
    deriveAutoMovieDrawing({
      environment,
      view: drawingView({
        id: "facade",
        projection: "elevation",
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 0, y: 0, z: 1 },
        up: { x: 0, y: 1, z: 0 },
        ...overrides,
      }),
    });
  const footLength: IAutoMovieDrawing = facade({
    dimensions: [
      {
        id: "run",
        from: feature({ kind: "vertex", index: 0 }),
        to: feature({ kind: "vertex", index: 4 }),
        measure: "world",
      },
    ],
  });
  const headLength: IAutoMovieDrawing = facade({
    dimensions: [
      {
        id: "run",
        from: feature({ kind: "vertex", index: 2 }),
        to: feature({ kind: "vertex", index: 6 }),
        measure: "world",
      },
    ],
  });
  const splitBefore: IAutoMovieDrawing = facade({
    annotations: [
      { id: "a", text: "b|c", target: feature({ kind: "vertex", index: 0 }) },
    ],
  });
  const splitAfter: IAutoMovieDrawing = facade({
    annotations: [
      { id: "a|b", text: "c", target: feature({ kind: "vertex", index: 0 }) },
    ],
  });
  TestValidator.predicate(
    "the selected endpoint and text-boundary changes give different digests",
    test12ValuesClose(
      [
        // The foot and the head of the wall are both 6 m long, so the two
        // dimensions agree on id, measure, status and value and differ only in
        // the page points they stand between.
        footLength.dimensions[0]!.value,
        headLength.dimensions[0]!.value,
        nclose(
          footLength.dimensions[0]!.from!.y,
          headLength.dimensions[0]!.from!.y,
          0,
        ),
        footLength.digest === headLength.digest,
        splitBefore.digest === splitAfter.digest,
      ],
      [6, 6, false, false, false],
    ),
  );

  // 10. Ids address entries, so one view cannot spend an id twice.
  const twice: (
    overrides: Partial<Parameters<typeof drawingView>[0]>,
  ) => () => unknown =
    (overrides: Partial<Parameters<typeof drawingView>[0]>): (() => unknown) =>
    (): IAutoMovieDrawing =>
      deriveAutoMovieDrawing({
        environment,
        view: drawingView({ id: "twice", ...overrides }),
      });
  const spec: {
    from: IAutoMovieDrawingFeature;
    to: IAutoMovieDrawingFeature;
    measure: "world";
  } = {
    from: feature({ kind: "vertex", index: 0 }),
    to: feature({ kind: "vertex", index: 4 }),
    measure: "world" as const,
  };
  const note: { text: string; target: IAutoMovieDrawingFeature } = {
    text: "repeated",
    target: feature({ kind: "vertex", index: 0 }),
  };
  TestValidator.equals(
    "a repeated dimension or note id is refused by name",
    namedFacts([
      [
        "two dimensions with one id",
        (): boolean =>
          throwsError(
            twice({
              dimensions: [
                { id: "span", ...spec },
                { id: "span", ...spec },
              ],
            }),
            'drawing view "twice" declares dimension "span" more than once',
          ),
      ],
      [
        "two notes with one id",
        (): boolean =>
          throwsError(
            twice({
              annotations: [
                { id: "tag", ...note },
                { id: "tag", ...note },
              ],
            }),
            'drawing view "twice" declares annotation "tag" more than once',
          ),
      ],
      [
        "a dimension and a note may share an id",
        (): boolean =>
          !throwsError(
            twice({
              dimensions: [{ id: "shared", ...spec }],
              annotations: [{ id: "shared", ...note }],
            }),
          ),
      ],
    ]),
    {
      "two dimensions with one id": true,
      "two notes with one id": true,
      "a dimension and a note may share an id": true,
    },
  );
}
