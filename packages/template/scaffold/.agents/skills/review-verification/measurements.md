# Offline measurements

Use these measurements after a current compile when a design question is exact in generated geometry or bindings and a frame would answer it only indirectly. They consume the same typed result as the source viewer and delivery consumer, and do not become a review verdict. Record the measured population, explicit inputs, source revision, result, and limits in the design review that asked the question. Inspect any drawing or other artifact the authored measurement produces; the engine queries do not publish reports on the project's behalf.

Execute the current producer before measuring. A result from an earlier source revision is not evidence about changed source.

## Measurement basis

State the measured quantity, unit, coordinate frame, population, artifact revision, method and uncertainty before using a result. Verify the measuring path against an independent known case. For geometry claims, measure the actual assembled or exported surface consumed by the renderer; for other claims, use the corresponding current consumer artifact. A copied implementation formula is not an independent oracle.

Distinguish observations from inferred hidden dimensions and population priors. Use applicable primary references for physical or anatomical assumptions, record the passage or method actually examined, and justify how it applies to this authored subject and state. Detector landmarks, finite collision samples, bounding boxes, triangle ordering and image masks measure different properties. A lower residual against any one of them does not by itself establish physical validity, visual improvement or likeness. Judge the claimed result through the corresponding current views and states under [Production review](review.md#compare-and-observe).

## Placement

Use `builtEnvironmentPlacementBounds`, `builtEnvironmentSupportStatus`, and `builtEnvironmentPlacementOverlap` from `@automovie/engine` on each relevant current built environment. Name the subject, support or neighbour, and contact tolerance in metres in the query. Preserve an unresolved result and its missing identities rather than inventing a support relation.

Read the returned status, gap, and measurement bases together. A geometry bound, a compact-population bound, and an origin-only point support different conclusions. Overlap compares bounds, not triangle collisions. Population bounds cover each compressed set as a whole; they do not certify every member. Contact is not a load-bearing, stability or gravity simulation result. Resolve candidates against the actual geometry and intended connections before claiming the spatial requirement is satisfied.

## Building reports

Use the public engine building-report functions when current geometry needs drawings, schedules, quantities, services, or declared performance studies. Pass the exact built environments from the production's current producer and preserve each subject's identity and provenance.

Keep derived drawings as SVG and record measurements in the authored review. Read the room schedule's declared volume box and measured content box as separate facts: the first says what the space claims to contain, while the second says what its staged members actually occupy. Read every declared gap with its status, reason, and remedy. A gap may name an unsupported derivation or a study that could run but lacks a production input; neither is repaired by editing the report.

An empty building population is no work measured, not a clean building review. Distinguish a reusable environment inspected directly from one actually staged in a delivered frame. Never invent a dummy shot to make a library building look photographed.

Correct the design or declared study inputs and recompute affected drawings and measurements instead of hand-editing derived results. Their recording and output format belong to the authored consumer, not an installed reporting command.

## Texture scale

Use `validateTextureScale` from `@automovie/engine` when material work declares physical or normalized texture coordinates. Pass the actual current models and inspect the returned validation findings; the function writes no report or census.

Identify which supplied mesh parts carry nondegenerate texture coordinates and structured bindings with a checkable `normalized` or `surface-metres` coordinate source. Primitive geometry, absent coordinates or materials, string bindings, omitted coordinate sources, and `source-uv` do not establish that scale was checked. An empty finding list without a checkable population is not a texture-scale review. Declare `coordinateSource` on the bindings whose scale matters, compile, and measure again.

A normalized coordinate span above one produces an error finding. A surface too small to show one whole repeating `surface-metres` tile produces a warning because fitting one image to one face can be deliberate; a clamped axis does not produce that warning. The authored consumer handles the returned validation result. Resolve the authored intent rather than converting every warning into a refusal.

## Geometry questions

Use a source module when a review needs distance, reach, ground, formation, effect, film-time, pose, or camera measurements. Pass the producer's actual design, compiled shots, and film values directly to `measureAutoMovieGeometry` from `@automovie/engine`. The query reads only those explicit inputs; preserve its refusal when they cannot answer the question.

Read each answer as the measurement it is. A formation's ground violations count only its representative members, the first, middle and last slot of each chunk, placed from the compiled record on its terrain snapshot. A camera answer projects subject roots and does not measure occlusion. An effect's visibility risk is its density along the camera's central ray, not a rendered frame. None of these is a review verdict; state what was measured in the review that asked.

## Gate use

Run only the measurements the active design branches and delivery actually call for. Query results contribute falsifying observations to a space, material, model, instance, or system review set; successful execution satisfies no principle, obligation, discovery duty, or evidence citation by itself. After a source, design, binding, or study input changes, recompute the current result and repeat every affected measurement before renewing that review. [Capture](capture.md) owns rendered artifact and frame identity checks.
