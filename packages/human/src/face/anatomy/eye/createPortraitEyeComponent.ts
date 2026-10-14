import type { IPortraitComponentPlan } from "../../surface/structures/IPortraitComponentPlan";








import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";



import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieVector3 as Point, IAutoMovieModelPart } from "@automovie/interface";

import { catmullRomPoint as interpolate } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { selectHostFacesInsideLoop } from "../../mesh/selectHostFacesInsideLoop";
import { createPortraitDirectionalContact } from "../../surface/createPortraitDirectionalContact";
import { portraitEyeSphereIntersection } from "../../surface/portraitEyeSphereIntersection";
import { type IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { portraitSkinAnnulus } from "../skin/portraitSkinAnnulus";
import { refinePortraitSkinBridge } from "../skin/refinePortraitSkinBridge";
import { reservePortraitSkin } from "../skin/reservePortraitSkin";
import { appendPortraitEyeMargins } from "./appendPortraitEyeMargins";
import { buildPortraitEye } from "./buildPortraitEye";
import { buildPortraitEyeContactBasis } from "./buildPortraitEyeContactBasis";
import { createHumanFaceCornealMaterial } from "./createHumanFaceCornealMaterial";
import { createPortraitEyeSupport } from "./createPortraitEyeSupport";
import { createPortraitEyeSurfaceContact } from "./createPortraitEyeSurfaceContact";
import { createPortraitIrisMaterials } from "./createPortraitIrisMaterials";
import { portraitEyeLidRows } from "./portraitEyeLidRows";
import { portraitEyeLoop } from "./portraitEyeLoop";
import { posePortraitLidCurves } from "./posePortraitLidCurves";
import { resolvePortraitEyeInputs } from "./resolvePortraitEyeInputs";
import { type IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

// Keep the established component module imports while definitions own their contracts.
export type { IPortraitAegyoSalShape } from "./structures/IPortraitAegyoSalShape";
export type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
export type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";
export { appendPortraitEyeMargins } from "./appendPortraitEyeMargins";
export { buildPortraitEye } from "./buildPortraitEye";
/**
 * Fit one replaceable eye and expose its actual outer lid as the skin seam.
 * Inputs describe an observed aperture in head millimetres, with +Z anterior.
 * Admission snapshots consumed geometry controls before optical identity is
 * fitted and blink moves the inner margins. Shared sections bridge that contact
 * to the host skin. Attachment mutates the supplied assembly cage; finalSurface
 * proposes common skin targets after refinement, then finish draws the same
 * support. Gaze cannot refit identity or move the outer attachment. Changing
 * identity requires a new component and fit; no phase establishes likeness.
 *
 * @evidence contracts/common.md#principled-implementation Observed aperture shaping precedes fixed optical identity, performed lid contact, source skin attachment and refined metric emission.
 * @evidence contracts/common.md#clear-and-simple-design Fit/attach/finalSurface/finish expose the shared component phases; one admitted socket/shape and actual support drive every phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaze never refits identity or changes the outer seam; reserved bridge admission precedes cage mutation and likeness remains unproven.
 * @evidence contracts/common.md#meaningful-documentation The prose states construction millimetres, host/cage ownership, phase invalidation and drawing/contact identity.
 * @evidence contracts/performance.md#efficient-algorithms Host copying, optical hull/query construction, source patch reservation/refinement and requested emitted optics/fibres dominate; delegated work is included.
 * @evidence contracts/performance.md#reuse-equivalent-work One fit shares identity support, actual skin sampler, owned profile samplers and margin correspondence across attachment/contact/finish.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The component retains copied inputs; fit plans retain their host support until release, while attach mutates the caller-owned cage and creates no background task.
 */
export function createPortraitEyeComponent(
  inputSocket: IPortraitEyeSocket,
  inputShape: IPortraitEyeShape,
  inputPerformance?: IPortraitEyePerformance,
): IPortraitComponent {
  const { performance, socket, shape, tissues, lowerProfile, upperProfile }: ReturnType<typeof resolvePortraitEyeInputs> =
    resolvePortraitEyeInputs(inputSocket, inputShape, inputPerformance);
  return {
    id: socket.name + "-eye",
    // Each optical volume owns its material so changing one shell's thickness
    // cannot leave a shared global thickness behind on either eye.
    materials: [
      createHumanFaceCornealMaterial(
        socket.name + "-cornea",
        socket.name + " corneal surface",
        shape.cornealThickness / 1000,
      ),
      // Preserve the optical material's established first slot; additive
      // pigment ownership appends materials without moving that existing entry.
      ...(shape.irisPigment === undefined
        ? []
        : createPortraitIrisMaterials(
            socket.name + "-iris",
            shape.irisPigment,
          )),
    ],
    fit: (host: IPortraitComponentHost): ReturnType<IPortraitComponent["fit"]>  => {
      const loop: number[] = portraitEyeLoop(socket);
      const points: number[][] = loop.map((id: number): number[]  => host.positions[id]);
      const left: number = Math.min(...points.map((p: number[]): number  => p[0])),
        right: number = Math.max(...points.map((p: number[]): number  => p[0]));
      const middleX: number = (left + right) / 2;
      const middleY: number =
        (Math.min(...points.map((p: number[]): number  => p[1])) +
          Math.max(...points.map((p: number[]): number  => p[1]))) /
        2;
      const aperture: number[][] = host.positions.map((point: number[]): number[]  => [...point]);
      for (const id of loop) {
        const point: number[] = host.positions[id],
          u: number = (point[0] - left) / (right - left);
        const outer: number = socket.name === "left" ? u : 1 - u;
        aperture[id] = [
          middleX + (point[0] - middleX) * shape.widthScale,
          middleY +
            (point[1] - middleY) * shape.openingScale +
            shape.outerCornerLift * outer,
          point[2],
        ].map((value: number, axis: number): number  => value + shape.socketLift * host.viewRay[axis]);
      }
      aperture[socket.iris] = host.positions[socket.iris].map(
        (value: number, axis: number): number  => value + shape.socketLift * host.viewRay[axis],
      );
      const direction: Point = p(host.viewRay[0], host.viewRay[1], host.viewRay[2]);
      const pointAt: (id: number) => Point = (id: number): Point =>
        p(aperture[id][0], aperture[id][1], aperture[id][2]);
      const { sphere, fittedSphere, shifted, canthal, intersect }: ReturnType<typeof createPortraitEyeSupport> =
        createPortraitEyeSupport(
          socket.top.map(pointAt),
          socket.bottom.map(pointAt),
          direction,
          shape,
        );
      // The host seam belongs to the fitted socket, not to optical prominence.
      // Keep its reference sphere while moving the complete optical body along
      // the observation ray. This preserves image coordinates without lifting
      // the brow-side attachment by the same amount.
      const identityGuide: number[][] | undefined =
        performance === undefined
          ? undefined
          : aperture.map((point: number[]): number[]  => [...point]);
      // Transport from the observed aperture on this same optical sphere.
      // Contact/refinement still owns the final root; neither gaze nor a second
      // assembled reference face is needed to carry the strand's direction.
      const lashReference: Point[] | undefined =
        shape.upperLashProfile === undefined ||
        performance === undefined ||
        performance.blink === performance.observedBlink
          ? undefined
          : socket.top.map((id: number): Point  => intersect(pointAt(id)));
      if (performance !== undefined) {
        const posed: { upper: Point[]; lower: Point[]; } = posePortraitLidCurves(
          socket.top.map(pointAt),
          socket.bottom.map(pointAt),
          performance,
        );
        for (const band of ["top", "bottom"] as const)
          socket[band].forEach((id: number, i: number): void  => {
            const point: Point = posed[band === "top" ? "upper" : "lower"][i];
            aperture[id] = [point.x, point.y, point.z];
          });
      }
      const lashCurrent: Point[] | undefined =
        lashReference === undefined
          ? undefined
          : socket.top.map((id: number): Point  => intersect(pointAt(id)));
      // The lid section starts at its actual ocular contact, not at a lower
      // globe surface that will later be pushed through a raised cornea. A
      // post-refinement collision correction alone leaves a local platform:
      // its movement never informed the tissue bridge constructed below.
      // Use the same resident optical builder and recorded projection ray as
      // the final contact check. Section thickness is added by the lid rows,
      // so this boundary query uses zero extra clearance, avoiding two copies.
      const contactBoundary: ((point: Point) => Point) | undefined =
        shape.lidContact !== "cornea"
          ? undefined
          : createPortraitDirectionalContact(
              createMetricMeshPart(
                "corneal-attachment-basis",
                buildPortraitEyeContactBasis(
                  portraitEyeSphereIntersection(
                    sphere,
                    pointAt(socket.iris),
                    direction,
                  ),
                  sphere,
                  shape,
                  [],
                  performance,
                  canthal?.surface,
                ),
                "skin",
              ).geometry.mesh,
              direction,
            );
      // Corneal contact must not redefine the gaze-independent outer seam.
      // Legacy support uses its reference sphere projection; separate canthal
      // support retains the observed anchors. Fade performed inner movement
      // to zero across either identity's tissue bridge.
      const apertureGuide: number[][] | undefined =
        identityGuide ??
        (canthal === undefined
          ? undefined
          : aperture.map((point: number[]): number[]  => [...point])) ??
        (contactBoundary === undefined && !shifted
          ? undefined
          : aperture.map((point: number[]): number[]  => [...point]));
      for (const id of loop) {
        const contact: Point = intersect(pointAt(id));
        if (apertureGuide !== undefined) {
          const guideContact: Point =
            canthal !== undefined
              ? p(
                  ...((identityGuide ?? aperture)[id] as [
                    number,
                    number,
                    number,
                  ]),
                )
              : identityGuide === undefined && !shifted
                ? contact
                : portraitEyeSphereIntersection(
                    fittedSphere,
                    p(
                      ...((identityGuide ?? aperture)[id] as [
                        number,
                        number,
                        number,
                      ]),
                    ),
                    direction,
                  );
          apertureGuide[id] = [guideContact.x, guideContact.y, guideContact.z];
        }
        if (contactBoundary === undefined)
          aperture[id] = [contact.x, contact.y, contact.z];
        else {
          const metric: Point = p(
            contact.x / 1000,
            contact.y / 1000,
            contact.z / 1000,
          );
          const boundary: Point = contactBoundary(metric);
          // A missed/clear sample keeps the original double coordinates
          // exactly, rather than introducing an unnecessary unit round trip.
          aperture[id] =
            boundary === metric
              ? [contact.x, contact.y, contact.z]
              : [boundary.x * 1000, boundary.y * 1000, boundary.z * 1000];
        }
      }
      // The outer eyelid attaches to the actual supporting skin. Its section
      // bridges that depth to the fitted ocular contact instead of extruding a flat
      // annulus from the aperture. The two boundaries keep distinct ownership.
      const support: (u: number, v: number) => { minimum: number; maximum: number; } | null = createAutoMovieMeshDepthSampler(
        createMetricMeshPart(
          "orbital-support-basis",
          {
            positions: host.positions.flat(),
            indices: host.indices,
            normals: null,
            uvs: null,
            skin: null,
          },
          "skin",
        ).geometry.mesh,
        "z",
      );
      const outerConstraints: { vertex: number; target: number[]; reach: number; }[] = portraitEyeLidRows(
        aperture,
        socket,
        shape,
        undefined,
        lowerProfile,
        apertureGuide,
        upperProfile,
      ).map((row: { id: number; outer: number[]; hoodUpper: number[]; hoodEdge: number[]; creaseOuter: number[]; creaseInner: number[]; tarsal: number[]; ridge: number[]; inner: number[]; }): { vertex: number; target: number[]; reach: number; }  => {
        const hit: { minimum: number; maximum: number; } | null = support(row.outer[0] / 1000, row.outer[1] / 1000);
        if (hit === null)
          throw new Error(
            "An eyelid's outer attachment must remain on supporting skin.",
          );
        return {
          vertex: row.id,
          target: [
            row.outer[0],
            row.outer[1],
            hit.maximum * 1000 + shape.socketLift * host.viewRay[2],
          ],
          reach: shape.blendReach,
        };
      });
      const cutFaces: number[] = selectHostFacesInsideLoop(host, loop);
      const reservation: { faces: number[]; boundary: number[]; } | undefined =
        shape.skinAttachment === undefined
          ? undefined
          : reservePortraitSkin(
              host,
              loop,
              outerConstraints.map((constraint: { vertex: number; target: number[]; reach: number; }): number[]  => constraint.target),
            );
      return {
        constraints: [
          // Internal seam targets still participate in shared ownership checks.
          // Zero reach prevents them from initiating a host deformation; simply
          // omitting them would hide a contradictory target from another part.
          ...(reservation === undefined
            ? outerConstraints
            : outerConstraints.map((constraint: { vertex: number; target: number[]; reach: number; }): { reach: number; vertex: number; target: number[]; }  => ({
                ...constraint,
                reach: 0,
              }))),
          { vertex: socket.iris, target: aperture[socket.iris], reach: 0 },
        ],
        cutFaces: reservation?.faces ?? cutFaces,
        attach: (cage: IControlMesh, _adapted: number[][], region: (id: string, material: string) => number): ReturnType<IPortraitComponentPlan["attach"]>  => {
          let bridge: number[] = [];
          let bridgePositions: number[][] = [];
          if (reservation !== undefined) {
            // The old aperture IDs are now wholly inside the removed patch.
            // Moving them cannot drag a remaining host triangle across the new
            // seam. Admit the actual post-adaptation annulus before mutating the
            // cage: another component may have moved its outer boundary.
            const targets: Map<number, number[]> = new Map(
              outerConstraints.map((constraint: { vertex: number; target: number[]; reach: number; }): [number, number[]]  => [
                constraint.vertex,
                constraint.target,
              ]),
            );
            bridge = portraitSkinAnnulus(
              cage.positions.map((point: number[], id: number): number[]  => targets.get(id) ?? point),
              reservation.boundary,
              loop,
            );
            if (shape.skinBridge === "sampled") {
              const refined: { positions: number[][]; indices: number[]; } = refinePortraitSkinBridge(
                cage.positions.map((point: number[], id: number): number[]  => targets.get(id) ?? point),
                bridge,
                (x: number, y: number): number  => {
                  const hit: { minimum: number; maximum: number; } | null = support(x / 1000, y / 1000);
                  if (hit === null)
                    throw new Error(
                      "Reserved orbital bridge must stay over its original skin support.",
                    );
                  return hit.maximum * 1000;
                },
              );
              bridge = refined.indices;
              bridgePositions = refined.positions.slice(cage.positions.length);
            }
            for (const { vertex, target } of outerConstraints)
              cage.positions[vertex] = [...target];
          }
          cage.positions.push(...bridgePositions);
          const lidGroup: number =
            shape.lidContact === "cornea"
              ? region(socket.name + "-eyelids", "skin")
              : 0;
          const margins: Map<number, number> = appendPortraitEyeMargins(
            cage,
            aperture,
            socket,
            shape,
            lidGroup,
            lowerProfile,
            apertureGuide,
            upperProfile,
          );
          for (let i: number = 0; i < bridge.length; i += 3) {
            cage.indices.push(...bridge.slice(i, i + 3));
            cage.groups.push(0);
          }
          return {
            openings: [portraitEyeLoop(socket).map((id: number): number  => margins.get(id)!)],
            closures:
              performance?.blink === 1 ? [margins.get(loop[0])!] : undefined,
            finalSurface:
              shape.lidContact !== "cornea"
                ? undefined
                : createPortraitEyeSurfaceContact({
                    iris: socket.iris,
                    sphere,
                    shape,
                    direction,
                    lidGroup,
                    performance,
                    canthal: canthal?.surface,
                  }),
            finish: (refined: IControlMesh): IAutoMovieModelPart[]  =>
              buildPortraitEye(
                refined.positions,
                refined,
                margins,
                host.viewRay,
                socket,
                shape,
                sphere,
                tissues,
                performance,
                lashReference === undefined
                  ? undefined
                  : (at: number): { from: Point; to: Point; }  => ({
                      from: Vector3.subtract(
                        interpolate(lashReference, at),
                        sphere.center,
                      ),
                      to: Vector3.subtract(
                        interpolate(lashCurrent!, at),
                        sphere.center,
                      ),
                    }),
                canthal,
              ),
          };
        },
      };
    },
  };
}
