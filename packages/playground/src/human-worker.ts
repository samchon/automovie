/// <reference lib="webworker" />
/**
 * The one worker entry of the human editors. The page names the role it
 * wants in the worker's `name` (`worker=<role>`, beside any other parameters
 * that role reads from the same name), and the entry loads that role's
 * module: the body editor's resident, anatomy, head and simple-tier workers,
 * the face editor's resident worker, or the person editor's resident worker.
 *
 * The roles share most of their module graph, and the production bundler
 * builds each worker entry separately. Repeated transformation of shared
 * validator code is a possible contributor to the observed Vite heap failure,
 * not an isolated measured cause. One entry lets the bundler share the graph
 * and split the roles into chunks; its memory and timing effects require
 * measurement on that build. Each role module still installs its own message
 * handler when it is evaluated.
 *
 * A role is loaded asynchronously, so a request can arrive before its handler
 * exists. Such requests are held here and handed to the role's handler in
 * arrival order once it is installed. An unknown role answers every request
 * with a failure instead of staying silent.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope;
const role = new URLSearchParams(scope.name).get("worker");
const held: MessageEvent[] = [];
const hold = (event: MessageEvent): void => {
  held.push(event);
};
scope.onmessage = hold;
const load = (): Promise<unknown> => {
  if (role === "body") return import("./connected-body-worker");
  if (role === "body-anatomy") return import("./connected-body-anatomy-worker");
  if (role === "body-head") return import("./connected-body-head-worker");
  if (role === "body-simple") return import("./connected-body-simple-worker");
  if (role === "face") return import("./connected-face-worker");
  if (role === "person") return import("./connected-person-worker");
  return Promise.reject(new Error("The human worker has no role named " + String(role) + "."));
};
void load()
  .then(() => {
    // the role installed its handler while its module was evaluated
    const handler = scope.onmessage;
    if (handler === hold || handler === null)
      throw new Error("The human worker role " + String(role) + " installed no message handler.");
    for (const event of held.splice(0)) handler.call(scope, event);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const refuse = (event: MessageEvent): void => {
      scope.postMessage({ id: event.data?.id, success: false, error: message });
    };
    scope.onmessage = refuse;
    for (const event of held.splice(0)) refuse(event);
  });
