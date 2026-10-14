import type { AutoMovieSurfacePatternGenerator, IAutoMoviePatternCandidate, IAutoMovieSurfacePattern } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { stackBond, zone } from "./patternFixtures";

/**
 * Retain the eight generated-module refusal cases of test_architecture_surface_pattern_refusals under its discoverable entry.
 *
 * The shared half-metre generator supplies authored input, with one original invalid candidate field overridden per row; no laid output supplies expectations. The borrowed refusal callback invokes the actual pattern generator and checks Error causes. Reach remains its separate original lattice-policy case, and this helper registers no test or host.
 */
export function assertPatternGeneratedModuleRefusals(
  refuses: (overrides: Partial<IAutoMovieSurfacePattern>, message: string | readonly string[]) => boolean,
): void {
  const cases: readonly {
    label: string;
    changes: Partial<IAutoMoviePatternCandidate>;
    message: string;
  }[] = [
    {
      label: "blankId",
      changes: { id: " " },
      message: 'pattern zone "field" module id must be non-empty',
    },
    {
      label: "duplicateId",
      changes: { id: "same" },
      message: 'pattern zone "field" module id "same" must be unique',
    },
    {
      label: "centre",
      changes: { center: { u: Number.NaN, v: 0 } },
      message: "center must be finite",
    },
    {
      label: "sizeU",
      changes: { size: { u: 0, v: 0.5 } },
      message: "size u must be a finite number > 0",
    },
    {
      label: "sizeV",
      changes: { size: { u: 0.5, v: -0.5 } },
      message: "size v must be a finite number > 0",
    },
    {
      label: "rotation",
      changes: { rotationDeg: Number.NaN },
      message: "rotation and grain must be finite",
    },
    {
      label: "grain",
      changes: { grainDeg: Number.POSITIVE_INFINITY },
      message: "rotation and grain must be finite",
    },
  ];
  const baseline: AutoMovieSurfacePatternGenerator = stackBond(0.5);
  for (const { label, changes, message } of cases)
    TestValidator.predicate(
      `a generated module refuses ${label}`,
      refuses({
        zones: [zone({
          generate: (context: Parameters<AutoMovieSurfacePatternGenerator>[0]): IAutoMoviePatternCandidate[] =>
            baseline(context).map((candidate: IAutoMoviePatternCandidate): IAutoMoviePatternCandidate => ({ ...candidate, ...changes })),
        })],
      }, message),
    );
  TestValidator.predicate(
    "a generated module stays within its declared reach",
    refuses({
      zones: [zone({ generate: stackBond(0.5), reach: { u: 0.4, v: 0.5 } })],
    }, "reaches beyond the declared reach of its cell origin"),
  );
}
