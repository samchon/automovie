import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import { readHumanFaceLashGeometry } from "./readHumanFaceLashGeometry";

/**
 * Eyelash shaft measurements, distinct from band darkness and card coverage.
 * A build without generated shafts retains the source-card instrument gap.
 *
 * @author Samchon
 */
export const HUMAN_FACE_LASH_MEASUREMENTS: readonly IHumanFaceMeasurement[] = [
  {
    id: "eyelash.left.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing clinical instrument: the read central-2-mm caliper protocol is not implemented on the generated shaft population; sampled centreline length is a separate output quantity",
      };
    },
  },
  {
    id: "eyelash.left.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing clinical instrument: the read central-2-mm caliper protocol is not implemented on the generated shaft population; sampled centreline length is a separate output quantity",
      };
    },
  },
  {
    id: "eyelash.right.upper.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing clinical instrument: the read central-2-mm caliper protocol is not implemented on the generated shaft population; sampled centreline length is a separate output quantity",
      };
    },
  },
  {
    id: "eyelash.right.lower.longestCentralLength",
    unit: "millimetres",
    channels: [],
    read: () => {
      return {
        reason:
          "missing clinical instrument: the read central-2-mm caliper protocol is not implemented on the generated shaft population; sampled centreline length is a separate output quantity",
      };
    },
  },
  ...(["left", "right"] as const).flatMap((side) =>
    (["upper", "lower"] as const).flatMap((row) => [
      {
        id: `eyelash.${side}.${row}.shaftCount`,
        unit: "count" as const,
        channels: [],
        qualification:
          "Connected components of generated free-shaft geometry; not a measured biological follicle population.",
        read: (context: Parameters<typeof readHumanFaceLashGeometry>[0]) =>
          readHumanFaceLashGeometry(context, side, row, "shaftCount"),
      },
      {
        id: `eyelash.${side}.${row}.longestSampledCentrelineLength`,
        unit: "millimetres" as const,
        channels: [],
        qualification:
          "Float32 sampled tube centreline length, a tessellation-dependent lower approximation to the analytic arc; not a caliper protocol.",
        read: (context: Parameters<typeof readHumanFaceLashGeometry>[0]) =>
          readHumanFaceLashGeometry(
            context,
            side,
            row,
            "longestSampledCentrelineLength",
          ),
      },
    ]),
  ),
];
