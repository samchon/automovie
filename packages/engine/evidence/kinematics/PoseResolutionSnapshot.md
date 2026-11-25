# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.ownsAxes

## @evidence contracts/development/common.md#meaningful-documentation

Authenticates only this owner's exact axes and vector identities.

## @evidence contracts/development/implementation.md#principled-implementation

Tests the exact outer identity; this allocation owner copies every object-valued direction into a fresh frozen own-data vector.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses the single allocation receipt written by axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads no foreign axes properties and certifies no range or normalization.

## @evidence contracts/development/implementation.md#efficient-algorithms

One constant-time weak identity check.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A numeric reader can certify live values of a snapshot without traversing foreign axes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weak identity set retains neither a rig nor a query result.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.entries

## @evidence contracts/development/common.md#meaningful-documentation

States own/custom-prototype lookup, non-enumerable support, undefined shadowing and string bone-key scope; numerical copying/admission remains with the caller.

## @evidence contracts/development/implementation.md#principled-implementation

Enumerates each own string property through the actual custom prototype chain and reads its effective value from the original table once. A seen-name set preserves direct property lookup shadowing; symbols and built-in Object members cannot name an AutoMovieHumanoidBone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One effective-entry reader serves the final skeletonJointAxes result and rest-frame table. The existing merge remains authoritative, so discarded inherited host axes are never reconstructed before its result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No enumerable-only assumption, bone whitelist, default mapping or admission flag substitutes for actual values. Undefined shadowing stays absent and malformed used values still reach their original numerical owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads P own/custom-prototype property occurrences and K effective values in O(P+K) work, using O(P) shadow names and O(K) returned pairs once per static preparation; it adds no per-pose scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit static producer captures these actual effective values before copying their numerical inputs. Source/prototype edits require a new preparation; no lookup answer is reused for a changing source table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns K local entry pairs borrowing values only until the caller snapshots them. The seen set/current prototype release on return or throw, without retaining a table, pose, query history, task or handle.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.sameQuaternion

## @evidence contracts/development/common.md#meaningful-documentation

States exact x/y/z/w comparison and signed-zero semantics, without an admission claim.

## @evidence contracts/development/implementation.md#principled-implementation

Identical actual private immutable operands are equal directly; otherwise Object.is on all four components proves exact operand equality under prepared FK's ownership, including NaN equivalence and distinct signed zeros.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One component comparison serves root snapshots, local articulation and final-query descendant invalidation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Identity reuse requires actual private immutable operands, never a caller's raw mutable-input certificate. No tolerance, normalization, pose/time key or caller admission flag replaces component equality.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most eight component reads and four constant-time comparisons allocate no records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only actual current and previous numerical values are compared; owners retain their own unchanged-source and admission contracts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and retains no operands or resource.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.sameVector

## @evidence contracts/development/common.md#meaningful-documentation

States exact component comparison, including signed zero, without changing the vector's frame or units.

## @evidence contracts/development/implementation.md#principled-implementation

Identical actual private immutable operands are equal directly; otherwise Object.is on x/y/z identifies exactly equal translation operands without normalization or numerical reassociation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The prepared placement owner compares translations here before owning changed private copies; vector separately owns frozen static rig copying.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Identity reuse requires actual private immutable operands instead of raw mutable-input trust. No tolerance, coordinate omission or input repair substitutes for the actual three values.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most six component reads and three constant-time comparisons allocate no records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equality is recomputed from actual operands on every call; only the owning producer may reuse its private unchanged value afterward.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean without retaining either operand or any resource.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.axes

## @evidence contracts/development/common.md#meaningful-documentation

States exact raw-axis copying and deferred admission.

## @evidence contracts/development/implementation.md#principled-implementation

The three direction vectors and declared placement determine clinical composition; exact frozen scalar copies isolate source edits without changing normalization or error policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses this owner's vector copier; normalizeJointAxes remains the separate admission owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Undefined placement stays absent, malformed non-record values remain for lazy refusal, and no default or normalized substitute is inserted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies nine components and one optional placement in constant time/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared rig retains the frozen result while its explicit snapshot is in use; subsequent source edits require another preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one frozen axes record with three frozen direction records and retains no source object, history or handle.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.vector

## @evidence contracts/development/common.md#meaningful-documentation

States exact component copying and inherited frame/unit semantics.

## @evidence contracts/development/implementation.md#principled-implementation

A vector is determined by x/y/z, so copying those actual property values isolates source mutation without enumeration assumptions or arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constant-size frozen copier serves static rest offsets and clinical directions; dynamic private placement has its separate lifetime owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize, clamp or replace malformed non-record values; existing consuming owners keep validation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three property reads and one frozen record take constant work/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit prepared rig retains these frozen static copies for its lifetime; source edits require new preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns only three copied scalars, without retaining a source record or external handle.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.quaternion

## @evidence contracts/development/common.md#meaningful-documentation

States exact glTF-ordered component ownership and absence of normalization.

## @evidence contracts/development/implementation.md#principled-implementation

Four scalar components determine the Hamilton operands; copying x/y/z/w preserves their original values and multiplication grouping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns frozen static rest rotation copying; dynamic private placement has its separate lifetime owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No unit-length repair, sign canonicalization or malformed-value substitute is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four component reads and one frozen record take constant work/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared owner copies static rest once, isolating source edits and preserving its immutable operand identity through that snapshot's lifetime.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns four owned scalars and retains no input, history or handle.

# src/kinematics/PoseResolutionSnapshot.ts#PoseResolutionSnapshot.frame

## @evidence contracts/development/common.md#meaningful-documentation

States optional-axis preservation and the unchanged lazy frame-admission boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Clinical maps depend on each optional sign and neutral degree value; frozen copies isolate source edits while toRigAngle still admits only axes a nonnull clinical coordinate uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses one private scalar-map copier and leaves frame validation/conversion with the existing ROM owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent maps stay absent and malformed non-record entries are preserved instead of defaulted or eagerly refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three optional maps and six scalars are copied in constant time/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit rig preparation owns the immutable map; source edits require a new rig snapshot rather than mutating this mapping.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns at most four frozen records, retaining no source object, pose or handle.
