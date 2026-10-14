import { validateSoftBodyDomain } from "@automovie/engine";
import { AutoMovieViolationKind, IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";

/** Run the original anchor/state, collider and wind refusal blocks after the owning test's geometry cases. The caller supplies the same sound/refuses function objects, preserving fixture construction, assertion order and every original oracle. */
export function assertSoftBodyBoundaryRefusals(
  sound: (overrides?: Partial<IAutoMovieSoftBodyDomain>) => IAutoMovieSoftBodyDomain,
  refuses: (overrides: Partial<IAutoMovieSoftBodyDomain>, kind: AutoMovieViolationKind, path: string) => boolean,
): void {
  TestValidator.equals(
    "anchors and named states are named",
    namedFacts([
      [
        "blank",
        (): boolean =>
          refuses(
            { anchors: [{ id: " ", particle: 0, position: null }], states: [] },
            "type",
            "anchors[0].id",
          ),
      ],
      [
        "duplicateId",
        (): boolean =>
          refuses(
            {
              anchors: [
                { id: "hook", particle: 0, position: null },
                { id: "hook", particle: 1, position: null },
              ],
              states: [],
            },
            "type",
            "anchors[1].id",
          ),
      ],
      [
        "particleRange",
        (): boolean =>
          refuses(
            {
              anchors: [{ id: "hook", particle: 9, position: null }],
              states: [],
            },
            "type",
            "anchors[0].particle",
          ),
      ],
      [
        "duplicateParticle",
        (): boolean =>
          refuses(
            {
              anchors: [
                { id: "a", particle: 0, position: null },
                { id: "b", particle: 0, position: null },
              ],
              states: [],
            },
            "type",
            "anchors[1].particle",
          ),
      ],
      [
        "position",
        (): boolean =>
          refuses(
            {
              anchors: [
                {
                  id: "hook",
                  particle: 0,
                  position: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 },
                },
              ],
              states: [],
            },
            "range",
            "anchors[0].position.y",
          ),
      ],
      [
        "unknownAnchor",
        (): boolean =>
          refuses(
            {
              states: [
                {
                  id: "open",
                  anchors: [
                    { anchor: "nobody", position: { x: 0, y: 0, z: 0 } },
                  ],
                },
              ],
            },
            "type",
            "states[0].anchors[0].anchor",
          ),
      ],
      [
        "posedTwice",
        (): boolean =>
          refuses(
            {
              states: [
                {
                  id: "open",
                  anchors: [
                    { anchor: "hook", position: { x: 0, y: 0, z: 0 } },
                    { anchor: "hook", position: { x: 1, y: 0, z: 0 } },
                  ],
                },
              ],
            },
            "type",
            "states[0].anchors[1].anchor",
          ),
      ],
      [
        "stateBudget",
        (): boolean =>
          refuses(
            {
              states: Array.from({ length: 33 }, (_: unknown, index: number): IAutoMovieSoftBodyDomain["states"][number] => ({
                id: `state-${index}`,
                anchors: [],
              })),
            },
            "range",
            "$input.states",
          ),
      ],
      [
        "blankState",
        (): boolean =>
          refuses(
            { states: [{ id: "", anchors: [] }] },
            "type",
            "states[0].id",
          ),
      ],
      [
        "duplicateState",
        (): boolean =>
          refuses(
            {
              states: [
                { id: "open", anchors: [] },
                { id: "open", anchors: [] },
              ],
            },
            "type",
            "states[1].id",
          ),
      ],
    ]),
    {
      blank: true,
      duplicateId: true,
      particleRange: true,
      duplicateParticle: true,
      position: true,
      unknownAnchor: true,
      posedTwice: true,
      stateBudget: true,
      blankState: true,
      duplicateState: true,
    },
  );

  TestValidator.equals(
    "colliders are named",
    namedFacts([
      [
        "duplicate",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "plane",
                  id: "floor",
                  normal: { x: 0, y: 1, z: 0 },
                  offset: -4,
                },
                {
                  kind: "plane",
                  id: "floor",
                  normal: { x: 0, y: 1, z: 0 },
                  offset: -5,
                },
              ],
            },
            "type",
            "colliders[1].id",
          ),
      ],
      [
        "zeroNormal",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "plane",
                  id: "flat",
                  normal: { x: 0, y: 0, z: 0 },
                  offset: 0,
                },
              ],
            },
            "type",
            "colliders[0].normal",
          ),
      ],
      [
        "nonFiniteNormal",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "plane",
                  id: "flat",
                  normal: { x: Number.NaN, y: 1, z: 0 },
                  offset: 0,
                },
              ],
            },
            "range",
            "colliders[0].normal.x",
          ),
      ],
      [
        "offset",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "plane",
                  id: "flat",
                  normal: { x: 0, y: 1, z: 0 },
                  offset: Number.NaN,
                },
              ],
            },
            "range",
            "colliders[0].offset",
          ),
      ],
      [
        "radius",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "sphere",
                  id: "ball",
                  center: { x: 0, y: -4, z: 0 },
                  radius: 0,
                },
              ],
            },
            "range",
            "colliders[0].radius",
          ),
      ],
      [
        "invertedBox",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "box",
                  id: "crate",
                  min: { x: -1, y: -6, z: -1 },
                  max: { x: -1, y: -5, z: 1 },
                },
              ],
            },
            "range",
            "colliders[0].max.x",
          ),
      ],
      [
        "clearOnlyOnOneAxis",
        (): boolean =>
          validateSoftBodyDomain({
            domain: sound({
              colliders: [
                {
                  kind: "box",
                  id: "beam",
                  min: { x: -4, y: -4, z: -4 },
                  max: { x: 4, y: 4, z: -0.5 },
                },
              ],
            }),
          }).success === true,
      ],
      [
        "embeddedInBox",
        (): boolean =>
          refuses(
            {
              colliders: [
                {
                  kind: "box",
                  id: "beam",
                  min: { x: -4, y: -4, z: -4 },
                  max: { x: 4, y: 4, z: 4 },
                },
              ],
            },
            "type",
            "colliders[0]",
          ),
      ],
      [
        "budget",
        (): boolean =>
          refuses(
            {
              colliders: Array.from({ length: 65 }, (_: unknown, index: number): IAutoMovieSoftBodyDomain["colliders"][number] => ({
                kind: "plane" as const,
                id: `plane-${index}`,
                normal: { x: 0, y: 1, z: 0 },
                offset: -4,
              })),
            },
            "range",
            "$input.colliders",
          ),
      ],
    ]),
    {
      duplicate: true,
      zeroNormal: true,
      nonFiniteNormal: true,
      offset: true,
      radius: true,
      invertedBox: true,
      clearOnlyOnOneAxis: true,
      embeddedInBox: true,
      budget: true,
    },
  );

  const still: NonNullable<IAutoMovieSoftBodyDomain["wind"]> = {
    direction: { x: 1, y: 0, z: 0 },
    acceleration: 1,
    gustAcceleration: 1,
    gustHz: 2,
  };
  const wind: (patch: Partial<NonNullable<IAutoMovieSoftBodyDomain["wind"]>>) => Partial<IAutoMovieSoftBodyDomain> = (
    patch: Partial<NonNullable<IAutoMovieSoftBodyDomain["wind"]>>,
  ): Partial<IAutoMovieSoftBodyDomain> => ({
    wind: { ...still, ...patch },
  });
  TestValidator.equals(
    "the draught is named",
    namedFacts([
      [
        "zeroDirection",
        (): boolean =>
          refuses(
            wind({ direction: { x: 0, y: 0, z: 0 } }),
            "type",
            "wind.direction",
          ),
      ],
      [
        "acceleration",
        (): boolean =>
          refuses(
            wind({ acceleration: Number.NaN }),
            "range",
            "wind.acceleration",
          ),
      ],
      [
        "gust",
        (): boolean =>
          refuses(
            wind({ gustAcceleration: -1 }),
            "range",
            "wind.gustAcceleration",
          ),
      ],
      ["hz", (): boolean => refuses(wind({ gustHz: -1 }), "range", "wind.gustHz")],
      [
        "absent",
        (): boolean =>
          validateSoftBodyDomain({ domain: sound({ wind: null }) }).success ===
          true,
      ],
    ]),
    {
      zeroDirection: true,
      acceleration: true,
      gust: true,
      hz: true,
      absent: true,
    },
  );
}
