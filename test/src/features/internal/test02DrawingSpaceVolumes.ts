import { deriveAutoMovieDrawingSchedule } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieDrawingSchedule,
  IAutoMovieDrawingScheduleRow,
  IAutoMovieDrawingSpacePlace,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingCell } from "./drawingFixtures";
import { namedFacts, nclose } from "./predicates";
import { test12ValuesClose } from "./test12ValuesClose";

/** Original space-schedule scenario 5 and its existing shell declarations. */
export function test02DrawingSpaceVolumes(
  environment: IAutoMovieBuiltEnvironment,
  row: (
    schedule: IAutoMovieDrawingSchedule,
    space: string,
  ) => Omit<IAutoMovieDrawingScheduleRow, "place"> & {
    place: IAutoMovieDrawingSpacePlace | null;
  },
  withSpace: (
    environment: IAutoMovieBuiltEnvironment,
    space: IAutoMovieBuiltSpace,
  ) => IAutoMovieBuiltEnvironment,
): void {
  // 5. Other spellings of a declared volume.
  TestValidator.equals(
    "a zone is measured from whatever spelling it declared, or from neither",
    namedFacts([
      [
        "a shelled zone is measured from its own vertices",
        (): boolean => {
          const shelled: {
            place: IAutoMovieDrawingSpacePlace | null;
            mark: string;
            kind: string;
            model: string | null;
            width: number | null;
            height: number | null;
            count: number;
            members: string[];
            omittedMembers: number;
            basis: "profile" | "fill" | "unmeasured";
          } = row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, tetrahedronSpace()),
              subject: "space",
            }),
            "vault",
          );
          return (
            shelled.basis === "profile" &&
            nclose(shelled.width ?? NaN, 1, 0) &&
            nclose(shelled.height ?? NaN, 1, 0) &&
            nclose(shelled.place?.declared?.max.z ?? NaN, 1, 0)
          );
        },
      ],
      [
        "a shell of over 130,000 vertices is bounded like a small one",
        (): boolean => {
          const crowded: {
            place: IAutoMovieDrawingSpacePlace | null;
            mark: string;
            kind: string;
            model: string | null;
            width: number | null;
            height: number | null;
            count: number;
            members: string[];
            omittedMembers: number;
            basis: "profile" | "fill" | "unmeasured";
          } = row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, crowdedVaultSpace()),
              subject: "space",
            }),
            "vault",
          );
          return (
            crowded.basis === "profile" &&
            nclose(crowded.width ?? NaN, 1, 0) &&
            nclose(crowded.height ?? NaN, 1, 0) &&
            test12ValuesClose(crowded.place?.declared, {
              min: { x: 0, y: 0, z: 0 },
              max: { x: 1, y: 1, z: 1 },
            })
          );
        },
      ],
      [
        "a zone stated over two cells reports the box that holds both",
        (): boolean => {
          const twin: {
            place: IAutoMovieDrawingSpacePlace | null;
            mark: string;
            kind: string;
            model: string | null;
            width: number | null;
            height: number | null;
            count: number;
            members: string[];
            omittedMembers: number;
            basis: "profile" | "fill" | "unmeasured";
          } = row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, {
                id: "wing",
                kind: "room",
                parent: "site",
                cells: [
                  drawingCell(
                    "wing-a",
                    { x: 0, y: 0, z: 0 },
                    { x: 2, y: 2, z: 2 },
                  ),
                  drawingCell(
                    "wing-b",
                    { x: 4, y: 0, z: 0 },
                    { x: 6, y: 1, z: 2 },
                  ),
                ],
              }),
              subject: "space",
            }),
            "wing",
          );
          return (
            nclose(twin.place?.declared?.min.x ?? NaN, 0, 0) &&
            nclose(twin.place?.declared?.max.x ?? NaN, 6, 0) &&
            nclose(twin.place?.declared?.max.y ?? NaN, 2, 0)
          );
        },
      ],
      [
        "a chamfered cell is refused rather than boxed off from a guess",
        (): boolean =>
          row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, {
                id: "bevel",
                kind: "room",
                parent: "site",
                cells: [
                  {
                    id: "bevel-cell",
                    planes: [
                      ...drawingCell(
                        "square",
                        { x: 0, y: 0, z: 0 },
                        { x: 2, y: 2, z: 2 },
                      ).planes,
                      { normal: { x: 1, y: 0, z: 1 }, offset: 3 },
                    ],
                  },
                ],
              }),
              subject: "space",
            }),
            "bevel",
          ).basis === "unmeasured",
      ],
      [
        "a cell left open on one side is refused for the same reason",
        (): boolean =>
          row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, {
                id: "open",
                kind: "room",
                parent: "site",
                cells: [
                  {
                    id: "open-cell",
                    planes: drawingCell(
                      "square",
                      { x: 0, y: 0, z: 0 },
                      { x: 2, y: 2, z: 2 },
                    ).planes.slice(1),
                  },
                ],
              }),
              subject: "space",
            }),
            "open",
          ).place?.declared === null,
      ],
      [
        "a zone with nothing in it at any depth measures no content at all",
        (): boolean =>
          row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, {
                id: "cellar",
                kind: "room",
                parent: "site",
                cells: [
                  drawingCell(
                    "cellar-cell",
                    { x: 0, y: -3, z: 0 },
                    { x: 2, y: -1, z: 2 },
                  ),
                ],
              }),
              subject: "space",
            }),
            "cellar",
          ).place?.content === null,
      ],
      [
        "a zone declaring a faceted approximation says so on its row",
        (): boolean =>
          row(
            deriveAutoMovieDrawingSchedule({
              environment: withSpace(environment, {
                id: "apse",
                kind: "room",
                parent: "site",
                fidelity: "faceted",
                cells: [
                  drawingCell(
                    "apse-cell",
                    { x: 0, y: 0, z: 0 },
                    { x: 2, y: 2, z: 2 },
                  ),
                ],
              }),
              subject: "space",
            }),
            "apse",
          ).place?.fidelity === "faceted",
      ],
    ]),
    {
      "a shelled zone is measured from its own vertices": true,
      "a shell of over 130,000 vertices is bounded like a small one": true,
      "a zone stated over two cells reports the box that holds both": true,
      "a chamfered cell is refused rather than boxed off from a guess": true,
      "a cell left open on one side is refused for the same reason": true,
      "a zone with nothing in it at any depth measures no content at all": true,
      "a zone declaring a faceted approximation says so on its row": true,
    },
  );
}

/** A closed four-faced volume, wound counter-clockwise seen from outside. */
const tetrahedronSpace: () => IAutoMovieBuiltSpace =
  (): IAutoMovieBuiltSpace => ({
    id: "vault",
    kind: "room",
    parent: "site",
    cells: [],
    shell: {
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 0 },
      ],
      triangles: [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2],
    },
  });

/**
 * The tetrahedron vault carrying 130,000 more vertices at its interior point
 * (0.25, 0.25, 0.25), which no triangle references and validation allows. The
 * large finite list exercises folding without a spread argument per vertex;
 * the box stays the tetrahedron's own 0..1 on every axis.
 */
const crowdedVaultSpace: () => IAutoMovieBuiltSpace =
  (): IAutoMovieBuiltSpace => {
    const vault: IAutoMovieBuiltSpace = tetrahedronSpace();
    return {
      ...vault,
      shell: {
        vertices: [
          ...vault.shell!.vertices,
          ...Array.from(
            { length: 130_000 },
            (): IAutoMovieVector3 => ({ x: 0.25, y: 0.25, z: 0.25 }),
          ),
        ],
        triangles: vault.shell!.triangles,
      },
    };
  };
