import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasPlan64,
  IAutoMovieBicubicAtlasRegistry64,
  IAutoMovieBicubicAtlasTessellation64,
} from "@automovie/interface";

import { AutoMovieBicubicAtlasEmit64 } from "./AutoMovieBicubicAtlasEmit64";
import { AutoMovieBicubicAtlasPlan64 } from "./AutoMovieBicubicAtlasPlan64";
import { AutoMovieBicubicAtlasRegistry64 } from "./AutoMovieBicubicAtlasRegistry64";

const SIDES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [3, 7, 11, 15],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
];
const CORNERS: readonly (readonly [number, number, number])[] = [
  [0, 0, 0],
  [3, 1, 0],
  [15, 1, 1],
  [12, 0, 1],
];

/**
 * Tessellate complete bicubic patches with explicit shared control identities.
 * Sixteen controls are row-major: v rows, u columns, all in millimetres.
 * Matching four-ID boundary tuples, including reversals, own one edge; matching
 * endpoint control IDs own one corner. Different IDs at equal positions stay separate.
 * Output positions are metres, indices are append-only global indices from vertexOffset,
 * and a chunk may reference earlier vertices. Inputs remain immutable until completion.
 * Optional triangle-corner parameters retain each accepted triangle's actual
 * chart coordinates independently of shared render vertices and normal fans.
 * They follow emitted triangle order, including after local omissions.
 *
 * Exact Bernstein restrictions refine each unit cell using the same-parameter Taylor
 * estimate Muu/8+Muv/4+Mvv/8. Second-partial coefficient norms bound these derivatives
 * in exact arithmetic; binary64 estimates are not outward-rounded certificates.
 * Every incident patch registers boundary requests before emission. Line registries
 * add hanging corners to parameter-boundary triangulations without a global grid.
 * Bottom/top chains are zipped before exterior hanging edges are split, using
 * their existing samples rather than an analytic cell-center vertex. Matching
 * translated boundary polygons retain station-parallel face planes in exact
 * arithmetic. Unequal samples and general fields acquire no normal-error bound.
 * Source fidelity, immersion, orientability and absence of intersections are unproved.
 *
 * maxCells bounds allocated leaf slots across the atlas. A cell needing refinement
 * after the budget is exhausted follows cellBudgetPolicy: the strict default leaves
 * an explicit gap, while retain-coarse emits that existing finite leaf once with
 * its actual error estimate and approximationQualified=false. A split parent is
 * never retained with its children. All retained leaves enter the same edge-request
 * union, so coarse budget retention does not bypass boundary conformity.
 * Legacy four-ID edges share the first retained incident patch's normal. Explicit
 * canonical bindings instead construct the edge coefficients before bounds, union
 * exact dyadic phase requests and alias hanging corners by declared endpoints.
 * Distinct exact phases retain separate identities even when their binary64 views
 * coincide; zero-area triangles remain counted omissions. An inverse that
 * cannot represent an interior coordinate omits that request with a local diagnostic,
 * preserving other requests and patches without welding or altering coefficients.
 * Optional coefficient retention copies the actual post-binding root grids into
 * the terminal summary and streamed chunks in mm. Omission or false allocates no snapshot and leaves
 * emitted geometry unchanged. A prepared grid can exist for an omitted region;
 * the public realizer separately filters snapshots to retained triangle owners.
 * Position owners are independent of render normal fans, preserving both crease
 * banks' analytic normals without averaging. This establishes no G1 certificate.
 * Canonical endpoint values must agree exactly across declared corner aliases.
 * Conflicting classes omit only their incident patches with explicit diagnostics.
 * Consistent bindings construct the shared corner in every incident chart before
 * derivative bounds, including charts that retain an unbound side at that corner.
 * Complete legacy edge tuples consume that same constructed edge, including reversal.
 * Equivalent nets under different authoritative intervals retain finite geometry
 * with an explicit inter-authority polygon-conformity limitation.
 * Exact zero or nonfinite normals
 * remain zero with counts; finite positive-area geometry survives normal qualifications.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Complete tensor Bernstein evaluation, exact subdivision, Taylor derivative bounds and declared edge authority generate a new indexed mesh. Sample unions conform within one authoritative interval family; different equivalent authority families retain a separate explicit polygon-conformity limitation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, bounded atlas planning, canonical edge registration and shared parameter-boundary triangulation expose separate ownership stages.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source mesh, coordinate welding, anatomy table, dropped control, arbitrary tolerance change or fallback normal supplies geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States control ordering, units, shared identity, streaming lifetime, approximation scope and local failure effects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Admission is O(C+P). At most maxCells leaf slots and fewer than twice as many refinement nodes are allocated. Registries sort O(L) corners in O(L log L); each cell triangulates its N ordered perimeter samples in O(N) work, followed by fixed-degree evaluations and logarithmic range searches.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical positions are cached after independent coefficient-consistency checks; distinct normal fans retain separate analytic render vertices at that identity. Atomic interval incidence is computed once per edge. Exact child nets serve refinement without source refitting.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The generator retains O(C+P+L) coefficient references, plans, canonical samples and fan registries plus one vertex-bounded chunk. Requested corner parameters add six numbers per emitted triangle alongside that chunk's indices; omitted requests allocate no parameter buffer. Legacy edge/corner caches release after their last incident patch; canonical registries release at completion or cancellation. Consumers own yielded arrays.
 */
export function* tessellateAutoMovieBicubicAtlas64(
  input: IAutoMovieBicubicAtlasTessellation64.Input,
): Generator<
  IAutoMovieBicubicAtlasTessellation64.Chunk,
  IAutoMovieBicubicAtlasTessellation64.Summary,
  void
> {
  if (
    input.retainTriangleParameters !== undefined &&
    typeof input.retainTriangleParameters !== "boolean"
  )
    throw new Error("Triangle parameter retention must be boolean");
  if (
    input.retainPatchCoefficients !== undefined &&
    typeof input.retainPatchCoefficients !== "boolean"
  )
    throw new Error("Patch coefficient retention must be boolean");
  const prepared: IAutoMovieBicubicAtlasPlan64.IResult =
    AutoMovieBicubicAtlasPlan64(input, SIDES, CORNERS);
  const registered: IAutoMovieBicubicAtlasRegistry64.IResult =
    AutoMovieBicubicAtlasRegistry64(input, prepared, SIDES, CORNERS);
  const summary: IAutoMovieBicubicAtlasTessellation64.Summary =
    yield* AutoMovieBicubicAtlasEmit64(
      input,
      prepared,
      registered,
      SIDES,
      CORNERS,
    );
  return {
    ...summary,
    ...(input.retainPatchCoefficients
      ? {
          patchCoefficients: prepared.plans.flatMap(
            (
              plan: (typeof prepared.plans)[number],
              i: number,
            ): NonNullable<
              IAutoMovieBicubicAtlasTessellation64.Summary["patchCoefficients"]
            > =>
              plan.grid.length === 4
                ? [
                    {
                      patch: input.patches[i]!.id,
                      gridMm: plan.grid.map(
                        (row: number[][]): Readonly<AutoMovieVector3Tuple>[] =>
                          row.map(
                            (p: number[]): Readonly<AutoMovieVector3Tuple> => [
                              p[0]!,
                              p[1]!,
                              p[2]!,
                            ],
                          ),
                      ),
                    },
                  ]
                : [],
          ),
        }
      : {}),
  };
}
