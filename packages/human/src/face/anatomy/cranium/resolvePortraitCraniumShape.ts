import { IPortraitCraniumShape } from "./structures/IPortraitCraniumShape";

/**
 * Resolve copied cranial sections before the assembler mutates its cage.
 * The host's actual chin sets only explicitly chin-relative lower envelopes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves omission and complete section replacement, refusing invalid final envelopes.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Checks finite dimensions, section order and envelope bounds without clipping input.
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
