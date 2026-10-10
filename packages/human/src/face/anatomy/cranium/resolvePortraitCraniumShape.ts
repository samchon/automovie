import { IPortraitCraniumShape } from "./structures/IPortraitCraniumShape";

/**
 * Resolve the cranial stations and cap controls into owned copies before the
 * assembler mutates its cage. Every length is in millimetres in the head frame
 * (+Y up, +Z anterior). Stations descend in Z from the forehead to the occiput;
 * omitted input takes the default vault, which is authored (four dimensioned
 * sections and three occipital rings whose crown and floor follow their width)
 * and is not a measurement of any subject.
 *
 * The posterior stations sit so that the default head length, from the basis's
 * glabella landmark (landmark 9 of the basis, at 59.5 mm on the unit test host)
 * to the rearmost point of the occipital cap, is 194.7 mm: the equal-weight mean of the female (189.8 mm,
 * n = 1986) and male (199.5 mm, n = 4082) `headlength` means of the ANSUR II
 * public data release, computed from its records. The earlier stations gave
 * 180 mm, 7% under that mean and two millimetres above the female fifth
 * percentile (178 mm). The
 * anterior section and the widths are unchanged: the widest section already
 * gives the same release's pooled head breadth (151 mm, both sex means 147.8 mm
 * and 154.3 mm). The depth behind the anterior station was scaled by 1.144.
 *
 * The host's actual chin, chinY, is added only to the floor of a station
 * marked chinRelative, so a lower envelope can follow the face it continues.
 * An invalid set refuses instead of being clipped: fewer than five or more than
 * 64 stations, Z that does not strictly descend, a crown Z posterior to its
 * station Z, a nonpositive width, a crown at or below its floor, a negative cap
 * depth, a transition outside (0,1) or a nonpositive angular frame.
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
      { z: -56.9, crownZ: -23.7, width: 77, crown: 139, floor: -74 },
      { z: -91.2, crownZ: -70.6, width: 67, crown: 127, floor: -60 },
      { z: -117.6, crownZ: -110.7, width: 46, crown: 91, floor: -38 },
      ...[
        [-124.4, 35],
        [-128.9, 26],
        [-131.3, 21],
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
