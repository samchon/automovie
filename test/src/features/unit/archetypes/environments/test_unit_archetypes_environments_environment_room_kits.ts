import {
  createBedroomKit,
  createEnvironment,
  createKitchenKit,
  createLivingRoomKit,
  createOfficeKit,
} from "@automovie/archetypes/environments";
import { Quaternion, computeModelRestExtent } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../../../internal/predicates";

/** A world box: the corners of a turned rest box, enclosed per axis. */
interface IBox {
  /** Least corner, world metres. */
  min: IAutoMovieVector3;

  /** Greatest corner, world metres. */
  max: IAutoMovieVector3;
}

/** The roles each kit's JSDoc names. */
const ROLES: Readonly<Record<string, readonly string[]>> = {
  living: ["sofa", "coffee", "armchair-left", "armchair-right", "bookcase"],
  bedroom: ["bed", "wardrobe", "chest"],
  kitchen: ["refrigerator", "counter-1", "range", "counter-2"],
  office: [
    "filing",
    "bookcase",
    "desk-1",
    "desk-1/chair",
    "desk-2",
    "desk-2/chair",
    "desk-3",
    "desk-3/chair",
  ],
};

/**
 * The living-room, bedroom, kitchen and office kits furnish their stated rooms
 * by relation and refuse a room that cannot keep a cited clearance, naming it.
 *
 * Scenarios:
 *
 * 1. Each kit fits a stated room with every piece's box inside it; every role its
 *    JSDoc names is an anchor, and every producer affordance appears under its
 *    role.
 * 2. Bedroom: a room 0.10 m narrower than the drawn bed width plus 2 x 0.76 m is
 *    refused naming the bed's side clearance, and one 0.10 m wider is
 *    accepted.
 * 3. Kitchen: a room leaving 1.10 m in front of the counter run is accepted for
 *    one cook (1.10 >= 1.067) and refused for two (1.10 < 1.219), naming the
 *    work aisle.
 * 4. Office: three desk groups fit, each office chair faces its desk, and the
 *    filing cabinet's 0.76 m by 1.22 m clear floor holds no chair.
 * 5. Living room: under two seeds that change the sofa, the coffee table stays
 *    centred on the sofa with `tableGap` of clear floor, for the default and
 *    for `tableGap: 0.6`.
 * 6. The same seed yields byte-identical stage, model and prop records for every
 *    kit.
 */
export function test_unit_archetypes_environments_environment_room_kits(): void {
  const build: (
    use: IAutoMovieEnvironmentModule,
    seed?: number,
  ) => IAutoMovieEnvironment = (
    use: IAutoMovieEnvironmentModule,
    seed: number = 3,
  ): IAutoMovieEnvironment =>
    createEnvironment({ id: "flat", seed, items: { room: { use } } });
  const modelOf: (
    environment: IAutoMovieEnvironment,
    role: string,
  ) => IAutoMovieModel = (
    environment: IAutoMovieEnvironment,
    role: string,
  ): IAutoMovieModel =>
    environment.runtime.models.find(
      (model: IAutoMovieModel): boolean => model.id === `flat/room/${role}`,
    )!;
  const restOf: (
    environment: IAutoMovieEnvironment,
    role: string,
  ) => IAutoMoviePropBox = (
    environment: IAutoMovieEnvironment,
    role: string,
  ): IAutoMoviePropBox => computeModelRestExtent(modelOf(environment, role))!;
  const box: (environment: IAutoMovieEnvironment, role: string) => IBox = (
    environment: IAutoMovieEnvironment,
    role: string,
  ): IBox => {
    const frame: IAutoMovieTransform = environment.anchors[`room/${role}`]!;
    const rest: IAutoMoviePropBox = restOf(environment, role);
    const corners: IAutoMovieVector3[] = [];
    for (const x of [rest.min.x, rest.max.x])
      for (const y of [rest.min.y, rest.max.y])
        for (const z of [rest.min.z, rest.max.z]) {
          const turned: IAutoMovieVector3 = Quaternion.rotateVector(
            frame.rotation,
            { x, y, z },
          );
          corners.push({
            x: frame.translation.x + turned.x,
            y: frame.translation.y + turned.y,
            z: frame.translation.z + turned.z,
          });
        }
    const pick: (
      axis: "x" | "y" | "z",
      reduce: (...values: number[]) => number,
    ) => number = (
      axis: "x" | "y" | "z",
      reduce: (...values: number[]) => number,
    ): number =>
      reduce(...corners.map((p: IAutoMovieVector3): number => p[axis]));
    return {
      min: {
        x: pick("x", Math.min),
        y: pick("y", Math.min),
        z: pick("z", Math.min),
      },
      max: {
        x: pick("x", Math.max),
        y: pick("y", Math.max),
        z: pick("z", Math.max),
      },
    };
  };
  const fits: (
    environment: IAutoMovieEnvironment,
    kit: string,
    [width, depth]: readonly [number, number],
  ) => boolean = (
    environment: IAutoMovieEnvironment,
    kit: string,
    [width, depth]: readonly [number, number],
  ): boolean =>
    ROLES[kit]!.every((role: string): boolean => {
      const b: IBox = box(environment, role);
      const affordances: readonly IAutoMovieAffordance[] =
        modelOf(environment, role).affordances ?? [];
      return (
        b.min.x >= -width / 2 - 1e-9 &&
        b.max.x <= width / 2 + 1e-9 &&
        b.min.z >= -depth / 2 - 1e-9 &&
        b.max.z <= depth / 2 + 1e-9 &&
        b.min.y >= -1e-9 &&
        affordances.every(
          (affordance: IAutoMovieAffordance): boolean =>
            environment.anchors[`room/${role}/${affordance.id}`] !== undefined,
        )
      );
    });

  // Stated rooms.
  const LIVING: readonly [number, number] = [5, 4.5];
  const OFFICE: readonly [number, number] = [8, 7];
  const living: IAutoMovieEnvironment = build(
    createLivingRoomKit({ room: LIVING }),
  );
  const office: IAutoMovieEnvironment = build(
    createOfficeKit({ room: OFFICE, desks: 3 }),
  );

  // The bedroom's bound comes from the drawn bed, read from a roomy build.
  const roomy: IAutoMovieEnvironment = build(
    createBedroomKit({ room: [6, 4.2] }),
  );
  const bedRest: IAutoMoviePropBox = restOf(roomy, "bed");
  const bound: number = bedRest.max.x - bedRest.min.x + 2 * 0.76;
  const BEDROOM: readonly [number, number] = [bound + 0.1, 4.2];
  const bedroom: IAutoMovieEnvironment = build(
    createBedroomKit({ room: BEDROOM }),
  );

  // The kitchen leaves 1.10 m in front of its deepest work piece.
  const wide: IAutoMovieEnvironment = build(createKitchenKit({ room: [8, 3] }));
  const run: string[] = ROLES.kitchen!.slice();
  const runWidth: number = run.reduce((sum: number, role: string): number => {
    const rest: IAutoMoviePropBox = restOf(wide, role);
    return sum + rest.max.x - rest.min.x;
  }, 0);
  const frontage: number = Math.max(
    ...["counter-1", "range", "counter-2"].map((role: string): number => {
      const rest: IAutoMoviePropBox = restOf(wide, role);
      return rest.max.z - rest.min.z;
    }),
  );
  const KITCHEN: readonly [number, number] = [runWidth + 0.3, frontage + 1.1];
  const kitchen: IAutoMovieEnvironment = build(
    createKitchenKit({ room: KITCHEN, cooks: 1 }),
  );

  const facts: Record<string, boolean> = namedFacts([
    [
      "the living room fits its room with every role and affordance",
      (): boolean => fits(living, "living", LIVING),
    ],
    [
      "the bedroom fits a room 0.10 m wider than the bed and both side clearances",
      (): boolean => fits(bedroom, "bedroom", BEDROOM),
    ],
    [
      "the kitchen fits a room with 1.10 m in front of its run",
      (): boolean => fits(kitchen, "kitchen", KITCHEN),
    ],
    [
      "the office fits three desk groups",
      (): boolean => fits(office, "office", OFFICE),
    ],
    [
      "a bedroom 0.10 m narrower than the bed and both side clearances is refused naming the side clearance",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment =>
            build(createBedroomKit({ room: [bound - 0.1, 4.2] })),
          ["flat/room bed", "side clearance"],
        ),
    ],
    [
      "two cooks need more than 1.10 m and the refusal names the work aisle",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment =>
            build(createKitchenKit({ room: KITCHEN, cooks: 2 })),
          ["flat/room", "work aisle clearance"],
        ),
    ],
    [
      "each office chair faces its desk",
      (): boolean =>
        [1, 2, 3].every((index: number): boolean => {
          const chair: IAutoMovieTransform =
            office.anchors[`room/desk-${index}/chair`]!;
          const desk: IBox = box(office, `desk-${index}`);
          const forward: IAutoMovieVector3 = Quaternion.rotateVector(
            chair.rotation,
            { x: 0, y: 0, z: 1 },
          );
          return (
            forward.x * ((desk.min.x + desk.max.x) / 2 - chair.translation.x) +
              forward.z *
                ((desk.min.z + desk.max.z) / 2 - chair.translation.z) >
            0
          );
        }),
    ],
    [
      "the filing cabinet's clear floor holds no chair",
      (): boolean => {
        const filing: IBox = box(office, "filing");
        const centre: number = (filing.min.z + filing.max.z) / 2;
        const clear: IBox = {
          min: { x: filing.max.x, y: 0, z: centre - 0.38 },
          max: { x: filing.max.x + 1.22, y: 0, z: centre + 0.38 },
        };
        return [1, 2, 3].every((index: number): boolean => {
          const chair: IBox = box(office, `desk-${index}/chair`);
          return (
            Math.min(chair.max.x, clear.max.x) -
              Math.max(chair.min.x, clear.min.x) <=
              1e-9 ||
            Math.min(chair.max.z, clear.max.z) -
              Math.max(chair.min.z, clear.min.z) <=
              1e-9
          );
        });
      },
    ],
    [
      "reseeding changes the sofa and the coffee table follows it at tableGap",
      (): boolean => {
        // A sofa place has one fixed width, so a seed changes its depth.
        const sofaDepth: (environment: IAutoMovieEnvironment) => number = (
          environment: IAutoMovieEnvironment,
        ): number => {
          const rest: IAutoMoviePropBox = restOf(environment, "sofa");
          return rest.max.z - rest.min.z;
        };
        const follows: (gap: number | undefined) => boolean = (
          gap: number | undefined,
        ): boolean =>
          [3, 4].every((seed: number): boolean => {
            const room: IAutoMovieEnvironment = build(
              createLivingRoomKit({
                room: LIVING,
                ...(gap === undefined ? {} : { tableGap: gap }),
              }),
              seed,
            );
            const sofa: IBox = box(room, "sofa");
            const coffee: IBox = box(room, "coffee");
            return (
              nclose(
                (coffee.min.x + coffee.max.x) / 2,
                (sofa.min.x + sofa.max.x) / 2,
                1e-9,
              ) && nclose(coffee.min.z - sofa.max.z, gap ?? 0.45, 1e-9)
            );
          });
        return (
          Math.abs(
            sofaDepth(living) -
              sofaDepth(build(createLivingRoomKit({ room: LIVING }), 4)),
          ) > 1e-3 &&
          follows(undefined) &&
          follows(0.6)
        );
      },
    ],
    [
      "the same seed repeats every kit's stage, models and props byte for byte",
      (): boolean =>
        [
          (): IAutoMovieEnvironment =>
            build(createLivingRoomKit({ room: LIVING })),
          (): IAutoMovieEnvironment =>
            build(createBedroomKit({ room: BEDROOM })),
          (): IAutoMovieEnvironment =>
            build(createKitchenKit({ room: KITCHEN, cooks: 1 })),
          (): IAutoMovieEnvironment =>
            build(createOfficeKit({ room: OFFICE, desks: 3 })),
        ].every((make: () => IAutoMovieEnvironment): boolean => {
          const a: IAutoMovieEnvironment = make();
          const b: IAutoMovieEnvironment = make();
          return (
            JSON.stringify(a.stage) === JSON.stringify(b.stage) &&
            JSON.stringify(a.runtime.models) ===
              JSON.stringify(b.runtime.models) &&
            JSON.stringify(a.runtime.props) === JSON.stringify(b.runtime.props)
          );
        }),
    ],
  ]);
  TestValidator.predicate(
    `room kits: ${Object.entries(facts)
      .filter(([, ok]: [string, boolean]): boolean => !ok)
      .map(([name]: [string, boolean]): string => name)
      .join("; ")}`,
    Object.values(facts).every((ok: boolean): boolean => ok) &&
      Object.keys(facts).length === 10,
  );
}
