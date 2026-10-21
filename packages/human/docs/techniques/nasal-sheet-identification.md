# Nasal sheet identification

The current nose study uses the four completed 109-member observation cohorts below. The study has not generated or visually verified a nasal surface. `planReferenceNoseSections` is an unimported acquisition-planning helper for the existing reference processor; it is not another acquisition entry point.

| Reference directory | Observation context | Head-feature SHA-256 |
| --- | --- | --- |
| `jang-nara` | `e77b22a998b10cbbe803e64aff18fc4be89e0402459318ae778d3180a07ff708` | `cf38d4c4ccc74b09f13a124bc7cd4e9b03d136170ab01007937b2fa2608702e3` |
| `emma-watson` | `8b6607425940ce6bd17154db41effb3d1cdf56979bc74af940ac8baa4c5f2ac8` | `70d8ee1c4ebe731dca52ca94d792148fa151a466e6ff0b4188c65a4b2cec46d5` |
| `won-bin` | `9f1cd819ba87eebb4ba7701ec67ce6155ec4484c4a532318250d1b97581a293e` | `195f51cbb5ab631979ad895ffa9e3b5cc409fcecb9a493e351ae4beb9addb485` |
| `daniel-radcliffe` | `fb5612fb69760ae545873f3c1ca91eb825934096e15f0fc49ede3b0d25795ab3` | `ec87aab36876832b9a8012809d195d4e15b28a14a971e11f831bca92811000b1` |

For each cohort, the completion filename equals its byte SHA-256. The head-feature, regional-frame and selected-head-skin artifacts match both their individual receipts and completion members. The original captured canonical head, application receipt and native render remain unchanged. Registered coordinates are millimetres, with +X forward, +Y up and signed lateral Z. Native side names remain geometrically qualified only.

## Semantic rims and sheet topology

Each side has one recovered `crv_nostril` cycle with 32 distinct canonical observations. All eight cycles have actual cubic Hermite spans and individual physical parameter widths. Seven have six spans; the Daniel left cycle has eight. The original fits preserve source corners. The right Won cycle has two declared corners; each other cycle has one. A single smooth ellipse would erase both observed nonplanarity and a declared corner.

The eight observed cycles have best-fit plane coordinate RMS 0.329–0.494 mm and maximum displacement 0.717–1.016 mm, using 257 equally spaced samples of the original physical Hermite phase. These are finite observations, not continuous bounds. Every original derivative is multiplied by its actual span width when evaluating its cubic. No higher-degree or rational source was observed or reduced.

Every nostril rim edge has canonical face incidence two. That fact alone neither identifies an open mesh boundary nor rejects a cavity model. Removing the two complete rim edge cycles from the face adjacency graph yields exactly three components in every reference: 46,996 faces in the remaining head sheet and 504 faces in each single-rim disk. Each disk has 269 vertices, Euler characteristic one and exactly its own 32 rim boundary edges. It has no contact with the opposite rim. The disk extends upward beyond the rim and is a supported candidate for the internal nasal sheet; recovered sections must still qualify its depth and orientation.

Canonical and native render positions match exactly, but their triangulations differ. Only 21,582 of the 48,004 canonical triangles have an exact native triangle with the same three positions. Therefore canonical triangle identities cannot be reused as native face identities. Transferring each disk's unique canonical position population to native skin section zero yields exactly 504 native faces. Those faces have exactly the same 32 boundary position edges and no nonmanifold edge in all eight cases. The planner verifies this boundary equality and publishes original native face IDs. It preserves all remaining skin faces as a separate exterior selection.

The two `crv_nasolabial` paths each contain 25 observations and three recovered Hermite spans. Their endpoints have unresolved installed names, their initial directions are combinatorial, and they share no recorded canonical junction with the nostril cycles. They can support a nose-to-cheek correspondence after geometric direction and source incidence are qualified. Their names alone do not make them nasal side-wall boundaries.

## Common rim correspondence

Using the largest corner angle as the cycle seam failed because the right Won curve's additional medial corner is sharper than its posterior corner. That choice produced a pooled coordinate RMS of 2.752 mm and a sampled maximum positional residual of 12.076 mm. A correspondence correction uses the actual posterior corner and reflects the two sides into a common chart, then traverses from that corner toward the medial rim. The original phase width is normalized over the entire cycle, without cropping or reordering its interior samples.

With each observed cycle conditioned on its physical centroid and the achieved bilateral nostril-width proxy, a common degree-nine polynomial of the form `a0 + u(1-u) sum(ak (2u-1)^k)` has coordinate RMS 0.908 mm and maximum sampled positional residual 3.284 mm. Its endpoints coincide while its two one-sided derivatives remain independent, so its posterior corner is retained. The extra medial Won corner remains an unsupported regional variation. This common approximation does not replace or reduce any original Hermite artifact.

| Held-out reference | Coordinate RMS mm | Maximum sampled positional residual mm |
| --- | --- | --- |
| `jang-nara` | 0.768 | 1.946 |
| `emma-watson` | 0.305 | 0.904 |
| `won-bin` | 1.644 | 3.738 |
| `daniel-radcliffe` | 1.554 | 4.317 |

An affine projection-to-width conditioning term reduced the four-reference coordinate RMS to 0.442 mm, but the held-out Daniel result worsened to 1.962 mm with a 4.921 mm maximum. It is not selected as a common predictive law. Increasing polynomial degree alone reduced little of the remaining variation.

The current typed `nose.protrusion` is a clinical subnasale-to-pronasale chord. The achieved reference proxy instead measures forward displacement from the nostril population centroid to a captured nose-gizmo anchor, with values 2.865–10.975 mm. The anchor sits above the visible nostril disk and is not certified as pronasale. Likewise, achieved width is the lateral span of both nostril populations and achieved height is inner-eye height minus the lowest nostril point. Their target residuals and definitions remain separate from the typed clinical inputs. This study identifies conditional shape from those geometric proxies; it has not identified independent clinical input effects.

`HumanNoseFeatures` stores the common degree-nine rim approximation separately from those original observations. Its caller supplies the existing `HumanHeadFrame` and `HumanMouthFeatures` objects. Bilateral lateral support of the common polynomial sets the generated rim span to the requested width. Its continuous polynomial Y minimum sets the lowest generated rim to `eyeY - nose.height`. A pooled two-variable placement solve defines its forward axis as `innerEyeForward + 0.6525087657705508 * nose.width + 0.6174784829862807 * nose.protrusion`. Source-conditioned forward placement residuals are below 0.469 mm, but that does not include the generated shared-frame placement error. The physical clinical input interpretation and extrapolation outside the observed proxy range remain unsupported.

The nasolabial generator takes its upper endpoint from the generated rim's analytic parameter mean plus a shared width-scaled offset. Its lower endpoint takes the existing actual generated mouth corner plus a shared mouth-width-scaled offset. Neither offset establishes a physical contact with those neighboring curves. The common cubic residual consumes the full original physical course after upper-to-lower direction qualification, then normalizes that domain to `[0,1]`. Pooled coordinate RMS is 0.742 mm and sampled maximum positional residual 2.836 mm conditioned on observed endpoints. Degree seven changes RMS only to 0.737 mm, so that extra profile complexity is not selected. Endpoint placement error remains separate. The returned `HumanSurface.Boundary` objects are the sole functions for future adjacent skin and visible construction to consume; skin has not yet been implemented.

## Next official observations and surface domains

The existing processor should append versioned nose stages using the new planner. It should preserve the completed 109 members, their receipts and original captures. Each selected disk receives transverse sections from its actual full physical Y extent; the exterior receives transverse, sagittal and oblique guides spanning the measured rim, inner-eye midpoint and captured nose anchor. Sixteen dyadic observation intervals resolve each finite span. This is acquisition resolution, not an instruction to add generated principal layers.

Every selected observer input triangle must map back to its original native face ID in source-lineage and slab records. Exterior contours and the two disk contours remain separate. Their intersections with the exact semantic rims can establish shared geometric correspondence; a contour count or an arbitrary phase pairing cannot. The official Recovery fit and Hermite conversion own coefficients, widths, directions and failures.

The nasal model should establish shared root, tip, alar and columellar feature curves before choosing its surface charts. The ridge and tip must come from qualified sagittal or oblique exterior observations. The two explicit rim authorities separate exterior skin and the internal candidate disks. Each incident chart consumes the same boundary object with compatible transverse derivatives and its actual parameter Jacobian. The middle nose-to-lip boundary must consume the head owner's current mouth and lower-face authorities, whose first actual inspection exposed other defects; the nose study must not lock in their present approximation or emit overlapping skin.

A complete nasal exterior, clinical landmark equivalence, internal cavity orientation, source transverse jets, nostril wall thickness and independent input interactions remain unverified. Shared-frame placement and a true skin surface have not been accepted by a numerical rim fit. The current generator remains partial.
