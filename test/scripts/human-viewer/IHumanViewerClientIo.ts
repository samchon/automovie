/** What the client needs from the machine: HTTP and the viewer's inputs directory. */
export interface IHumanViewerClientIo {
  fetch(url: string): Promise<{
    ok: boolean;
    status: number;
    headers: { get(name: string): string | null };
    json(): Promise<unknown>;
    arrayBuffer(): Promise<ArrayBuffer>;
  }>;

  /** Write one file of the viewer's inputs directory. */
  writeInput(name: string, data: string): void;

  /** Copy a local file into the viewer's inputs directory under a name. */
  copyInput(name: string, source: string): void;
}
