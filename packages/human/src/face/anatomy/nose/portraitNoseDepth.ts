import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Smooth nasal volume controls evaluated in the subject-owned socket frame.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Evaluates basic tip and alar volume within the declared nasal socket.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Adds signed tip and paired alar Gaussian relief using the caller's metric centres and support radii.
 */
export function portraitNoseDepth(
  point: number[],
  socket: IPortraitNoseSocket,
  shape: IPortraitNoseShape,
): number {
  const x = point[0] - socket.midline;
  const alar = Math.exp(
    -(((Math.abs(x) - socket.alarOffset) / socket.alarRadius) ** 2) -
      ((point[1] - socket.alarY) / socket.alarRadius) ** 2,
  );
  const tip = Math.exp(
    -((x / socket.tipRadius[0]) ** 2) -
      ((point[1] - socket.tipY) / socket.tipRadius[1]) ** 2,
  );
  return shape.alarProjection * alar + shape.tipProjection * tip;
}
