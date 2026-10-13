/**
 * Typed website boundary onto the modern production's shared native uploader. The production inspector and website now call the same mesh, mirror, light and material implementation. The public house tour requires its physical lighting record; the native inspector also supports calibration fallbacks.
 */
import { buildMesh } from "modern-suburban-house/viewer/scene";

/** The production's existing mesh uploader, shared by identity with its inspector and public tour. */
export const modernMesh: typeof buildMesh = buildMesh;
