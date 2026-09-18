import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/**
 * The canonical pointer addressing one light's property.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Encodes one authored light-property address by stable light identity.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Produces the canonical address shared by authored light-channel branches.
 */
export const formatLightPointer = (
  light: string,
  property: AutoMovieLightProperty,
): string => `/lights/${escapePointerSegment(light)}/${property}`;
