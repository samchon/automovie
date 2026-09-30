import { IPortraitCraniumShape } from "./structures/IPortraitCraniumShape";

/**
 * Resolve the cranial stations and cap controls into owned copies before the
 * assembler mutates its cage. Every length is in millimetres in the head frame
 * (+Y up, +Z anterior). Stations descend in Z from the forehead to the occiput;
 * omitted input takes the default vault, which is authored (four dimensioned
 * sections and three occipital rings whose crown and floor follow their width)
 * and is not a measurement of any subject.
 *
 * The host's actual chin, chinY, is added only to the floor of a station
 * marked chinRelative, so a lower envelope can follow the face it continues.
 * An invalid set refuses instead of being clipped: fewer than five or more than
 * 64 stations, Z that does not strictly descend, a crown Z posterior to its
 * station Z, a nonpositive width, a crown at or below its floor, a negative cap
 * depth, a transition outside (0,1) or a nonpositive angular frame.
 *
 * @evidence contracts/common.md#principled-implementation Resolution copies the stations, adds the host's chin height only to stations marked chinRelative and checks the ordering premises the builder relies on (strictly descending Z, crown Z not posterior to its station, positive width, crown above floor, five to 64 stations, cap depth, transition in (0,1), positive frame), so the ring lattice built from them is well ordered.
 * @evidence contracts/common.md#clear-and-simple-design One function that merges input over the default vault and checks the merged result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid set refuses and is never clipped; the default stations are documented defaults, not a special case for any subject.
 * @evidence contracts/common.md#meaningful-documentation States the units and frame, the descending order, that the default is authored, the chin-relative rule and each refusal.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres with +Y up and +Z anterior; chinY is read in the same frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping resolvePortraitCraniumShape is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry resolvePortraitCraniumShape emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries resolvePortraitCraniumShape constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation resolvePortraitCraniumShape owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function resolvePortraitCraniumShape(
  chinY: number,
  input: IPortraitCraniumShape = {},
) {
  const stations = structuredClone(
    input.stations ?? [
      {
        z: -18,
        crownZ: 20,
        width: 75,
        crown: 125,
        floor: -4.5,
        chinRelative: true,
      },
      { z: -52, crownZ: -23, width: 77, crown: 139, floor: -74 },
      { z: -82, crownZ: -64, width: 67, crown: 127, floor: -60 },
      { z: -105, crownZ: -99, width: 46, crown: 91, floor: -38 },
      ...[
        [-111, 35],
        [-115, 26],
        [-117, 21],
      ].map(([z, width]) => ({
        z,
        crownZ: z,
        width,
        crown: 26.5 + 1.4 * width,
        floor: 26.5 - 1.4 * width,
      })),
    ],
  ).map(({ chinRelative, ...station }) => ({
    ...station,
    floor: station.floor + (chinRelative ? chinY : 0),
  }));
  const capDepth = input.capDepth ?? 4;
  const transition = input.transition ?? 0.3;
  const frame = { ...(input.frame ?? { width: 71, height: 79, centerY: 5 }) };
  if (
    ![
      chinY,
      capDepth,
      transition,
      frame.width,
      frame.height,
      frame.centerY,
    ].every(Number.isFinite) ||
    capDepth < 0 ||
    transition <= 0 ||
    transition >= 1 ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    stations.length < 5 ||
    stations.length > 64 ||
    stations.some(
      (station, index) =>
        ![
          station.z,
          station.crownZ,
          station.width,
          station.crown,
          station.floor,
        ].every(Number.isFinite) ||
        station.width <= 0 ||
        station.crown <= station.floor ||
        station.crownZ < station.z ||
        (index > 0 && station.z >= stations[index - 1].z),
    )
  )
    throw new Error(
      "Cranium needs finite ordered sections, positive widths and heights, and a valid transition frame.",
    );
  return { stations, capDepth, transition, frame };
}
