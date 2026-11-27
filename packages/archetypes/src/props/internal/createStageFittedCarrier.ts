import type { AutoMovieArchetypeStageFittedCarrier } from "../AutoMovieArchetypeStageFittedCarrier";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core/index";
import "../AutoMovieArchetypeStageTwoHandedSwordProp";

/*
 * Fit a hollow digital carrier to a separate padded two-handed display model.
 *
 * The carrier stands on its closed base, with its channel open along +Y. The
 * display faces down at both root frames. At "seated" its cap is above the base
 * and its guard sits above the physical mouth. At "opening" the whole display
 * clears the mouth. The "belt" hook faces the wearer along −X.
 * Parameter params: A generated padded display model and optional carrier id.
 * Returns: The carrier and its model-space contact frames, in metres.
 * If the display model or the proposed
 * identity cannot be fitted.
 */
export function createStageFittedCarrier(
  params: AutoMovieArchetypeStageFittedCarrier.IParams,
): AutoMovieArchetype<
  AutoMovieArchetypeStageFittedCarrier.Affordance,
  AutoMovieArchetypeStageFittedCarrier.Dimension
> {
  const {
    display,
    id = "stageFittedCarrier",
  }: AutoMovieArchetypeStageFittedCarrier.IParams = params;
  if (
    display.archetype !== "stageBladeProp" ||
    display.name !== "padded longsword stage prop" ||
    id === display.id
  )
    throw invalidEnvelope(display.id);
  const { tip, guardTop, radius }: IEnvelope = envelope(display);
  const v: typeof Vector3.create = Vector3.create;
  const inner: number = 2 * (radius + GAP);
  const outer: number = inner + 2 * WALL;
  const mouthY: number = WALL + tip - guardTop;
  const seatedY: number = mouthY + guardTop + GAP;
  const openingY: number = mouthY + tip + GAP;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStageFittedCarrier.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageFittedCarrier",
      { length: "m", opening: "m" },
      undefined,
    );
  draw.derive("length", mouthY);
  draw.derive("opening", inner);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageFittedCarrier.Affordance,
    AutoMovieArchetypeStageFittedCarrier.Dimension
  > = new AutoMovieArchetypeBuilder({
    id,
    name: "fitted padded display carrier",
    material: "foam",
    draw,
  });

  const height: number = mouthY - WALL;
  const center: number = WALL + height / 2;
  const offset: number = (inner + WALL) / 2;
  builder.box("base", v(outer, WALL, outer), v(0, WALL / 2, 0), {
    color: "#49415c",
  });
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.box(
      side + "-wall",
      v(WALL, height, outer),
      v(sign * offset, center, 0),
      {
        color: "#756688",
      },
    );
  for (const [side, sign] of [
    ["front", 1],
    ["rear", -1],
  ] as const)
    builder.box(
      side + "-wall",
      v(inner, height, WALL),
      v(0, center, sign * offset),
      {
        color: "#8a789c",
      },
    );
  builder.affordance({
    id: "mouth",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, mouthY, 0)),
    extent: null,
  });
  for (const [site, y] of [
    ["opening", openingY],
    ["seated", seatedY],
  ] as const)
    builder.affordance({
      id: site,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, y, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.facing(
      v(-outer / 2, mouthY - outer / 2, 0),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(MASS);
}

/*
 * Authored clearance around the rounded foam display profile, in metres.
 */
const GAP: number = 0.006;

/*
 * Thickness of the visible digital channel walls, in metres.
 */
const WALL: number = 0.012;

/*
 * Authored mass of the lightweight stand-in, in kilograms.
 */
const MASS: number = 0.25;



/*
 * The axis-aligned envelope read from the generated padded foam parts.
 */
interface IEnvelope {
  /*
   * Leading cap's furthest extent along the display's +Y.
   */
  tip: number;
  /*
   * Crossguard's furthest extent along the display's +Y.
   */
  guardTop: number;
  /*
   * Greatest perpendicular radius of the cap and shaft.
   */
  radius: number;
}

/*
 * Read the admitted padded silhouette's centred cap, shaft and crossguard.
 */
function envelope(
  display: AutoMovieArchetypeStageFittedCarrier.IParams["display"],
): IEnvelope {
  const part = (id: string): IAutoMovieModelPart | undefined =>
    display.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
  const cap: IAutoMovieModelPart | undefined = part("endCap");
  const shaft: IAutoMovieModelPart | undefined = part("shaft");
  const guard: IAutoMovieModelPart | undefined = part("guard");
  if (
    cap?.geometry.type !== "primitive" ||
    cap.geometry.shape.type !== "sphere" ||
    shaft?.geometry.type !== "primitive" ||
    shaft.geometry.shape.type !== "cylinder" ||
    guard?.geometry.type !== "primitive" ||
    guard.geometry.shape.type !== "capsule" ||
    cap.transform === null ||
    shaft.transform === null ||
    guard.transform === null
  )
    throw invalidEnvelope(display.id);
  const tip: number = cap.transform.translation.y + cap.geometry.shape.radius;
  const guardTop: number =
    guard.transform.translation.y + guard.geometry.shape.radius;
  const radius: number = Math.max(
    cap.geometry.shape.radius,
    shaft.geometry.shape.radius,
  );
  if (
    ![tip, guardTop, radius].every((value: number): boolean => value > 0) ||
    !(tip - guardTop > GAP)
  )
    throw invalidEnvelope(display.id);
  return { tip, guardTop, radius };
}

/*
 * Describe a duplicate or incompatible padded display.
 */
function invalidEnvelope(
  displayId: string | undefined,
): AutoMovieArchetypeRefusal {
  return new AutoMovieArchetypeRefusal({
    kind: "parameter",
    archetype: "stageFittedCarrier",
    axis: "display",
    value: displayId,
    feasible: null,
    reason:
      "a carrier needs a separate display with an admitted padded shaft, cap and crossguard envelope",
    fix: "supply a createStageTwoHandedSwordProp output and a distinct carrier id",
  });
}
