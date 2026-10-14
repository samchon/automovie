import { validatePropPlacements } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createImportedPropSpec } from "../internal/createImportedPropSpec";
import { createModel } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";
import { inSpace, propEnvironment } from "../internal/propPlacementFixtures";

const CHAIR: number = 0;
const LAMP: number = 1;
const STOOL: number = 2;

/**
 * The imported chair, standing in the room on the floor and keeping the room it needs to be pulled out.
 *
 * Its proxy is the registered 0.5 x 0.9 x 0.5 collision box, so its world occupancy at the staged height below runs from `y = 0` to `y = 0.9`, resting exactly on the floor patch, and its seat face stands at `y = 0.9` over the plan square `[0.8, 1.2]` on both axes.
 */
const chair: () => IAutoMoviePropSpec = (): IAutoMoviePropSpec => ({
  ...createImportedPropSpec(),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "on-support",
        target: { kind: "surface", environment: "house", surface: "floor" },
      },
    ],
    footprint: null,
    clearance: [
      {
        id: "pull-out",
        min: { x: -0.25, y: -0.45, z: 0.25 },
        max: { x: 0.25, y: 0.45, z: 0.85 },
      },
    ],
  },
});

/** A generated lamp resting on the imported chair's own seat face. */
const lamp: () => IAutoMoviePropSpec = (): IAutoMoviePropSpec => ({
  node: "lamp",
  model: { ...createModel(null), id: "lamp" },
  articulation: null,
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "on-support",
        target: { kind: "prop-affordance", prop: "chair", affordance: "seat" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});

/** A generated stool standing clear of both, the movable third body. */
const stool: () => IAutoMoviePropSpec = (): IAutoMoviePropSpec => ({
  node: "stool",
  model: { ...createModel(null), id: "stool" },
  articulation: null,
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "on-support",
        target: { kind: "surface", environment: "house", surface: "floor" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});

/** Construct the original fresh imported/generated placement registry in slot order. */
const registry: () => IAutoMoviePropSpec[] = (): IAutoMoviePropSpec[] => [
  chair(),
  lamp(),
  stool(),
];

/** Construct the original placements aligned with the three registry slots. */
const set: () => IAutoMovieStageSetPiece[] = (): IAutoMovieStageSetPiece[] => [
  { node: "chair", model: "chair", position: { x: 1, y: 0.45, z: 1 } },
  {
    node: "lamp",
    model: "lamp",
    // Half of the 0.5-scaled 0.6 m box above the seat face at y = 0.9: the lamp
    // bears on the imported chair rather than hovering near it.
    position: { x: 1, y: 1.05, z: 1 },
    scale: 0.5,
  },
  { node: "stool", model: "stool", position: { x: -2, y: 0.3, z: -2 } },
];

/** Run the actual placement validator on caller inputs or the original fresh defaults. */
const validate: (
  props?: IAutoMoviePropSpec[],
  pieces?: IAutoMovieStageSetPiece[],
  environments?: IAutoMovieBuiltEnvironment[],
) => IAutoMovieValidation = (
  props: IAutoMoviePropSpec[] = registry(),
  pieces: IAutoMovieStageSetPiece[] = set(),
  environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()],
): IAutoMovieValidation =>
  validatePropPlacements({
    props,
    set: pieces,
    builtEnvironments: environments,
  });

/** A mutated room must fail at `path` with `message`, on a fresh arrangement. */
const violated: (
  mutate: (
    props: IAutoMoviePropSpec[],
    pieces: IAutoMovieStageSetPiece[],
    environments: IAutoMovieBuiltEnvironment[],
  ) => void,
  path: string,
  message: string,
) => boolean = (
  mutate: (
    props: IAutoMoviePropSpec[],
    pieces: IAutoMovieStageSetPiece[],
    environments: IAutoMovieBuiltEnvironment[],
  ) => void,
  path: string,
  message: string,
): boolean => {
  const props: IAutoMoviePropSpec[] = registry();
  const pieces: IAutoMovieStageSetPiece[] = set();
  const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
  mutate(props, pieces, environments);
  const result: IAutoMovieValidation = validate(props, pieces, environments);
  return (
    result.success === false &&
    result.violations.some(
      (item: IAutoMovieConstraintViolation): boolean =>
        item.path === path && item.expected.includes(message),
    )
  );
};

/**
 * A prop drawing a registered external appearance is judged by every placement rule a generated one is, as the subject of a claim and as the host of one.
 *
 * The whole point of admitting the reference is that nothing the prop means travels out with the pixels, so this pins the measurable half of that claim: the chair is contained, borne, cleared, and held out of passages through its deterministic proxy, and other props rest on the seat face its own spec declares.
 *
 * Scenarios:
 *
 * 1. The imported chair, the lamp standing on its seat, and the stool beside them
 * resolve: an external appearance forges and stages like any other prop.
 * 2. As a subject it is refused where a generated prop would be: floating off the
 * floor it names, sinking into it, leaving the logical space it occupies, and standing in the doorway.
 * 3. Its keep-out volume is its own: the stool pushed into the chair's pull-out
 * clearance is refused, and the stool pushed into the chair itself is refused as occupancy with no declared contact.
 * 4. As a host it bears: the lamp floats above and sinks into the seat face the
 * imported chair declares, and stands off it when moved away.
 * 5. A chair whose sealed closure is broken does not forge, and is therefore not
 * also measured: the forge violation is reported at the prop's own path and the geometric refusal it would otherwise have earned is not.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates an imported chair as supported subject, clearance neighbor and supporting host, then observes located physical refusals and suppression of geometry for an unforged appearance.
 * @evidence contracts/testing.md#independent-expectations Authored proxy dimensions, chair/seat/floor positions and the same placement rules for imported and generated props determine expected paths; in-memory sealed metadata does not prove external mesh bytes or rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the accepted room and chair floor/space/doorway, clearance/occupancy, lamp floating/sinking/off-seat and broken-closure-with-geometric-fault cases.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_imported and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_imported(): void {
  TestValidator.equals(
    "the imported chair resolves with the room it stands in",
    validate().success,
    true,
  );

  TestValidator.equals(
    "an imported prop is judged as subject, as neighbour, and as host",
    namedFacts([
      [
        "floatsAboveTheFloorItNames",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): number => (pieces[CHAIR]!.position.y = 0.95),
            "$input.props[0].placement.relations[1].target.surface",
            'floats above support surface "floor"',
          ),
      ],
      [
        "sinksIntoTheFloorItNames",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): number => (pieces[CHAIR]!.position.y = 0.4),
            "$input.props[0].placement.relations[1].target.surface",
            'sinks into support surface "floor"',
          ),
      ],
      [
        "leavesTheSpaceItOccupies",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): { x: number; y: number; z: number } =>
              (pieces[CHAIR]!.position = { x: 12, y: 0.45, z: 0 }),
            "$input.props[0].placement.relations[0].target.space",
            'leaves logical space "room"',
          ),
      ],
      [
        "standsInTheDoorway",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): { x: number; y: number; z: number } =>
              (pieces[CHAIR]!.position = { x: 4, y: 0.45, z: 0 }),
            "$input.props[0].placement",
            'blocks opening "doorway"',
          ),
      ],
      [
        "itsClearanceIsRefusedLikeAnyOther",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): { x: number; y: number; z: number } =>
              (pieces[STOOL]!.position = { x: 1, y: 0.3, z: 1.5 }),
            "$input.props[0].placement.clearance[0]",
            'clearance "pull-out" intersects staged prop "stool"',
          ),
      ],
      [
        "itsOccupancyIsRefusedLikeAnyOther",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): { x: number; y: number; z: number } =>
              (pieces[STOOL]!.position = { x: 1, y: 0.3, z: 1 }),
            "$input.props[2].placement.footprint",
            'overlaps prop "chair", which declares no contact with it',
          ),
      ],
      [
        "hostsALampThatFloatsAboveItsSeat",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): number => (pieces[LAMP]!.position.y = 1.1),
            "$input.props[1].placement.relations[1].target.affordance",
            'floats above prop "chair" affordance "seat"',
          ),
      ],
      [
        "hostsALampThatSinksIntoItsSeat",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): number => (pieces[LAMP]!.position.y = 1),
            "$input.props[1].placement.relations[1].target.affordance",
            'sinks into prop "chair" affordance "seat"',
          ),
      ],
      [
        "hostsALampThatStandsOffItsSeat",
        (): boolean =>
          violated(
            (
              _props: IAutoMoviePropSpec[],
              pieces: IAutoMovieStageSetPiece[],
            ): { x: number; y: number; z: number } =>
              (pieces[LAMP]!.position = { x: 3, y: 1.05, z: 1 }),
            "$input.props[1].placement.relations[1].target.affordance",
            'does not stand over prop "chair" affordance "seat"',
          ),
      ],
      [
        "anUnforgedAppearanceIsNotAlsoMismeasured",
        (): boolean => {
          const props: IAutoMoviePropSpec[] = registry();
          const pieces: IAutoMovieStageSetPiece[] = set();
          const environments: IAutoMovieBuiltEnvironment[] = [
            propEnvironment(),
          ];
          props[CHAIR]!.model.imported!.lod[0]!.digest = "sha256:not-a-digest";
          pieces[CHAIR]!.position.y = 0.95;
          const result: IAutoMovieValidation = validate(
            props,
            pieces,
            environments,
          );
          return (
            result.success === false &&
            result.violations.some(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.path === "$input.props[0].model.imported.lod[0].digest",
            ) &&
            result.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                !item.expected.includes("floats above support surface"),
            )
          );
        },
      ],
    ]),
    {
      floatsAboveTheFloorItNames: true,
      sinksIntoTheFloorItNames: true,
      leavesTheSpaceItOccupies: true,
      standsInTheDoorway: true,
      itsClearanceIsRefusedLikeAnyOther: true,
      itsOccupancyIsRefusedLikeAnyOther: true,
      hostsALampThatFloatsAboveItsSeat: true,
      hostsALampThatSinksIntoItsSeat: true,
      hostsALampThatStandsOffItsSeat: true,
      anUnforgedAppearanceIsNotAlsoMismeasured: true,
    },
  );
}
