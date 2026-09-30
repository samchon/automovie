import type { portraitDiagnosticsReview } from "./diagnostics-review";
import type { portraitIrisReview } from "./iris-review";
import type { portraitNasalReview } from "./nasal-review";
import type { portraitOcularReview } from "./ocular-review";
import type { portraitOralReview } from "./oral-review";
import type { portraitStudyReview } from "./study-review";
import type { portraitSurfaceReview } from "./surface-review";

/**
 * Partial construction-source account. Individual notes retain the explicitly
 * named historical capture that was inspected; a historical observation is not
 * a current-source attestation. In particular, the b3306ba5 patch/fairing notes
 * predate late source insertion and XYZ tangent-row fairing and need a renewed
 * literal source review. Current image observations belong to review.md.
 * Relationships remain recorded while review fingerprints are removed.
 * Missing coverage now warns; this intermediate account does
 * not claim whole-source or likeness acceptance.
 *
 * @evidence {@link portraitOcularReview} Retains optical identity, lids, lashes and brows inspections within the complete construction account.
 * @evidence {@link portraitNasalReview} Retains external nasal body, aperture sections and shared nasal attachment inspections within the complete construction account.
 * @evidence {@link portraitOralReview} Retains lips, oral enclosure, tongue, teeth and mandibular performance inspections within the complete construction account.
 * @evidence {@link portraitSurfaceReview} Retains shared topology, skin, cranium, materials and model export inspections within the complete construction account.
 * @evidence {@link portraitStudyReview} Retains frozen measurements, recipes, fitted construction and attributed alternatives inspections within the complete construction account.
 * @evidence {@link portraitDiagnosticsReview} Retains capture identities, fit bases and historical join diagnostics inspections within the complete construction account.
 * @evidence {@link portraitIrisReview} Retains the connected iris pigment source inspection within the complete construction account.
 */
export const portraitReview = {
  directory: ".shots/face-experiment/preview",
  sourceCommit: "ac1145b0",
  gltfSha256:
    "49c90e9d61b6e0ec3004630d86cace7eebe096ca7228466cb28f9b7ffb5198cb",
  profileSha256:
    "d682354f6c1be6500f66cd7783f27e0554aa8bfa5ea396daa49a334ea1588145",
};
