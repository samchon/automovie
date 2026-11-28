import { nclose } from "../../internal/predicates";
import { AutoMovieEngineViewAxis, AutoMovieEngineViewOutline } from "@automovie/engine";
import {
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeControlLaw as N,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * Complete conic controls, independent skin/bone roots and protected native scalar functions.
 *
 * Scenarios:
 * 1. Identity at a distant centre preserves every valid ellipse control; scaling a made ellipse carries all controls and tangents.
 * 2. A bone shift from z5 to z9 keeps the skin root at5 through rail2, reaches9 at6 and is7 at4; identity borrows its source.
 * 3. A remote knot changes while [0,1] retains the independent original cubic value and both physical derivatives, even with a changed whole-source span.
 * 4. Identical root parameters preserve sqrt(s) with changed normalized span; a nonlinear root-to-station map is refused instead of claiming whole-function preservation.
 * 5. A skin-owned mound keeps its four-millimetre free course when its entire root datum moves.
 * 6. Nonpositive directional size, reversed root spans and reversed protected intervals are refused.
 * 7. Source identity retains valid ownership but does not bypass interval-domain or finite-junction admission.
 * 8. A junction binds only a boundary both sources share: the same knots read 0.5 station-linear and 0.7071 under a top pole at s 0.5,
 *    and a knot changed by 0.1 nearby moves the cubic at 0.5, so both are refused by name ("protected junction at 0.5 disagrees"); an
 *    equal copy, or one nudged by 5e-12 against the tolerance 1e-9 of the extent 5 (in value, slope per station unit and second
 *    derivative), is bound and reads the original cubic, slope and curvature at 0.25, 0.5 and 0.75.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises actual complete original-control, course and scalar-source owners; detects root bone carry and natural interpolation leakage rather than comparing metadata.
 * @evidence contracts/development/testing.md#independent-expectations Affine ellipse arithmetic and a fixed skin datum give literal controls/root positions; the protected source is the separately admitted original cubic, whose finite derivatives come from the native evaluator.
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios check literal identity, affine controls, carried root and protected intervals, root parameter transport, skin attachment and invalid junctions.
 */
export function test_human_native_control_law(): void {
  const failures: string[] = [];
  const circle: IAutoMovieHumanConicSection.IChain = S.resolve(
    [2, 0, 0, 3, -2, 0, 0, -3, 0.4, 0.4, 0.4, 0.4],
    S.limb(0),
  );
  const unchanged: IAutoMovieHumanConicSection.IChain = N.section(circle, [1e20, 1e20], [0, 0], [1, 1]);
  const originalPoints: AutoMovieVector2Tuple[] = [
    [2, 0],
    [0, 3],
    [-2, 0],
    [0, -3],
  ];
  const ellipsePoints: AutoMovieVector2Tuple[] = [
    [5, 2],
    [1, 11],
    [-3, 2],
    [1, -7],
  ];
  const ellipseTangents: AutoMovieVector2Tuple[] = [
    [0, 3],
    [-2, 0],
    [0, -3],
    [2, 0],
  ];
  const ellipse: IAutoMovieHumanConicSection.IChain = N.section(circle, [0, 0], [1, 2], [2, 3]);
  for (let k: number = 0; k < 4; k++)
    for (let c: number = 0; c < 2; c++) {
      if (
        !nclose(unchanged.input.points[k]![c]!, originalPoints[k]![c]!, 1e-12)
      )
        failures.push("zero-delta identity cancelled control " + k + ":" + c);
      if (
        !nclose(ellipse.input.points[k]![c]!, ellipsePoints[k]![c]!, 1e-12) ||
        !nclose(ellipse.input.tangents[k]![c]!, ellipseTangents[k]![c]!, 1e-12)
      )
        failures.push(
          "complete affine point/tangent differs at " + k + ":" + c,
        );
    }
  if (
    ellipse.guides !== circle.guides ||
    ellipse.input.shoulders !== circle.input.shoulders
  )
    failures.push("affine map changed guide or shoulder owners");
  const fixed = (z: number): IAutoMovieViewAxis.IAxis => ({
    at: (station: number) => ({
      origin: [0, station, z],
      u: [1, 0, 0],
      v: [0, 0, 1],
    }),
    jet: (station: number) => ({
      value: { origin: [0, station, z], u: [1, 0, 0], v: [0, 0, 1] },
      first: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
      second: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
    }),
  });
  const skin: IAutoMovieViewAxis.IAxis = fixed(5);
  const bone: IAutoMovieViewAxis.IAxis = fixed(9);
  const axis: IAutoMovieViewAxis.IAxis = N.root(skin, bone, 2, 6);
  for (const [station, z] of [
    [0, 5],
    [2, 5],
    [4, 7],
    [6, 9],
    [8, 9],
  ])
    if (!nclose(axis.at(station).origin[2], z!, 1e-12))
      failures.push("skin/bone axis disagrees at " + station);
  if (N.root(skin, skin, 2, 6) !== skin)
    failures.push("identical axis owner was not borrowed");

  // Past the release the course is the bone's alone: a bone whose planes turn there (a knee at another arclength than the
  // skin course's) is read without the skin, while the same turn inside the handoff is still refused.
  const turned = (from: number): IAutoMovieViewAxis.IAxis => ({
    at: (station: number) => ({ ...bone.at(station), ...(station >= from ? { u: [0, 0, 1], v: [-1, 0, 0] } : {}) }),
  });
  try {
    const past = N.root(skin, turned(7), 2, 6).at(8);
    if (past.u[2] !== 1 || past.origin[2] !== 9) failures.push("the bone's own frame was not returned past the release");
  } catch (error: unknown) {
    failures.push("a bone turning past the release was refused: " + (error instanceof Error ? error.message : String(error)));
  }
  try {
    N.root(skin, turned(3), 2, 6).at(4);
    failures.push("a bone turning inside the handoff was admitted");
  } catch {
    // Refused as it must be.
  }
  for (const [station, first] of [
    [2, 0],
    [4, 1.875],
    [6, 0],
  ]) {
    const jet = axis.jet?.(station!);
    if (
      jet === undefined ||
      jet === null ||
      !nclose(jet.first.origin[2], first!, 1e-12) ||
      !nclose(jet.second.origin[2], 0, 1e-12) ||
      !nclose(jet.first.origin[1], 1, 1e-12) ||
      !nclose(jet.value.u[0], 1, 1e-12) ||
      !nclose(jet.value.v[2], 1, 1e-12)
    )
      failures.push("root physical2 differs at " + station);
  }
  const source = (values: number[]): IAutoMovieViewPart.IOutline => ({
    knots: values.map(
      (value: number, station: number): IAutoMovieViewPart.IKnot => ({
        site: "made" + station,
        station,
        value,
      }),
    ),
  });
  const one: IAutoMovieViewPart.IOutline = source([1, 2]);
  if (N.outline(one, one, { type: "interval", domain: [0, 1] }) !== one)
    failures.push("valid source identity did not retain its owner");
  for (const request of [
    { type: "interval", domain: [2, 3] },
    { type: "junction", station: NaN },
  ] as N.IProtection[]) {
    for (const identical of [true, false]) {
      let refused: boolean = false;
      try {
        N.outline(
          one,
          identical ? one : { ...one, knots: one.knots.map((k) => ({ ...k })) },
          request,
        );
      } catch {
        refused = true;
      }
      if (!refused)
        failures.push(
          (identical ? "same-object" : "separate equal") +
            " source bypassed " +
            request.type +
            " admission",
        );
    }
  }
  const binding: IAutoMovieViewPart.IOutline = source([1, 0]);
  let bindingRefused: boolean = false;
  try {
    N.outline(
      binding,
      binding,
      { type: "interval", domain: [0, 0.5] },
      {},
      { top: 1 },
    );
  } catch {
    bindingRefused = true;
  }
  if (!bindingRefused)
    failures.push(
      "same-object source borrowed a different valid pole binding for a whole interval",
    );
  // A junction binds a boundary both sources already share; it never writes the bound value over a changed function. The station-linear
  // source reads 1 - s = 0.5 at s = 0.5, the same knots closed at a top pole read sqrt(1 - s) = 0.7071 there, so the binding is refused.
  let disagreementRefused: boolean = false;
  try {
    N.outline(
      binding,
      binding,
      { type: "junction", station: 0.5 },
      {},
      { top: 1 },
    );
  } catch (error: unknown) {
    disagreementRefused = String(error).includes(
      "protected junction at 0.5 disagrees",
    );
  }
  if (!disagreementRefused)
    failures.push(
      "a junction whose bound value 0.5 disagrees with the changed source's 0.7071 overwrote it",
    );

  // A knot changed by 0.1 two and a half stations away still moves the natural cubic at 0.5 by millimetres' thousandths, far past the
  // binding tolerance, so it is refused too; an equal copy, and one whose knot differs by 1e-12 of the outline's extent, are bound and
  // read the original cubic and its jets there.
  const equalJunction: IAutoMovieViewPart.IOutline = source([1, 2, 1, 5]);
  let shiftedRefused: boolean = false;
  try {
    N.outline(equalJunction, source([1, 2, 1, 5.1]), {
      type: "junction",
      station: 0.5,
    });
  } catch (error: unknown) {
    shiftedRefused = String(error).includes(
      "protected junction at 0.5 disagrees",
    );
  }
  if (!shiftedRefused)
    failures.push("a junction disagreeing with its changed natural cubic was accepted");
  const reference = AutoMovieEngineViewOutline.create(equalJunction);
  for (const nudge of [0, 5e-12]) {
    let bound: IAutoMovieViewPart.IOutline | undefined;
    try {
      bound = N.outline(equalJunction, source([1, 2, 1, 5 + nudge]), {
        type: "junction",
        station: 0.5,
      });
    } catch (error: unknown) {
      failures.push(`an equal junction (nudge ${nudge}) was refused: ${String(error)}`);
    }
    if (bound === undefined || "contract" in reference) continue;
    const curve = AutoMovieEngineViewOutline.create(bound);
    if ("contract" in curve) {
      failures.push("an equal junction made an inadmissible source");
      continue;
    }
    for (const station of [0.25, 0.5, 0.75]) {
      const a = AutoMovieEngineViewOutline.at(reference, station);
      const b = AutoMovieEngineViewOutline.at(curve, station);
      if (
        typeof a === "string" ||
        typeof b === "string" ||
        a.stationJet === null ||
        b.stationJet === null ||
        !nclose(a.value, b.value, 1e-10) ||
        !nclose(a.stationJet[0], b.stationJet[0], 1e-9) ||
        !nclose(a.stationJet[1], b.stationJet[1], 1e-8)
      )
        failures.push(`an equal junction changed the source at ${station}`);
    }
  }
  const original: IAutoMovieViewPart.IOutline = source([1, 2, 1]);
  const protectedSource: IAutoMovieViewPart.IOutline = N.outline(
    original,
    source([1, 2, 1, 5]),
    { type: "interval", domain: [0, 1] },
  );
  const old: ReturnType<typeof AutoMovieEngineViewOutline.create> =
    AutoMovieEngineViewOutline.create(original);
  const changed: ReturnType<typeof AutoMovieEngineViewOutline.create> =
    AutoMovieEngineViewOutline.create(protectedSource);
  if ("contract" in old || "contract" in changed)
    failures.push("made original source admission failed");
  else
    for (const station of [0, 0.25, 0.5, 0.75, 1]) {
      const a = AutoMovieEngineViewOutline.at(old, station);
      const b = AutoMovieEngineViewOutline.at(changed, station);
      const expected: readonly number[] = [
        1 + 1.5 * station - 0.5 * station ** 3,
        1.5 - 1.5 * station ** 2,
        -3 * station,
      ];
      if (
        typeof a === "string" ||
        typeof b === "string" ||
        a.stationJet === null ||
        b.stationJet === null ||
        ![
          a.value - expected[0]!,
          a.stationJet[0] - expected[1]!,
          a.stationJet[1] - expected[2]!,
          b.value - expected[0]!,
          b.stationJet[0] - expected[1]!,
          b.stationJet[1] - expected[2]!,
        ].every((difference: number): boolean => Math.abs(difference) < 1e-10)
      )
        failures.push("remote knot contaminated held physical2 at " + station);
    }
  const rootOriginal: IAutoMovieViewPart.IOutline = {
    parameter: { type: "root", end: "bottom", pole: 0 },
    knots: [
      { site: "one", station: 1, value: 1 },
      { site: "four", station: 4, value: 2 },
    ],
  };
  const rootChanged: IAutoMovieViewPart.IOutline = {
    ...rootOriginal,
    knots: [...rootOriginal.knots, { site: "nine", station: 9, value: 3 }],
  };
  const sameParameter = AutoMovieEngineViewOutline.create(
    N.outline(rootOriginal, rootChanged, { type: "interval", domain: [1, 4] }),
  );
  if ("contract" in sameParameter)
    failures.push("same-root-parameter counterpart refused");
  else {
    const value = AutoMovieEngineViewOutline.at(sameParameter, 2.5);
    if (
      typeof value === "string" ||
      value.stationJet === null ||
      !nclose(value.value, Math.sqrt(2.5), 1e-12) ||
      !nclose(value.stationJet[0], 1 / (2 * Math.sqrt(2.5)), 1e-12)
    )
      failures.push("same-parameter preservation lost sqrt(s) physical units");
  }
  let refusedNonlinear: boolean = false;
  try {
    N.outline(
      rootOriginal,
      {
        knots: rootOriginal.knots.map(
          (k): IAutoMovieViewPart.IKnot => ({ ...k }),
        ),
      },
      { type: "interval", domain: [1, 4] },
    );
  } catch (error: unknown) {
    refusedNonlinear = error instanceof Error;
  }
  if (!refusedNonlinear)
    failures.push(
      "nonlinear root-to-station parameter was accepted as exact preservation",
    );
  const movedSkin: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight(
    [3, 0, 9],
    [1, 0, 0],
    [0, 0, 1],
  );
  const mound: IAutoMovieViewAxis.IAxis = N.skinCourse(movedSkin);
  if (
    !nclose(mound.at(2).origin[0], 3, 1e-12) ||
    !nclose(mound.at(6).origin[0], 3, 1e-12) ||
    !nclose(mound.at(6).origin[1] - mound.at(2).origin[1], 4, 1e-12)
  )
    failures.push(
      "skin-owned mound tip did not follow its root while free course stayed4",
    );
  for (const bad of [
    (): unknown => N.section(circle, [0, 0], [0, 0], [0, 1]),
    (): unknown => N.root(skin, bone, 6, 2),
    (): unknown =>
      N.outline(original, source([1, 2, 3]), {
        type: "interval",
        domain: [1, 0],
      }),
  ]) {
    let refused: boolean = false;
    try {
      bad();
    } catch {
      refused = true;
    }
    if (!refused) failures.push("invalid native control input accepted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
