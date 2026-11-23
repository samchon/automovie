# src/actions/supportKey.ts#supportKey.solved

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The whole-body fit on the contact forms is seeded from the previous solution or geometrically placed preference, whichever violates less of the fit's complete constraint merit before solving once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original contact forms and whole-body merit admit both direct and reduced support candidates. A held-contact miss can open the diagonal or bilateral branch before the original refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A contact the fit misses is refused, never left where the fit stopped; a swing's residual refuses nothing, since it bears on nothing, and a swing whose top would cost a contact is dropped from the key rather than traded against it.

## @evidence contracts/development/implementation.md#efficient-algorithms

A feasible preference already minimizes the merit and needs no SQP. An unplaced knee or trunk contact earns one geometric seed alongside the two original seeds. The best seed gets one fit, plus a retry without a swing only if that swing costs a contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prepareForm operation shares unchanged body geometry across all contacts, and HumanBodyFit.fit remains the actual complete multi-contact solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/actions/supportKey.ts#supportKey.preferred

## @evidence contracts/development/common.md#meaningful-documentation

States both cases and how the stated posture is placed.

## @evidence contracts/development/implementation.md#principled-implementation

The stated tilt and joints use the fit's actual local contact offsets. Their mean Cartesian miss places the seed; floor contacts lower it to the floor, while entirely raised contacts retain their target height without floor penetration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture and one floor reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

All anchors share one current candidate resolution and demanded FK, followed by the existing separately translated floor reading; N points require O(N) transforms rather than N candidate solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Anchor points observe the same unchanged turned candidate within supportContact.points; their offsets retain the form owner, and the translated floor posture receives its own actual reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/actions/supportKey.ts#supportKey.prepareBlended

## @evidence contracts/development/common.md#meaningful-documentation

States the key/body premises, world-metre/degree frame, unclipped share, ROM joint interpolation and output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A free movement between two postures is smooth in joint space (Flash and Hogan 1985 for the caller's minimum-jerk share), each joint on its range (`blendHumanJoint`); a joint one key lacks blends from or to clinical zero; the heading difference is wrapped by `wrapDegrees`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed joint pairs and trunk deltas precede per-pair range readers and one per-read fallback for a pair missing an endpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No joint interpolation, range admission, root arithmetic or heading wrap is replaced with a fitted or sampled pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(J) construction over the J union joints. Each complete pair pays its range reader's lazy preparation once, then each read evaluates only its numerical blend; M missing-endpoint pairs share one O(B+M) metadata pass for B bones per interior read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoint tuples, order, trunk deltas and each pair's range metadata serve every read, since the caller holds the body and keys unchanged. Missing-endpoint zeros are per-read inputs to the generic joint owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One transition owns J fixed pairs and at most J range readers until release. A missing-pair read's metadata ends with that read; no share, blended output or FK workspace is retained.
