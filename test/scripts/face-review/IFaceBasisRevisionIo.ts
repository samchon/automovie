/**
 * The file operations the basis preparation entries perform, so the shared
 * reader and writer run against `node:fs` in a script and against an in-memory
 * stand-in in a test. `node:fs` satisfies it as it is.
 */
export interface IFaceBasisRevisionIo {
  readFileSync(file: string): Buffer;
  writeFileSync(file: string, data: string | Uint8Array): void;
  mkdirSync(directory: string, options: { recursive: true }): unknown;
  existsSync(file: string): boolean;
}
