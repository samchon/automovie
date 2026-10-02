import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import path from "node:path";

/**
 * An in-memory owned-output reader for generated ownership policy scenarios.
 *
 * The caller supplies resident records and exact byte or thrown-value reads.
 * No filesystem is simulated: this implements the policy's typed input port
 * and leaves physical fencing to the host. Each requested path is recorded so
 * a scenario can prove that expected files were checked and extras were not
 * silently adopted.
 */
export const createGeneratedOwnershipReader = (props: {
  manifest: IAutoMovieGeneratedManifest | null;
  files: string[];
  read: (file: string) => Uint8Array;
}) => {
  const root = path.resolve("ownership-policy-input");
  const generated = path.join(root, "generated", "harbor");
  const reads: string[] = [];
  return {
    reads,
    project: {
      root,
      generatedManifest: () => props.manifest,
      generatedRoot: () => generated,
      trackedStatePath: (file: string) =>
        path.join(root, "automovie", "productions", "harbor", file),
      readGeneratedFile: (file: string): Uint8Array => {
        reads.push(file);
        return props.read(file);
      },
    },
    listFiles: (_root: string): string[] =>
      props.files.map((file) => path.join(generated, file)),
  };
};
