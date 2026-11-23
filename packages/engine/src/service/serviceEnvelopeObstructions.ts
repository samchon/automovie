import {
  IAutoMoviePropBox,
  type IAutoMovieServiceEnvelopeObstructions,
  IAutoMovieServiceNode,
} from "@automovie/interface";

import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { serviceMaintenanceBounds } from "./serviceMaintenanceBounds";

/**
 * Which nodes' maintenance envelopes a world volume intrudes on.
 *
 * This is the seam a prop, a piece of furniture or a second discipline is
 * compared through: hand it any axis-aligned world box — a staged prop's
 * occupancy bound, for instance — and it names the equipment that could no
 * longer be serviced. Contact alone is not intrusion, so a cabinet standing
 * exactly on the edge of an access zone is left alone. World metre boxes are
 * expected to be admitted. This query currently has no product caller and is
 * exercised only by service geometry tests.
 */
export const serviceEnvelopeObstructions: (
  props: IAutoMovieServiceEnvelopeObstructions.IProps,
) => string[] = (
  props: IAutoMovieServiceEnvelopeObstructions.IProps,
): string[] =>
  props.network.nodes
    .filter((node: IAutoMovieServiceNode): boolean => {
      const envelope: IAutoMoviePropBox | null = serviceMaintenanceBounds(node);
      return envelope !== null && propBoundsOverlap(props.bounds, envelope);
    })
    .map((node: IAutoMovieServiceNode): string => node.id);
