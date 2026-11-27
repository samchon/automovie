import { createSeat, createTable, AutoMovieArchetypeDrawerUnit, AutoMovieArchetypePlatformBed, AutoMovieArchetypeMirror } from "@automovie/archetypes";
import { createFurnishedRoom, AutoMovieEnvironment } from "@automovie/archetypes/environments";
import { Quaternion, Transform, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  AutoMovieFurnishingWall,
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentContribution,
  IAutoMovieFurnishingPiece,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieWallMount,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/** A world box: the eight corners of a turned rest box, enclosed per axis. */
interface IBox {
  /** Least corner, world metres. */
  min: IAutoMovieVector3;

  /** Greatest corner, world metres. */
  max: IAutoMovieVector3;
}

/**
 * A room furnished by relations places each piece from the measured boxes of
 * the pieces before it, hangs a wall piece at its producer's height and refuses
 * every broken relation by role.
 *
 * Scenarios:
 *
 * 1. In a 4.0 m by 3.2 m room, a sofa on wall `-z` at offset 0.4 has its back box
 *    face at z = -1.6, a chest `after` it with gap 0.05 starts 0.05 m past its
 *    box, and a coffee table `facing` it at distance 0.45 leaves 0.45 m of
 *    clear floor between the two front faces.
 * 2. A three-place sofa in place of a two-place one widens the drawn sofa, moves
 *    the chest by the width difference, still 0.05 m away, and keeps the coffee
 *    table centred on the sofa's box.
 * 3. A chest on each wall faces into the room at the table's heading, and a second
 *    chest `after` it lies further along the table's run direction.
 * 4. A wall mirror on wall `+x` with no elevation keeps its producer's underside
 *    height, its back box face lies on the wall at x = 2.0, and the room
 *    returns its wall; a sofa in the same room keeps its underside at 0.
 * 5. A single platform bed on wall `-z` at offset 0.8 reserves 0.76 m by 1.22 m
 *    beside both long sides: a chest `after` it with gap 0.10 enters the right
 *    rectangle and is refused, and with gap 0.86 it is accepted.
 * 6. A sofa whose 1.0 m front clearance cannot fit a 1.5 m deep room, an `after`
 *    naming a piece on another wall, a `facing` naming a later piece and a
 *    piece entering a `keepClear` door swing are refused by role.
 * 7. The same seed yields byte-identical stage, model and prop records.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds rooms through the public `createFurnishedRoom` in `createEnvironment` and reads the staged frames, which catches a wall face off the wall, a run or heading in the wrong direction, an `after` or `facing` that ignores the measured box, a hung piece dropped to the floor, a clearance not reserved and a refusal without its role.
 * @evidence contracts/development/testing.md#independent-expectations Every expected face, gap and height is computed from the room dimensions, the authored offsets and the producers' own rest boxes measured through the engine's `computeModelRestExtent` and turned by the staged rotation; the headings and run directions are the issue's table.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a two-place and a three-place sofa, an accepted and a refused chest gap on either side of the 0.76 m clearance, all four walls and four distinct refusals; `test_environment_furnishing` keeps the cafe and gym cases.
 * @evidence contracts/development/testing.md#execution-ownership A CPU-only feature scenario over in-memory rooms; it starts no renderer or host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists its seven scenarios with the input and expected behavior of each.
 */
export function test_environment_furnishing_relations(): void {
  const build: (
    room: readonly [number, number],
    pieces: Readonly<Record<string, IAutoMovieFurnishingPiece>>,
    keepClear?: Readonly<
      Record<string, readonly [number, number, number, number]>
    >,
  ) => IAutoMovieEnvironment = (
    room: readonly [number, number],
    pieces: Readonly<Record<string, IAutoMovieFurnishingPiece>>,
    keepClear?: Readonly<
      Record<string, readonly [number, number, number, number]>
    >,
  ): IAutoMovieEnvironment =>
    AutoMovieEnvironment.create({
      id: "home",
      seed: 7,
      items: {
        room: {
          use: createFurnishedRoom({
            room,
            pieces,
            ...(keepClear !== undefined ? { keepClear } : {}),
          }),
        },
      },
    });

  // A role's world box from its staged frame and its model's rest box.
  const box: (
    environment: IAutoMovieEnvironment,
    role: string,
    model: IAutoMovieModel,
  ) => IBox = (
    environment: IAutoMovieEnvironment,
    role: string,
    model: IAutoMovieModel,
  ): IBox => {
    const frame: IAutoMovieTransform = environment.anchors[`room/${role}`]!;
    const rest: IAutoMoviePropBox = AutoMovieEngineFilm.computeModelRestExtent(model)!;
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
  const forward: (
    environment: IAutoMovieEnvironment,
    role: string,
  ) => IAutoMovieVector3 = (
    environment: IAutoMovieEnvironment,
    role: string,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(environment.anchors[`room/${role}`]!.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });

  // Scenarios 1 and 2: a sofa, a chest after it and a coffee table facing it.
  const chest: IAutoMovieModel = AutoMovieArchetypeDrawerUnit.create({ kind: "chest" }, 1015);
  const coffee: IAutoMovieModel = createTable({ kind: "coffee" }, 1016);
  const lounge: (sofa: IAutoMovieModel) => IAutoMovieEnvironment = (
    sofa: IAutoMovieModel,
  ): IAutoMovieEnvironment =>
    build([4.0, 3.2], {
      sofa: { model: sofa, place: { kind: "wall", wall: "-z", offset: 0.4 } },
      chest: {
        model: chest,
        place: { kind: "wall", wall: "-z", after: "sofa", gap: 0.05 },
      },
      coffee: {
        model: coffee,
        place: { kind: "facing", target: "sofa", distance: 0.45 },
      },
    });
  const sofaA: IAutoMovieModel = createSeat({ kind: "sofa" }, 1017);
  const sofaB: IAutoMovieModel = createSeat({ kind: "sofa", places: 3 }, 1018);
  const widthOf: (model: IAutoMovieModel) => number = (
    model: IAutoMovieModel,
  ): number => {
    const rest: IAutoMoviePropBox = AutoMovieEngineFilm.computeModelRestExtent(model)!;
    return rest.max.x - rest.min.x;
  };
  const first: IAutoMovieEnvironment = lounge(sofaA);
  const second: IAutoMovieEnvironment = lounge(sofaB);
  const sofa1: IBox = box(first, "sofa", sofaA);
  const chest1: IBox = box(first, "chest", chest);
  const coffee1: IBox = box(first, "coffee", coffee);
  const sofa2: IBox = box(second, "sofa", sofaB);
  const chest2: IBox = box(second, "chest", chest);
  const coffee2: IBox = box(second, "coffee", coffee);

  // Scenario 3: two chests on each wall.
  const HEADINGS: Readonly<Record<AutoMovieFurnishingWall, number>> = {
    "-z": 0,
    "+z": 180,
    "+x": -90,
    "-x": 90,
  };
  const RUNS: Readonly<Record<AutoMovieFurnishingWall, IAutoMovieVector3>> = {
    "-z": { x: 1, y: 0, z: 0 },
    "+z": { x: -1, y: 0, z: 0 },
    "+x": { x: 0, y: 0, z: 1 },
    "-x": { x: 0, y: 0, z: -1 },
  };
  const walls: AutoMovieFurnishingWall[] = ["-z", "+z", "+x", "-x"];
  const ring: IAutoMovieEnvironment = build(
    [6, 6],
    Object.fromEntries(
      walls.flatMap(
        (
          wall: AutoMovieFurnishingWall,
        ): [string, IAutoMovieFurnishingPiece][] => [
          [
            `first${wall}`,
            { model: chest, place: { kind: "wall", wall, offset: 0.2 } },
          ],
          [
            `next${wall}`,
            {
              model: chest,
              place: { kind: "wall", wall, after: `first${wall}`, gap: 0.1 },
            },
          ],
        ],
      ),
    ),
  );

  // Scenario 4: a wall mirror on +x and a sofa on -z.
  const mirror: IAutoMovieModel = AutoMovieArchetypeMirror.create({ kind: "wall" }, 1019);
  const mirrorRest: IAutoMoviePropBox = AutoMovieEngineFilm.computeModelRestExtent(mirror)!;
  const hungPieces: Readonly<Record<string, IAutoMovieFurnishingPiece>> = {
    sofa: { model: sofaA, place: { kind: "wall", wall: "-z", offset: 0.4 } },
    mirror: { model: mirror, place: { kind: "wall", wall: "+x", offset: 1.0 } },
  };
  const hung: IAutoMovieEnvironment = build([4.0, 3.2], hungPieces);
  const contribution: IAutoMovieEnvironmentContribution = createFurnishedRoom({
    room: [4.0, 3.2],
    pieces: hungPieces,
  })({
    id: "home/room",
    seed: undefined,
    frame: Transform.identity(),
    anchor: (id: string): IAutoMovieTransform => {
      throw new Error(`no anchor ${id}`);
    },
  });

  // Scenario 5: a single bed with both long sides clear and a chest after it.
  const bed: IAutoMovieModel = AutoMovieArchetypePlatformBed.create({ kind: "single" }, 1020);
  const bedroom: (gap: number) => IAutoMovieEnvironment = (
    gap: number,
  ): IAutoMovieEnvironment =>
    build([4.0, 3.2], {
      bed: {
        model: bed,
        place: { kind: "wall", wall: "-z", offset: 0.8 },
        clear: [
          { side: "left", depth: 0.76, width: 1.22 },
          { side: "right", depth: 0.76, width: 1.22 },
        ],
      },
      chest: {
        model: chest,
        place: { kind: "wall", wall: "-z", after: "bed", gap },
      },
    });
  const sofaRest: IAutoMoviePropBox = AutoMovieEngineFilm.computeModelRestExtent(sofaA)!;

  const facts: Record<string, boolean> = namedFacts([
    [
      "the sofa's back box face is on the -z wall",
      (): boolean => nclose(sofa1.min.z, -1.6, 1e-9),
    ],
    [
      "the sofa's box starts 0.4 m from the -X corner",
      (): boolean => nclose(sofa1.min.x, -2.0 + 0.4, 1e-9),
    ],
    [
      "the chest starts 0.05 m past the sofa's box on the same wall",
      (): boolean =>
        nclose(chest1.min.x - sofa1.max.x, 0.05, 1e-9) &&
        nclose(chest1.min.z, -1.6, 1e-9),
    ],
    [
      "0.45 m of clear floor separates the sofa's and coffee table's front faces",
      (): boolean =>
        nclose(coffee1.min.z - sofa1.max.z, 0.45, 1e-9) &&
        vclose(forward(first, "coffee"), { x: 0, y: 0, z: -1 }),
    ],
    [
      "the three-place sofa is drawn wider",
      (): boolean => Math.abs(widthOf(sofaA) - widthOf(sofaB)) > 1e-3,
    ],
    [
      "the chest moves by the width difference and keeps its 0.05 m gap",
      (): boolean =>
        nclose(
          chest2.min.x - chest1.min.x,
          widthOf(sofaB) - widthOf(sofaA),
          1e-9,
        ) && nclose(chest2.min.x - sofa2.max.x, 0.05, 1e-9),
    ],
    [
      "the coffee table stays centred on the sofa's box",
      (): boolean =>
        nclose(
          (coffee1.min.x + coffee1.max.x) / 2,
          (sofa1.min.x + sofa1.max.x) / 2,
          1e-9,
        ) &&
        nclose(
          (coffee2.min.x + coffee2.max.x) / 2,
          (sofa2.min.x + sofa2.max.x) / 2,
          1e-9,
        ),
    ],
    [
      "each wall gives its table heading and run direction",
      (): boolean =>
        walls.every((wall: AutoMovieFurnishingWall): boolean => {
          const h: number = (HEADINGS[wall] * Math.PI) / 180;
          const a: IBox = box(ring, `first${wall}`, chest);
          const b: IBox = box(ring, `next${wall}`, chest);
          const along: number =
            ((b.min.x + b.max.x) / 2 - (a.min.x + a.max.x) / 2) * RUNS[wall].x +
            ((b.min.z + b.max.z) / 2 - (a.min.z + a.max.z) / 2) * RUNS[wall].z;
          return (
            vclose(
              forward(ring, `first${wall}`),
              { x: Math.sin(h), y: 0, z: Math.cos(h) },
              1e-9,
            ) && along > 0.75
          );
        }),
    ],
    [
      "the wall mirror keeps its producer's underside height and backs onto x = 2.0",
      (): boolean => {
        const hungMirror: IBox = box(hung, "mirror", mirror);
        return (
          mirrorRest.min.y > 0 &&
          nclose(hungMirror.min.y, mirrorRest.min.y, 1e-9) &&
          nclose(hungMirror.max.x, 2.0, 1e-9) &&
          nclose(box(hung, "sofa", sofaA).min.y, 0, 1e-9)
        );
      },
    ],
    [
      "the room returns the mirror's and the sofa's walls",
      (): boolean => {
        const mounts: readonly IAutoMovieWallMount[] =
          contribution.mounts ?? [];
        const of: (node: string) => IAutoMovieWallMount | undefined = (
          node: string,
        ): IAutoMovieWallMount | undefined =>
          mounts.find((m: IAutoMovieWallMount): boolean => m.node === node);
        const mirrorMount: IAutoMovieWallMount | undefined =
          of("home/room/mirror");
        return (
          mounts.length === 2 &&
          mirrorMount?.wall === "home/room/walls/+x" &&
          nclose(mirrorMount.point.x, 2.0, 1e-12) &&
          vclose(mirrorMount.normal, { x: -1, y: 0, z: 0 }, 1e-12) &&
          of("home/room/sofa")?.wall === "home/room/walls/-z"
        );
      },
    ],
    [
      "a chest 0.10 m past the bed enters the bed's right clearance and is refused",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment => bedroom(0.1),
          ["home/room chest", "bed/clear/right"],
        ),
    ],
    [
      "a chest 0.86 m past the bed clears it",
      (): boolean => {
        const room: IAutoMovieEnvironment = bedroom(0.86);
        return nclose(
          box(room, "chest", chest).min.x - box(room, "bed", bed).max.x,
          0.86,
          1e-9,
        );
      },
    ],
    [
      "a sofa deeper than 0.5 m cannot keep 1.0 m clear in a 1.5 m deep room",
      (): boolean =>
        sofaRest.max.z - sofaRest.min.z > 0.5 &&
        throwsError(
          (): IAutoMovieEnvironment =>
            build([4.0, 1.5], {
              sofa: {
                model: sofaA,
                place: { kind: "wall", wall: "-z" },
                clear: [{ depth: 1.0 }],
              },
            }),
          ["home/room sofa front clearance", "outside the usable room"],
        ),
    ],
    [
      "an after on another wall, a later facing target and a door swing are refused by role",
      (): boolean =>
        throwsError(
          (): IAutoMovieEnvironment =>
            build([4.0, 3.2], {
              sofa: {
                model: sofaA,
                place: { kind: "wall", wall: "-z", offset: 0.4 },
              },
              chest: {
                model: chest,
                place: { kind: "wall", wall: "+x", after: "sofa" },
              },
            }),
          ["home/room chest", '"sofa" is not on wall +x'],
        ) &&
        throwsError(
          (): IAutoMovieEnvironment =>
            build([4.0, 3.2], {
              coffee: {
                model: coffee,
                place: { kind: "facing", target: "sofa", distance: 0.45 },
              },
              sofa: {
                model: sofaA,
                place: { kind: "wall", wall: "-z", offset: 0.4 },
              },
            }),
          ["home/room coffee", '"sofa" is a later piece'],
        ) &&
        throwsError(
          (): IAutoMovieEnvironment =>
            build(
              [4.0, 3.2],
              {
                chest: {
                  model: chest,
                  place: { kind: "wall", wall: "-z", offset: 0.2 },
                },
              },
              { swing: [-1.9, -1.6, 0.9, 0.9] },
            ),
          ["home/room chest", "keepClear.swing"],
        ),
    ],
    [
      "the same seed repeats the stage, models and props byte for byte",
      (): boolean => {
        const again: IAutoMovieEnvironment = lounge(sofaA);
        return (
          JSON.stringify(again.stage) === JSON.stringify(first.stage) &&
          JSON.stringify(again.runtime.models) ===
            JSON.stringify(first.runtime.models) &&
          JSON.stringify(again.runtime.props) ===
            JSON.stringify(first.runtime.props)
        );
      },
    ],
  ]);
  TestValidator.predicate(
    `furnishing relations: ${Object.entries(facts)
      .filter(([, ok]: [string, boolean]): boolean => !ok)
      .map(([name]: [string, boolean]): string => name)
      .join("; ")}`,
    Object.values(facts).every((ok: boolean): boolean => ok) &&
      Object.keys(facts).length === 15,
  );
}
