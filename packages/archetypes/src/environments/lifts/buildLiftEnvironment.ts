import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieBoxShape,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePlanarPoint,
  IAutoMoviePropSpec,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { AutoMovieArchetypeElevator } from "../../architecture/AutoMovieArchetypeElevator";
import type { AutoMovieArchetypeEnvironment } from "../AutoMovieArchetypeEnvironment";
import type { liftStopHeights } from "./internal/liftStopHeights";
import { liftLandingSpace } from "./liftLandingSpace";
import { liftShaftParts } from "./liftShaftParts";

/*
 * Assemble the cab, hoistway and declared landings on a single lift axis. The
 * stock cab sets both door layers and the width of the boarding strips. Each
 * landing has a fixed call plate and a full bearing surface. The lift unit's
 * connector records each stopped location for admission by the building engine.
 * All transforms inside the model are in metres.
 */
export function buildLiftEnvironment(
  props: buildLiftEnvironment.IProps,
): buildLiftEnvironment.IResult {
  const { context, car, gap, landingDepth, stops, first } = props;
  const root: string = "shaft";
  const minimum: number = stops[0]!.height;
  const maximum: number = stops[stops.length - 1]!.height;
  const aperture: number = car.affordance("entrance").width!;
  const doorHeight: number = car.affordance("entrance").height!;
  const width: number = car.affordance("floor").width!;
  const depth: number = car.affordance("floor").depth!;
  const leafThickness: number = boxPart(car, "leftDoor-leaf").geometry.shape
    .depth;
  const side: ReturnType<typeof boxPart> = boxPart(car, "side-left");
  const wallThickness: number = side.geometry.shape.width;
  if (gap <= leafThickness)
    throw new Error(
      `Lift ${context.id} gap must exceed the cab leaf thickness of ${leafThickness} metres.`,
    );
  const shaftWidth: number =
    2 * (Math.max(width / 2 + wallThickness, aperture) + gap + wallThickness);
  const back: number = -depth - 2 * wallThickness - gap;
  const front: number = gap + leafThickness + wallThickness;
  const bottom: number = minimum - wallThickness;
  const top: number = maximum + car.dimensions.height! + 2 * wallThickness;
  const shaftHeight: number = top - bottom;
  const floorMaterial: string | null = boxPart(car, "floor").material;
  const walls: IAutoMovieModel = isolated(
    car,
    `${context.id}/walls`,
    liftShaftParts({
      width: shaftWidth,
      height: shaftHeight,
      thickness: wallThickness,
      openings: stops.map((sill) => ({
        id: sill.id,
        x: (shaftWidth - aperture) / 2,
        y: sill.height - bottom,
        width: aperture,
        height: doorHeight,
      })),
      centerY: (top + bottom) / 2,
      front,
      back,
      material: side.material,
    }),
  );
  const cab: IAutoMovieModel = isolated(
    car,
    `${context.id}/cab`,
    car.parts.filter(
      (part: IAutoMovieModelPart): boolean =>
        part.id !== "call-station" &&
        !LEAVES.some((leaf): boolean => part.id === `${leaf}-leaf`),
    ),
    [
      car.affordance("entrance"),
      car.affordance("floor"),
      { ...car.affordance("floor"), id: "sill", width: aperture },
    ],
  );
  const callPart: ReturnType<typeof boxPart> = boxPart(car, "call-station");
  const callShift: number =
    front -
    (callPart.transform.translation.z - callPart.geometry.shape.depth / 2);
  const models: IAutoMovieModel[] = [walls, cab];
  const runtimeProps: IAutoMoviePropSpec[] = [asProp(cab)];
  const elements: IAutoMovieBuiltElement[] = [
    {
      id: root,
      kind: "shaft",
      parent: null,
      transform: context.frame,
      space: root,
      model: null,
    },
    element(
      "walls",
      "shaft-walls",
      root,
      root,
      AutoMovieEngineVector3.create(0, 0, 0),
      walls.id,
    ),
    element("cab", "cab", root, root, AutoMovieEngineVector3.create(0, minimum, 0), cab.id),
  ];
  const spaces: IAutoMovieBuiltSpace[] = [
    { id: root, kind: "shaft", parent: null, cells: [] },
  ];
  const surfaces: IAutoMovieBuiltSurface[] = [];
  const anchors: Record<string, IAutoMovieTransform> = Object.create(null);
  const world = (x: number, y: number, z: number): IAutoMovieVector3 =>
    AutoMovieArchetypeFrame.point(context.frame, AutoMovieEngineVector3.create(x, y, z));
  const anchorFrame = (x: number, y: number, z: number): IAutoMovieTransform =>
    AutoMovieArchetypeFrame.compose(
      context.frame,
      AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(x, y, z)),
    );
  const leafOffset = (
    leaf: (typeof LEAVES)[number],
    opened: boolean,
  ): IAutoMovieVector3 => {
    const slider: IAutoMovieAffordance = car.affordance(leaf);
    return AutoMovieEngineVector3.scale(
      AutoMovieArchetypeFrame.axis(slider.frame, "x"),
      opened ? slider.travel! : 0,
    );
  };
  for (const leaf of LEAVES) {
    const part: IAutoMovieModelPart = boxPart(car, `${leaf}-leaf`);
    const id: string = `cab/${leaf}`;
    const model: IAutoMovieModel = isolated(car, `${context.id}/${id}`, [part]);
    models.push(model);
    elements.push(
      element(
        id,
        "cab-door",
        "cab",
        root,
        leafOffset(leaf, first.doors === "open"),
        model.id,
      ),
    );
  }

  for (const { id, height } of stops) {
    const local: string = `stops/${id}`;
    const landing: string = `${local}/landing`;
    const call: string = `${local}/call`;
    const doors: string = `${local}/doors`;
    const landingFloor: IAutoMovieAffordance = {
      id: "floor",
      kind: "surface",
      extent: null,
      width: shaftWidth,
      depth: landingDepth,
      frame: AutoMovieArchetypeFrame.upright(
        AutoMovieEngineVector3.create(0, 0, landingDepth / 2),
      ),
    };
    const landingModel: IAutoMovieModel = isolated(
      car,
      `${context.id}/${landing}`,
      [
        liftShaftParts.box(
          "slab",
          floorMaterial,
          shaftWidth,
          wallThickness,
          landingDepth,
          AutoMovieEngineVector3.create(0, -wallThickness / 2, landingDepth / 2),
        ),
      ],
      [landingFloor, { ...landingFloor, id: "sill", width: aperture }],
    );
    const callModel: IAutoMovieModel = isolated(
      car,
      `${context.id}/${call}`,
      [callPart],
      [car.affordance("call")],
    );
    models.push(landingModel, callModel);
    runtimeProps.push(asProp(landingModel), asProp(callModel));
    elements.push(
      element(
        landing,
        "landing-floor",
        root,
        local,
        AutoMovieEngineVector3.create(0, height, gap),
        landingModel.id,
      ),
      element(
        call,
        "call-button",
        root,
        local,
        AutoMovieEngineVector3.create(0, height, callShift),
        callModel.id,
      ),
      element(
        doors,
        "landing-doors",
        root,
        local,
        AutoMovieEngineVector3.create(0, height, gap),
        null,
      ),
    );
    for (const leaf of LEAVES) {
      const leafId: string = `${doors}/${leaf}`;
      const model: IAutoMovieModel = isolated(car, `${context.id}/${leafId}`, [
        boxPart(car, `${leaf}-leaf`),
      ]);
      models.push(model);
      elements.push(
        element(
          leafId,
          "landing-door",
          doors,
          local,
          leafOffset(leaf, first.stop === id && first.doors === "open"),
          model.id,
        ),
      );
    }
    const sill: IAutoMovieTransform = anchorFrame(0, height, 0);
    const { space, support }: ReturnType<typeof liftLandingSpace> =
      liftLandingSpace(
        local,
        context.id,
        root,
        sill,
        shaftWidth,
        doorHeight,
        gap,
        landingDepth,
      );
    spaces.push(space);
    surfaces.push(support);
    anchors[id] = sill;
    anchors[`${id}/approach`] = anchorFrame(0, height, gap + landingDepth);
    anchors[`${id}/call`] = AutoMovieArchetypeFrame.compose(
      anchorFrame(0, height, callShift),
      car.affordance("call").frame,
    );
  }
  const rise: number = maximum - minimum;
  return {
    anchors,
    props: runtimeProps,
    environment: {
      id: context.id,
      version: 1,
      units: "meter",
      buildings: [{ id: "lift", element: root, space: root }],
      models,
      modelReferences: [],
      elements,
      spaces,
      boundaries: [
        {
          id: "front",
          kind: "wall",
          spaces: [root],
          elements: ["walls"],
          face: {
            origin: world(0, bottom, front - wallThickness / 2),
            rotation: context.frame.rotation,
            outline: rectangle(-shaftWidth / 2, 0, shaftWidth / 2, shaftHeight),
            thickness: wallThickness,
          },
        },
      ],
      openings: stops.map(({ id, height }: liftStopHeights.IStop) => ({
        id: `stops/${id}/opening`,
        kind: "lift-door",
        boundary: "front",
        fill: `stops/${id}/doors`,
        profile: {
          outline: rectangle(
            -aperture / 2,
            height - bottom,
            aperture / 2,
            height - bottom + doorHeight,
          ),
        },
      })),
      connectors: [
        {
          id: "travel",
          kind: "lift",
          from: `stops/${stops[0]!.id}`,
          to: `stops/${stops[stops.length - 1]!.id}`,
          bidirectional: true,
          route: [world(0, minimum, 0), world(0, maximum, 0)],
          width: aperture,
          clearHeight: doorHeight,
          elements: ["cab"],
          landings: stops
            .slice(1, -1)
            .map(({ id, height }: liftStopHeights.IStop) => ({
              space: `stops/${id}`,
              at: (height - minimum) / rise,
            })),
          operation: {
            carriages: [
              {
                id: "cab",
                element: "cab",
                motion: {
                  kind: "prismatic",
                  axis: AutoMovieEngineVector3.create(0, 1, 0),
                  min: 0,
                  max: rise,
                },
              },
            ],
            states: stops.map(({ id, height }: liftStopHeights.IStop) => ({
              id,
              drive: "still",
              carriages: [
                {
                  carriage: "cab",
                  value: height - minimum,
                  serves: `stops/${id}`,
                },
              ],
            })),
            state: first.stop,
          },
        },
      ],
      surfaces,
      walkable: surfaces.map(
        (entry: IAutoMovieBuiltSurface): string => entry.surface.id,
      ),
    },
  };
}

/*
 * The lift assembly's geometry input and portable result contracts.
 */
export namespace buildLiftEnvironment {
  /*
   * The placed lift and the resolved dimensions shared by its staged members.
   * The context supplies the rigid world frame. The car supplies its aperture
   * and contacts at the original scale, and the stops give the sill
   * elevations.
   */
  export interface IProps {
    /*
     * The upright module instance layout and ownership.
     */
    context: IAutoMovieEnvironmentModule.IContext;

    /*
     * The chosen car and its resolved aperture affordances.
     */
    car: ReturnType<typeof AutoMovieArchetypeElevator.create>;

    /*
     * Clear sill gap, metres.
     */
    gap: number;

    /*
     * Fixed landing depth beyond the gap, metres.
     */
    landingDepth: number;

    /*
     * Local stop names and strictly increasing sill elevations.
     */
    stops: readonly liftStopHeights.IStop[];

    /*
     * Door and cab state at film second zero.
     */
    first: AutoMovieArchetypeEnvironment.ILiftKey;
  }

  /*
   * Geometry, logical stations and current-state prop facts for one lift. Each
   * prop references its model in the design. Anchors locate fixed attachments
   * in world metres, and the object clip supplies cab motion.
   */
  export interface IResult {
    /*
     * Built design owning shaft, landings, and connector.
     */
    environment: IAutoMovieBuiltEnvironment;

    /*
     * The fixed landing and moving cab support props, plus the fixed call
     * plates.
     */
    props: IAutoMoviePropSpec[];

    /*
     * World-space sill, call and approach points keyed by stop.
     */
    anchors: Readonly<Record<string, IAutoMovieTransform>>;
  }
}


/*
 * The two leaf affordances and their corresponding existing panel parts.
 */
const LEAVES: readonly ["leftDoor", "rightDoor"] = ["leftDoor", "rightDoor"];

/*
 * Require an upright box part from the lift archetype, the geometry owner.
 */
function boxPart(
  car: IAutoMovieModel,
  id: string,
): IAutoMovieModelPart & {
  geometry: { type: "primitive"; shape: IAutoMovieBoxShape };
  transform: IAutoMovieTransform;
} {
  const part: IAutoMovieModelPart | undefined = car.parts.find(
    (entry: IAutoMovieModelPart): boolean => entry.id === id,
  );
  if (
    part?.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "box" ||
    part.transform === null
  )
    throw new Error(`The lift car must supply the positioned box part ${id}.`);
  return {
    ...part,
    geometry: { type: "primitive" as const, shape: part.geometry.shape },
    transform: part.transform,
  };
}

/*
 * Assemble a rigid subset with its original materials and only its own
 * contacts.
 */
function isolated(
  car: IAutoMovieModel,
  id: string,
  parts: IAutoMovieModelPart[],
  affordances?: IAutoMovieModel["affordances"],
): IAutoMovieModel {
  return {
    id,
    name: null,
    origin: "generated",
    parts,
    skeleton: null,
    body: null,
    materials: car.materials,
    asset: null,
    ...(affordances === undefined ? {} : { affordances }),
  };
}

/*
 * Register a rigid model carrying a staged prop affordance.
 */
function asProp(model: IAutoMovieModel): IAutoMoviePropSpec {
  return { node: model.id, model, articulation: null };
}

/*
 * Name one visible or grouping element in its parent's rigid frame.
 */
function element(
  id: string,
  kind: string,
  parent: string,
  space: string,
  position: IAutoMovieVector3,
  model: string | null,
): IAutoMovieBuiltElement {
  return {
    id,
    kind,
    parent,
    space,
    model,
    transform: AutoMovieArchetypeFrame.upright(position),
  };
}

/*
 * Create an XY outline in one wall's local metres.
 */
function rectangle(
  left: number,
  bottom: number,
  right: number,
  top: number,
): IAutoMoviePlanarPoint[] {
  return [
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
    { x: left, y: top },
  ];
}
