import { MP4BoxBuffer, type Movie, createFile } from "mp4box";

/** Read an in-memory container through the actual public MP4Box parser for observable sample and movie facts. */
export const parseProductionMp4 = (
  bytes: Uint8Array,
): { file: ReturnType<typeof createFile>; movie: Movie } => {
  const file = createFile();
  const copy = Uint8Array.from(bytes).buffer;
  file.appendBuffer(MP4BoxBuffer.fromArrayBuffer(copy, 0), true);
  file.flush();
  // All callers provide complete authored inputs; after flush the public
  // parser owns the complete inventory, so no callback fallback is needed.
  return { file, movie: file.getInfo() };
};
