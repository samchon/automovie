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
      const targets = new Map<number, number[]>();
      for (const id of socket.surface) {
        const point = host.positions[id];
        targets.set(id, [
          socket.midline + (point[0] - socket.midline) * shape.widthScale,
          point[1],
          point[2] + depth(point),
        ]);
      }
      for (const faces of openings) {
        const ids = orderCutPatchBoundary(faces).map((edge) => edge.a);
        const rim = resizePortraitNostrilRim(
          fitPortraitNostrilRim(
            ids.map((id) => [
              host.positions[id][0],
              host.positions[id][1],
              host.positions[id][2] + depth(host.positions[id]),
            ]),
            shape.rimRoundness,
          ),
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
          targets.set(id, [
            socket.midline + (point[0] - socket.midline) * shape.widthScale,
            center[1] +
              shape.nostrilRise +
              y * Math.cos(angle) -
              z * Math.sin(angle),
            centerZ + y * Math.sin(angle) + z * Math.cos(angle),
          ]);
        }
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
