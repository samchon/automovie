import type * as Capture from "../captureProfile";
import type * as CaptureDiagnostic from "../portraitCaptureDiagnostic";
import type * as FitBasis from "../portraitFitBasis";
import type * as JoinReference from "../portraitJoinReference";
import type * as JoinTangency from "../portraitJoinTangency";
import type * as MeshPatch from "../portraitMeshPatch";
import type * as PatchAttachment from "../portraitPatchAttachment";
import type * as Fairing from "../portraitSurfaceFairing";
import type * as SurfaceFit from "../portraitSurfaceFit";
import type * as JoinRefinement from "../refinePortraitJoin";
import type * as RimReplacement from "../replacePortraitRim";
import type * as Quads from "../subdividePortraitQuads";

/**
 * Capture identities, fit bases and historical join diagnostics.
 * The frozen study root retains this domain through the native evidence graph.
 * Existing source inspections and historical capture limitations are preserved
 * verbatim. This carrier neither changes geometry nor accepts current likeness;
 * artifact observations and identities remain in review.md and the root record.
 *
 * @evidence {@link JoinRefinement.refinePortraitJoin} Refines a joining annulus while retaining its fixed attachment boundaries.
 * @evidence {@link JoinTangency.fitPortraitJoinBoundary} Fits the first joining row to the actual supporting planes on both sides.
 * @evidence {@link JoinReference.fitPortraitJoinReference} Adapts a supplied source height surface across a joining annulus.
 * @evidence {@link RimReplacement.IPortraitRimMeshes} Groups the skin and lining meshes returned for one replaced nasal rim.
 * @evidence {@link RimReplacement.IPortraitRimMeshes.skin} Supplies the exterior nasal-rim mesh after replacement.
 * @evidence {@link RimReplacement.IPortraitRimMeshes.lining} Supplies the interior lining mesh corresponding to the replaced rim.
 * @evidence {@link RimReplacement.replacePortraitRim} Replaces a selected nasal rim region while retaining its resident opening boundary.
 * @evidence {@link RimReplacement.replacePortraitRimAttachment} Attaches the replaced rim meshes to the live refined host.
 * @evidence {@link Fairing.fairPortraitSurface} Shapes the annulus interior against both fixed neighbouring skin regions while preserving the recorded image ray.
 * @evidence {@link PatchAttachment.IPortraitPatchAttachment} Gives the patch group physical skin reach and a bounded view-ray search interval.
 * @evidence {@link PatchAttachment.fitPortraitPatchBoundary} Places host boundary controls on the full reference surface without changing their recorded image-plane coordinates.
 * @evidence {@link MeshPatch.IPortraitMeshPatch} Names the source mesh and its oriented, anatomically phased attachment loop.
 * @evidence {@link MeshPatch.createPortraitMeshPatchComponent} Replaces the enclosed host region with a selected patch and an engine-triangulated annulus.
 * @evidence {@link FitBasis.assertPortraitFitBasis} Binds a recorded residual to the exact source-model and target-control bytes consumed by its producer.
 * @evidence {@link Quads.IPortraitQuadMesh} Retains quadrilateral topology for the inactive anatomical prior's common skin/neck refinement.
 * @evidence {@link Quads.subdividePortraitQuads} Applies shared Catmull-Clark refinement to the anatomical skin and attached neck.
 * @evidence {@link Capture.portraitCaptureProfile} Fixes the finite angle set, source crop, optics and lighting conditions used by these inspection frames.
 * @evidence {@link CaptureDiagnostic.IPortraitCaptureBytes} Enumerates the exact byte populations a diagnostic consumes while holding the preview lease.
 * @evidence {@link CaptureDiagnostic.IPortraitCaptureReceipt} Binds the diagnostic's geometry/configuration/source identities and named captured frames.
 * @evidence {@link CaptureDiagnostic.IPortraitDiagnosticProfile} Exposes only the source crop, planned views and measurement frame needed by these observers.
 * @evidence {@link CaptureDiagnostic.portraitCaptureDigest} Identifies exact consumed bytes with SHA-256 for capture-generation comparisons.
 * @evidence {@link CaptureDiagnostic.inspectPortraitCapture} Admits a coherent source-pose diagnostic basis before inference and again before publication.
 * @evidence {@link CaptureDiagnostic.runPortraitCaptureDiagnostic} Keeps observation and publication inside one publisher-compatible lease lifetime.
 * @evidence {@link SurfaceFit.IPortraitSurfaceFit} Describes the numerical thin-plate residual and optional gaze/ray data consumed by the inactive fitted foundation.
 * @evidence {@link SurfaceFit.createPortraitSurfaceFitter} Evaluates the inactive foundation's recorded X/Y residual while retaining prior depth.
 */
export const portraitDiagnosticsReview = {
  scope: "diagnostics construction inspection",
};
