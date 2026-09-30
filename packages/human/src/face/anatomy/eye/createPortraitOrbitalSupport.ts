import { createAutoMovieMeshDepthSampler } from "@automovie/engine";

import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { createPortraitControlLayer } from "../../surface/createPortraitControlLayer";
import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitOrbitalSupportShape } from "./structures/IPortraitOrbitalSupportShape";

/**
 * Resolve an upper-orbit section group on resident skin. Every offset sample
 * first queries the actual surface height; the same point is then the control
 * solver's target. No hidden offset depth or independently guessed attachment
 * can attenuate the requested support before the common surface mask.
 *
 * This defines a compact displacement field over existing skin, not internal
 * bone anatomy or a complete volumetric tissue reconstruction. Open-lid masking
 * remains owned by the surface assembler; brow fibres consume the final skin.
 *
 * Distances are head millimetres (+Y superior, +Z anterior, +X anatomical
 * left) and the query skin is built in engine metres by the shared metric part
 * builder, so the surface height is read in metres and returned in millimetres
 * once per sample. Each station contributes three controls (forehead, brow and
 * sulcus) at heights measured from its retained brow datum, and the layer id is
 * `<side>-orbital-support`. One through 32 uniquely named stations, a positive
 * finite radius, an integral non-negative anchor, finite sections with positive
 * forehead height and sulcus descent, a datum that is not a finite triple, and
 * any sample that does not lie on supporting skin throw; the last is raised
 * when the fields are evaluated on a host.
 *
 * @evidence contracts/common.md#principled-implementation Each control's rest depth is the actual skin height at its sample point, queried from the host, and its displacement is the requested projection, so the solver receives a target on the real surface instead of an offset that a guessed depth could attenuate. Solving all stations as one group is what lets a stationary forehead sample constrain its neighbouring brow rather than receive a summed inflation. The result is a compact displacement field over existing skin, and the comment says it is not bone or a volumetric reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design One function validates a shape, samples the host skin for each control and delegates the displacement solve to the shared control-layer owner; it holds no state between hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The controls are a function of the shape and the host only; no subject or fixture is named, and a sample off the skin throws instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the layer is and is not, the two frames and the conversion, the controls per station, the id and every refusal and when it is raised.
 * @evidence contracts/modeling.md#spatial-conventions Distances are head millimetres in one right-handed frame; the metric skin sampler works in metres, and the conversion is the explicit division by 1000 on the query and multiplication on the hit, each named at the call.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits displacement fields and no primitive; the surface assembler owns the triangles.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the section values are the subject's.
 */
export function createPortraitOrbitalSupport(
  side: "left" | "right",
  input: IPortraitOrbitalSupportShape,
): IPortraitSurfaceLayer {
  const shape = structuredClone(input);
  if (
    (side !== "left" && side !== "right") ||
    shape.stations.length < 1 ||
    shape.stations.length > 32 ||
    new Set(shape.stations.map((s) => s.name)).size !== shape.stations.length ||
    !Number.isFinite(shape.radius) ||
    shape.radius / 1000 <= 0 ||
    shape.stations.some(
      (s) =>
        s.name.trim().length === 0 ||
        !Number.isInteger(s.anchor) ||
        s.anchor < 0 ||
        ![
          s.forehead.height,
          s.forehead.projection,
          s.browProjection,
          s.sulcus.descent,
          s.sulcus.projection,
        ].every(Number.isFinite) ||
        s.forehead.height <= 0 ||
        s.sulcus.descent <= 0,
    )
  )
    throw new Error(
      "Orbital support needs a side, distinct stations, finite sections and positive support distances.",
    );
  const id = `${side}-orbital-support`;
  return {
    id,
    fields: (host) => {
      for (const station of shape.stations) {
        const datum = host.positions[station.anchor];
        if (
          datum === undefined ||
          datum.length !== 3 ||
          !datum.every(Number.isFinite)
        )
          throw new Error(
            "Orbital support requires a finite resident brow datum.",
          );
      }
      const skin = createAutoMovieMeshDepthSampler(
        createMetricMeshPart(
          "orbital-section-basis",
          {
            positions: host.positions.flat(),
            indices: [...host.indices],
            normals: null,
            uvs: null,
            skin: null,
          },
          "skin",
        ).geometry.mesh,
        "z",
      );
      const controls = shape.stations.flatMap((station) => {
        const datum = host.positions[station.anchor];
        return (
          [
            ["forehead", station.forehead.height, station.forehead.projection],
            ["brow", 0, station.browProjection],
            ["sulcus", -station.sulcus.descent, station.sulcus.projection],
          ] as const
        ).map(([role, offset, projection]) => {
          const y = datum[1] + offset;
          const hit = skin(datum[0] / 1000, y / 1000);
          if (hit === null)
            throw new Error(
              "Every orbital section sample must lie on supporting skin.",
            );
          return {
            name: `${station.name}/${role}`,
            anchor: station.anchor,
            offset: [0, offset, hit.maximum * 1000 - datum[2]],
            displacement: [0, 0, projection],
          };
        });
      });
      return createPortraitControlLayer(id, shape.radius, controls).fields(
        host,
      );
    },
  };
}
