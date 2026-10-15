import { MeshAccount } from "./MeshAccount";

/** Reasons the account violates its closure contract; an empty array satisfies it. */

export const closureFindings = (account: MeshAccount, closed: boolean): string[] => {
  const findings: string[] = [];
  if (account.degenerate > 0) findings.push(`degenerate triangles ${account.degenerate}`);
  if (account.nonFinite > 0) findings.push(`non-finite components ${account.nonFinite}`);
  if (account.nonManifoldEdges > 0 || account.resolvedNonManifold > 0) {
    findings.push(`non-manifold edges ${account.nonManifoldEdges}/${account.resolvedNonManifold}`);
  }
  if (account.windingErrors > 0) findings.push(`winding errors ${account.windingErrors}`);
  if (closed && account.openEdges > 0) findings.push(`open edges after T-junction resolution ${account.openEdges}`);
  if (closed && !(account.volume > 0)) findings.push(`signed volume of closed solid ${account.volume}`);
  return findings;
};
