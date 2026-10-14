import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { test12MotionFixture } from "./test12MotionFixture";

/**
 * Inspect the existing resident motion fixture through the public byte seam, resolving only its declared walk.bin sidecar.
 */
export function test12MotionInspect(fixture: ReturnType<typeof test12MotionFixture>): import("../../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection { return inspectAutoMovieExternalModelBytes({
    path: "public/motion/walk.gltf",
    bytes: fixture.bytes,
    profile: "gltf-motion-v1",
    resolveResource: (uri: string): Buffer<ArrayBuffer> | null => (uri === "walk.bin" ? fixture.payload : null),
  }); }
