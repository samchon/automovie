import {
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanFeatureLaws as Laws,
  AutoMovieHumanFeatureTemplate as Template,
} from "@automovie/human";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { nclose } from "../../internal/predicates";

/**
 * A supplied feature is placed by its landmarks and sized by the caller's
 * shares of the person's length.
 *
 * The made scale is 1,000 mm for each case, so a share of 0.02 is 20 mm. A law
 * of one landmark is given the centre [10, -200, 30], the outward direction [2,
 * 0, 0] and the long direction [1, -4, 0], which is not square to it; a law of
 * two landmarks is given the ends [0, 0, 0] and [0, 0, 120] and the outward
 * direction [1, 1, 0].
 *
 * Scenarios:
 *
 * 1. A law of one landmark: the centre is the landmark; the long direction is the
 *    given one made square to the outward direction, `[0, -1, 0]`; the short
 *    direction is `outward x along = [0, 0, -1]`; `along x across` is the
 *    outward direction `[1, 0, 0]`; the half extents are 20 and 10 mm and the
 *    hollow height is -5 mm.
 * 2. A law of two landmarks: the centre is their midpoint `[0, 0, 60]`, the long
 *    direction `[0, 0, 1]`, the half length 60, the half width is 15 mm and the
 *    ridge is 8 mm high.
 * 3. The template's height is the law's at the centre and zero on its edge along
 *    both directions, for every law.
 * 4. At twice the scale the transverse extents and signed heights double. The
 *    one-landmark feature also doubles along. The two-landmark feature keeps
 *    its given endpoints. The directions stay fixed.
 * 5. A tissue ratio of 1.5 deepens the pad from -5 to -7.5 mm and leaves the
 *    tendon height at 8 mm.
 * 6. A nonpositive length, a law of two landmarks given one, and a law of one
 *    landmark given no long direction are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls production `template` with declared in-memory laws and reads the geometry with the template record's `height` and `at`.
 * @evidence contracts/development/testing.md#independent-expectations Known directions use the stated cross products and extents use the fixture's round scale. The midpoint and half length follow from its endpoints.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds of law, a long direction that is not square to the outward one, two lengths, mounds and hollows, three refusals; all findings are collected.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous pure arithmetic; no family, person or loft.
 * @evidence contracts/development/common.md#meaningful-documentation States the made datums and each scenario's numbers.
 */
export function test_human_feature_laws(): void {
  const failures: string[] = [];
  const close = (label: string, actual: number, expected: number): void => {
    if (!nclose(actual, expected, 1e-9))
      failures.push(label + ": " + actual + " against " + expected);
  };
  const same = (
    label: string,
    actual: AutoMovieVector3Tuple,
    expected: AutoMovieVector3Tuple,
  ): void => {
    for (let c: number = 0; c < 3; ++c)
      close(label + "[" + c + "]", actual[c]!, expected[c]!);
  };
  const one: Laws.IDatums = {
    from: [10, -200, 30],
    outward: [2, 0, 0],
    along: [1, -4, 0],
  };
  const two: Laws.IDatums = {
    from: [0, 0, 0],
    to: [0, 0, 120],
    outward: [1, 1, 0],
  };
  const centred: Laws.ILaw = {
    name: "hollow",
    class: "pad",
    segment: "test-wall",
    landmarks: ["centre"],
    scale: "stature",
    along: 0.02,
    across: 0.01,
    height: -0.005,
  };
  const spanned: Laws.ILaw = {
    name: "ridge",
    class: "tendon",
    segment: "test-wall",
    landmarks: ["first", "last"],
    scale: "knee",
    across: 0.015,
    height: 0.008,
  };

  for (const { law, datums, spans, halfWidth, height, tissueHeight } of [
    {
      law: centred,
      datums: one,
      spans: false,
      halfWidth: 10,
      height: -5,
      tissueHeight: -7.5,
    },
    {
      law: spanned,
      datums: two,
      spans: true,
      halfWidth: 15,
      height: 8,
      tissueHeight: 8,
    },
  ]) {
    const made: Template.ITemplate = Laws.template(law, datums, 1000);
    if (spans) {
      same(law.name + " centre", made.centre, [0, 0, 60]);
      same(law.name + " along", made.along, [0, 0, 1]);
      close(law.name + " half length", made.extent[0], 60);
    } else {
      same(law.name + " centre", made.centre, [10, -200, 30]);
      same(law.name + " along", made.along, [0, -1, 0]);
      same(law.name + " across", made.across, [0, 0, -1]);
      same(law.name + " normal", F.cross(made.along, made.across), [1, 0, 0]);
      close(law.name + " half extent along", made.extent[0], 20);
    }
    close(law.name + " half extent across", made.extent[1], halfWidth);
    close(law.name + " height", made.height, height);
    close(
      law.name + " height at the centre",
      Template.height(made, 0, 0),
      height,
    );
    close(
      law.name + " height on the edge along",
      Template.height(made, made.extent[0], 0),
      0,
    );
    close(
      law.name + " height on the edge across",
      Template.height(made, 0, -made.extent[1]),
      0,
    );

    const doubled: Template.ITemplate = Laws.template(law, datums, 2000);
    close(law.name + " doubled across", doubled.extent[1], 2 * halfWidth);
    close(law.name + " doubled height", doubled.height, 2 * height);
    same(law.name + " doubled along", doubled.along, made.along);
    close(
      law.name + " along extent after scale change",
      doubled.extent[0],
      spans ? 60 : 40,
    );

    const fuller: Template.ITemplate = Template.at(made, {
      along: 1,
      across: 1,
      tissue: 1.5,
    });
    close(law.name + " under tissue", fuller.height, tissueHeight);
  }

  const refused = (label: string, call: () => unknown): void => {
    try {
      call();
      failures.push(label + " was accepted");
    } catch {
      // Refused, as the law requires.
    }
  };
  refused("a nonpositive length", (): unknown =>
    Laws.template(centred, one, 0),
  );
  refused("a law of two landmarks given one", (): unknown =>
    Laws.template(spanned, one, 1000),
  );
  refused("a law of one landmark given no long direction", (): unknown =>
    Laws.template(centred, two, 1000),
  );
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
