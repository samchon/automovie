import path from "node:path";

/**
 * Normalize a local or remote route before checking its resident target.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Decodes one instruction destination, retains supported HTTP references and refuses local routes that escape the candidate project root.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Decodes one instruction destination, retains supported HTTP references and refuses local routes that escape the candidate project root.
 */
export const resolveInstructionRoute = (
  source: string,
  destination: string,
): { resolved: string; anchor: string | undefined } | null => {
  const separator = destination.indexOf("#");
  const encodedRoute =
    separator === -1 ? destination : destination.slice(0, separator);
  const encodedAnchor =
    separator === -1 ? undefined : destination.slice(separator + 1);
  let route: string;
  let anchor: string | undefined;
  try {
    route = decodeURIComponent(encodedRoute);
    anchor =
      encodedAnchor === undefined
        ? undefined
        : decodeURIComponent(encodedAnchor);
  } catch {
    throw new Error(
      `${source}: instruction route is not valid percent-encoded text: ${destination}.`,
    );
  }
  if (path.win32.isAbsolute(route) || path.posix.isAbsolute(route))
    throw new Error(
      `${source}: instruction route escapes its project root: ${destination}.`,
    );
  const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/u.exec(route)?.[1];
  if (scheme !== undefined) {
    if (scheme.toLowerCase() === "http" || scheme.toLowerCase() === "https")
      return null;
    throw new Error(
      `${source}: instruction route uses unsupported scheme ${scheme}: ${destination}.`,
    );
  }
  const portableRoute = route.replaceAll("\\", "/");
  const resolved =
    portableRoute === ""
      ? source
      : path.posix.normalize(
          path.posix.join(path.posix.dirname(source), portableRoute),
        );
  // Absolute Windows/POSIX routes were already refused before separator
  // normalization; only relative traversal can leave the root at this point.
  if (resolved === ".." || resolved.startsWith("../"))
    throw new Error(
      `${source}: instruction route escapes its project root: ${destination}.`,
    );
  return { resolved, anchor };
};
