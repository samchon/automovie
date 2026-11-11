import * as net from "node:net";

/**
 * A TCP port the operating system reports free on 127.0.0.1 at the moment of asking, for a page server that must not take another server's port.
 *
 * The port is free only at that moment; the server that takes it listens with `strictPort`, so a port taken meanwhile fails the start instead of moving elsewhere.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is returned, the race it leaves and how a caller closes it.
 * @evidence contracts/development/implementation.md#principled-implementation Listening on port 0 asks the operating system for an unused ephemeral port, which the address then reports.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Listen, read the address, close.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed port is guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One listen and one close.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each server asks once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The probing server is closed before the promise resolves.
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
