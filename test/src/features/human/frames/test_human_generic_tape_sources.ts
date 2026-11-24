import {
  AutoMovieLoftViewSource,
  AutoMovieViewSection,
} from "@automovie/engine";
import {
  AutoMovieHumanArmConstruction,
  AutoMovieHumanArmInterim,
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
  AutoMovieHumanChestWall,
  AutoMovieHumanLimbRest,
  AutoMovieHumanLumbarSection,
  AutoMovieHumanMassInterim,
  AutoMovieHumanSex,
  AutoMovieHumanShoulderDatum,
  AutoMovieHumanTrunkInterim,
  AutoMovieHumanTrunkLaws,
  AutoMovieHumanTrunkShapes,
  AutoMovieHumanTrunkTapes,
  AutoMovieHumanTrunkViewPart,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmConstruction,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanParameters,
  IAutoMovieHumanTrunkViewLaws,
  IAutoMovieHumanTrunkViews,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../../internal/MOTION_HUMAN_PEOPLE.json";
import { nclose } from "../../internal/nclose";

/**
 * Generic arm, trunk and mass sources use public measures and analytic
 * sections.
 *
 * Scenarios:
 *
 * 1. Four independent arm tapes make the same centred circles on either side.
 * 2. The median back carries the authored cervicale and responds to posture.
 * 3. Upper trunk sites keep the acromion, axilla and neck dimensions.
 * 4. The chest and buttock targets retain the supplied widths and depths.
 * 5. The measured hand's default dimensions admit a positive tape section.
 * 6. Forearm and wrist calipers and the shoulder chord keep authored scale, and
 *    the hand's material follows its forearm.
 * 7. A public survey body carries the original neck cut and elliptical waist into
 *    the trunk solve and admits the arm's simultaneous breadth and tapes.
 * 8. Both near-boundary trunk tape trials preserve the neck's native source when
 *    their bounded section fullness is made explicit.
 * 9. The public trunk tape and arm original use the common neck boundary without
 *    solving the head or requesting raw lofts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads generic public source factories and checks their circumferences, endpoints, units, response to input changes and preparation scope.
 * @evidence contracts/development/testing.md#independent-expectations Uses the circumference formula for a circle, the authored neck and shoulder datums, the surveyed adjacent-wall box owners, the sternal CT mean and the explicit landmark bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises independent tape sites, opposite handedness, posture variation, scale, supplied support widths, breast setback, projected posterior depth and recorded requested versus unrequested stages.
 * @evidence contracts/development/testing.md#execution-ownership Pure CPU reads of synthetic numeric records and published scalar laws. The test loads no reference figure and creates no files.
 * @evidence contracts/development/common.md#meaningful-documentation States each source and the anatomical inputs it must retain.
 */
export function test_human_generic_tape_sources(): void {
  const failures: string[] = [];
  const approximate = (
    label: string,
    actual: number,
    expected: number,
  ): void => {
    if (!nclose(actual, expected, 1e-9))
      failures.push(`${label} read ${actual}, expected ${expected}`);
  };

  // Read one side from its own measured palm and both sides from the same long-bone tapes.
  const arm: IAutoMovieHumanArmConstruction.IInputs = {
    upper: 335,
    lower: 260,
    bicep: 305,
    elbow: 230,
    forearm: 260,
    wrist: 160,
    circumference: 192,
    left: { length: 181, palm: 105, breadth: 78, thumb: 65 },
    right: { length: 189, palm: 107, breadth: 84, thumb: 67 },
    scale: 1,
    sex: 0,
  };
  for (const side of ["left", "right"] as const) {
    const sites: IAutoMovieHumanArmWalk.ISiteLaw[] =
      AutoMovieHumanArmInterim.sites(side, arm, [0, 0, 0], [0, -260, 0], {
        projection: 33,
        humerus: 286,
      });
    for (const [name, tape] of [
      ["biceps", arm.bicep],
      ["elbow", arm.elbow],
      ["forearm", arm.forearm],
      ["wrist", arm.wrist],
    ] as const) {
      const site: IAutoMovieHumanArmWalk.ISiteLaw = sites.find(
        (s) => s.site === name,
      )!;
      for (const edge of site.edges)
        approximate(`${side} ${name} tape`, 2 * Math.PI * Math.abs(edge), tape);
      approximate(
        `${side} ${name} lateral centre`,
        site.edges[1] + site.edges[3],
        0,
      );
      approximate(
        `${side} ${name} forward centre`,
        site.edges[0] + site.edges[2],
        0,
      );
    }
    const palm: IAutoMovieHumanArmWalk.ISiteLaw = sites.find(
      (s) => s.site === "knuckles",
    )!;
    approximate(
      `${side} measured palm breadth`,
      palm.edges[0] - palm.edges[2],
      arm[side].breadth,
    );
  }

  const measures: IAutoMovieHumanBodyMeasures =
    AutoMovieHumanBodyAnatomy.resolve({
      body: {
        anatomy: {
          sex: AutoMovieHumanSex.Female,
          stature: 1700,
          kyphoticAngle: 58,
          lordoticAngle: 50,
          chestDepth: 275,
          chestBreadth: 340,
          bustPointWidth: 170,
          buttockDepth: 325,
          hipBreadth: 360,
        },
      },
    });
  const scale: number = 2;
  const calipers: IAutoMovieHumanArmWalk.ISiteLaw[] =
    AutoMovieHumanArmInterim.sites(
      "left",
      { ...arm, scale, circumference: arm.circumference * scale },
      [0, 0, 0],
      [0, -260, 0],
      { projection: 33, humerus: 286, calipers: measures },
    );
  for (const [site, breadth, depth] of [
    ["forearm", measures.forearmBreadth, measures.forearmDepth],
    ["wrist", measures.wristSkinBreadth, measures.wristDepth],
  ] as const) {
    const law: IAutoMovieHumanArmWalk.ISiteLaw = calipers.find(
      (value: IAutoMovieHumanArmWalk.ISiteLaw): boolean => value.site === site,
    )!;
    approximate(
      `${site} calibrated depth`,
      law.edges[0] - law.edges[2],
      depth * scale,
    );
    approximate(
      `${site} calibrated breadth`,
      law.edges[1] - law.edges[3],
      breadth * scale,
    );
  }
  approximate(
    "default posterior shoulder course",
    measures.acrossBackShoulderWidth,
    2 *
      Math.hypot(
        measures.biacromialBreadth / 2,
        measures.cervicaleHeight - measures.acromialHeight,
      ),
  );
  const trunkKey = AutoMovieHumanTrunkShapes.key(900, 165, 0.7, -85, 0.9);
  approximate("trunk key width", trunkKey.width, 165);
  approximate("trunk key back", trunkKey.back!, -85);
  approximate("trunk key ellipse depth", trunkKey.front! - trunkKey.back!, 231);
  approximate(
    "trunk key centre",
    trunkKey.middle,
    (trunkKey.front! + trunkKey.back!) / 2,
  );

  const acromialHeight: number = 1313;
  const neckSide: AutoMovieVector3Tuple = [30, 1385, 52];
  const attachment = AutoMovieHumanShoulderDatum.create(
    { acromion: acromialHeight, biacromial: 360, scale: 1 },
    measures.stature,
    neckSide,
  );
  approximate("acromial AP chord", attachment.shoulder[0], neckSide[0]);
  approximate("acromial height", attachment.shoulder[1], acromialHeight);
  approximate("acromial breadth", attachment.shoulder[2], 180);
  const foot = { length: 250, breadth: 95, ankle: 65 };
  const rest = AutoMovieHumanLimbRest.create({
    stature: measures.stature,
    arms: arm,
    feet: { left: foot, right: foot, fat: 0, muscularity: 0, scale: 1 },
    legs: {
      calf: 310,
      knee: 360,
      thigh: 550,
      hip: 995,
      sex: 0,
      fat: 0,
      muscularity: 0,
      scale: 1,
    },
    sex: AutoMovieHumanSex.Female,
    diagnostics: [],
    hipForward: 0,
    shoulder: () => attachment,
  });
  const difference = (
    end: AutoMovieVector3Tuple,
    start: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2],
  ];
  for (const side of ["left", "right"] as const) {
    const { bones, hand } = rest.arm(side);
    const upper: AutoMovieVector3Tuple = difference(
      bones.elbow,
      bones.shoulder,
    );
    const lower: AutoMovieVector3Tuple = difference(bones.wrist, bones.elbow);
    const cos: number =
      upper.reduce(
        (v: number, u: number, i: number): number => v + u * lower[i]!,
        0,
      ) /
      (Math.hypot(...upper) * Math.hypot(...lower));
    approximate(`${side} coronal bind`, upper[1], -Math.abs(upper[2]));
    approximate(
      `${side} female elbow carry`,
      (Math.acos(cos) * 180) / Math.PI,
      15.07,
    );
    hand.frame.along.forEach((axis: number, i: number): void =>
      approximate(
        `${side} hand along ${i}`,
        axis,
        lower[i]! / Math.hypot(...lower),
      ),
    );
  }
  const crotch: number = 820 * scale;
  const chest: number = 1160 * scale;
  const cervicale: number = measures.cervicaleHeight * scale;
  const datum: number = 16;
  const spine = (
    body: IAutoMovieHumanBodyMeasures,
  ): IAutoMovieHumanTrunkViewLaws.ILaws =>
    AutoMovieHumanTrunkLaws.of(body, scale, crotch, {
      chest,
      cervicale: datum,
      perineum: 0,
      upper: [],
    });
  const profile: IAutoMovieHumanTrunkViewLaws.ILaws = spine(measures);
  const stiffer: IAutoMovieHumanTrunkViewLaws.ILaws = spine({
    ...measures,
    kyphoticAngle: 64,
  });
  approximate("cervicale datum", profile.back(cervicale), datum);
  const backAt: number = (chest + cervicale) / 2;
  if (
    !(
      profile.back(backAt) < datum &&
      Math.abs(profile.back(backAt) - stiffer.back(backAt)) > 0.1
    )
  )
    failures.push(
      "the posterior curve lost its profile or ignored kyphotic angle",
    );

  const neck = {
    y: cervicale,
    width: 53 * scale,
    middle: 32 * scale,
    front: [105 * scale, cervicale, 0] as [number, number, number],
    back: [datum, cervicale, 0] as [number, number, number],
    side: [32 * scale, cervicale, 53 * scale] as [number, number, number],
    lateral: { y: cervicale, z: 53 * scale, slope: 0, curvature: 0 },
  };
  const axilla: number = measures.axillaHeight * scale;
  const shoulder: [number, number, number] = [
    0,
    (axilla + cervicale) / 2,
    180 * scale,
  ];
  const bustPoint: [number, number, number] = [0, chest, 85 * scale];
  const breastSetback: number = AutoMovieHumanMassInterim.breastAmplitude(
    measures,
    scale,
  );
  const upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"] =
    AutoMovieHumanTrunkInterim.upperSites(
      { seat: neck, landmarks: { shoulder, bustPoint } },
      measures,
      scale,
      profile.back,
      breastSetback,
    );
  const [armpit, acromion, seat] = upper;
  if (
    armpit?.site !== "axilla" ||
    acromion?.site !== "acromion" ||
    seat?.site !== "neck"
  )
    failures.push(
      "upper sites do not retain their ordered anatomical addresses",
    );
  if (armpit !== undefined && acromion !== undefined && seat !== undefined) {
    approximate("armpit height", armpit.y, axilla);
    approximate(
      "armpit support",
      armpit.half,
      shoulder[2] - (measures.upperArmCircumference * scale) / (2 * Math.PI),
    );
    approximate("shoulder support", acromion.half, shoulder[2]);
    approximate("neck support", seat.half, neck.width);
    approximate("neck front", seat.front, neck.front[0]);
    approximate("neck back", seat.back!, neck.back[0]);
    approximate(
      "bare chest depth at axilla",
      armpit.front - armpit.back!,
      measures.chestDepth * scale - breastSetback,
    );
  }

  const local: IAutoMovieHumanTrunkViewLaws.ILaws = { ...profile, upper };
  const pelvis: { buttock: number; crotch: number } = {
    crotch,
    buttock: crotch + 55 * scale,
  };
  const fold: number = 10;
  const glutealSetback: number = AutoMovieHumanMassInterim.glutealAmplitude(
    measures,
    scale,
  );
  const breast = AutoMovieHumanMassInterim.breast(
    measures,
    scale,
    local,
    fold,
    crotch,
    breastSetback,
  );
  const gluteal = AutoMovieHumanMassInterim.gluteal(
    pelvis,
    measures,
    scale,
    local,
    fold,
    glutealSetback,
  );
  approximate(
    "median chest setback",
    breastSetback,
    (measures.chestDepth -
      AutoMovieHumanChestWall.box(measures, measures.underbustCircumference)
        .depth) *
      scale,
  );
  approximate(
    "median hip setback",
    glutealSetback,
    (measures.buttockDepth -
      AutoMovieHumanLumbarSection.box(measures, measures.highHipCircumference)
        .depth) *
      scale,
  );
  if (breast === null || gluteal === null)
    failures.push("positive supplied projection did not generate a mass");
  else {
    approximate(
      "bust target width",
      breast.target[2] * 2,
      measures.bustPointWidth * scale,
    );
    approximate(
      "bust target depth",
      breast.target[0] - local.back(chest),
      measures.chestDepth * scale,
    );
    approximate(
      "sternum boundary",
      breast.target[2] - breast.footprint[3],
      13.9 * scale,
    );
    approximate(
      "gluteal midline clearance",
      gluteal.target[2] - gluteal.footprint[3],
      fold,
    );
    approximate(
      "gluteal lower boundary",
      gluteal.target[1] - gluteal.footprint[2],
      crotch,
    );
  }
  approximate(
    "male breast setback",
    AutoMovieHumanMassInterim.breastAmplitude(
      { ...measures, sex: AutoMovieHumanSex.Male },
      scale,
    ),
    0,
  );

  for (const sex of [AutoMovieHumanSex.Female, AutoMovieHumanSex.Male]) {
    const hand = AutoMovieHumanArmConstruction.expected(
      measures.stature,
      arm.circumference,
      scale,
      sex,
    );
    if (
      !(
        hand.length > hand.palm &&
        hand.palm > hand.thumb &&
        0 < hand.breadth &&
        2 * hand.breadth < arm.circumference * scale
      )
    )
      failures.push(
        "public hand defaults lack a positive tape section or ordered lengths",
      );
  }
  checkPublicOriginals();
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Read the actual regional and trunk source owners for one public survey body. */
function checkPublicOriginals(): void {
  const params = PEOPLE["m-average"].params as IAutoMovieHumanParameters;
  const original = AutoMovieHumanBodyLaw.prepareSources(params);
  const trunk = original.trunkSolution();
  const { seat, connection } = original.neckBoundary();
  const last = trunk.column.keys[trunk.column.keys.length - 1]!;
  TestValidator.predicate(
    "the actual neck cut closes the top column key",
    last.y === seat.y &&
      last.back === seat.back[0] &&
      last.front === seat.front[0],
  );
  const waist = trunk.column.at(trunk.landmarks.waist);
  const tape = AutoMovieHumanTrunkTapes.hull(
    AutoMovieHumanTrunkTapes.points(waist, []),
  );
  TestValidator.predicate(
    "the coarse solver preserves its regular elliptical waist and neutral crotch displacement",
    Math.abs(tape - original.trunkInputs.waist) < 1e-6 &&
      waist.width > 0 &&
      Math.abs((waist.front + waist.back) / 2 - waist.middle) < 1e-9 &&
      waist.squareFront === 2 &&
      waist.squareBack === 2 &&
      trunk.column
        .at(trunk.landmarks.crotch)
        .foldFront(0)
        .every((value) => value === 0),
  );
  const { part, diagnostics } = original
    .limbSources()
    .arm("left")
    .arm().definition;
  if (part === null)
    throw new Error(
      `The independent left arm produced no original part: ${JSON.stringify(diagnostics)}`,
    );
  TestValidator.predicate(
    "the independent arm original has the left source name",
    part.name === "arm.left",
  );
  TestValidator.predicate(
    `the production arm must admit both proximal tapes and its deltoid width: ${JSON.stringify(diagnostics)}`,
    diagnostics.length === 0,
  );

  const lower: number = original.limbs.crotch;
  const span: number = seat.y - lower;
  for (const shoulder of [1e-8, 1 - 1e-8]) {
    const views: IAutoMovieHumanTrunkViews = {
      perineum: { y: lower, x: original.frame.perineum },
      connection,
      sites: [
        {
          site: "buttock",
          y: lower + 0.1 * span,
          half: 160,
          front: 90,
          back: -105,
          fullness: { shoulder },
        },
        {
          site: "waist",
          y: lower + 0.45 * span,
          half: 120,
          front: 70,
          back: -70,
          fullness: { shoulder: AutoMovieViewSection.ELLIPSE },
        },
        {
          site: "neck",
          y: seat.y,
          half: seat.width,
          front: seat.front[0],
          back: seat.back[0],
          fullness: { shoulder: AutoMovieViewSection.ELLIPSE },
        },
      ],
    };
    const trunkPart = AutoMovieHumanTrunkViewPart.define(views, {
      x: seat.middle,
      y: seat.y + seat.width,
    });
    const source =
      trunkPart.part === null
        ? null
        : AutoMovieLoftViewSource.create(trunkPart.part);
    TestValidator.predicate(
      `the trunk trial at shoulder ${shoulder} retains its admissible native cut: ${JSON.stringify(source?.diagnostics ?? trunkPart.diagnostics)}`,
      source?.source !== undefined && source.source !== null,
    );
  }

  TestValidator.predicate(
    "the tape and arm originals prepare the shared boundary without acquiring head or raw geometry",
    original.milliseconds.neckBoundary !== null &&
      original.milliseconds.trunkConstraints !== null &&
      original.milliseconds.headSource === null &&
      original.milliseconds.neckRaw === null &&
      original.production === undefined,
  );
}
