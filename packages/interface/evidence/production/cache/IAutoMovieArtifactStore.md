# src/production/cache/IAutoMovieArtifactStore.ts#IAutoMovieArtifactStore

## @evidence contracts/development/design.md#principled-representation

Represents a content-verified key-value store: keys are composed `sha256:` strings, values are owned bytes with their recorded `sha256:` content digest, and the digest function belongs to the store so each host uses its native hash (Node crypto, SubtleCrypto) while producing the same FIPS 180-4 value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieArtifactStore owns the port consumed by resolveAutoMovieArtifact; the HTTP adapter and in-memory test stores provide read, write, remove and digest without exposing host handles to the resolver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing names a stage, a file layout or a transport.

## @evidence contracts/development/common.md#meaningful-documentation

States ownership, the recorded-digest invariant, absence semantics and failure effects of each member.

# src/production/cache/IAutoMovieArtifactStore.ts#IAutoMovieArtifactStore.IEntry

## @evidence contracts/development/design.md#principled-representation

An entry couples artifact bytes with the digest recorded at write time; resolveAutoMovieArtifact recomputes that digest before reuse and removes mismatches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieArtifactStore owns the storage port and entry; the engine resolver uses the same entry with host-specific directory, HTTP or memory storage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The byte payload and recorded digest remain separate so corruption can be detected; neither a file path nor a transport handle enters the contract.

## @evidence contracts/development/common.md#meaningful-documentation

Storage entry carried between the artifact resolver and host storage adapters. An entry couples artifact bytes with the digest recorded at write time; resolveAutoMovieArtifact recomputes that digest before reuse and removes mismatches.
