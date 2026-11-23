# src/animals/EquineSurcingle.ts#EquineSurcingle

## @evidence contracts/development/common.md#meaningful-documentation

States what is laid, the rules the sizes keep within, the contacts and what is absent.

## @evidence contracts/development/design.md#principled-representation

The surcingle and pad as boxes and bars, the handles as handle contacts, the pad as a surface and the basic seat as a seat sat astride.

## @evidence contracts/development/design.md#minimal-and-owned-surface `lay` and the sizes it reads; `createHorse` calls it for `tack` `surcingle`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every size is checked against a published limit or named as an estimate; no weight is invented.

# src/animals/EquineSurcingle.ts#EquineSurcingle.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and what it reads.

## @evidence contracts/development/implementation.md#principled-implementation

The surcingle crosses the back `AHEAD` of the hitch and its straps run down to the barrel's side; each handle is a fore-and-aft bar `HANDLE.rise` above the pad on its own side, `SPREAD` apart; the pad lies behind the surcingle on the back.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The surcingle, the two handles, then the pad and its two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every part is massless and every size within its published limit; nothing is fitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ten parts and four contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one surcingle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
