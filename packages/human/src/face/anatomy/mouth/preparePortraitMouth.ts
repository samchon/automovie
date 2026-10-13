import type { IPortraitDentalCrown as ImportedIPortraitDentalCrown, IPortraitDentalArc as ImportedIPortraitDentalArc } from "@automovie/human";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { catmullRomPoint as interpolate } from "../../mesh/catmullRomPoint";
import { linearInterpolate as mix } from "../../mesh/linearInterpolate";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { triangulateSurfaceLattice as patch } from "../../mesh/triangulateSurfaceLattice";
import { IPortraitInterior } from "../../surface/structures/IPortraitInterior";
import { createPortraitDentalArc } from "../dental/createPortraitDentalArc";
import { preparePortraitDentalCrown } from "../dental/preparePortraitDentalCrown";
import { resolvePortraitDentalCrown } from "../dental/resolvePortraitDentalCrown";
import { separatePortraitDentalCrowns } from "../dental/separatePortraitDentalCrowns";
import { assertPortraitOralLining } from "./assertPortraitOralLining";
import { preparePortraitOralLining } from "./preparePortraitOralLining";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";

/**
 * Recess the mouth interior behind the photographed lip opening, then place the supplied upper crowns along that opening's curved dental arch. Central crowns are wider and taller; side crowns turn with the arch to remain behind the mouth corners. Widths are authored estimates, in millimetres, not dental data. Lips themselves remain in the shared facial mesh, preserving their skin join. Selecting cavityWall requires final skin indices and replaces the detached backdrop with an enclosure joined to every actual refined oral-rim vertex.
 *
 * @evidence contracts/common.md#principled-implementation Actual refined lip margins select native lining or legacy backdrop, followed by authored crowns placed along a curved dental arc.
 * @evidence contracts/common.md#clear-and-simple-design Direct mouth building and component interior finishing share one preparation and exact lining boundary registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed performed mouths omit cavity; connected lining needs actual skin triangles, and legacy crown dimensions are authored estimates rather than acquired dental measurements.
 * @evidence contracts/common.md#meaningful-documentation Portrait millimetres stay native until metric publication, and lining attachments preserve original refined rim vertex ids.
 * @evidence contracts/performance.md#efficient-algorithms Lining/backdrop mesh and per-crown preparation dominate, followed by shared neighbouring-crown separation.
 * @evidence contracts/performance.md#reuse-equivalent-work Arch samples and one preparation policy serve both compatibility and component paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared interiors own mesh buffers and attachment arrays; source/socket/shape data are borrowed and placed crowns mutate only newly prepared meshes.
 */
export function preparePortraitMouth(
  source: number[][],
  socket: IPortraitMouthSocket,
  shape: IPortraitMouthShape,
  performance?: IPortraitMouthPerformance,
  skinIndices?: readonly number[],
): IPortraitInterior[] {
  if (shape.cavityWall !== undefined || shape.cavityChamber !== undefined)
    assertPortraitOralLining(
      shape.cavityDepth,
      shape.cavityWall!,
      shape.cavityChamber,
    );
  const parts: IPortraitInterior[] = [];
  const add: (id: string, mesh: IAutoMovieMesh, finish: string, bindings: Pick<IPortraitInterior, "attachments" | "loops">) => void = (
    id: string,
    mesh: IAutoMovieMesh,
    finish: string,
    bindings: Pick<IPortraitInterior, "attachments" | "loops">,
  ): void => {
    parts.push({ id, mesh, material: finish, ...bindings });
  };
  const landmark: (id: number) => Point = (id: number): Point =>
    p(source[id][0], source[id][1], source[id][2]);
  const cavity: string = "mouth-interior",
    enamel: string = "teeth";
  const mouthUpper: IAutoMovieVector3[] = socket.upper.map(landmark);
  const mouthLower: IAutoMovieVector3[] = socket.lower.map(landmark);
  if (
    performance === undefined ||
    mouthUpper.some(
      (point: IAutoMovieVector3, i: number): boolean =>
        point.x !== mouthLower[i].x ||
        point.y !== mouthLower[i].y ||
        point.z !== mouthLower[i].z,
    )
  ) {
    if (shape.cavityWall !== undefined && skinIndices === undefined)
      throw new Error("Oral lining requires the actual refined lip triangles.");
    const lining: { mesh: IAutoMovieMesh; boundary: number[]; } | undefined =
      shape.cavityWall === undefined
        ? undefined
        : preparePortraitOralLining(
            { positions: source, indices: skinIndices! },
            socket.upper[0],
            shape.cavityDepth,
            shape.cavityWall,
            shape.cavityChamber,
          );
    add(
      "oral-cavity",
      lining !== undefined
        ? lining.mesh
        : patch(
            (u: number, v: number): IAutoMovieVector3 => {
              const top: IAutoMovieVector3 = interpolate(mouthUpper, u),
                bottom: IAutoMovieVector3 = interpolate(mouthLower, u);
              return p(
                mix(bottom.x, top.x, v),
                mix(bottom.y, top.y, v),
                mix(bottom.z, top.z, v) -
                  shape.cavityDepth * (1 + 0.8 * Math.sin(pi * v)),
              );
            },
            100,
            30,
          ),
      cavity,
      {
        attachments: lining?.boundary.map((skin: number, vertex: number): { vertex: number; target: { part: null; vertex: number; }; } => ({
          vertex,
          target: { part: null, vertex: skin },
        })),
      },
    );
  }
  if (shape.crowns.length === 0) return parts;
  // Width is enamel size, not a pitch on the head's X axis. Walk the arch in
  // millimetres so rotating the side teeth cannot create artificial diastemata.
  const rowLength: number =
    shape.crowns.reduce((sum: number, crown: { width: number; height: number; cervicalWidth?: number; edgeRise?: number; contour?: ImportedIPortraitDentalCrown["contour"]; }): number => sum + crown.width, 0) +
    shape.toothGap * (shape.crowns.length - 1);
  const arch: ImportedIPortraitDentalArc = createPortraitDentalArc(mouthUpper, rowLength);
  let cursor: number = arch.center + shape.dentalOffset - rowLength / 2;
  const cervical: number[][] = [];
  const placed: IAutoMovieMesh[] = [];
  for (let i: number = 0; i < shape.crowns.length; i++) {
    const { width }: { width: number; height: number; cervicalWidth?: number; edgeRise?: number; contour?: ImportedIPortraitDentalCrown["contour"]; } = shape.crowns[i];
    const distance: number = cursor + width / 2;
    const { position: at, tangent }: { position: IAutoMovieVector3; tangent: IAutoMovieVector3; } = arch.sample(distance);
    cursor += width + shape.toothGap;
    const angleY: number = -Math.atan2(tangent.z, tangent.x);
    const prepared: { mesh: IAutoMovieMesh; cervical: number[]; } = preparePortraitDentalCrown(
      resolvePortraitDentalCrown(shape.crowns[i], shape.dentalDepth),
      distance <= arch.center ? 1 : -1,
    );
    const crown: IAutoMovieMesh = prepared.mesh;
    // Placement and normals use the same rigid arch rotation. The local crown
    // profile therefore cannot silently change measured interdental clearance.
    for (let vertex: number = 0; vertex < crown.positions.length; vertex += 3) {
      const x: number = crown.positions[vertex],
        y: number = crown.positions[vertex + 1],
        z: number = crown.positions[vertex + 2];
      crown.positions[vertex] =
        at.x + Math.cos(angleY) * x + Math.sin(angleY) * z;
      crown.positions[vertex + 1] = at.y - shape.dentalDrop + y;
      crown.positions[vertex + 2] =
        at.z - shape.dentalRecess - Math.sin(angleY) * x + Math.cos(angleY) * z;
      const nx: number = crown.normals![vertex],
        nz: number = crown.normals![vertex + 2];
      crown.normals![vertex] = Math.cos(angleY) * nx + Math.sin(angleY) * nz;
      crown.normals![vertex + 2] =
        -Math.sin(angleY) * nx + Math.cos(angleY) * nz;
    }
    placed.push(crown);
    cervical.push(prepared.cervical);
  }
  // Rotated proximal faces can overlap at nominal arc spacing; enamel of
  // neighbouring crowns is separated exactly as the dental row owner does.
  separatePortraitDentalCrowns(placed, 0).forEach((crown: IAutoMovieMesh, i: number): void =>
    add(`tooth-${i}`, crown, enamel, {
      loops: [{ name: "cervical", vertices: cervical[i] }],
    }),
  );
  return parts;
}

type Point = IAutoMovieVector3;
const pi: number = Math.PI;
