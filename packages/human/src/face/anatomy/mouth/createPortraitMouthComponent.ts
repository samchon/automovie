import type {
  IControlMesh as ImportedIControlMesh,
  IPortraitComponentHost as ImportedIPortraitComponentHost,
  IPortraitDentalCrown as ImportedIPortraitDentalCrown,
  IPortraitInterior as ImportedIPortraitInterior,
  IPortraitLipBandKnot as ImportedIPortraitLipBandKnot,
  IPortraitLipCoordinate as ImportedIPortraitLipCoordinate,
  IPortraitLipSection as ImportedIPortraitLipSection,
  IPortraitOralChamber as ImportedIPortraitOralChamber,
} from "@automovie/human";
import {
  IAutoMovieVector3,
  type IAutoMovieModelPart as ImportedIAutoMovieModelPart,
} from "@automovie/interface";

import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { selectHostFacesInsideLoop } from "../../mesh/selectHostFacesInsideLoop";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { assertPortraitDentalCrown } from "../dental/assertPortraitDentalCrown";
import { resolvePortraitDentalCrown } from "../dental/resolvePortraitDentalCrown";
import { assertPortraitOralLining } from "./assertPortraitOralLining";
import { createPortraitLipBandSampler } from "./createPortraitLipBandSampler";
import { createPortraitLipBandScale } from "./createPortraitLipBandScale";
import { createPortraitLipSection } from "./createPortraitLipSection";
import { createPortraitMouthPerformance } from "./createPortraitMouthPerformance";
import { portraitLipTriangles } from "./portraitLipTriangles";
import { preparePortraitMouth } from "./preparePortraitMouth";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { portraitMouthInnerLoop } from "./structures/portraitMouthInnerLoop";

/**
 * Fit the lips, adapt adjacent skin and finish the selected oral interior at the refined rim. A connected lining receives only the final lip triangles, retaining every refined boundary vertex without scanning the whole head.
 *
 * @evidence contracts/common.md#principled-implementation Actual socket lip triangles receive authored band/section/performance constraints before refined native interior preparation.
 * @evidence contracts/common.md#clear-and-simple-design Shared boundary coordinates and one interior finisher preserve skin ownership and exact refined attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Moving-lip legacy crowns, malformed dimensions and unsupported border modes refuse; geometric construction is not physiological reconstruction.
 * @evidence contracts/common.md#meaningful-documentation Portrait millimetres govern constraints and final native preparation, with separate metric publication.
 * @evidence contracts/performance.md#efficient-algorithms Fit scans topology and skin vertices; coordinate sampling/search and optional performance add per-vertex work, then selected refined triangles feed lining preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work Band/section/profile samplers are prepared once and target maps let performance reuse constrained rim coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The component owns copied socket/crowns/chamber and sampler closures; fit temporaries stay local and returned constraints/interiors are caller-owned.
 */
export function createPortraitMouthComponent(
  inputSocket: IPortraitMouthSocket,
  inputShape: IPortraitMouthShape,
  inputPerformance?: IPortraitMouthPerformance,
): IPortraitComponent {
  const performance: IPortraitMouthPerformance | undefined =
    inputPerformance === undefined
      ? undefined
      : structuredClone(inputPerformance);
  if (performance !== undefined && inputShape.crowns.length !== 0)
    throw new Error(
      "Oral performance requires separate maxillary dentition, not crowns attached to the moving lip.",
    );
  const socket: {
    outer: number[];
    upper: number[];
    lower: number[];
    lipSeed: number;
  } = {
    ...inputSocket,
    outer: [...inputSocket.outer],
    upper: [...inputSocket.upper],
    lower: [...inputSocket.lower],
  };
  const shape: {
    crowns: {
      width: number;
      height: number;
      cervicalWidth?: number;
      edgeRise?: number;
      contour?: ImportedIPortraitDentalCrown["contour"];
    }[];
    cavityChamber: ImportedIPortraitOralChamber | undefined;
    widthScale: number;
    openingScale: number;
    cornerLift: number;
    upperLipProjection: number;
    lowerLipProjection: number;
    seamProjection?: number;
    section?: ImportedIPortraitLipSection;
    band?: {
      upper?: number | readonly ImportedIPortraitLipBandKnot[];
      lower?: number | readonly ImportedIPortraitLipBandKnot[];
    };
    borderRefinement?: "surface" | "curve";
    blendReach: number;
    cavityDepth: number;
    cavityWall?: number;
    dentalOffset: number;
    dentalRecess: number;
    dentalDrop: number;
    dentalDepth: number;
    toothGap: number;
  } = {
    ...inputShape,
    crowns: structuredClone(inputShape.crowns),
    cavityChamber:
      inputShape.cavityChamber === undefined
        ? undefined
        : structuredClone(inputShape.cavityChamber),
  };
  const seamProjection: number =
    shape.seamProjection === undefined ? 0 : shape.seamProjection;
  const section:
    | ((coordinate: ImportedIPortraitLipCoordinate) => number)
    | undefined =
    inputShape.section === undefined
      ? undefined
      : createPortraitLipSection(inputShape.section);
  const upperBand: (lateral: number) => number = createPortraitLipBandScale(
    inputShape.band?.upper,
  );
  const lowerBand: (lateral: number) => number = createPortraitLipBandScale(
    inputShape.band?.lower,
  );
  if (shape.cavityWall !== undefined || shape.cavityChamber !== undefined)
    assertPortraitOralLining(
      shape.cavityDepth,
      shape.cavityWall!,
      shape.cavityChamber,
    );
  if (
    shape.borderRefinement !== undefined &&
    shape.borderRefinement !== "surface" &&
    shape.borderRefinement !== "curve"
  )
    throw new Error("Lip border refinement must be surface or curve.");
  for (const crown of shape.crowns)
    assertPortraitDentalCrown(
      resolvePortraitDentalCrown(crown, shape.dentalDepth),
    );
  if (
    [
      shape.widthScale,
      shape.openingScale,
      shape.cavityDepth,
      shape.dentalDepth,
    ].some((value: number): boolean => !Number.isFinite(value) || value <= 0) ||
    [
      shape.blendReach,
      shape.toothGap,
      shape.dentalRecess,
      shape.dentalDrop,
    ].some((value: number): boolean => !Number.isFinite(value) || value < 0) ||
    [
      shape.cornerLift,
      shape.upperLipProjection,
      shape.lowerLipProjection,
      seamProjection,
      shape.dentalOffset,
    ].some((value: number): boolean => !Number.isFinite(value))
  )
    throw new Error(
      "Mouth dimensions must be finite, with positive openings and crown sizes.",
    );
  return {
    id: "mouth",
    fit: (
      host: ImportedIPortraitComponentHost,
    ): {
      constraints: { vertex: number; target: number[]; reach: number }[];
      cutFaces: number[];
      attach: (
        cage: ImportedIControlMesh,
        _adapted: number[][],
        region: (id: string, material: string) => number,
      ) => {
        prepareInteriors: (
          refined: ImportedIControlMesh,
        ) => ImportedIPortraitInterior[];
        finish: (
          refined: ImportedIControlMesh,
        ) => ImportedIAutoMovieModelPart[];
        openings: number[][];
        closures: number[] | undefined;
        curves: number[][] | undefined;
      };
    } => {
      const inner: number[] = portraitMouthInnerLoop(socket);
      const lips: Set<number> = portraitLipTriangles(host.indices, socket);
      const skin: Set<number> = new Set<number>();
      const lipKeys: Set<string> = new Set<string>();
      for (const triangle of lips) {
        const ids: number[] = host.indices.slice(
          3 * triangle,
          3 * triangle + 3,
        );
        lipKeys.add(ids.join("/"));
        for (const id of ids) skin.add(id);
      }
      const points: number[][] = inner.map(
        (id: number): number[] => host.positions[id],
      );
      const left: number = Math.min(
        ...points.map((point: number[]): number => point[0]),
      );
      const right: number = Math.max(
        ...points.map((point: number[]): number => point[0]),
      );
      const centerX: number = (left + right) / 2;
      const centerY: number =
        (Math.min(...points.map((point: number[]): number => point[1])) +
          Math.max(...points.map((point: number[]): number => point[1]))) /
        2;
      // Follow the curved smile locally when distinguishing the two bands.
      // A lower-lip point near a raised corner may be above the global centre;
      // its anatomical role is still lower lip. Both borders come from this
      // socket, and section relief is exactly zero on either retained boundary.
      const coordinate: (point: readonly number[]) => {
        coordinate: ImportedIPortraitLipCoordinate;
        innerY: number;
        outerY: number;
      } = createPortraitLipBandSampler(
        socket.outer.map((id: number): number[] => host.positions[id]),
        socket.upper.map((id: number): number[] => host.positions[id]),
        socket.lower.map((id: number): number[] => host.positions[id]),
      );
      let constraints: { vertex: number; target: number[]; reach: number }[] = [
        ...skin,
      ].map(
        (
          vertex: number,
        ): { vertex: number; target: number[]; reach: number } => {
          const point: number[] = host.positions[vertex];
          const band: {
            coordinate: ImportedIPortraitLipCoordinate;
            innerY: number;
            outerY: number;
          } = coordinate(point);
          const local: ImportedIPortraitLipCoordinate = band.coordinate;
          const ratio: number = (
            local.side === "upper" ? upperBand : lowerBand
          )(local.lateral);
          // Identity keeps the original coordinate exactly. Detail scales the
          // curved band about its actual oral boundary, not about the head's Y.
          const height: number =
            ratio === 1
              ? point[1]
              : band.innerY + (point[1] - band.innerY) * ratio;
          const corner: number = Math.min(
            1,
            Math.abs((point[0] - centerX) / ((right - left) / 2)),
          );
          return {
            vertex,
            target: [
              centerX + (point[0] - centerX) * shape.widthScale,
              centerY +
                (height - centerY) * shape.openingScale +
                shape.cornerLift * corner ** 2,
              point[2] +
                (local.side === "upper"
                  ? shape.upperLipProjection
                  : shape.lowerLipProjection) *
                  (1 - corner ** 2) +
                (section?.(local) ?? 0) +
                seamProjection *
                  (1 - local.lateral ** 2) ** 2 *
                  local.across ** 2 *
                  (3 - 2 * local.across),
            ],
            reach: shape.blendReach,
          };
        },
      );
      if (performance !== undefined) {
        const targets: Map<number, number[]> = new Map(
          constraints.map(
            (constraint: {
              vertex: number;
              target: number[];
              reach: number;
            }): [number, number[]] => [constraint.vertex, constraint.target],
          ),
        );
        const point: (id: number) => IAutoMovieVector3 = (
          id: number,
        ): IAutoMovieVector3 =>
          p(...(targets.get(id)! as [number, number, number]));
        const pose: {
          upper: IAutoMovieVector3[];
          lower: IAutoMovieVector3[];
          move: (
            point: IAutoMovieVector3,
            side: "upper" | "lower",
          ) => IAutoMovieVector3;
        } = createPortraitMouthPerformance(
          socket.upper.map(point),
          socket.lower.map(point),
          performance,
        );
        const rims: Map<number, IAutoMovieVector3> = new Map<number, Point>();
        for (const side of ["upper", "lower"] as const)
          socket[side].forEach(
            (id: number, i: number): Map<number, IAutoMovieVector3> =>
              rims.set(id, pose[side][i]),
          );
        constraints = constraints.map(
          (constraint: {
            vertex: number;
            target: number[];
            reach: number;
          }): { target: number[]; vertex: number; reach: number } => {
            const target: IAutoMovieVector3 =
              rims.get(constraint.vertex) ??
              pose.move(
                point(constraint.vertex),
                coordinate(host.positions[constraint.vertex]).coordinate.side,
              );
            return { ...constraint, target: [target.x, target.y, target.z] };
          },
        );
      }
      return {
        constraints,
        cutFaces: selectHostFacesInsideLoop(host, inner),
        attach: (
          cage: ImportedIControlMesh,
          _adapted: number[][],
          region: (id: string, material: string) => number,
        ): {
          prepareInteriors: (
            refined: ImportedIControlMesh,
          ) => ImportedIPortraitInterior[];
          finish: (
            refined: ImportedIControlMesh,
          ) => ImportedIAutoMovieModelPart[];
          openings: number[][];
          closures: number[] | undefined;
          curves: number[][] | undefined;
        } => {
          // Material ownership follows the original anatomical band through
          // other components' cuts. The host contains no lip-specific policy.
          const group: number = region("lips", "lips");
          for (let i: number = 0; i < cage.indices.length; i += 3)
            if (lipKeys.has(cage.indices.slice(i, i + 3).join("/")))
              cage.groups[i / 3] = group;
          return {
            openings: [inner],
            closures:
              performance?.lipPart === 0 &&
              (performance.jaw?.current ?? 0) === 0
                ? [inner[0]]
                : undefined,
            curves:
              shape.borderRefinement === "curve" ? [socket.outer] : undefined,
            ...createPortraitInteriorFinisher(
              (refined: ImportedIControlMesh): ImportedIPortraitInterior[] =>
                preparePortraitMouth(
                  refined.positions,
                  socket,
                  shape,
                  performance,
                  shape.cavityWall === undefined
                    ? undefined
                    : refined.indices.filter(
                        (_vertex: number, i: number): boolean =>
                          refined.groups[Math.floor(i / 3)] === group,
                      ),
                ),
            ),
          };
        },
      };
    },
  };
}

type Point = IAutoMovieVector3;
