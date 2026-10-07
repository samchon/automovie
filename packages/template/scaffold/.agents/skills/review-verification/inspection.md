# Inspecting compiled subjects

Use public `@automovie/engine` queries on the current `IAutoMovieSubjectArtifact`, a typed compiled shot result paired with its source revision. They describe structure and differences; [Capture](capture.md) and [Production review](review.md) own appearance and acceptance. Run queries in production-owned source over explicit inputs.

## Choose the artifact and revision

Pass the exact typed source result and its revision to `describeAutoMovieSubjects` or `describeAutoMovieSubject` from `@automovie/engine`. Use the same producer as the viewer and delivery consumer. Record the input revision and invocation basis; a timestamp or a successful page load is not source identity.

## Enumerate, then address

`describeAutoMovieSubjects`, called with `{ revision, compiled }`, lists the directly stored subjects in stable order: prototypes, prototype parts, building elements, instance sets, logical spaces, and authored building units. Building elements include the transform-only groups the builder stages no scene node for, because a group is an authored element and a list that skipped it would be a list of the scene rather than of the work. `describeAutoMovieSubject`, called with the same pair and an id, resolves any of those and additionally regenerates a placed part or one compact instance on demand. The stable id namespaces are:

- `prototype:<model>` and `prototype-part:<model>/<part>` for reusable geometry;
- `element:<node>` and `element-part:<node>/<part>` for scene placements, where a built-environment element's node id reads `<environment>/<element>`;
- `instance-set:<set>` and `instance:<set>:slot:<six-digit-index>` for compact repetition, with an explicit transform id replacing `slot:<index>` when authored;
- `space:<environment>/<space>` for logical volumes;
- `building:<environment>/<building>` for an authored building unit.

Enumeration omits placed parts and individual instances. Read the owner's `/members` or address the exact id with `describeAutoMovieSubject`. Generated slots use `instance:<set>:slot:<six-digit-index>` below the set's `count`; explicit layouts use their authored transform ids. Display names and prefix matches do not establish identity.

Do not merge prototype and placement. A prototype answers what geometry and materials exist; an element, placed part, or instance answers where one use of that geometry stands, and `/prototype` on the placement links the two.

## Ask what a room contains

Describe the space; do not search for its contents. A `space:<environment>/<space>` subject carries in `/members` the child spaces under it, every element assigned to it, and every instance set placed in it, each as an id `describeAutoMovieSubject` opens directly. One read answers "what is in this room", from declared containment rather than from name similarity.

Every `/members` is a bounded summary: `total` is exact, `offset` is the page's starting rank, `items` is the stable sample capped at `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT`, and `omitted` counts members outside it. Read `total` for population size. Page a subject with `describeAutoMovieSubject(artifact, id, { memberOffset })`; offsets must be nonnegative safe integers. Follow the returned member ids and reconcile the complete visited population before claiming coverage.

## Walk the building, not only its rooms

A room-by-room survey is not a survey of a building. An element's assignment to a logical space is authored; an exterior wall, foundation, or structural frame may belong to no room. Absence from room membership alone is therefore not a missing building element or an authoring defect.

The space tree is an index over a building. What covers a building is its element hierarchy, and the record says so: `IAutoMovieBuiltEnvironment.buildings` states that ownership is total, every element descending from exactly one unit's roots. So walk the hierarchy, and use the spaces to ask what occupies a room.

Start at each exact `building:<environment>/<building>` identity and follow its element and space roots. `builtEnvironmentUnclaimedElements` identifies hierarchy roots not listed through spaces; element `/members` includes child elements and placed parts. A transform-only group remains addressable even though it stages no scene node and reports null transform, content bounds, materials, and prototype. Compare visited identities with the current environment's complete element population.

## Read bounds honestly

`bounds.content` is measured from compiled primitive or mesh coordinates after the applicable part, rest-bone, and placement transforms. `bounds.declared` is a separate authored extent, and only a space has one; every other kind reports `null` there. Either side may be `null`, so a space can carry a large declared volume beside a smaller content box, or beside no measurable content at all.

`bounds.coordinateSpace` decides whether two boxes may be compared. A prototype and a prototype part are measured in `model` space; elements, placed parts, instances, instance sets, and spaces are measured in `world` space. Differencing one against the other produces a number that means nothing.

A compact instance set's content box measures compiled slot origins, not the geometry standing on them, so a dense set of tall objects still reports a flat box. Address one instance when its prototype extent is the question.

The description does not guess provenance. Join its revision and stable subject id to the separately compiled lineage or evidence ledger when the question asks where a fact came from.

## Compare revisions

`diffAutoMovieSubjects`, called with a before artifact, an after artifact, and an optional tolerance, returns `added`, `removed`, `moved`, `reshaped`, and a bounded `unchanged` summary. Both sides are full `{ revision, compiled }` pairs, so comparing two compiles means holding both sets of bytes; the function reads no history of its own. The default absolute tolerance is `1e-6`, a difference exactly at the tolerance is unchanged, a negative or non-finite tolerance is refused, and equivalent quaternion signs compare as the same rotation.

Movement covers transform, owner, space, and referenced-prototype placement state. Reshaping covers reusable geometry and compact instance-set population laws. One subject may appear in both categories. A prototype change stays one change record carrying aggregate element, instance, and instance-set fan-out, and instance-set prototype reassignment reports a changed-slot count instead of thousands of member records.

`unchanged` is the same bounded summary shape as `/members`, so read its `total` there too. This diff answers whether the compiled model moved and says nothing about whether any picture moved; that question needs current observations under [Capture](capture.md).

## Ask the host for pictures

Follow [Capture](capture.md) for the complete subject-view population, current source and viewpoint basis, missing or stale outcomes, and delivery-frame distinction. [Production review](review.md) owns the resulting judgment.

## Look inside a building: section planes

When the review needs interior structure across rooms, section the resolved scene. `IAutoMovieSectionPlane` declares one half-space to REMOVE, as a coplanar `point` and a `normal` pointing at the removed side.

Keep the execution environments distinct. `classifyAutoMovieSectionPlaneBox` is an `@automovie/engine` calculation over `{ planes, min, max }` that answers `kept`, `cut`, or `crossed` for a subject's bound. `applyAutoMovieSectionPlanes` is an `@automovie/viewer` call over `{ renderer, root, planes }` that clips the materials of an already-built scene and requires a live browser renderer. Both are authored under `src`; only the pure calculation can run in a Node measurement module.

Derive an inspection cut from the measured subject and camera. It may remove intervening geometry but must not remove the subject being judged. State the cut explicitly in the observation basis.

Use the production-owned source preview to frame a subject from its actual content bounds and to apply an explicitly declared inspection section. [Live viewing](live-viewing.md) owns the preview entry and controls. Record the exact subject, source revision, camera, and section rather than inferring a result from a page address.

A viewpoint identity belongs to its complete camera and framing rule, not to the subject alone. Compare viewpoints only when their source basis, angles, aspect, raster, fit distance, and section agree. Stable subject ids may connect observations taken under different viewing conditions.

Derive the plane from geometry you already measured rather than from a guessed offset: a floor level plus `{ x: 0, y: 1, z: 0 }` reads that storey as a plan, and a wall face plus its outward normal opens the elevation behind it. Several planes intersect, so each one added removes more.

Geometry exactly on the plane is kept. Cuts remain uncapped, so walls appear as open shells. `crossed` means no single plane removed the whole bound; several planes may jointly remove it, so the status does not establish partial visibility.

A section is an inspection viewpoint and never a delivery camera. `IAutoMovieCamera` carries no clipping plane, a cut frame is not evidence about the image a shot delivers, and shot acceptance is unchanged by any section you take.
