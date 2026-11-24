import {
  Quaternion,
  Transform,
  Vector3,
  buildAutoMoviePolyhedron,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieStageSetPiece,
  IAutoMovieSurface,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createStairs } from "../../architecture/createStairs";
import { buildingModel } from "./buildingModel";

/**
 * Span named landing frames with a bridge, ramp or flight of stairs.
 *
 * The landing locations give the route direction and run. Adjacent flights can
 * join a shared intermediate landing, and a bridge can connect distinct
 * buildings. A constant or planar support patch per slab or step uses the same
 * upper face as its visible geometry.
 *
 * A fitted opening requires a normal approach to its clear section.
 *
 * @param props Named endpoints and the connector's physical dimensions.
 * @returns A placed environment module supplying geometry, support and route.
 * @throws Error for missing anchors, incompatible landing heights, an oblique
 *   fitted opening or invalid flight dimensions.
 */
export function createPassage(
  props: createPassage.IProps,
): IAutoMovieEnvironmentModule {
  const recipe: createPassage.IProps = structuredClone(props);
  const depth: number = recipe.thickness ?? 0.18;
  const color: string = recipe.color ?? "#aaa398";
  if (recipe.width <= 0 || depth <= 0)
    throw new Error(
      "passage width and thickness must be finite positive metres",
    );
  if (
    recipe.kind === "stairs" &&
    (recipe.steps < 2 || recipe.steps > createStairs.STEPS)
  )
    throw new Error(
      `stair flight needs 2 to ${createStairs.STEPS} steps; join taller flights at a named intermediate landing`,
    );
  if (
    recipe.kind === "ramp" &&
    recipe.maximumSlope !== undefined &&
    recipe.maximumSlope <= 0
  )
    throw new Error(
      "ramp maximumSlope must be a finite positive rise/run ratio",
    );
  if (recipe.clearHeight !== undefined && recipe.clearHeight <= 0)
    throw new Error("passage clearHeight must be finite positive metres");

  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const from: IAutoMovieTransform = landing(
      context,
      recipe.from,
      recipe.width,
      recipe.clearHeight,
    );
    const to: IAutoMovieTransform = landing(
      context,
      recipe.to,
      recipe.width,
      recipe.clearHeight,
    );
    const reversed: boolean =
      recipe.kind === "stairs" && from.translation.y > to.translation.y;
    const begin: IAutoMovieVector3 = (reversed ? to : from).translation;
    const end: IAutoMovieVector3 = (reversed ? from : to).translation;
    const difference: IAutoMovieVector3 = Vector3.subtract(end, begin);
    const run: number = Math.hypot(difference.x, difference.z);
    const rise: number = difference.y;
    const endpoints: string = `passage "${context.id}" between "${landingName(recipe.from)}" and "${landingName(recipe.to)}"`;
    if (run <= 1e-9)
      throw new Error(
        `${endpoints} requires horizontally separated finite landings`,
      );
    for (const [endpoint, landingFrame] of [
      [recipe.from, from],
      [recipe.to, to],
    ] as const) {
      if (typeof endpoint === "string") continue;
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        landingFrame.rotation,
        Vector3.create(0, 0, 1),
      );
      const alignment: number = Math.abs(
        (difference.x * normal.x + difference.z * normal.z) /
          (run * Math.hypot(normal.x, normal.z)),
      );
      if (!(alignment >= 1 - 1e-9))
        throw new Error(
          `passage "${context.id}" must approach opening "${endpoint.opening}" perpendicular to its clear section`,
        );
    }
    if (recipe.kind === "bridge" && Math.abs(rise) > 1e-9)
      throw new Error(
        `${endpoints} requires level landings; choose a ramp for unequal heights`,
      );
    if (
      recipe.kind === "ramp" &&
      recipe.maximumSlope !== undefined &&
      Math.abs(rise) / run > recipe.maximumSlope
    )
      throw new Error(
        `${endpoints} is steeper than its maximumSlope; lengthen the run or change a landing`,
      );
    if (recipe.kind === "stairs" && rise <= 1e-9)
      throw new Error(
        `${endpoints} requires different landing heights; choose a level passage for equal heights`,
      );

    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      Vector3.create(0, 1, 0),
      Math.atan2(difference.x, difference.z) / Quaternion.DEG2RAD,
    );
    const pose: IAutoMovieTransform = {
      ...Transform.identity(),
      translation: begin,
      rotation,
    };
    const models: IAutoMovieModel[] = [];
    const set: IAutoMovieStageSetPiece[] = [];
    const surfaces: IAutoMovieSurface[] = [];
    const count: number = recipe.kind === "stairs" ? recipe.steps : 1;
    for (let index: number = 0; index < count; ++index) {
      const flat: boolean = recipe.kind === "stairs";
      const y: number = flat ? (rise * (index + 1)) / count : 0;
      const leg: ILeg = {
        from: (run * index) / count,
        to: (run * (index + 1)) / count,
        fromHeight: y,
        toHeight: flat ? y : rise,
      };
      const id: string = `${context.id}/${flat ? `step${index + 1}` : "deck"}`;
      const top: IAutoMovieVector3[] = [
        Vector3.create(-recipe.width / 2, leg.fromHeight, leg.from),
        Vector3.create(-recipe.width / 2, leg.toHeight, leg.to),
        Vector3.create(recipe.width / 2, leg.toHeight, leg.to),
        Vector3.create(recipe.width / 2, leg.fromHeight, leg.from),
      ];
      models.push(
        buildingModel(
          id,
          flat ? "stair tread" : recipe.kind,
          {
            type: "mesh",
            mesh: buildAutoMoviePolyhedron(
              slabFaces(top, depth, flat ? 0 : undefined),
            ),
          },
          color,
        ),
      );
      set.push({ node: id, model: id, position: pose.translation, rotation });
      const polygon: IAutoMovieVector3[] = top.map(
        (corner: IAutoMovieVector3): IAutoMovieVector3 => place(pose, corner),
      );
      surfaces.push({
        id,
        kind: leg.fromHeight === leg.toHeight ? "platform" : "ramp",
        polygon,
        anchor: polygon[0]!,
        ...(leg.fromHeight === leg.toHeight ? {} : { rampTo: polygon[1]! }),
      });
    }
    return {
      anchors: { from, to },
      models,
      set,
      spaces: [
        {
          id: context.id,
          surfaces,
          walkable: surfaces.map(
            (surface: IAutoMovieSurface): string => surface.id,
          ),
        },
      ],
      routes: [
        {
          id: context.id,
          waypoints: [from.translation, to.translation].map(
            ({ x, z }): { x: number; z: number } => ({ x, z }),
          ),
          allowedFormationWidth: recipe.width,
        },
      ],
    };
  };
}

/** Static span construction choices specific to the passage producer. */
export namespace createPassage {
  /** A plain scenic anchor or a generated opening with a clear section. */
  export type Endpoint =
    | string
    | {
        /** Scoped opening anchor carrying generated clear section frames. */
        readonly opening: string;
      };

  /** Connection between two scoped world anchors. */
  export type IProps = {
    /** First world anchor, in centreline position at its landing surface. */
    readonly from: Endpoint;

    /** Second world anchor, in centreline position at its landing surface. */
    readonly to: Endpoint;

    /** Full clear deck width, in metres. */
    readonly width: number;

    /** Required headroom in metres at a fitted opening, when stated. */
    readonly clearHeight?: number;

    /** Vertical thickness of suspended spans, in metres. Defaults to 0.18 m. */
    readonly thickness?: number;

    /** SRGB finish swatch, with neutral stone by default. */
    readonly color?: string;
  } & (
    | { readonly kind: "bridge" }
    | {
        readonly kind: "ramp";
        /** Optional maximum absolute rise divided by horizontal run. */
        readonly maximumSlope?: number;
      }
    | {
        readonly kind: "stairs";
        /** Number of equal rises and treads, including the top tread. */
        readonly steps: number;
      }
  );
}

/** Read the declared endpoint's exact anchor path for diagnostics. */
function landingName(endpoint: createPassage.Endpoint): string {
  return typeof endpoint === "string" ? endpoint : endpoint.opening;
}

/**
 * Center on a physical opening's admitted clear section or use the ordinary
 * anchor.
 */
function landing(
  context: IAutoMovieEnvironmentModule.IContext,
  endpoint: createPassage.Endpoint,
  width: number,
  height: number | undefined,
): IAutoMovieTransform {
  if (typeof endpoint === "string") return context.anchor(endpoint);
  const id: string = endpoint.opening;
  const left: IAutoMovieTransform = context.anchor(`${id}/clear/left`);
  const right: IAutoMovieTransform = context.anchor(`${id}/clear/right`);
  const head: IAutoMovieTransform = context.anchor(`${id}/clear/head`);
  const span: IAutoMovieVector3 = Vector3.subtract(
    right.translation,
    left.translation,
  );
  const widthAtOpening: number = Math.hypot(span.x, span.z);
  const heightAtOpening: number = head.translation.y - left.translation.y;
  if (
    width > widthAtOpening + 1e-9 ||
    (height !== undefined && height > heightAtOpening + 1e-9)
  )
    throw new Error(
      `passage "${context.id}" does not fit the clear section of opening "${id}"`,
    );
  return {
    ...left,
    translation: Vector3.add(left.translation, Vector3.scale(span, 0.5)),
  };
}

/**
 * One slab section in the span frame, ordered along local Z and measured in
 * metres.
 */
interface ILeg {
  readonly from: number;
  readonly to: number;
  readonly fromHeight: number;
  readonly toHeight: number;
}

/** Construct oppositely wound caps and four planar exterior faces. */
function slabFaces(
  top: readonly IAutoMovieVector3[],
  depth: number,
  floor: number | undefined,
): IAutoMovieVector3[][] {
  const bottom: IAutoMovieVector3[] = top.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({
      ...point,
      y: floor ?? point.y - depth,
    }),
  );
  const faces: IAutoMovieVector3[][] = [[...top], bottom.slice().reverse()];
  for (let index: number = 0; index < top.length; ++index) {
    const next: number = (index + 1) % top.length;
    faces.push([top[index]!, bottom[index]!, bottom[next]!, top[next]!]);
  }
  return faces;
}

/** Place a support corner with the same frame as the staged solid. */
function place(
  pose: IAutoMovieTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    pose.translation,
    Quaternion.rotateVector(pose.rotation, local),
  );
}
