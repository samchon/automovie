/**
 * Typed website boundary onto the modern production's shared native uploader. The production inspector and website now call the same mesh, mirror, light and material implementation. The public house tour requires its physical lighting record; the native inspector also supports calibration fallbacks.
 */
import { buildScene } from "modern-suburban-house/viewer/scene";

/**
 * Parameter type of the production's shared scene uploader; the website uses that existing contract rather than defining a parallel payload shape.
 */
export type ModernPayload = Parameters<typeof buildScene>[0];
