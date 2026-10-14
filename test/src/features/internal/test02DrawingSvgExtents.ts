import {
  autoMovieDrawingToSvg,
  deriveAutoMovieDrawing,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawing,
  IAutoMovieDrawingView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingView } from "./drawingFixtures";
import { namedFacts } from "./predicates";

/** Original SVG scenario 7, including its existing empty-attribute and reasonless-record probes. */
export function test02DrawingSvgExtents(
  environment: IAutoMovieBuiltEnvironment,
  drawing: IAutoMovieDrawing,
  view: IAutoMovieDrawingView,
): void {
  // 7. A sheet with nothing on it.
  const blankView: IAutoMovieDrawingView = drawingView({
    id: "blank",
    projection: "elevation",
    direction: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    elementKinds: ["nothing-of-this-kind"],
    spaces: ["roof-deck"],
  });
  const blank: string = autoMovieDrawingToSvg({
    drawing: deriveAutoMovieDrawing({ environment, view: blankView }),
    view: blankView,
  });
  TestValidator.equals(
    "a drawing with nothing on it is a sheet of margins",
    [
      blank.startsWith(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20.000mm" height="20.000mm"',
      ),
      blank
        .split("\n")
        .filter((line: string): boolean => line.includes("automovie-line"))
        .length,
    ],
    [true, 0],
  );

  // A sheet whose only content is its own annotation is still that sheet's size.
  const slabFeature: (
    kind: "vertex" | "centroid",
    index: number,
    element: string,
  ) => {
    readonly element: string;
    readonly part: null;
    readonly kind: "vertex" | "centroid";
    readonly index: number;
    readonly count: null;
  } = (
    kind: "vertex" | "centroid",
    index: number,
    element: string,
  ): {
    readonly element: string;
    readonly part: null;
    readonly kind: "vertex" | "centroid";
    readonly index: number;
    readonly count: null;
  } => ({ element, part: null, kind, index, count: null }) as const;
  const noteOnly: (element: string) => IAutoMovieDrawingView = (
    element: string,
  ): IAutoMovieDrawingView =>
    drawingView({
      id: "note-only",
      // Nothing is drafted and no cell is sectioned, so the linework and the
      // regions contribute no extent at all and the annotation is the whole of
      // what the sheet has to hold.
      elementKinds: ["nothing-of-this-kind"],
      spaces: ["roof-deck"],
      dimensions: [
        {
          id: "slab-diagonal",
          from: slabFeature("vertex", 0, element),
          to: slabFeature("vertex", 7, element),
          measure: "page",
        },
      ],
      annotations: [
        {
          id: "slab-note",
          text: "screed",
          target: slabFeature("centroid", 0, element),
        },
      ],
    });
  const noteOnlySheet: (element: string) => string[] = (
    element: string,
  ): string[] =>
    autoMovieDrawingToSvg({
      drawing: deriveAutoMovieDrawing({
        environment,
        view: noteOnly(element),
      }),
      view: noteOnly(element),
    }).split("\n");
  const annotated: string[] = noteOnlySheet("floor-slab");
  TestValidator.equals(
    "a sheet whose only content is its annotation is sized to hold it",
    namedFacts([
      [
        "the page is the annotated span at 1:50 plus a margin on every side",
        (): boolean =>
          annotated[0]!.startsWith(
            '<svg xmlns="http://www.w3.org/2000/svg" width="220.000mm" height="140.000mm" viewBox="0 0 220.000 140.000"',
          ),
      ],
      [
        // The slab's far corners are page (0, 0) and (10, -6) and its centre is
        // page (5, -3); at 1:50 with a 10 mm margin those are the two ends of
        // the sheet's own diagonal and its middle. These assertions place the
        // dimension ends and note anchor, without measuring the glyph bounds.
        "the dimension runs corner to corner of the page it sized",
        (): boolean =>
          annotated.some(
            (line: string): boolean =>
              line.includes('data-id="slab-diagonal"') &&
              line.includes(
                'x1="10.000" y1="10.000" x2="210.000" y2="130.000"',
              ),
          ),
      ],
      [
        "the note sits at the middle of that page",
        (): boolean =>
          annotated.some(
            (line: string): boolean =>
              line.includes('data-id="slab-note"') &&
              line.includes('x="110.000" y="70.000"'),
          ),
      ],
      [
        "a target that resolves to nothing sizes nothing, so the sheet is margins",
        (): boolean =>
          noteOnlySheet("no-such-slab")[0]!.startsWith(
            '<svg xmlns="http://www.w3.org/2000/svg" width="20.000mm" height="20.000mm"',
          ),
      ],
    ]),
    {
      "the page is the annotated span at 1:50 plus a margin on every side": true,
      "the dimension runs corner to corner of the page it sized": true,
      "the note sits at the middle of that page": true,
      "a target that resolves to nothing sizes nothing, so the sheet is margins": true,
    },
  );

  TestValidator.equals(
    "a region with no finish and a line in no space are written as empty, not omitted",
    namedFacts([
      [
        "a ceiling region names no finish and says so with an empty attribute",
        (): boolean => {
          const ceilingView: IAutoMovieDrawingView = drawingView({
            id: "ceiling",
            projection: "reflected-ceiling-plan",
            origin: { x: 0, y: 3.05, z: 0 },
            direction: { x: 0, y: 1, z: 0 },
            up: { x: 0, y: 0, z: -1 },
          });
          return autoMovieDrawingToSvg({
            drawing: deriveAutoMovieDrawing({
              environment,
              view: ceilingView,
            }),
            view: ceilingView,
          }).includes(
            'data-space="roof-deck" data-cell="deck-cell" data-kind="roof-deck" data-finish=""',
          );
        },
      ],
      [
        "a line whose element belongs to no space carries an empty space",
        (): boolean => {
          const plainView: IAutoMovieDrawingView = drawingView({ id: "plain" });
          return autoMovieDrawingToSvg({
            drawing: deriveAutoMovieDrawing({
              environment: {
                ...environment,
                elements: environment.elements.map(
                  (element: IAutoMovieBuiltElement): IAutoMovieBuiltElement =>
                    element.id === "floor-slab"
                      ? { ...element, space: null }
                      : element,
                ),
              },
              view: plainView,
            }),
            view: plainView,
          }).includes(
            'data-owner="floor-slab" data-space="" data-layer="slab"',
          );
        },
      ],
    ]),
    {
      "a ceiling region names no finish and says so with an empty attribute": true,
      "a line whose element belongs to no space carries an empty space": true,
    },
  );

  TestValidator.equals(
    "a stale record that carries no reason writes an empty one, not the word null",
    namedFacts([
      [
        "a hand-built stale dimension and note serialize without a reason",
        (): boolean => {
          const emitted: string = autoMovieDrawingToSvg({
            drawing: {
              ...drawing,
              dimensions: [
                {
                  id: "reasonless",
                  measure: "page",
                  status: "stale",
                  from: null,
                  to: null,
                  value: null,
                  reason: null,
                },
              ],
              annotations: [
                {
                  id: "reasonless-note",
                  text: "no reason given",
                  status: "stale",
                  at: null,
                  reason: null,
                },
              ],
            },
            view,
          });
          return (
            emitted.includes(
              '<g class="automovie-dimension" data-id="reasonless" data-status="stale" data-reason="" />',
            ) &&
            emitted.includes(
              '<g class="automovie-annotation" data-id="reasonless-note" data-status="stale" data-reason="" />',
            )
          );
        },
      ],
    ]),
    {
      "a hand-built stale dimension and note serialize without a reason": true,
    },
  );
}
