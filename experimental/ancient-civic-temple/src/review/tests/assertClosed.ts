/**
 * Shared fixtures for pure geometry tests. Builds an engine polyhedron from
 * face lists, measures it through accountMeshes, and checks closed-solid expectations:
 * 0 open edges, non-manifold edges, winding errors and degeneracy, plus expected volume.
 * Expected volume is calculated independently from fixture input dimensions, not operation code.
 */
import assert from "node:assert/strict";
import { type MeshAccount } from "../MeshAccount";
import { near } from "./near";

/** Closed-solid ledger conditions: T-junctions are allowed, but no gap may remain after resolution. */
export const assertClosed = (account: MeshAccount, volume: number, components = 1): void => {
  assert.equal(account.degenerate, 0, `${account.id}: degenerate`);
  assert.equal(account.nonFinite, 0, `${account.id}: non-finite`);
  assert.equal(account.nonManifoldEdges, 0, `${account.id}: non-manifold`);
  assert.equal(account.resolvedNonManifold, 0, `${account.id}: resolved non-manifold`);
  assert.equal(account.windingErrors, 0, `${account.id}: winding`);
  assert.equal(account.openEdges, 0, `${account.id}: open edges after T-junction resolution`);
  assert.equal(account.components, components, `${account.id}: components`);
  near(account.volume, volume, 1e-9, `${account.id}: volume`);
};

