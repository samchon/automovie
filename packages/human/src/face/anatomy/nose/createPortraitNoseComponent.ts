import type {
  IControlMesh as ImportedIControlMesh,
  IPortraitComponentHost as ImportedIPortraitComponentHost,
} from "@automovie/human";

import { orderCutPatchBoundary } from "../../mesh/orderCutPatchBoundary";
import { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { appendPortraitNostrils } from "./appendPortraitNostrils";
import { createPortraitNasalSupport } from "./createPortraitNasalSupport";
import { fitPortraitNostrilRim } from "./fitPortraitNostrilRim";
import { portraitNoseDepth } from "./portraitNoseDepth";
import { resizePortraitNostrilRim } from "./resizePortraitNostrilRim";
import { resolvePortraitNoseShape } from "./resolvePortraitNoseShape";
import { resolvePortraitNoseSocket } from "./resolvePortraitNoseSocket";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Build one replaceable nose against the host's declared nasal attachment.
 *
 * The socket (host attachments, in millimetres of the head frame: +X anatomical left, +Y up, +Z anterior) and the shape are admitted and copied here, and `fit` later reads the actual host. Every shape input is a named nasal measurement (widths and projections in millimetres, aperture scales, an aperture tilt in degrees), never a vertex, curve or patch. Fitting proceeds in one order: resolve one depth field (support-plane projection scale, tip and alar relief) and use it for both the exterior targets and the pre-fit aperture samples; regularize, resize, rotate and raise each opening about its own fitted centre, so the rim and its lining share one frame. `attach` runs after host subdivision and adds the lining, whose rim vertices are the fitted opening's own, so skin and lining cannot separate.
 *
 * A refused shape or socket throws before any geometry exists; the caller's inputs are never mutated. The lining is a geometric hypothesis, not a measured airway, and no likeness is claimed.
 *
 * @evidence contracts/common.md#principled-implementation Admitted copied socket/shape share one depth field, fitted resized rims and lining attachment identity.
 * @evidence contracts/common.md#clear-and-simple-design Width/depth/alar/tip and aperture transformations run in explicit stages before adjacent skin constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Euclidean distance blending and inverse-square rim residual spread do not prove surface injectivity or a measured airway; geometry admission/visual observation remain separate.
 * @evidence contracts/common.md#meaningful-documentation Head millimetres, degree tilt and dimensionless scale controls preserve the same fitted aperture/lining frame.
 * @evidence contracts/performance.md#efficient-algorithms Work includes pinned-to-free vertex comparisons, quadratic rim fitting and surface-times-rim residual blending before linear attachment.
 * @evidence contracts/performance.md#reuse-equivalent-work One support/depth evaluator serves exterior and rim samples, and maps reuse fitted targets instead of refitting during attachment.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The component owns copied profiles; fit maps are local and attach intentionally mutates only the caller's assembled cage.
 */
export function createPortraitNoseComponent(
  inputSocket: IPortraitNoseSocket,
  inputShape: IPortraitNoseShape,
): IPortraitComponent {
  const socket: IPortraitNoseSocket = resolvePortraitNoseSocket(inputSocket);
  const shape: IPortraitNoseShape & { cavityOffset: number[] } =
    resolvePortraitNoseShape(inputShape);
  return {
    id: "nose",
    fit: (
      host: ImportedIPortraitComponentHost,
    ): {
      constraints: { vertex: number; target: number[]; reach: number }[];
      cutFaces: number[];
      attach: (
        cage: ImportedIControlMesh,
        _adapted: number[][],
        region: (id: string, material: string) => number,
      ) => { openings: never[]; finish: () => never[] };
    } => {
      const supportIds: readonly number[] = socket.supportPlane ?? [];
      const scaled: boolean = (shape.depthScale ?? 1) !== 1;
      if (
        scaled &&
        supportIds.some(
          (id: number): boolean =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Nasal support plane must name resident skin datums.");
      const support: (point: readonly number[]) => number =
        createPortraitNasalSupport(
          scaled
            ? supportIds.map((id: number): number[] => host.positions[id])
            : [],
          shape.depthScale,
        );
      // One depth evaluator owns both exterior targets and pre-fit aperture
      // samples; the lining later reads the actual fitted rim, so it cannot
      // retain a stale basis.
      const depth: (point: number[]) => number = (point: number[]): number =>
        support(point) + portraitNoseDepth(point, socket, shape);
      const openings: number[][][] = socket.nostrils.map(
        (ordinals: number[]): number[][] =>
          ordinals.map((i: number): number[] =>
            host.indices.slice(3 * i, 3 * i + 3),
          ),
      );
      // Width scales the nose about its midline where the nasal structures
      // lie and fades to identity toward the attachment boundary. A jump from
      // full scale to none at the boundary would need the surrounding skin to
      // absorb the whole lateral displacement, which folds it. The fade runs
      // over the subject's skin-adaptation reach, measured from the nearest
      // skin the component does not pin. Smoothstep makes the displacement
      // derivative vanish at each end of the fade; it does not bound the
      // interior derivative or prove that the fitted skin cannot fold. The
      // openings themselves widen by the full stated ratio.
      const pinned: Set<number> = new Set<number>(socket.surface);
      for (const faces of openings)
        for (const face of faces) for (const id of face) pinned.add(id);
      const free: number[][] =
        shape.widthScale === 1
          ? []
          : host.positions.filter(
              (_p: number[], id: number): boolean => !pinned.has(id),
            );
      const clearance: (point: number[]) => number = (
        point: number[],
      ): number =>
        free.length === 0
          ? Infinity
          : Math.min(
              ...free.map((q: number[]): number =>
                Math.hypot(
                  ...point.map((v: number, i: number): number => v - q[i]),
                ),
              ),
            );
      const widening: (id: number) => number = (id: number): number => {
        const t: number =
          shape.blendReach > 0
            ? Math.min(1, clearance(host.positions[id]) / shape.blendReach)
            : 1;
        return 1 + (shape.widthScale - 1) * t * t * (3 - 2 * t);
      };
      const targets: Map<number, number[]> = new Map<number, number[]>();
      for (const id of socket.surface) {
        const point: number[] = host.positions[id];
        targets.set(id, [
          socket.midline + (point[0] - socket.midline) * widening(id),
          point[1],
          point[2] + depth(point),
        ]);
      }
      const rimDelta: Map<number, number[]> = new Map<number, number[]>();
      for (const faces of openings) {
        const ids: number[] = orderCutPatchBoundary(faces).map(
          (edge: { a: number; b: number }): number => edge.a,
        );
        const fitted: number[][] = fitPortraitNostrilRim(
          ids.map((id: number): number[] => [
            host.positions[id][0],
            host.positions[id][1],
            host.positions[id][2] + depth(host.positions[id]),
          ]),
          shape.rimRoundness,
        );
        const rim: number[][] = resizePortraitNostrilRim(
          fitted,
          shape.nostrilWidthScale,
          shape.nostrilHeightScale,
        );
        const center: number[] = [0, 1, 2].map(
          (axis: number): number =>
            ids.reduce(
              (sum: number, id: number): number =>
                sum + host.positions[id][axis],
              0,
            ) / ids.length,
        );
        // Rotate about the fitted opening centre, including the nasal volume
        // edit. The rim and its lining must use the same anatomical frame.
        const centerZ: number =
          ids.reduce(
            (sum: number, id: number): number =>
              sum + host.positions[id][2] + depth(host.positions[id]),
            0,
          ) / ids.length;
        const angle: number = (shape.nostrilTilt * Math.PI) / 180;
        for (let vertex: number = 0; vertex < ids.length; vertex++) {
          const id: number = ids[vertex],
            point: number[] = rim[vertex];
          const y: number = point[1] - center[1];
          const z: number = point[2] - centerZ;
          const edited: number[] = [
            socket.midline + (point[0] - socket.midline) * shape.widthScale,
            center[1] +
              shape.nostrilRise +
              y * Math.cos(angle) -
              z * Math.sin(angle),
            centerZ + y * Math.sin(angle) + z * Math.cos(angle),
          ];
          // What this opening's edit moved the rim by, relative to the rim
          // as the volume edits alone leave it.
          const unedited: number[] = [
            socket.midline +
              (fitted[vertex][0] - socket.midline) * shape.widthScale,
            fitted[vertex][1],
            fitted[vertex][2],
          ];
          rimDelta.set(
            id,
            edited.map((v: number, axis: number): number => v - unedited[axis]),
          );
          targets.set(id, edited);
        }
      }
      // The rim's move is spread into the pinned skin around it, decaying to
      // nothing over the adaptation reach. Left pinned in place, that skin
      // would be turned over by a rim that moves farther than one edge, which
      // renders as a thin blade across the opening. Spreading the move reduces
      // this jump but does not establish injectivity of the fitted surface;
      // admission must inspect that surface independently.
      if (shape.blendReach > 0 && rimDelta.size !== 0)
        for (const id of socket.surface) {
          if (rimDelta.has(id)) continue;
          let nearest: number = Infinity;
          let sum: number[] = [0, 0, 0],
            weight: number = 0;
          for (const [rimId, delta] of rimDelta) {
            const distance: number = Math.hypot(
              ...host.positions[id].map(
                (v: number, i: number): number => v - host.positions[rimId][i],
              ),
            );
            nearest = Math.min(nearest, distance);
            const w: number = 1 / Math.max(distance * distance, 1e-12);
            sum = sum.map((v: number, i: number): number => v + w * delta[i]);
            weight += w;
          }
          const t: number = Math.max(0, 1 - nearest / shape.blendReach);
          const fade: number = t * t * (3 - 2 * t);
          if (fade === 0) continue;
          const target: number[] = targets.get(id)!;
          targets.set(
            id,
            target.map(
              (v: number, i: number): number => v + (fade * sum[i]) / weight,
            ),
          );
        }
      return {
        constraints: [...targets].map(
          ([vertex, target]: [number, number[]]): {
            vertex: number;
            target: number[];
            reach: number;
          } => ({
            vertex,
            target,
            reach: shape.blendReach,
          }),
        ),
        cutFaces: socket.nostrils.flat(),
        attach: (
          cage: ImportedIControlMesh,
          _adapted: number[][],
          region: (id: string, material: string) => number,
        ): { openings: never[]; finish: () => never[] } => {
          // The exterior skin and the vestibular lining share the actual
          // fitted rim ids, so an aperture edit moves both together.
          appendPortraitNostrils(
            cage,
            openings,
            shape,
            region("nostril-interiors", "nasal-interior"),
          );
          return { openings: [], finish: (): never[] => [] };
        },
      };
    },
  };
}
