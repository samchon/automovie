import {
  type AutoMovieConstructionRealization,
  type IAutoMovieConstructionCurve,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
  sampleAutoMovieConstructionCurves,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionDiagnostic,
  IAutoMovieConstructionView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionCurves } from "../../internal/construction/ConstructionCurves";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { nclose, throwsError } from "../../internal/predicates";

/** What a sampling reads of a realization. */
type Source = Pick<
  AutoMovieConstructionRealization.IRealization,
  "chains" | "surfaces" | "diagnostics"
>;

/**
 * `sampleAutoMovieConstructionCurves` turns a realization's chains into section rings, guide rails and an axis in metres, flags what a diagnostic or a non-finite sample touches, and refuses malformed options.
 *
 * Scenarios:
 *
 * 1. A realized round tube of nine stations gives nine closed sections, four open guides and one open axis with the documented ids, order and point counts, and coarser options give the counts they name.
 * 2. Every section point of that tube stands at its authored 0.02 m radius and at its layer's station, every guide point on its authored rail and every axis point on the authored centre line.
 * 3. Each guide passes through its quarter's sample of every section, guide 0 through each section's first point.
 * 4. A stub surface with one non-finite sample flags that section and the axis and omits the sample, and one that is non-finite at phase 0 of every ring flags every section and loses guide 0 and the axis.
 * 5. A surface without a point reader is read through its jet, and a surface with one is never read through its jet.
 * 6. A surface domain narrower than the layers keeps only the layers inside it and is never evaluated outside it, and a wider one extends guides and axis to its ends.
 * 7. A diagnostic on a part's node flags every curve of that part and none of another part, and chains find their surfaces by name whatever the order.
 * 8. Phases that are not a multiple of four of at least 8, steps that are not a positive whole number, a chain without a surface and a reversed domain are each refused by name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public sampler on a tube made by the public realizer and on stub records, and reads the returned ids, kinds, closure, flags, point counts and coordinates. It fails for a sampler that leaves the points in millimetres, starts rings off phase 0, takes guides from other phases than the quarters, keeps or replaces a non-finite sample, evaluates outside the owned range or flags by position instead of by name. Any station list or buffer layout that returns the same curves passes.
 * @evidence contracts/development/testing.md#independent-expectations The tube is authored with radius 0.02 m, length 0.1 m and nine uniform stations along -z, so its ring, rail and centre-line coordinates are written from those numbers; the stubs are closed-form cylinders of radius 30 and 10 mm. Section points off the sixteen spline knots may leave the circle by the periodic cubic interpolation bound `ConstructionChecks.polarSpline` gives for that order, about six micrometres, which the test first shows is under a hundredth of the radius; guide points are knots and are held to a nanometre. Counts follow from 48 phases, eight intervals and eight steps. One straight round tube does not show behaviour on a bent axis, a pole or a retained cap.
 * @evidence contracts/development/testing.md#distinguishing-cases The realized tube pins units, order and geometry, and each stub varies one input: one bad sample, one bad phase, no point reader, a narrower or wider domain, a diagnostic, a second chain. The realizer's own geometry, diagnostics and domain rules belong to the `test_construction_` specifications, such as `test_construction_without_skin`.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by `--include test_sample_construction_curves`. The tree and the jet-only stub are authored in this file, the point stubs come from the shared `ConstructionCurves` fixture, and every case runs inside this entry; it starts no process, browser or GPU, reads no file and replaces no global.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A realized round tube of nine stations gives nine closed sections, four open guides and one open axis with the documented ids, order and point counts, and coarser options give the counts they name.).
 */
export function test_sample_construction_curves(): void {
  /** The authored tube: radius 0.02 m, length 0.1 m, nine uniform stations advancing along -z. */
  const view: IAutoMovieConstructionView = ConstructionShapes.cylinder(
    "tube",
    ConstructionShapes.DOWN,
    0.02,
    0.1,
  );

  /** Its realization by the public realizer. */
  const realized: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "tube", root: view }, { chord: 1e-4 });

  /** The default sampling of the realized tube. */
  const curves: IAutoMovieConstructionCurve[] =
    sampleAutoMovieConstructionCurves(realized);

  /** A clean realization's diagnostics. */
  const clean: IAutoMovieConstructionDiagnostic[] = [];

  // 1. Ids, kinds, closure, flags, order and counts, at the defaults and at the coarsest options.
  TestValidator.equals(
    "the fixture tube realizes without a diagnostic",
    realized.diagnostics,
    clean,
  );
  TestValidator.equals(
    "a tube gives its sections, four guides and one axis in the documented order",
    {
      rows: ConstructionCurves.rows(curves),
      parts: Array.from(
        new Set(
          curves.map(
            (curve: IAutoMovieConstructionCurve): string => curve.part,
          ),
        ),
      ),
    },
    { rows: ConstructionCurves.whole("tube", false), parts: ["tube"] },
  );
  TestValidator.equals(
    "eight phases and one step give eight-point rings and nine-point rails",
    ConstructionCurves.rows(
      sampleAutoMovieConstructionCurves(realized, { phases: 8, steps: 1 }),
    ),
    ConstructionCurves.whole("tube", false, 8, 9),
  );

  /** The section rings, by layer. */
  const sections: IAutoMovieConstructionCurve[] = ConstructionCurves.ofKind(
    curves,
    "section",
  );

  /** The guide rails, by quarter. */
  const guides: IAutoMovieConstructionCurve[] = ConstructionCurves.ofKind(
    curves,
    "guide",
  );

  /** The axis, alone in its list. */
  const axes: IAutoMovieConstructionCurve[] = ConstructionCurves.ofKind(
    curves,
    "axis",
  );

  /** How far a section point between spline knots may stand from the authored circle, metres. */
  const bound: number =
    ConstructionChecks.polarSpline(0.02, 0.02, view.order) + 1e-10;

  // 2. Coordinates in metres against the authored radius, stations and centre line.
  TestValidator.predicate(
    "the section bound is under a hundredth of the radius, so a millimetre result cannot pass",
    bound < 0.0002,
  );
  TestValidator.predicate(
    "every section point stands at the authored radius and its layer's station",
    sections.every(
      (section: IAutoMovieConstructionCurve, layer: number): boolean =>
        ConstructionCurves.everyPoint(
          section,
          (x: number, y: number, z: number): boolean =>
            nclose(Math.hypot(x, y), 0.02, bound) &&
            nclose(z, -0.0125 * layer, 1e-10),
        ),
    ),
  );
  TestValidator.predicate(
    "every guide point stands on its quarter's authored rail",
    guides.every(
      (guide: IAutoMovieConstructionCurve, quarter: number): boolean =>
        ConstructionCurves.everyPoint(
          guide,
          (x: number, y: number, z: number, at: number): boolean =>
            nclose(x, 0.02 * Math.cos((quarter * Math.PI) / 2), 1e-9) &&
            nclose(y, 0.02 * Math.sin((quarter * Math.PI) / 2), 1e-9) &&
            nclose(z, (-0.1 * at) / 64, 1e-10),
        ),
    ),
  );
  TestValidator.predicate(
    "every axis point stands on the authored centre line",
    axes.every((axis: IAutoMovieConstructionCurve): boolean =>
      ConstructionCurves.everyPoint(
        axis,
        (x: number, y: number, z: number, at: number): boolean =>
          nclose(Math.hypot(x, y), 0, bound) &&
          nclose(z, (-0.1 * at) / 64, 1e-10),
      ),
    ),
  );

  // 3. Layer k is rail point 8 k, and quarter q is ring point 12 q.
  TestValidator.predicate(
    "each guide passes through its quarter's sample of every section",
    sections.every(
      (section: IAutoMovieConstructionCurve, layer: number): boolean =>
        guides.every(
          (guide: IAutoMovieConstructionCurve, quarter: number): boolean =>
            [0, 1, 2].every((component: number): boolean =>
              nclose(
                guide.points[3 * 8 * layer + component]!,
                section.points[3 * 12 * quarter + component]!,
                0,
              ),
            ),
        ),
    ),
  );

  /** No chart point is spoiled. */
  const never: (u: number, v: number) => boolean = (): boolean => false;

  /** Phase of ring sample 5 of 48, radians. */
  const fifth: number = (Math.PI / 2) * (20 / 48);

  /** The tube's layers under a 30 mm stub that is non-finite at ring sample 5 of the 25 mm station, which is layer 2. */
  const holed: IAutoMovieConstructionCurve[] =
    sampleAutoMovieConstructionCurves({
      chains: realized.chains,
      surfaces: [
        ConstructionCurves.cylinder(
          "tube",
          30,
          (u: number, v: number): boolean =>
            Math.abs(u - 25) < 1e-6 && Math.abs(v - fifth) < 1e-12,
          null,
          [],
        ),
      ],
      diagnostics: [],
    });

  // 4. A non-finite sample is left out and flags only the curves that would have held it.
  TestValidator.equals(
    "one non-finite sample flags its section and the axis and is left out of both",
    ConstructionCurves.rows(holed),
    ConstructionCurves.table(
      "tube",
      ConstructionCurves.LAYERS.map(
        (ordinal: number): [number, number, boolean] => [
          ordinal,
          ordinal === 2 ? 47 : 48,
          ordinal === 2,
        ],
      ),
      ConstructionCurves.QUARTERS.map(
        (quarter: number): [number, number, boolean] => [quarter, 65, false],
      ),
      [64, true],
    ),
  );
  TestValidator.predicate(
    "the section closes over the gap: its point 5 is ring sample 6",
    nclose(holed[2]!.points[15]!, 0.03 * Math.cos(Math.PI / 4), 1e-12) &&
      nclose(holed[2]!.points[16]!, 0.03 * Math.sin(Math.PI / 4), 1e-12) &&
      nclose(holed[2]!.points[17]!, -0.025, 1e-12),
  );
  TestValidator.equals(
    "a surface non-finite at phase 0 flags every section and loses guide 0 and the axis",
    ConstructionCurves.rows(
      sampleAutoMovieConstructionCurves({
        chains: realized.chains,
        surfaces: [
          ConstructionCurves.cylinder(
            "tube",
            30,
            (_: number, v: number): boolean => v === 0,
            null,
            [],
          ),
        ],
        diagnostics: [],
      }),
    ),
    ConstructionCurves.table(
      "tube",
      ConstructionCurves.LAYERS.map(
        (ordinal: number): [number, number, boolean] => [ordinal, 47, true],
      ),
      [1, 2, 3].map((quarter: number): [number, number, boolean] => [
        quarter,
        65,
        false,
      ]),
      null,
    ),
  );

  /** A 30 mm cylinder that offers its jet only. */
  const jetOnly: IAutoMovieSolidSurface = {
    name: "tube",
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [30 * Math.cos(v), 30 * Math.sin(v), -u],
      u: [0, 0, -1],
      v: [-30 * Math.sin(v), 30 * Math.cos(v), 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [-30 * Math.cos(v), -30 * Math.sin(v), 0],
    }),
  };

  /** The sampling read through that jet. */
  const jetted: IAutoMovieConstructionCurve[] =
    sampleAutoMovieConstructionCurves({
      chains: realized.chains,
      surfaces: [jetOnly],
      diagnostics: [],
    });

  // 5. Either reader gives the whole table; the point reader's stub throws from its jet, so returning shows the preference.
  TestValidator.equals(
    "a jet-only surface and a point surface both give every curve",
    [
      ConstructionCurves.rows(jetted),
      ConstructionCurves.rows(
        sampleAutoMovieConstructionCurves({
          chains: realized.chains,
          surfaces: [ConstructionCurves.cylinder("tube", 30, never, null, [])],
          diagnostics: [],
        }),
      ),
    ],
    [
      ConstructionCurves.whole("tube", false),
      ConstructionCurves.whole("tube", false),
    ],
  );
  TestValidator.predicate(
    "the jet's point is converted to metres",
    nclose(jetted[0]!.points[0]!, 0.03, 1e-12) &&
      nclose(jetted[0]!.points[1]!, 0, 1e-12) &&
      nclose(jetted[0]!.points[2]!, 0, 1e-12),
  );

  /** Stations the narrow surface was evaluated at, mm. */
  const visited: number[] = [];

  /** The tube's layers under a surface that owns stations 10 to 60 mm only, at two steps per interval. */
  const narrow: IAutoMovieConstructionCurve[] =
    sampleAutoMovieConstructionCurves(
      {
        chains: realized.chains,
        surfaces: [
          ConstructionCurves.cylinder("tube", 30, never, [10, 60], visited),
        ],
        diagnostics: [],
      },
      { steps: 2 },
    );

  /** The same layers under a surface that owns 5 mm before the first layer and 10 mm past the last, at one step. */
  const wide: IAutoMovieConstructionCurve[] = sampleAutoMovieConstructionCurves(
    {
      chains: realized.chains,
      surfaces: [ConstructionCurves.cylinder("tube", 30, never, [-5, 110], [])],
      diagnostics: [],
    },
    { steps: 1 },
  );

  // 6. Layers 1 to 4 lie in 10..60 mm, whose knots 10, 12.5, 25, 37.5, 50, 60 make five intervals.
  TestValidator.equals(
    "a narrower domain keeps the layers inside it and a wider one keeps them all",
    [ConstructionCurves.rows(narrow), ConstructionCurves.rows(wide)],
    [
      ConstructionCurves.table(
        "tube",
        [1, 2, 3, 4].map((ordinal: number): [number, number, boolean] => [
          ordinal,
          48,
          false,
        ]),
        ConstructionCurves.QUARTERS.map(
          (quarter: number): [number, number, boolean] => [quarter, 11, false],
        ),
        [11, false],
      ),
      ConstructionCurves.whole("tube", false, 48, 11),
    ],
  );
  TestValidator.predicate(
    "the narrow surface is evaluated once per ring sample and never outside its domain",
    visited.length === 11 * 48 &&
      visited.every((u: number): boolean => u >= 10 && u <= 60),
  );
  TestValidator.predicate(
    "guides run from one end of the owned range to the other",
    nclose(
      ConstructionCurves.ofKind(narrow, "guide")[0]!.points[2]!,
      -0.01,
      1e-12,
    ) &&
      nclose(
        ConstructionCurves.ofKind(narrow, "guide")[0]!.points[32]!,
        -0.06,
        1e-12,
      ) &&
      nclose(
        ConstructionCurves.ofKind(wide, "guide")[0]!.points[2]!,
        0.005,
        1e-12,
      ) &&
      nclose(
        ConstructionCurves.ofKind(wide, "guide")[0]!.points[32]!,
        -0.11,
        1e-12,
      ),
  );

  /** The tube's chain under a second name, for a realization of two parts. */
  const pipe: IAutoMovieLoftChain = { ...realized.chains[0]!, name: "pipe" };

  /** Two parts whose surfaces are listed in the other order, with a diagnostic on the second part only. */
  const pair: Source = {
    chains: [realized.chains[0]!, pipe],
    surfaces: [
      ConstructionCurves.cylinder("pipe", 10, never, null, []),
      ConstructionCurves.cylinder("tube", 30, never, null, []),
    ],
    diagnostics: [
      { node: "pipe", contract: "authored", detail: "written for this test" },
    ],
  };

  /** The sampling of both parts. */
  const paired: IAutoMovieConstructionCurve[] =
    sampleAutoMovieConstructionCurves(pair);

  // 7. Flags follow the diagnostic's node name, and each chain reads the surface of its own name.
  TestValidator.equals(
    "a diagnostic flags every curve of its own part and no other",
    [
      ConstructionCurves.rows(
        sampleAutoMovieConstructionCurves({
          chains: realized.chains,
          surfaces: realized.surfaces,
          diagnostics: [
            { node: "tube", contract: "authored", detail: "written here" },
          ],
        }),
      ),
      ConstructionCurves.rows(
        sampleAutoMovieConstructionCurves({
          chains: realized.chains,
          surfaces: realized.surfaces,
          diagnostics: [
            { node: "other", contract: "authored", detail: "written here" },
          ],
        }),
      ),
      ConstructionCurves.rows(paired),
    ],
    [
      ConstructionCurves.whole("tube", true),
      ConstructionCurves.whole("tube", false),
      [
        ...ConstructionCurves.whole("tube", false),
        ...ConstructionCurves.whole("pipe", true),
      ],
    ],
  );
  TestValidator.predicate(
    "each chain is sampled on the surface of its own name",
    nclose(paired[0]!.points[0]!, 0.03, 1e-12) &&
      nclose(paired[14]!.points[0]!, 0.01, 1e-12),
  );

  /** Each malformed request with a fragment of the message that names it. */
  const refusals: Array<readonly [string, () => unknown, string]> = [
    ...[7, 10, 4, 8.5, Number.NaN].map(
      (phases: number): readonly [string, () => unknown, string] => [
        `phases ${phases}`,
        (): IAutoMovieConstructionCurve[] =>
          sampleAutoMovieConstructionCurves(realized, { phases }),
        `phases ${phases} is not a whole number of at least 8 that four divides`,
      ],
    ),
    ...[0, 1.5, -1, Number.NaN].map(
      (steps: number): readonly [string, () => unknown, string] => [
        `steps ${steps}`,
        (): IAutoMovieConstructionCurve[] =>
          sampleAutoMovieConstructionCurves(realized, { steps }),
        `steps ${steps} is not a positive whole number`,
      ],
    ),
    [
      "a chain without a surface",
      (): IAutoMovieConstructionCurve[] =>
        sampleAutoMovieConstructionCurves({
          chains: realized.chains,
          surfaces: [],
          diagnostics: [],
        }),
      'chain "tube" has no surface of its name',
    ],
    [
      "a reversed domain",
      (): IAutoMovieConstructionCurve[] =>
        sampleAutoMovieConstructionCurves({
          chains: realized.chains,
          surfaces: [
            ConstructionCurves.cylinder("tube", 30, never, [60, 10], []),
          ],
          diagnostics: [],
        }),
      'chain "tube" owns no station range',
    ],
  ];

  // 8. Every refusal throws an Error that names its own cause.
  for (const [name, task, message] of refusals)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(task, message),
    );
}
