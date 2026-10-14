import {
  type IAutoMovieDrawingFeatureResolution,
  deriveAutoMovieDrawing,
  resolveAutoMovieDrawingFeature,
} from "@automovie/engine";
import {
  type IAutoMovieBuiltElement, type IAutoMovieDrawing, type IAutoMovieDrawingDimension, type IAutoMovieDrawingGap, type IAutoMovieDrawingPoint,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFeature,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  drawingEnvironment,
  drawingPlace,
  drawingView,
} from "../internal/drawingFixtures";
import {
  namedFacts,
  nclose,
  vclose,
} from "../internal/predicates";
import { test02DrawingAnnotationIdentity } from "../internal/test02DrawingAnnotationIdentity";
import { test02DrawingAnnotationOrder } from "../internal/test02DrawingAnnotationOrder";
import { test02DrawingAnnotationStaleness } from "../internal/test02DrawingAnnotationStaleness";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A dimension follows the wall it is pinned to, or says out loud that it no
 * longer knows which wall that is.
 *
 * The fixture wall is a 6 x 3 x 0.2 box, so its welded geometry has 8 corners,
 * 18 edges (twelve of the box and six face diagonals) and 12 triangles. Those
 * counts are what a pinned target is checked against, and they are hand
 * arithmetic over the engine's own box tessellation rather than numbers read
 * back out of the resolver.
 *
 * Targets re-resolve against the supplied geometry: translating the wall moves
 * its note while preserving the length between two wall corners. A target
 * authored with count nine is stale against the existing eight-corner wall;
 * this checks a count mismatch without replacing the model's topology.
 *
 * Scenarios:
 *
 * 1. Vertex, edge, axis and centroid resolve to selected world positions;
 *    the face probe checks count and absent direction, not its centroid.
 * 2. Moving the wall re-resolves selected targets to their new places and changes the
 *    note position while preserving its measured length; the digest changes.
 * 3. A target authored against a different feature count is stale even though its
 *    index is still in range, and the reason names both counts.
 * 4. An index out of range, a fractional index, a bad axis index, a non-zero
 *    centroid index and mismatched axis or centroid counts are stale, with
 *    selected cause-specific reasons and current counts.
 * 5. A missing element, an element with no model, a runtime model the design does
 *    not carry, a missing part and a part with no geometry are each stale
 *    rather than resolved to something nearby.
 * 6. A dimension measures the page distance or the true 3D distance, and says
 *    which; a stale end makes the whole dimension stale with the failing end's
 *    reason, from either side.
 * 7. Reordering model parts preserves four selected corner positions and
 *    welded feature counts; collapsed-axis refusal is covered in 3..5.
 * 8. A sheet carrying a resolved note declares that it sized the note's anchor and
 *    not the lettering; a sheet whose every note is stale owes no text-extent gap,
 *    because it set no text at all.
 * 9. The digest tells apart two drawings that differ only in where a dimension
 *    stands, or only in where an id ends and its note's text begins.
 * 10. A view declaring one dimension id or one note id twice is refused by name,
 *     while one id shared between a dimension and a note is allowed.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves the existing wall's feature families, derives dimensions/notes before and after translation, observes stale counts/indices/references, propagates stale ends, compares selected reordered-part corners and welded sliver counts, and checks note-extent gaps, selected digest distinctions and duplicate-id admission. Original scenarios 3..5, 7 and 9/10 run through their named internal helpers in the same sequence.
 * @evidence contracts/testing.md#independent-expectations The 6-by-3-by-0.2 authored box gives eight corners, eighteen tessellated edges, twelve triangles, selected endpoints and centre (3,1.5,0.1); translation adds 0.5 on x while a six-metre span stays six. The sloped plan distance is hypot(6,0.2); literal stale reasons, counts and null records supply independent guards. Reordered-part parity compares two product results and is limited to four selected corners.
 * @evidence contracts/testing.md#distinguishing-cases Correct versus mismatched feature counts, fractional/negative/out-of-range indices, model-free axes versus model-free vertices, external/empty/missing parts and collapsed scale distinguish resolution branches. Page versus world requests, left/right missing ends, resolved versus stale notes, part order, welded degenerate edges, equal lengths at different page heights and separator-bearing text distinguish artifact behavior; no count-preserving topology replacement is tested.
 * @evidence contracts/testing.md#execution-ownership Uses existing local model declarations and synchronous public feature/drawing APIs without a renderer, filesystem output, clocks, global replacement or an alternate driver. Selected face count/null direction is not a face-position oracle; selected corner parity does not establish all-feature stability. Distinct observed digests do not prove collision impossibility or coverage of every payload field; both stale-end cases use the same missing-element cause. The diagonal checks page distance without a paired world-distance assertion for that diagonal.
 */
export function test_drawing_annotation_resolution(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const feature: (overrides: Partial<IAutoMovieDrawingFeature>) => IAutoMovieDrawingFeature = (
    overrides: Partial<IAutoMovieDrawingFeature>,
  ): IAutoMovieDrawingFeature => ({
    element: "north-wall",
    part: null,
    kind: "vertex",
    index: 0,
    count: null,
    ...overrides,
  });
  const resolve: (overrides: Partial<IAutoMovieDrawingFeature>, where?: IAutoMovieBuiltEnvironment) => IAutoMovieDrawingFeatureResolution = (
    overrides: Partial<IAutoMovieDrawingFeature>,
    where: IAutoMovieBuiltEnvironment = environment,
  ) : IAutoMovieDrawingFeatureResolution => resolveAutoMovieDrawingFeature(where, feature(overrides));

  // 1. Every family resolves where the fixture puts it.
  TestValidator.equals(
    "each feature family resolves to the fixture's own geometry",
    namedFacts([
      [
        "the wall has 8 welded corners and the first is its origin corner",
        () : boolean => {
          const corner: IAutoMovieDrawingFeatureResolution = resolve({ kind: "vertex", index: 0 });
          return (
            corner.count === 8 &&
            corner.status === "resolved" &&
            vclose(corner.point!, { x: 0, y: 0, z: 0 }) &&
            corner.direction === null
          );
        },
      ],
      [
        "the last corner is the far top corner of the same box",
        () : boolean =>
          vclose(resolve({ kind: "vertex", index: 7 }).point!, {
            x: 6,
            y: 3,
            z: 0.2,
          }),
      ],
      [
        "the wall has 18 welded edges and the first runs through its thickness",
        () : boolean => {
          const edge: IAutoMovieDrawingFeatureResolution = resolve({ kind: "edge", index: 0 });
          return (
            edge.count === 18 &&
            vclose(edge.point!, { x: 0, y: 0, z: 0.1 }) &&
            vclose(edge.direction!, { x: 0, y: 0, z: 1 })
          );
        },
      ],
      [
        "the wall face probe reports twelve triangles and no direction",
        () : boolean => {
          const face: IAutoMovieDrawingFeatureResolution = resolve({ kind: "face", index: 0 });
          return face.count === 12 && face.direction === null;
        },
      ],
      [
        "the centroid of a box is the centre of the box",
        () : boolean => {
          const centre: IAutoMovieDrawingFeatureResolution = resolve({ kind: "centroid", index: 0 });
          return (
            centre.count === 1 &&
            vclose(centre.point!, { x: 3, y: 1.5, z: 0.1 })
          );
        },
      ],
      [
        "each local axis resolves to the element's own origin and direction",
        () : boolean =>
          (
            [
              [0, { x: 1, y: 0, z: 0 }],
              [1, { x: 0, y: 1, z: 0 }],
              [2, { x: 0, y: 0, z: 1 }],
            ] as const
          ).every(([index, direction]: readonly [0, { readonly x: 1; readonly y: 0; readonly z: 0; }] | readonly [1, { readonly x: 0; readonly y: 1; readonly z: 0; }] | readonly [2, { readonly x: 0; readonly y: 0; readonly z: 1; }]) : boolean => {
            const axis: IAutoMovieDrawingFeatureResolution = resolve({ kind: "axis", index });
            return (
              axis.count === 3 &&
              vclose(axis.point!, { x: 3, y: 1.5, z: 0.1 }) &&
              vclose(axis.direction!, direction)
            );
          }),
      ],
      [
        "a named part resolves the same geometry as the whole element",
        () : boolean =>
          vclose(
            resolve({ kind: "vertex", index: 7, part: "wall-body" }).point!,
            { x: 6, y: 3, z: 0.2 },
          ),
      ],
    ]),
    {
      "the wall has 8 welded corners and the first is its origin corner": true,
      "the last corner is the far top corner of the same box": true,
      "the wall has 18 welded edges and the first runs through its thickness": true,
      "the wall face probe reports twelve triangles and no direction": true,
      "the centroid of a box is the centre of the box": true,
      "each local axis resolves to the element's own origin and direction": true,
      "a named part resolves the same geometry as the whole element": true,
    },
  );

  // 2. A moved wall moves its own notes.
  const moved: IAutoMovieBuiltEnvironment = movedWall(environment);
  TestValidator.predicate(
    "a moved wall carries its pinned corner with it",
    vclose(resolve({ kind: "vertex", index: 7 }, moved).point!, {
      x: 6.5,
      y: 3,
      z: 0.2,
    }),
  );

  const dimensioned: (where: IAutoMovieBuiltEnvironment, measure: "page" | "world") => IAutoMovieDrawing = (
    where: IAutoMovieBuiltEnvironment,
    measure: "page" | "world",
  ) : IAutoMovieDrawing =>
    deriveAutoMovieDrawing({
      environment: where,
      view: drawingView({
        id: "dimensioned",
        dimensions: [
          {
            id: "wall-length",
            from: feature({ kind: "vertex", index: 0, count: 8 }),
            to: feature({ kind: "vertex", index: 4, count: 8 }),
            measure,
          },
        ],
        annotations: [
          {
            id: "wall-note",
            text: "fair-faced blockwork",
            target: feature({ kind: "centroid", index: 0, count: 1 }),
          },
        ],
      }),
    });
  const before: IAutoMovieDrawing = dimensioned(environment, "world");
  const after: IAutoMovieDrawing = dimensioned(moved, "world");
  TestValidator.predicate(
    "a dimension between two corners is the wall's own 6 m length",
    test12ValuesClose(
      [before.dimensions[0]!.status, before.dimensions[0]!.value],
      ["resolved", 6],
    ),
  );
  TestValidator.predicate(
    "the note resolves onto the page at the wall's own centre",
    test12ValuesClose(
      [before.annotations[0]!.status, before.annotations[0]!.at],
      ["resolved", { x: 3, y: -0.1 }],
    ),
  );
  TestValidator.predicate(
    "a moved wall keeps its length and moves its note and its digest",
    test12ValuesClose(
      [
        after.dimensions[0]!.value,
        after.annotations[0]!.at,
        after.digest === before.digest,
      ],
      [6, { x: 3.5, y: -0.1 }, false],
    ),
  );
  TestValidator.equals(
    "a page dimension measures the drawing and a world dimension measures the building",
    namedFacts([
      [
        "level",
        () : boolean => nclose(dimensioned(environment, "page").dimensions[0]!.value!, 6),
      ],
      [
        "sloped",
        () : boolean =>
          nclose(
            deriveAutoMovieDrawing({
              environment,
              view: drawingView({
                id: "sloped",
                dimensions: [
                  {
                    id: "diagonal",
                    from: feature({ kind: "vertex", index: 0 }),
                    to: feature({ kind: "vertex", index: 7 }),
                    measure: "page",
                  },
                ],
              }),
            }).dimensions[0]!.value!,
            Math.hypot(6, 0.2),
          ),
      ],
    ]),
    { level: true, sloped: true },
  );

  // 3-5. Existing stale-target cases retain their original order.
  test02DrawingAnnotationStaleness(environment, resolve);

  // 6. A stale end makes the dimension stale, from either side.
  const broken: IAutoMovieDrawing = deriveAutoMovieDrawing({
    environment,
    view: drawingView({
      id: "broken",
      dimensions: [
        {
          id: "left-end-gone",
          from: feature({ element: "no-such-wall" }),
          to: feature({ kind: "vertex", index: 4 }),
          measure: "world",
        },
        {
          id: "right-end-gone",
          from: feature({ kind: "vertex", index: 0 }),
          to: feature({ element: "no-such-wall" }),
          measure: "page",
        },
      ],
      annotations: [
        {
          id: "note-gone",
          text: "this one lost its wall",
          target: feature({ element: "no-such-wall", kind: "centroid" }),
        },
      ],
    }),
  });
  TestValidator.equals(
    "a stale end at either side makes the whole dimension stale with its reason",
    broken.dimensions.map((dimension: IAutoMovieDrawingDimension) : (string | number | IAutoMovieDrawingPoint | null)[] => [
      dimension.id,
      dimension.status,
      dimension.from,
      dimension.to,
      dimension.value,
      dimension.reason,
    ]),
    [
      [
        "left-end-gone",
        "stale",
        null,
        null,
        null,
        'built environment "atelier" has no element "no-such-wall"',
      ],
      [
        "right-end-gone",
        "stale",
        null,
        null,
        null,
        'built environment "atelier" has no element "no-such-wall"',
      ],
    ],
  );
  TestValidator.equals(
    "a note whose target is gone is stale rather than left at its last place",
    broken.annotations,
    [
      {
        id: "note-gone",
        text: "this one lost its wall",
        status: "stale",
        at: null,
        reason: 'built environment "atelier" has no element "no-such-wall"',
      },
    ],
  );

  // 7. Existing part-order and welded-edge cases retain their original inputs.
  test02DrawingAnnotationOrder(environment, resolve);

  // 8. What the sheet sized, and what it could not.
  TestValidator.equals(
    "a sheet with a note says it sized the anchor and not the lettering",
    [
      before.gaps.find((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "note-text-extent")?.status,
      // Every note on this one is stale, so no text was set and there is no
      // unmeasured run of glyphs to declare.
      broken.gaps.some((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "note-text-extent"),
    ],
    ["unsupported", false],
  );

  // 9-10. Existing digest and duplicate-id cases run after note-extent checks.
  test02DrawingAnnotationIdentity(environment, feature);
}


/** The same design with the wall moved half a metre along the plan. */
const movedWall: (environment: IAutoMovieBuiltEnvironment) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  elements: environment.elements.map((element: IAutoMovieBuiltElement) : IAutoMovieBuiltElement =>
    element.id === "north-wall"
      ? { ...element, transform: drawingPlace(3.5, 1.5, 0.1) }
      : element,
  ),
});
