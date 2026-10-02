import type { IAutoMovieGeneratedManifest } from "@automovie/interface";

/**
 * Supplies resident generation observations to the publication planner.
 *
 * Members are typed byte observations rather than physical files. The recorded
 * call order proves that a missing member is not read and that path admission
 * and member reads precede the manifest observation. Publication and revision
 * mutation belong to the caller and are absent from this reader.
 */
export const createGeneratedPublicationReader = (props: {
  previous: IAutoMovieGeneratedManifest | null;
  files: ReadonlyMap<string, Uint8Array>;
  resident: ReadonlyMap<string, Uint8Array>;
  serializedManifest: string;
  manifest: Uint8Array | null;
}) => {
  const calls: string[] = [];
  return {
    calls,
    previous: props.previous,
    files: props.files,
    serializedManifest: props.serializedManifest,
    manifestPath: "state:generated-manifest",
    resolveMember: (relative: string): string => {
      calls.push(`resolve:${relative}`);
      return `generated:${relative}`;
    },
    exists: (absolute: string): boolean => {
      calls.push(`exists:${absolute}`);
      return props.resident.has(absolute.slice("generated:".length));
    },
    readMember: (relative: string): Uint8Array => {
      calls.push(`read:${relative}`);
      return props.resident.get(relative)!;
    },
    readManifest: (): Uint8Array | null => {
      calls.push("manifest");
      return props.manifest;
    },
  };
};
