import * as net from "node:net";

/*
 * A TCP port the operating system reports free on 127.0.0.1 at the moment of
 * asking, for a page server that must not take another server's port.
 *
 * The port is free only at that moment; the server that takes it listens with
 * `strictPort`, so a port taken meanwhile fails the start instead of moving
 * elsewhere.
 */
export function findAutoMovieFreePort(): Promise<number> {
  return new Promise<number>(
    (resolve: (port: number) => void, reject: (error: Error) => void): void => {
      const server: net.Server = net.createServer();
      server.once("error", reject);
      server.listen(0, "127.0.0.1", (): void => {
        const address: net.AddressInfo = server.address() as net.AddressInfo;
        server.close((): void => resolve(address.port));
      });
    },
  );
}
