import http from "node:http";

/** Existing viewer HTTP transport. No browser, generation or private page access is created. */
export namespace HumanDebugInspectionHttp {
  /** An untruncated local HTTP result. */
  export interface Answer {
    /** HTTP status. */
    status: number;
    /** Exact UTF-8 response body. */
    body: string;
  }
  /** Read one existing endpoint without the short fetch header timeout or automatic retries. */
  export function get(url: string): Promise<Answer> {
    const address: URL = new URL(url);
    if (address.origin !== "http://127.0.0.1:5197")
      return Promise.reject(new Error("Inspection uses only the shared viewer at 127.0.0.1:5197"));
    return new Promise<Answer>((resolve: (value: Answer) => void, reject: (error: Error) => void): void => {
      http.get(address, (response: http.IncomingMessage): void => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer): void => { chunks.push(chunk); });
        response.on("error", reject);
        response.on("end", (): void => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
      }).on("error", reject);
    });
  }
}
