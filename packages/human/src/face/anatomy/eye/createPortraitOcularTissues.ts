import type { IAutoMovieMesh } from "@automovie/interface";
import { portraitMix } from "../../mesh/portraitMix";
import { portraitPoint } from "../../mesh/portraitPoint";
import { portraitPatch } from "../../mesh/portraitPatch";
import { IPortraitOcularTissueBoundary } from "./structures/IPortraitOcularTissueBoundary";
import { IPortraitOcularTissueShape } from "./structures/IPortraitOcularTissueShape";

/**
 * Own a tissue profile and build both surfaces in one live ocular frame.
 * The medial mound and lateral plica share a patch between the actual lids;
 * neither is a floating sphere with an independently guessed attachment.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs caruncular/plica relief and a lower wet margin within the actual eye opening.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Copies nonnegative tissue settings, checks live lid/support samples and bounds the lower strip to half the local aperture.
 */
export const createPortraitOcularTissues = (
  input: IPortraitOcularTissueShape,
): ((boundary: IPortraitOcularTissueBoundary) => {
  corner: IAutoMovieMesh | null;
  lowerMargin: IAutoMovieMesh | null;
}) => {
  const shape = { ...input };
  if (
    Object.values(shape).some((value) => !Number.isFinite(value) || value < 0)
  )
    throw new Error("Ocular tissue dimensions must be finite and nonnegative.");
  return (boundary) => {
    const span = boundary.maximumX - boundary.minimumX;
    if (
      ![boundary.minimumX, boundary.maximumX, span].every(Number.isFinite) ||
      span <= 0 ||
      shape.cornerLength > span / 2
    )
      throw new Error(
        "Ocular tissue needs an ordered aperture and a medial half-width fit.",
      );
    const section = (x: number) => {
      const lower = boundary.lower(x),
        upper = boundary.upper(x);
      if (
        ![lower.x, lower.y, lower.z, upper.x, upper.y, upper.z].every(
          Number.isFinite,
        ) ||
        upper.y < lower.y
      )
        throw new Error("Ocular tissue requires finite, ordered lid samples.");
      return { lower, upper };
    };
    const globe = (x: number, y: number): number => {
      const z = boundary.globe(x, y);
      if (!Number.isFinite(z))
        throw new Error("Ocular tissue requires a finite globe surface.");
      return z;
    };
    const corner =
      shape.cornerLength === 0
        ? null
        : portraitPatch(
            (u, v) => {
              // Both meshes retain increasing X, hence outward (+Z) winding. The
              // anatomical side changes distance from the medial corner, not winding.
              const x =
                boundary.side === "left"
                  ? boundary.minimumX + shape.cornerLength * u
                  : boundary.maximumX - shape.cornerLength * (1 - u);
              const distance = boundary.side === "left" ? u : 1 - u;
              const { lower, upper } = section(x);
              const y = portraitMix(lower.y, upper.y, v);
              const across = Math.sin(Math.PI * v) ** 2;
              const along = Math.sin(Math.PI * distance) ** 2;
              // The caruncle occupies the medial body; the narrower plica crest sits
              // laterally at 82% of the same region. Their envelopes vanish at the lids
              // and at the scleral join. These fractions define this procedural shape,
              // not population statistics. A zero projection retains a flat tissue mask.
              const caruncle = Math.exp(-(((distance - 0.42) / 0.26) ** 2));
              const plica = Math.exp(-(((distance - 0.82) / 0.08) ** 2));
              const rim = portraitMix(lower.z, upper.z, v);
              const z =
                portraitMix(rim, globe(x, y), across) +
                across *
                  along *
                  (0.02 +
                    shape.caruncleProjection * caruncle +
                    shape.plicaProjection * plica);
              return portraitPoint(x, y, z);
            },
            32,
            12,
          );
    const lowerMargin =
      shape.lowerMarginWidth === 0
        ? null
        : portraitPatch(
            (u, v) => {
              const x = portraitMix(boundary.minimumX, boundary.maximumX, u);
              const { lower, upper } = section(x);
              const fade = Math.sin(Math.PI * u);
              // Never span more than half the local aperture. This also closes the
              // strip at both shared canthi and keeps narrow replacement eyes valid.
              const width = Math.min(
                shape.lowerMarginWidth * fade,
                (upper.y - lower.y) / 2,
              );
              const y = lower.y + width * v;
              const z =
                portraitMix(lower.z, globe(x, y), v) +
                shape.lowerMarginLift * fade * Math.sin(Math.PI * v);
              return portraitPoint(x, y, z);
            },
            80,
            4,
          );
    return { corner, lowerMargin };
  };
};
