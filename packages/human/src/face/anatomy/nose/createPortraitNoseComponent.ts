import { orderCutPatchBoundary } from "../../mesh/orderCutPatchBoundary";
import { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { appendPortraitNostrils } from "./appendPortraitNostrils";
import { createPortraitNasalSupport } from "./createPortraitNasalSupport";
import { fitPortraitNostrilRim } from "./fitPortraitNostrilRim";
import { portraitNoseDepth } from "./portraitNoseDepth";
import { resizePortraitNostrilRim } from "./resizePortraitNostrilRim";
import { resolvePortraitNoseShape } from "./resolvePortraitNoseShape";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Build one replaceable nose against the host's declared nasal attachment.
 *
 * The socket (host attachments, in millimetres of the head frame: +X anatomical
 * left, +Y up, +Z anterior) and the shape are copied and admitted here, and
 * `fit` later reads the actual host. Every shape input is a named nasal
 * measurement (widths and projections in millimetres, aperture scales, an
 * aperture tilt in degrees), never a vertex, curve or patch. Fitting proceeds
 * in one order: resolve one depth field (support-plane projection scale, tip
 * and alar relief) and use it for both the exterior targets and the pre-fit
 * aperture samples; regularize, resize, rotate and raise each opening about its
 * own fitted centre, so the rim and its lining share one frame. `attach` runs
 * after host subdivision and adds the lining, whose rim vertices are the fitted
 * opening's own, so skin and lining cannot separate.
 *
 * A refused shape or socket throws before any geometry exists; the caller's
 * inputs are never mutated. The lining is a geometric hypothesis, not a
 * measured airway, and no likeness is claimed.
 */
export function createPortraitNoseComponent(
  inputSocket: IPortraitNoseSocket,
  inputShape: IPortraitNoseShape,
): IPortraitComponent {
  const socket = {
    ...inputSocket,
    tipRadius: [...inputSocket.tipRadius] as [number, number],
    surface: [...inputSocket.surface],
    nostrils: inputSocket.nostrils.map((faces) => [...faces]),
    supportPlane:
      inputSocket.supportPlane === undefined
        ? undefined
        : [...inputSocket.supportPlane],
  };
  const shape = resolvePortraitNoseShape(inputShape);
  return {
    id: "nose",
    fit: (host) => {
      const supportIds = socket.supportPlane ?? [];
      const scaled = (shape.depthScale ?? 1) !== 1;
      if (
        scaled &&
        supportIds.some(
          (id) =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Nasal support plane must name resident skin datums.");
      const support = createPortraitNasalSupport(
        scaled ? supportIds.map((id) => host.positions[id]) : [],
        shape.depthScale,
      );
      // One depth evaluator owns both exterior targets and pre-fit aperture
      // samples; the lining later reads the actual fitted rim, so it cannot
      // retain a stale basis.
      const depth = (point: number[]): number =>
        support(point) + portraitNoseDepth(point, socket, shape);
      const openings = socket.nostrils.map((ordinals) =>
        ordinals.map((i) => host.indices.slice(3 * i, 3 * i + 3)),
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
      const pinned = new Set<number>(socket.surface);
      for (const faces of openings)
        for (const face of faces) for (const id of face) pinned.add(id);
      const free =
        shape.widthScale === 1
          ? []
          : host.positions.filter((_p, id) => !pinned.has(id));
      const clearance = (point: number[]): number =>
        free.length === 0
          ? Infinity
          : Math.min(...free.map((q) => Math.hypot(...point.map((v, i) => v - q[i]))));
      const widening = (id: number): number => {
        const t =
          shape.blendReach > 0
            ? Math.min(1, clearance(host.positions[id]) / shape.blendReach)
            : 1;
        return 1 + (shape.widthScale - 1) * t * t * (3 - 2 * t);
      };
      const targets = new Map<number, number[]>();
      for (const id of socket.surface) {
        const point = host.positions[id];
        targets.set(id, [
          socket.midline + (point[0] - socket.midline) * widening(id),
          point[1],
          point[2] + depth(point),
        ]);
      }
      const rimDelta = new Map<number, number[]>();
      for (const faces of openings) {
        const ids = orderCutPatchBoundary(faces).map((edge) => edge.a);
        const fitted = fitPortraitNostrilRim(
          ids.map((id) => [
            host.positions[id][0],
            host.positions[id][1],
            host.positions[id][2] + depth(host.positions[id]),
          ]),
          shape.rimRoundness,
        );
        const rim = resizePortraitNostrilRim(
          fitted,
          shape.nostrilWidthScale,
          shape.nostrilHeightScale,
        );
        const center = [0, 1, 2].map(
          (axis) =>
            ids.reduce((sum, id) => sum + host.positions[id][axis], 0) /
            ids.length,
        );
        // Rotate about the fitted opening centre, including the nasal volume
        // edit. The rim and its lining must use the same anatomical frame.
        const centerZ =
          ids.reduce(
            (sum, id) =>
              sum + host.positions[id][2] + depth(host.positions[id]),
            0,
          ) / ids.length;
        const angle = (shape.nostrilTilt * Math.PI) / 180;
        for (let vertex = 0; vertex < ids.length; vertex++) {
          const id = ids[vertex],
            point = rim[vertex];
          const y = point[1] - center[1];
          const z = point[2] - centerZ;
          const edited = [
            socket.midline + (point[0] - socket.midline) * shape.widthScale,
            center[1] +
              shape.nostrilRise +
              y * Math.cos(angle) -
              z * Math.sin(angle),
            centerZ + y * Math.sin(angle) + z * Math.cos(angle),
          ];
          // What this opening's edit moved the rim by, relative to the rim
          // as the volume edits alone leave it.
          const unedited = [
            socket.midline + (fitted[vertex][0] - socket.midline) * shape.widthScale,
            fitted[vertex][1],
            fitted[vertex][2],
          ];
          rimDelta.set(id, edited.map((v, axis) => v - unedited[axis]));
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
          let nearest = Infinity;
          let sum = [0, 0, 0],
            weight = 0;
          for (const [rimId, delta] of rimDelta) {
            const distance = Math.hypot(
              ...host.positions[id].map((v, i) => v - host.positions[rimId][i]),
            );
            nearest = Math.min(nearest, distance);
            const w = 1 / Math.max(distance * distance, 1e-12);
            sum = sum.map((v, i) => v + w * delta[i]);
            weight += w;
          }
          const t = Math.max(0, 1 - nearest / shape.blendReach);
          const fade = t * t * (3 - 2 * t);
          if (fade === 0) continue;
          const target = targets.get(id)!;
          targets.set(
            id,
            target.map((v, i) => v + (fade * sum[i]) / weight),
          );
        }
      return {
        constraints: [...targets].map(([vertex, target]) => ({
          vertex,
          target,
          reach: shape.blendReach,
        })),
        cutFaces: socket.nostrils.flat(),
        attach: (cage, _adapted, region) => {
          // The exterior skin and the vestibular lining share the actual
          // fitted rim ids, so an aperture edit moves both together.
          appendPortraitNostrils(
            cage,
            openings,
            shape,
            region("nostril-interiors", "nasal-interior"),
          );
          return { openings: [], finish: () => [] };
        },
      };
    },
  };
}
