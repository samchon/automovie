import {
  type IAutoMovieAssemblyBreak,
  type IAutoMovieAssemblyContinuity,
  type IAutoMovieAssemblyJunction,
  type IAutoMovieAssemblyReveal,
  type IAutoMovieResolvedAssembly,
  autoMovieAssemblyOpeningReveal,
  matchAutoMovieAssemblyJunction,
  resolveAutoMovieMaterialAssembly,
} from "@automovie/engine";
import type { IAutoMovieMaterialAssembly } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assembly, layer } from "../internal/materialFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const resolve: (
  one: IAutoMovieMaterialAssembly,
) => IAutoMovieResolvedAssembly = (
  one: IAutoMovieMaterialAssembly,
): IAutoMovieResolvedAssembly =>
  resolveAutoMovieMaterialAssembly({ assembly: one });

const wet: (
  overrides?: Partial<IAutoMovieMaterialAssembly>,
) => IAutoMovieMaterialAssembly = (
  overrides: Partial<IAutoMovieMaterialAssembly> = {},
): IAutoMovieMaterialAssembly =>
  assembly(
    [
      layer("render", 0.02, { finish: true, wrapsOpening: true }),
      layer("block", 0.1),
      layer("cavity", 0.05, { substance: "cavity", material: null }),
      layer("barrier", 0, { substance: "membrane" }),
      layer("board", 0.0125, { finish: true, wrapsOpening: true }),
    ],
    {
      id: "wet-wall",
      faces: { first: "exposed", last: "exposed" },
      ...overrides,
    },
  );

/**
 * Measure finished opening dimensions and compare role spans across two resolved build-ups.
 *
 * Face-reachable lining reduces each structural dimension by twice its thickness. Junction output reports shared role hulls and one-sided roles on a caller-supplied common measuring line; neither these arithmetic cases nor role labels establish thermal performance or leak tightness.
 *
 * The wet-wall fixture totals 0.1825 metres from render 0.02, block 0.10, cavity 0.05, membrane 0 and board 0.0125; only render and board wrap the jamb.
 *
 * Scenarios:
 *
 * 1. A 1.2 x 2.1 m structural opening finishes at 1.135 x 2.035 m, because the
 *    0.0325 m of wrapping lines both jambs, both head and sill.
 * 2. The lining reaches 0.02 m from the first face and 0.0125 m from the last,
 *    leaving 0.15 m of bare jamb between them, and names the two layers doing
 *    it.
 * 3. A build-up whose layers all stop at the jamb changes nothing: the finished
 *    opening equals the structural one and the whole depth is bare. The
 *    negative twin of scenarios 1 and 2.
 * 4. A one-layer build-up that wraps lines from the first face only, so no depth
 *    is counted twice.
 * 5. A hand-built build-up whose only wrapping layer sits behind one that stops at
 *    the jamb lines nothing, because the lining is the run reachable from a
 *    face and not the flag. Validation refuses that build-up; this pins that it
 *    could not narrow an opening even if it reached the reveal unvalidated.
 * 6. A non-positive opening dimension is refused, and so is a lining that would
 *    consume the opening.
 * 7. A junction of two offset build-ups reports every shared role with its two
 *    spans, aligning only the one whose spans actually meet, and reports the
 *    role each side carries alone.
 * 8. A role spent over several layers is spanned and summed as one role rather
 *    than reduced to its first layer.
 * 9. A tolerance that is not a finite non-negative number is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real layer resolution, opening reveal and junction matching, observing finished dimensions, reachable lining ids, role hulls, signed overlaps, alignment and located Error causes. It catches doubled lining, unreachable wrapping and reduction of repeated roles to their first layer.
 * @evidence contracts/testing.md#independent-expectations The authored 0.0325 metre lining gives 1.2 - 2 * 0.0325 = 1.135 and 2.1 - 2 * 0.0325 = 2.035; manually offset span endpoints determine overlap and role membership. The common-axis/origin premise is supplied by the fixtures, not verified by the matcher, and these conventional layers supply no measured physical property oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves lined/unlined and fully wrapping one-layer cases, an unreachable interior wrap, zero/NaN/consumed openings, shared and one-sided roles, repeated separated role layers, zero tolerance and negative/NaN tolerance refusal. Assembly validation and resolved prefix coordinates belong to companion tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_material_assembly_junction entry owns all cases over portable source functions and shared authored fixtures, without installing a consumer, building an artifact, registering dynamic cases or starting a process/browser/GPU host.
 */
export function test_architecture_material_assembly_junction(): void {
  const resolved: IAutoMovieResolvedAssembly = resolve(wet());
  const reveal: IAutoMovieAssemblyReveal = autoMovieAssemblyOpeningReveal({
    resolved,
    width: 1.2,
    height: 2.1,
  });
  TestValidator.equals(
    "the wrapping layers line both jambs and shrink the finished opening",
    namedFacts([
      ["width", (): boolean => nclose(reveal.width, 1.135, 1e-12)],
      ["height", (): boolean => nclose(reveal.height, 2.035, 1e-12)],
      ["inset", (): boolean => nclose(reveal.inset, 0.0325, 1e-12)],
      ["first", (): boolean => nclose(reveal.first, 0.02, 1e-12)],
      ["last", (): boolean => nclose(reveal.last, 0.0125, 1e-12)],
      ["bare", (): boolean => nclose(reveal.bare, 0.15, 1e-12)],
    ]),
    {
      width: true,
      height: true,
      inset: true,
      first: true,
      last: true,
      bare: true,
    },
  );
  TestValidator.equals(
    "the reveal names the layers that line the jamb",
    reveal.layers,
    ["render", "board"],
  );

  const bare: IAutoMovieAssemblyReveal = autoMovieAssemblyOpeningReveal({
    resolved: resolve(
      assembly(
        [
          layer("render", 0.02, { finish: true }),
          layer("block", 0.1),
          layer("board", 0.0125, { finish: true }),
        ],
        { id: "unlined", faces: { first: "exposed", last: "exposed" } },
      ),
    ),
    width: 1.2,
    height: 2.1,
  });
  TestValidator.equals(
    "a build-up that stops at the jamb finishes the opening at its structural size",
    namedFacts([
      ["width", (): boolean => nclose(bare.width, 1.2, 1e-12)],
      ["height", (): boolean => nclose(bare.height, 2.1, 1e-12)],
      ["inset", (): boolean => nclose(bare.inset, 0, 0)],
      ["first", (): boolean => nclose(bare.first, 0, 0)],
      ["last", (): boolean => nclose(bare.last, 0, 0)],
      ["bare", (): boolean => nclose(bare.bare, 0.1325, 1e-12)],
      ["layers", (): boolean => bare.layers.length === 0],
    ]),
    {
      width: true,
      height: true,
      inset: true,
      first: true,
      last: true,
      bare: true,
      layers: true,
    },
  );

  const solo: IAutoMovieAssemblyReveal = autoMovieAssemblyOpeningReveal({
    resolved: resolve(
      assembly([layer("slab", 0.2, { finish: true, wrapsOpening: true })], {
        id: "solo",
        faces: { first: "exposed", last: "exposed" },
      }),
    ),
    width: 1,
    height: 1,
  });
  TestValidator.equals(
    "one wrapping layer is counted from the first face only",
    namedFacts([
      ["width", (): boolean => nclose(solo.width, 0.6, 1e-12)],
      ["inset", (): boolean => nclose(solo.inset, 0.2, 1e-12)],
      ["first", (): boolean => nclose(solo.first, 0.2, 1e-12)],
      ["last", (): boolean => nclose(solo.last, 0, 0)],
      ["bare", (): boolean => nclose(solo.bare, 0, 0)],
    ]),
    {
      width: true,
      inset: true,
      first: true,
      last: true,
      bare: true,
    },
  );

  const buriedWrap: IAutoMovieAssemblyReveal = autoMovieAssemblyOpeningReveal({
    resolved: {
      id: "hand-built",
      axis: "z",
      total: 0.17,
      start: 0,
      end: 0.17,
      extent: { min: 0, max: 0.17 },
      layers: [
        { ...resolve(wet()).layers[1]!, id: "outer", wrapsOpening: false },
        { ...resolve(wet()).layers[1]!, id: "middle", wrapsOpening: true },
        { ...resolve(wet()).layers[0]!, id: "inner", wrapsOpening: false },
      ],
    },
    width: 1.2,
    height: 2.1,
  });
  TestValidator.equals(
    "a wrap no face can reach lines nothing, so it narrows nothing",
    namedFacts([
      ["width", (): boolean => nclose(buriedWrap.width, 1.2, 1e-12)],
      ["height", (): boolean => nclose(buriedWrap.height, 2.1, 1e-12)],
      ["inset", (): boolean => nclose(buriedWrap.inset, 0, 0)],
      ["layers", (): boolean => buriedWrap.layers.length === 0],
      ["bare", (): boolean => nclose(buriedWrap.bare, 0.17, 1e-12)],
    ]),
    { width: true, height: true, inset: true, layers: true, bare: true },
  );

  TestValidator.equals(
    "an impossible opening is refused instead of reported as a negative dimension",
    namedFacts([
      [
        "zeroWidth",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyReveal =>
              autoMovieAssemblyOpeningReveal({
                resolved,
                width: 0,
                height: 2.1,
              }),
            "opening width must be a finite number > 0",
          ),
      ],
      [
        "nonFiniteHeight",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyReveal =>
              autoMovieAssemblyOpeningReveal({
                resolved,
                width: 1.2,
                height: Number.NaN,
              }),
            "opening height must be a finite number > 0",
          ),
      ],
      [
        "consumedWidth",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyReveal =>
              autoMovieAssemblyOpeningReveal({
                resolved,
                width: 0.06,
                height: 2.1,
              }),
            ["wet-wall", "leaves no usable opening in 0.06 x 2.1 m"],
          ),
      ],
      [
        "consumedHeight",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyReveal =>
              autoMovieAssemblyOpeningReveal({
                resolved,
                width: 1.2,
                height: 0.06,
              }),
            ["wet-wall", "leaves no usable opening in 1.2 x 0.06 m"],
          ),
      ],
    ]),
    {
      zeroWidth: true,
      nonFiniteHeight: true,
      consumedWidth: true,
      consumedHeight: true,
    },
  );

  const neighbour: IAutoMovieResolvedAssembly = resolve(
    assembly(
      [
        layer("render", 0.02, { finish: true, wrapsOpening: true }),
        layer("block", 0.1),
        layer("furring", 0.05),
        layer("barrier", 0, { substance: "membrane" }),
        layer("board", 0.0125, { finish: true, wrapsOpening: true }),
      ],
      {
        id: "return-wall",
        offset: 0.08,
        faces: { first: "exposed", last: "exposed" },
      },
    ),
  );
  const junction: IAutoMovieAssemblyJunction = matchAutoMovieAssemblyJunction({
    left: resolved,
    right: neighbour,
    tolerance: 0.001,
  });
  TestValidator.equals(
    "every shared role is reported with both spans and its own alignment",
    junction.continuous.map(
      (
        one: IAutoMovieAssemblyContinuity,
      ): { role: string; aligned: boolean } => ({
        role: one.role,
        aligned: one.aligned,
      }),
    ),
    [
      { role: "render", aligned: false },
      { role: "block", aligned: true },
      { role: "barrier", aligned: false },
      { role: "board", aligned: false },
    ],
  );
  TestValidator.equals(
    "the shared lengths are the signed overlaps of the two spans",
    namedFacts([
      [
        "overlaps",
        (): boolean =>
          [-0.06, 0.02, -0.08, -0.0675].every(
            (expected: number, index: number): boolean =>
              nclose(junction.continuous[index]!.overlap, expected, 1e-12),
          ),
      ],
      [
        "leftSpans",
        (): boolean =>
          nclose(junction.continuous[1]!.left.min, 0.02, 1e-12) &&
          nclose(junction.continuous[1]!.left.max, 0.12, 1e-12),
      ],
      [
        "rightSpans",
        (): boolean =>
          nclose(junction.continuous[1]!.right.min, 0.1, 1e-12) &&
          nclose(junction.continuous[1]!.right.max, 0.2, 1e-12),
      ],
    ]),
    {
      overlaps: true,
      leftSpans: true,
      rightSpans: true,
    },
  );
  TestValidator.equals(
    "a role only one side carries is reported as a break on that side",
    junction.broken.map(
      (
        one: IAutoMovieAssemblyBreak,
      ): { role: string; side: "left" | "right" } => ({
        role: one.role,
        side: one.side,
      }),
    ),
    [
      { role: "cavity", side: "left" },
      { role: "furring", side: "right" },
    ],
  );
  TestValidator.equals(
    "a break carries the thickness the side that has it gives the role",
    namedFacts([
      [
        "left",
        (): boolean => nclose(junction.broken[0]!.thickness, 0.05, 1e-12),
      ],
      [
        "right",
        (): boolean => nclose(junction.broken[1]!.thickness, 0.05, 1e-12),
      ],
    ]),
    {
      left: true,
      right: true,
    },
  );

  const split: IAutoMovieResolvedAssembly = resolve(
    assembly(
      [
        layer("outer-batt", 0.06, { role: "insulation" }),
        layer("batten", 0.02, { role: "batten" }),
        layer("inner-batt", 0.04, { role: "insulation" }),
      ],
      { id: "split-insulation" },
    ),
  );
  const single: IAutoMovieResolvedAssembly = resolve(
    assembly([layer("batt", 0.1, { role: "insulation" })], {
      id: "single-insulation",
    }),
  );
  const spanned: IAutoMovieAssemblyJunction = matchAutoMovieAssemblyJunction({
    left: split,
    right: single,
    tolerance: 0,
  });
  TestValidator.equals(
    "a role spread over several layers is spanned and summed as one role",
    namedFacts([
      [
        "roles",
        (): boolean =>
          spanned.continuous
            .map((one: IAutoMovieAssemblyContinuity): string => one.role)
            .join() === "insulation",
      ],
      [
        "leftSpan",
        (): boolean =>
          nclose(spanned.continuous[0]!.left.min, 0, 1e-12) &&
          nclose(spanned.continuous[0]!.left.max, 0.12, 1e-12),
      ],
      [
        "overlap",
        (): boolean => nclose(spanned.continuous[0]!.overlap, 0.1, 1e-12),
      ],
      ["aligned", (): boolean => spanned.continuous[0]!.aligned === true],
      [
        "summedRole",
        (): boolean =>
          nclose(
            matchAutoMovieAssemblyJunction({
              left: split,
              right: resolved,
              tolerance: 0,
            }).broken.find(
              (one: IAutoMovieAssemblyBreak): boolean =>
                one.role === "insulation",
            )!.thickness,
            0.1,
            1e-12,
          ),
      ],
      [
        "brokenBatten",
        (): boolean =>
          spanned.broken.length === 1 &&
          spanned.broken[0]!.role === "batten" &&
          spanned.broken[0]!.side === "left" &&
          nclose(spanned.broken[0]!.thickness, 0.02, 1e-12),
      ],
    ]),
    {
      roles: true,
      leftSpan: true,
      overlap: true,
      aligned: true,
      summedRole: true,
      brokenBatten: true,
    },
  );

  TestValidator.equals(
    "a junction tolerance must be a finite non-negative number",
    namedFacts([
      [
        "negative",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyJunction =>
              matchAutoMovieAssemblyJunction({
                left: split,
                right: single,
                tolerance: -1e-9,
              }),
            "junction tolerance must be a finite number >= 0",
          ),
      ],
      [
        "nonFinite",
        (): boolean =>
          throwsError(
            (): IAutoMovieAssemblyJunction =>
              matchAutoMovieAssemblyJunction({
                left: split,
                right: single,
                tolerance: Number.NaN,
              }),
            "junction tolerance must be a finite number >= 0",
          ),
      ],
    ]),
    {
      negative: true,
      nonFinite: true,
    },
  );
}
