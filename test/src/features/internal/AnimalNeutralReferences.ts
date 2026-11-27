import type { AutoMovieArchetypeQuadruped } from "@automovie/archetypes";

/**
 * Independent source literals and declared transfer assumptions of the neutral unit.
 *
 * This test data never imports producer measurement/ratio tables. Horse controls
 * use the original Kubo/Matsuura lengths and their declared three-decimal
 * normalization precision. Brooks surface-cohort means scale the provisional
 * equid controls without asserting cleaned bone measurements. Non-equid rows
 * retain the primary cohorts and explicitly declared coarse fourth controls.
 */
export namespace AnimalNeutralReferences {
  /** Four actual control lengths, top to bottom, in metres. */
  export type Four = readonly [number, number, number, number];

  /** External source dimensions and independent length expectations. */
  export interface IExpected {
    /** Fixed source height, or null when the source supports a drawn band. */
    height: number | null;
    /** Source chest circumference in metres, independent of primitive output. */
    girth: number;
    /** Four fore control lengths, including explicitly provisional controls. */
    fore: Four;
    /** Four hind control lengths, including explicitly provisional controls. */
    hind: Four;
    /** Fore source normalization precision, separately propagated per control. */
    foreTolerance: Four;
    /** Hind source normalization precision, separately propagated per control. */
    hindTolerance: Four;
  }

  /** One actual public request and its independent physical interpretation. */
  export interface ICase {
    /** Human-readable source/cohort/tack identity. */
    id: string;
    /** Complete caller-authored producer inputs; the unit checks they stay unchanged. */
    params: AutoMovieArchetypeQuadruped.IParams;
    /** Derive expected source lengths at the independently observed height. */
    expected: (height: number) => IExpected;
  }

  /** Brooks-derived whole surface means: height/girth, forearm/cannon/digit and gaskin/hind-cannon/digit, centimetres. */
  const PONIES: Readonly<
    Record<
      "shetland" | "welshMountain" | "welshPony" | "dartmoor" | "connemara",
      readonly [number, number, number, number, number, number, number, number]
    >
  > = {
    shetland: [105.3, 135.8, 30.3, 19.7, 12.8, 35.8, 29.1, 14.1],
    welshMountain: [121.6, 151.6, 33.7, 24.5, 16.2, 41.0, 34.7, 15.9],
    welshPony: [130.7, 168.1, 37.5, 27.1, 15.5, 48.9, 37.8, 15.6],
    dartmoor: [125.7, 150.7, 33.2, 24.6, 19.5, 48.5, 34.6, 19.8],
    connemara: [146.0, 180.9, 39.2, 28.2, 18.4, 51.8, 37.6, 19.3],
  };

  /** Huson et al.2025 Table1: h/girth and four constructed fore/hind surface controls, centimetres; foot lengths are deliberately halved. */
  const DOGS: Readonly<
    Record<"pet" | "show" | "sled", readonly [number, number, Four, Four]>
  > = {
    pet: [
      56.92,
      67.23,
      [20.04, 21.41, 13.56 / 2, 13.56 / 2],
      [30.51, 24.21, 21.23 / 2, 21.23 / 2],
    ],
    show: [
      56.85,
      62.56,
      [19.1, 20.93, 12.5 / 2, 12.5 / 2],
      [27.3, 23.6, 20.8 / 2, 20.8 / 2],
    ],
    sled: [
      60.22,
      64.85,
      [17.83, 21.29, 12.83 / 2, 12.83 / 2],
      [30.15, 22.0, 20.24 / 2, 20.24 / 2],
    ],
  };

  /** Diop2020 pooled summary/TableII complete selected h/girth means, centimetres; no mass is measured. */
  const CAMELS: Readonly<
    Record<
      | "mauritanian-adult-female"
      | "maur1"
      | "maur2"
      | "maur3"
      | "maur4"
      | "maur5",
      readonly [number, number]
    >
  > = {
    "mauritanian-adult-female": [184.7, 197.8],
    maur1: [189.3, 200.8],
    maur2: [177.9, 188.4],
    maur3: [187.1, 194.7],
    maur4: [176.6, 205.4],
    maur5: [196.1, 204.1],
  };

  /** All explicit source cohorts crossed with all four equid tacks, without selecting expected values from production tables. */
  export function cases(): readonly ICase[] {
    const cases: ICase[] = [];
    for (const tack of ["saddle", "harness", "both", "pack"] as const) {
      cases.push({
        id: `horse/${tack}`,
        params: { kind: "horse", tack },
        expected: (height: number): IExpected =>
          equid(height, null, (height * 2.04) / 1.72),
      });
      cases.push({
        id: `donkey/${tack}`,
        params: { kind: "donkey", tack },
        expected: (height: number): IExpected =>
          equid(
            height,
            null,
            (height * 121.2) / 112.62,
            [151.1, 164.6, 42.2, 31.2, 20.9, 50.8, 43.9, 20.3],
          ),
      });
      for (const breed of [
        "shetland",
        "welshMountain",
        "welshPony",
        "dartmoor",
        "connemara",
      ] as const) {
        const row: (typeof PONIES)[typeof breed] = PONIES[breed];
        cases.push({
          id: `pony/${breed}/${tack}`,
          params: { kind: "pony", breed, tack },
          expected: (): IExpected =>
            equid(row[0] / 100, row[0] / 100, row[1] / 100, row),
        });
      }
      for (const [sex, height, girth] of [
        ["female", 1.304, 1.4785],
        ["male", 1.3528, 1.5258],
      ] as const)
        cases.push({
          id: `mule/${sex}/${tack}`,
          params: { kind: "mule", sex, tack },
          expected: (): IExpected => equid(height, height, girth),
        });
    }
    for (const cohort of ["pet", "show", "sled"] as const) {
      const row: (typeof DOGS)[typeof cohort] = DOGS[cohort];
      cases.push({
        id: `dog/${cohort}/collar`,
        params: {
          kind: "dog",
          cohort,
          mass: 22,
          collar: {
            width: 0.02,
            thickness: 0.003,
            leadLength: 0.6,
            leadRadius: 0.004,
          },
        },
        expected: (): IExpected =>
          exact(
            row[0] / 100,
            row[1] / 100,
            scale(row[2], 0.01),
            scale(row[3], 0.01),
          ),
      });
    }
    const lead: {
      width: number;
      thickness: number;
      leadLength: number;
      leadRadius: number;
    } = { width: 0.1, thickness: 0.01, leadLength: 0.6, leadRadius: 0.005 };
    cases.push({
      id: "ox/kathani-working-bullock/yoke",
      params: {
        kind: "ox",
        mass: 300,
        lead,
        equipment: {
          yoke: {
            width: 0.6,
            radius: 0.02,
            neckAt: 0.12,
            clearance: 0.005,
            hook: { radius: 0.008, opening: 0.08, depth: 0.05 },
          },
        },
      },
      expected: (): IExpected =>
        exact(
          1.1932,
          1.5061,
          [
            (0.3876 * 1.1932) / 1.3658,
            (0.3922 * 1.1932) / 1.3658,
            (0.2425 * 1.1932) / 1.3658,
            0.1 * 1.1932,
          ],
          [
            (0.4745 * 1.1932) / 1.3658,
            (0.4497 * 1.1932) / 1.3658,
            (0.2855 * 1.1932) / 1.3658,
            0.1 * 1.1932,
          ],
        ),
    });
    for (const cohort of [
      "mauritanian-adult-female",
      "maur1",
      "maur2",
      "maur3",
      "maur4",
      "maur5",
    ] as const) {
      const row: (typeof CAMELS)[typeof cohort] = CAMELS[cohort];
      const height: number = row[0] / 100;
      cases.push({
        id: `camel/${cohort}/pack`,
        params: {
          kind: "camel",
          cohort,
          mass: 450,
          lead,
          equipment: {
            pack: {
              length: 0.45,
              width: 0.2,
              thickness: 0.06,
              railRadius: 0.02,
              clearance: 0.01,
              hook: { radius: 0.008, opening: 0.1, depth: 0.05 },
            },
          },
        },
        expected: (): IExpected =>
          exact(
            height,
            row[1] / 100,
            scale([0.3863, 0.5229, 0.2779, 0.1523], height / 1.847),
            scale([0.4534, 0.4683, 0.4192, 0.1337], height / 1.847),
          ),
      });
    }
    cases.push({
      id: "deer/boso-adult-male",
      params: { kind: "deer", cohort: "boso-adult-male" },
      expected: (): IExpected =>
        exact(
          0.836,
          0.92,
          [0.1995, 0.198, 0.1873, 0.11 * 0.836],
          [0.2396, 0.278, 0.2143, 0.11 * 0.836],
        ),
    });
    cases.push({
      id: "deer/boso-adult-female",
      params: { kind: "deer", cohort: "boso-adult-female" },
      expected: (): IExpected =>
        exact(
          0.74,
          0.788,
          [0.1749, 0.1773, 0.1725, 0.11 * 0.74],
          [0.2141, 0.2424, 0.1981, 0.11 * 0.74],
        ),
    });
    return cases;
  }

  /** Original equine studies' unrounded ratios and source-documented coarse three-decimal quantization, with optional explicit Brooks transfer. */
  function equid(
    height: number,
    fixed: number | null,
    girth: number,
    surface?: readonly [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ],
  ): IExpected {
    const fore: Four = [0.3 / 1.584, 0.382 / 1.62, 0.28 / 1.62, 0.185 / 1.62];
    const hind: Four = [0.35 / 1.584, 0.384 / 1.62, 0.368 / 1.62, 0.183 / 1.62];
    const factors: readonly [Four, Four] =
      surface === undefined
        ? [
            [1, 1, 1, 1],
            [1, 1, 1, 1],
          ]
        : [
            [
              1,
              surface[2] / surface[0] / (45.4 / 161.4),
              surface[3] / surface[0] / (32.9 / 161.4),
              surface[4] / surface[0] / (20.4 / 161.4),
            ],
            [
              1,
              surface[5] / surface[0] / (58.2 / 161.4),
              surface[6] / surface[0] / (46.5 / 161.4),
              surface[7] / surface[0] / (20.9 / 161.4),
            ],
          ];
    return {
      height: fixed,
      girth,
      fore: multiply(fore, scale(factors[0], height)),
      hind: multiply(hind, scale(factors[1], height)),
      foreTolerance: scale(factors[0], height * 0.0005 + 1e-9),
      hindTolerance: scale(factors[1], height * 0.0005 + 1e-9),
    };
  }

  /** Source metre literals and declared non-equid transfer require only double-precision observation error. */
  function exact(
    height: number,
    girth: number,
    fore: Four,
    hind: Four,
  ): IExpected {
    return {
      height,
      girth,
      fore,
      hind,
      foreTolerance: [1e-9, 1e-9, 1e-9, 1e-9],
      hindTolerance: [1e-9, 1e-9, 1e-9, 1e-9],
    };
  }

  /** Independent unit conversion and declared uniform-transfer arithmetic on a fixed four-vector. */
  function scale(values: Four, factor: number): Four {
    return [
      values[0] * factor,
      values[1] * factor,
      values[2] * factor,
      values[3] * factor,
    ];
  }

  /** Independent source normalization product without reading a production ratio table. */
  function multiply(left: Four, right: Four): Four {
    return [
      left[0] * right[0],
      left[1] * right[1],
      left[2] * right[2],
      left[3] * right[3],
    ];
  }
}
