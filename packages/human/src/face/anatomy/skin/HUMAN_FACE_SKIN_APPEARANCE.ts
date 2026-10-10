import type { IAutoMovieHumanFaceStylingDescriptor } from "../../structures/IAutoMovieHumanFaceStylingDescriptor";

/**
 * Numerical styling domains consumed by the connected product editor.
 * These entries mirror the established runtime admission, including open bounds
 * and dependencies; they supply no clinical interval or universal neutral.
 * Current values come from the owning document reader or an identity skin gain.
 */
export const HUMAN_FACE_SKIN_APPEARANCE: readonly IAutoMovieHumanFaceStylingDescriptor[] =
  [
    {
      path: ["gain", "0"],
      label: "Skin red gain",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      qualification:
        "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity.",
    },
    {
      path: ["gain", "1"],
      label: "Skin green gain",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      qualification:
        "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity.",
    },
    {
      path: ["gain", "2"],
      label: "Skin blue gain",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      qualification:
        "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity.",
    },
    {
      path: ["strength"],
      label: "Regional gain strength",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Zero preserves source appearance. Membership belongs to a registered continuous skin area.",
    },
  ];
