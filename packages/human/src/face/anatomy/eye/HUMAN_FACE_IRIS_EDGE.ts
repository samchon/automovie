/**
 * Half-width of the anti-aliased limbal and pupillary edges of a painted iris,
 * radians of polar angle (0.3 degrees, about one texel of a 1024 texture's
 * iris).
 *
 * Texture preparation widens its raster margin and the sclera sampling ring by
 * this width, and the pigment rule blends across it, so both stages agree on
 * where the painted edge lies.
 *
 * @author Samchon
 */
export const HUMAN_FACE_IRIS_EDGE = (0.3 * Math.PI) / 180;
