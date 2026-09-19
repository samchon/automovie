import { p } from "../../mesh/p";
import { portraitFacesInsideLoop } from "../../mesh/portraitFacesInsideLoop";
import { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { createPortraitInteriorFinisher } from "../../surface/createPortraitInteriorFinisher";
import { assertPortraitDentalCrown } from "../dental/assertPortraitDentalCrown";
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
import { innerLoop } from "./structures/innerLoop";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Fit the lips, adapt adjacent skin and finish the selected oral interior at
 * the refined rim. A connected lining receives only the final lip triangles,
 * retaining every refined boundary vertex without scanning the whole head.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Fits shared lips and adjacent skin, with separate maxillary teeth required during oral performance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Copies oral settings, applies curved-band thickness and observed-relative motion, and passes final lip-group connectivity to a selected oral lining.
 */
export function createPortraitMouthComponent(
  inputSocket: IPortraitMouthSocket,
  inputShape: IPortraitMouthShape,
  inputPerformance?: IPortraitMouthPerformance,
): IPortraitComponent {
  const performance =
    inputPerformance === undefined
      ? undefined
      : structuredClone(inputPerformance);
  if (performance !== undefined && inputShape.crowns.length !== 0)
    throw new Error(
      "Oral performance requires separate maxillary dentition, not crowns attached to the moving lip.",
    );
  const socket = {
    ...inputSocket,
    outer: [...inputSocket.outer],
    upper: [...inputSocket.upper],
    lower: [...inputSocket.lower],
  };
  const shape = {
    ...inputShape,
    crowns: structuredClone(inputShape.crowns),
    cavityChamber:
      inputShape.cavityChamber === undefined
        ? undefined
        : structuredClone(inputShape.cavityChamber),
  };
  const seamProjection =
    shape.seamProjection === undefined ? 0 : shape.seamProjection;
  const section =
    inputShape.section === undefined
      ? undefined
      : createPortraitLipSection(inputShape.section);
  const upperBand = createPortraitLipBandScale(inputShape.band?.upper);
  const lowerBand = createPortraitLipBandScale(inputShape.band?.lower);
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
    assertPortraitDentalCrown({
      ...crown,
      depth: shape.dentalDepth,
      cervicalWidth: crown.cervicalWidth ?? 0.78,
      edgeRise: crown.edgeRise ?? 0.035 * crown.height,
    });
  if (
    [
      shape.widthScale,
      shape.openingScale,
      shape.cavityDepth,
      shape.dentalDepth,
    ].some((value) => !Number.isFinite(value) || value <= 0) ||
    [
      shape.blendReach,
      shape.toothGap,
      shape.dentalRecess,
      shape.dentalDrop,
    ].some((value) => !Number.isFinite(value) || value < 0) ||
    [
      shape.cornerLift,
      shape.upperLipProjection,
      shape.lowerLipProjection,
      seamProjection,
      shape.dentalOffset,
    ].some((value) => !Number.isFinite(value))
  )
    throw new Error(
      "Mouth dimensions must be finite, with positive openings and crown sizes.",
    );
  return {
    id: "mouth",
    fit: (host) => {
      const inner = innerLoop(socket);
      const lips = portraitLipTriangles(host.indices, socket);
      const skin = new Set<number>();
      const lipKeys = new Set<string>();
      for (const triangle of lips) {
        const ids = host.indices.slice(3 * triangle, 3 * triangle + 3);
        lipKeys.add(ids.join("/"));
        for (const id of ids) skin.add(id);
      }
      const points = inner.map((id) => host.positions[id]);
      const left = Math.min(...points.map((point) => point[0]));
      const right = Math.max(...points.map((point) => point[0]));
      const centerX = (left + right) / 2;
      const centerY =
        (Math.min(...points.map((point) => point[1])) +
          Math.max(...points.map((point) => point[1]))) /
        2;
      // Follow the curved smile locally when distinguishing the two bands.
      // A lower-lip point near a raised corner may be above the global centre;
      // its anatomical role is still lower lip. Both borders come from this
      // socket, and section relief is exactly zero on either retained boundary.
      const coordinate = createPortraitLipBandSampler(
        socket.outer.map((id) => host.positions[id]),
        socket.upper.map((id) => host.positions[id]),
        socket.lower.map((id) => host.positions[id]),
      );
      let constraints = [...skin].map((vertex) => {
        const point = host.positions[vertex];
        const band = coordinate(point);
        const local = band.coordinate;
        const ratio = (local.side === "upper" ? upperBand : lowerBand)(
          local.lateral,
        );
        // Identity keeps the original coordinate exactly. Detail scales the
        // curved band about its actual oral boundary, not about the head's Y.
        const height =
          ratio === 1
            ? point[1]
            : band.innerY + (point[1] - band.innerY) * ratio;
        const corner = Math.min(
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
      });
      if (performance !== undefined) {
        const targets = new Map(
          constraints.map((constraint) => [
            constraint.vertex,
            constraint.target,
          ]),
        );
        const point = (id: number) =>
          p(...(targets.get(id)! as [number, number, number]));
        const pose = createPortraitMouthPerformance(
          socket.upper.map(point),
          socket.lower.map(point),
          performance,
        );
        const rims = new Map<number, Point>();
        for (const side of ["upper", "lower"] as const)
          socket[side].forEach((id, i) => rims.set(id, pose[side][i]));
        constraints = constraints.map((constraint) => {
          const target =
            rims.get(constraint.vertex) ??
            pose.move(
              point(constraint.vertex),
              coordinate(host.positions[constraint.vertex]).coordinate.side,
            );
          return { ...constraint, target: [target.x, target.y, target.z] };
        });
      }
      return {
        constraints,
        cutFaces: portraitFacesInsideLoop(host, inner),
        attach: (cage, _adapted, region) => {
          // Material ownership follows the original anatomical band through
          // other components' cuts. The host contains no lip-specific policy.
          const group = region("lips", "lips");
          for (let i = 0; i < cage.indices.length; i += 3)
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
            ...createPortraitInteriorFinisher((refined) =>
              preparePortraitMouth(
                refined.positions,
                socket,
                shape,
                performance,
                shape.cavityWall === undefined
                  ? undefined
                  : refined.indices.filter(
                      (_vertex, i) =>
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
