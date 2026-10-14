import { IAutoMovieRoomVisibility, IAutoMovieBuiltSpace, IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { autoMovieRoomVisibility } from "../../../../packages/engine/src/render/autoMovieRoomVisibility";
import { TestValidator } from "@nestia/e2e";
import { boxCell, buildingFixture } from "../internal/renderFixtures";
/**
 * Cell-and-portal culling excludes graph-unreachable rooms in the selected environment graphs and retains the containers of kept rooms.
 *
 * Hand graph expectations follow the authored relations: the hall/vault wall has no opening, the hall opens outside through a door and window, and stairs connect the hall to the loft. Exterior or ambiguous placement and unknown cells supply the selected conservative twins.
 *
 * Scenarios:
 *
 * 1. A camera inside `ground-hall` hides exactly `ground-vault`, the one space no declared portal reaches, and keeps every container of a kept room.
 * 2. A camera inside `ground-vault` hides the hall, the upper storey and the loft: sealed both ways, not merely one way.
 * 3. Cutting a door through the hall/vault wall keeps the vault: same camera, one portal more, nothing hidden.
 * 4. A camera outside every cell hides nothing and states why.
 * 5. Two overlapping leaf cells containing the camera hide nothing and name the ambiguity.
 * 6. A leaf space with no cells hides nothing even though the camera is unambiguously placed: an unknown extent cannot be ruled out of a sight line.
 * 7. Two rooms whose only openings face outside still see one another, because the exterior is a portal node and not the absence of one.
 * 8. A one-way stair keeps both ends: traversal is directional, sight is not.
 * 9. Intermediate lift landings are portals: from an endpoint, every served storey is kept. Removing those landings hides the intermediate storeys again.
 * 10. A stop naming an undeclared space leaves the closure answer unchanged without throwing. Environment admission separately refuses that unresolved stop.
 * 11. From an intermediate landing of a one-way shaft, the stop below, the stop above and the other landing are kept. An endpoint-only graph would omit the camera's own starting space.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real cell/portal visibility and observes named visible/hidden sets and inconclusive placement, detecting false portal reachability or loss of conservative uncertainty.
 * @evidence contracts/testing.md#independent-expectations The authored hall/vault wall has no opening, the facade opens outside and stairs/lift landings connect declared rooms; hand graph reachability supplies every expected set. This graph policy does not measure sight rays, pixels or actual occlusion geometry.
 * @evidence contracts/testing.md#distinguishing-cases Interior/exterior/ambiguous placement, unknown cells, added door, exterior windows, solitary room, one-way links, intermediate landings and an undeclared stop preserve aggressive and conservative twins.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_room_visibility owns its cases. Portable graph/cell computation from resident environment records, with no live camera, renderer or host process.
 */
export function test_render_room_visibility(): void {
  const inside: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: buildingFixture(),
    camera: { x: 5, y: 1, z: 5 },
  });
  TestValidator.equals(
    "an unambiguous interior camera hides exactly the sealed room",
    {
      placement: inside.cameraPlacement,
      camera: inside.camera,
      hidden: inside.hidden,
      visible: inside.visible,
      inconclusive: inside.inconclusive,
    },
    {
      placement: "interior",
      camera: "ground-hall",
      hidden: ["ground-vault"],
      visible: ["ground", "ground-hall", "site", "upper", "upper-loft"],
      inconclusive: null,
    },
  );

  TestValidator.equals(
    "the sealed room is sealed in both directions",
    autoMovieRoomVisibility({
      environment: buildingFixture(),
      camera: { x: 13, y: 1, z: 5 },
    }).hidden,
    ["ground-hall", "upper", "upper-loft"],
  );

  const doored: IAutoMovieBuiltEnvironment = buildingFixture();
  doored.openings.push({
    id: "vault-door",
    kind: "door",
    boundary: "hall-vault-wall",
    fill: null,
  });
  TestValidator.equals(
    "one cut door keeps the previously sealed room drawn",
    autoMovieRoomVisibility({
      environment: doored,
      camera: { x: 5, y: 1, z: 5 },
    }).hidden,
    [],
  );

  const outside: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: buildingFixture(),
    camera: { x: 100, y: 1, z: 5 },
  });
  TestValidator.equals(
    "an exterior camera hides nothing and says so",
    {
      placement: outside.cameraPlacement,
      camera: outside.camera,
      hidden: outside.hidden,
      reason:
        outside.inconclusive?.includes("outside every declared leaf space") ??
        false,
    },
    { placement: "exterior", camera: null, hidden: [], reason: true },
  );

  const overlapping: IAutoMovieBuiltEnvironment = buildingFixture();
  overlapping.spaces
    .find((space: IAutoMovieBuiltSpace): boolean => space.id === "ground-vault")!
    .cells.push(boxCell({ id: "spill", min: [0, 0, 0], max: [16, 3, 10] }));
  const ambiguous: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: overlapping,
    camera: { x: 5, y: 1, z: 5 },
  });
  TestValidator.equals(
    "overlapping cells make the camera ambiguous and hide nothing",
    {
      placement: ambiguous.cameraPlacement,
      hidden: ambiguous.hidden,
      named:
        (ambiguous.inconclusive?.includes("ground-hall") ?? false) &&
        (ambiguous.inconclusive?.includes("ground-vault") ?? false),
    },
    { placement: "ambiguous", hidden: [], named: true },
  );

  const cellless: IAutoMovieBuiltEnvironment = buildingFixture();
  cellless.spaces.find((space: IAutoMovieBuiltSpace): boolean => space.id === "upper-loft")!.cells = [];
  const unknown: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: cellless,
    camera: { x: 5, y: 1, z: 5 },
  });
  const unplaced: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: cellless,
    camera: { x: 100, y: 1, z: 5 },
  });
  TestValidator.equals(
    "an unknown extent hides nothing, and never lets a camera be called exterior",
    {
      hidden: unknown.hidden,
      placement: unknown.cameraPlacement,
      camera: unknown.camera,
      named: unknown.inconclusive?.includes('leaf space "upper-loft"') ?? false,
      outside: unplaced.cameraPlacement,
      outsideCamera: unplaced.camera,
      outsideNamed:
        unplaced.inconclusive?.includes("no celled leaf space") ?? false,
    },
    {
      hidden: [],
      placement: "interior",
      camera: "ground-hall",
      named: true,
      outside: "ambiguous",
      outsideCamera: null,
      outsideNamed: true,
    },
  );

  TestValidator.equals(
    "two rooms open only to the outside still see one another",
    autoMovieRoomVisibility({
      environment: twoWindowedRooms(),
      camera: { x: 5, y: 1, z: 5 },
    }).hidden,
    [],
  );

  const solitary: IAutoMovieBuiltEnvironment = buildingFixture();
  solitary.spaces = [
    {
      id: "cell",
      kind: "room",
      parent: null,
      cells: [boxCell({ id: "only", min: [0, 0, 0], max: [4, 3, 4] })],
    },
  ];
  solitary.boundaries = [];
  solitary.openings = [];
  solitary.connectors = [];
  TestValidator.equals(
    "a single space that is both leaf and root keeps itself and hides nothing",
    autoMovieRoomVisibility({
      environment: solitary,
      camera: { x: 2, y: 1, z: 2 },
    }),
    {
      version: 1,
      camera: "cell",
      cameraPlacement: "interior",
      hidden: [],
      visible: ["cell"],
      inconclusive: null,
    },
  );

  const oneWay: IAutoMovieBuiltEnvironment = buildingFixture();
  oneWay.connectors[0]!.bidirectional = false;
  TestValidator.equals(
    "a one-way stair still lets sight travel back down it",
    autoMovieRoomVisibility({
      environment: oneWay,
      camera: { x: 5, y: 4, z: 5 },
    }).hidden,
    ["ground-vault"],
  );

  const served: IAutoMovieBuiltEnvironment = liftFixture();
  const unserved: IAutoMovieBuiltEnvironment = liftFixture();
  delete unserved.connectors.find(
    (connector: IAutoMovieBuiltConnector): boolean => connector.id === "service-lift",
  )!.landings;
  TestValidator.equals(
    "the storeys a shaft stops at in between are portals, and only its landings make them so",
    {
      served: autoMovieRoomVisibility({
        environment: served,
        camera: { x: 5, y: 1, z: 5 },
      }).hidden,
      // Negative twin: the same two rooms, the same shaft, the stops taken
      // away. Without them the run is the two-ended relation it always was and
      // the storeys it passes are unreachable again, so the case above is
      // pinning the landings and not some other portal in the fixture.
      unserved: autoMovieRoomVisibility({
        environment: unserved,
        camera: { x: 5, y: 1, z: 5 },
      }).hidden,
    },
    {
      served: ["ground-vault"],
      unserved: [
        "ground-vault",
        "middle",
        "middle-gallery",
        "middle-mezzanine",
      ],
    },
  );

  const undeclared: IAutoMovieBuiltEnvironment = liftFixture();
  undeclared.connectors.find(
    (connector: IAutoMovieBuiltConnector): boolean => connector.id === "service-lift",
  )!.landings = [{ space: "plant-room", at: 0.9 }];
  const strayStop: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: undeclared,
    camera: { x: 5, y: 1, z: 5 },
  });
  TestValidator.equals(
    "a stop naming a space the design never declares is a portal to nothing",
    {
      // `validateBuiltEnvironment` refuses this environment outright: a landing
      // space that does not resolve is a stated violation. The culler is not
      // the validator, so this unresolved-stop case checks totality:
      // the stop is joined like any other and reaches the closure, and it
      // simply has no record, no container above it, and no place in an answer
      // drawn from the declared spaces. Nothing is invented and nothing throws.
      hidden: strayStop.hidden,
      visible: strayStop.visible,
      inconclusive: strayStop.inconclusive,
    },
    {
      hidden: ["ground-vault", "middle", "middle-gallery", "middle-mezzanine"],
      visible: ["ground", "ground-hall", "site", "upper", "upper-loft"],
      inconclusive: null,
    },
  );

  const boarded: IAutoMovieBuiltEnvironment = liftFixture();
  boarded.connectors.find(
    (connector: IAutoMovieBuiltConnector): boolean => connector.id === "service-lift",
  )!.bidirectional = false;
  const fromLanding: IAutoMovieRoomVisibility = autoMovieRoomVisibility({
    environment: boarded,
    camera: { x: 13, y: 4, z: 5 },
  });
  TestValidator.equals(
    "a landing of a one-way shaft sees every other stop of its run",
    {
      camera: fromLanding.camera,
      placement: fromLanding.cameraPlacement,
      hidden: fromLanding.hidden,
      inconclusive: fromLanding.inconclusive,
    },
    {
      // The camera is standing in a space the graph only has because the run
      // stops there, which is what a `from`/`to` join could not have produced:
      // there would have been no node to start the closure from.
      camera: "middle-mezzanine",
      placement: "interior",
      // `ground-hall` is behind the drive, `upper-loft` is ahead of it, and
      // `middle-gallery` is another stop of the same run rather than an end of
      // it. Only the room no portal reaches at all stays hidden.
      hidden: ["ground-vault"],
      inconclusive: null,
    },
  );
}

/**
 * The tower with a service lift that stops at two storeys in between.
 *
 * The shaft runs from `ground-hall` up to `upper-loft`, which the stair already joins, so its two ends carry no information the graph did not have. Every fact the lift adds arrives through its landings: `middle-mezzanine` and `middle-gallery` are reachable from nothing else in the fixture.
 *
 * The shaft centre line lies on the party wall at `x = 10` between the room columns. Each stop names the room entered at that station, allowing this shaft to serve rooms on both sides.
 */
const liftFixture: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => {
  const environment: IAutoMovieBuiltEnvironment = buildingFixture();
  environment.spaces.push(
    { id: "middle", kind: "storey", parent: "site", cells: [] },
    {
      id: "middle-mezzanine",
      kind: "room",
      parent: "middle",
      cells: [boxCell({ id: "mezzanine", min: [10, 3, 0], max: [16, 6, 10] })],
    },
    {
      id: "middle-gallery",
      kind: "room",
      parent: "middle",
      cells: [boxCell({ id: "gallery", min: [10, 6, 0], max: [16, 9, 10] })],
    },
  );
  environment.connectors.push({
    id: "service-lift",
    kind: "lift",
    from: "ground-hall",
    to: "upper-loft",
    bidirectional: true,
    landings: [
      { space: "middle-mezzanine", at: 0.4 },
      { space: "middle-gallery", at: 0.7 },
    ],
    route: [
      { x: 10, y: 0, z: 5 },
      { x: 10, y: 9, z: 5 },
    ],
    width: 1.6,
    clearHeight: 2.3,
    elements: [],
  });
  return environment;
};

/** Two rooms with no shared portal, each with its own exterior window. */
const twoWindowedRooms: () => IAutoMovieBuiltEnvironment = (): IAutoMovieBuiltEnvironment => {
  const environment: IAutoMovieBuiltEnvironment = buildingFixture();
  environment.boundaries.push({
    id: "vault-facade",
    kind: "wall",
    spaces: ["ground-vault"],
    elements: [],
  });
  environment.openings.push({
    id: "vault-window",
    kind: "window",
    boundary: "vault-facade",
    fill: null,
  });
  return environment;
};
