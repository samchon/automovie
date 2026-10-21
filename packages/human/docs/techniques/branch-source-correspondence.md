# Branch source correspondence

This note separates source topology, geometric phase observations and the still-unidentified interior law. The main boundary owner supplies generated ports, phase maps, transverse jets and assembly. No original source mesh, facet model, per-person coordinates or normal field enters the runtime generator.

## Bound source observations

The current complete-part slab observations live under `test/.shots/human-observations/<source>/<epoch>/`. Their `source-slabs-v1.*.json` members wrap official Recovery observations, including original source-face incidence, exact ports, component cycles and qualified PL events.

| Source | Slab observation epoch |
| --- | --- |
| jang-nara | `e77b22a998b10cbbe803e64aff18fc4be89e0402459318ae778d3180a07ff708` |
| emma-watson | `8b6607425940ce6bd17154db41effb3d1cdf56979bc74af940ac8baa4c5f2ac8` |
| won-bin | `9f1cd819ba87eebb4ba7701ec67ce6155ec4484c4a532318250d1b97581a293e` |
| daniel-radcliffe | `fb5612fb69760ae545873f3c1ca91eb825934096e15f0fc49ede3b0d25795ab3` |

The registration is `[10*y,10*z,-10*x]` mm, with +X forward, +Y up and signed lateral Z. Current rig support names define geometric work charts; their anatomical side and clinical interpretation remain unqualified.

## Shared source indexing

Each original `test/.shots/<source>/body-native.json` has 32,334 vertices and 60,816 ordered triangles. The following SHA-256 values are identical across all four people. Hashes below cover the UTF-8 `JSON.stringify` value of the named array, separately from the acquisition's raw-buffer digests.

| Population | Shared SHA-256 |
| --- | --- |
| `triangles` | `13f65fa9200e0ada35fd3ff77fc86fd50116350d04969eae404370397909513a` |
| `renderSections.triangleSectionIds` | `ac0a3e2e2a24c72488ae997d387cd6f7adff3bb7b19e318d88e27eec294ac319` |
| `renderSections.triangleMaterialIds` | `ac0a3e2e2a24c72488ae997d387cd6f7adff3bb7b19e318d88e27eec294ac319` |
| `renderSections.triangleSourceRenderIds` | `cac9ea61b4c705d626138d6a6fcb74bedf5d3abb3ff8e703298a170cb02ba07d` |
| `renderSections.vertexSourceRenderIds` | `aca5b474a21904100e6bb40613c3b537d3c5c0ec8ee2e0b327161c80f10ac940` |

This supports transporting a declared observation graph edge sequence through the same source indices. It does not establish equal physical curve phase, canonical DNA identity, anatomical identity or an unchanged critical vertex. Runtime geometry must still come from compact common equations fitted to the recovered curves, rather than these source positions or triangles.

Source render seams also matter. In all four originals, vertices 8188 and 18549 have exactly equal positions. Their separate raw vertex links are boundary paths; their combined position-welded link is a cycle. Any use of a PL event must preserve the Recovery observation's welding and critical-policy semantics. Coordinate rounding or a new tolerance-based repair is not justified by the shared indexing.

## Shoulder and pelvis events

Both upper-arm charts contain one central genus-zero, orientable manifold component with Euler characteristic -1 and three coherent boundary cycles. One before port becomes a body port and an arm port after the saddle. The plane direction follows the actual native arm chord; these ports are oblique source contours, not the generated shoulder boundary by definition.

| Source | Upper-arm-l critical vertex | Upper-arm-r critical vertex | Left critical coordinate mm | Right critical coordinate mm |
| --- | --- | --- | --- | --- |
| jang-nara | 5029 | 15162 | -931.391099 | -931.413136 |
| emma-watson | 4928 | 15165 | -923.843559 | -923.872528 |
| won-bin | 4931 | 15159 | -985.403830 | -986.148690 |
| daniel-radcliffe | 4928 | 15165 | -997.419587 | -997.295324 |

The arm pants component is slab 6 for the two women and slab 8 for the two men. Its arm port is `after.section.7.contour.1` or `after.section.9.contour.1`, respectively. Its larger after port is contour 0, and its single before port is contour 0. These identities come from the component's exact cycle incidence; equal port counts alone do not establish correspondence.

Jang's vertex 5029 has two lower and two upper link components along the left-arm axis. The same indexed vertex is regular, with one lower and one upper component, in Emma, Won and Daniel. Thus a shared source graph does not justify freezing Jang's saddle identity in another person.

Pelvis observations have different event structures and cannot share an assumed single-saddle chart without further domain qualification.

| Source | Central slab bounds Y mm | Component topology | Recorded central events |
| --- | --- | --- | --- |
| jang-nara | 814.218597 to 819.218597 | chi -1, genus 0, three cycles, two before ports and one after port | Qualified saddle 8188 at Y 814.557037 |
| emma-watson | 810.101624 to 815.101624 | chi -1, genus 0, three cycles, two before ports and one after port | Qualified saddle 8191 at Y 811.665955 |
| won-bin | 864.494171 to 869.494171 | chi -1, genus 0, three cycles, two before ports and one after port | Birth 11311 at Y 866.570053; saddles 17452 at Y 867.737274 and 11320 at Y 868.052368 |
| daniel-radcliffe | 882.616501 to 887.616501 | chi -2, genus 0, four cycles, three before ports and one after port | Events 17452, 11324, 8182, 8192, 8188 and 8174; all six are unqualified in this slab |

The source declares the component manifold and orientable in all four rows. Daniel's four-cycle component and unqualified event population are not a clean pair of pants. Won's net three-cycle slab contains three events, not one observed saddle. A native inseam endpoint is not a replacement critical point. Other three-cycle components in these complete-part slices belong near the hands at lateral Z approximately 450 to 540 mm; topology alone does not label them as pelvic branches.

The excluded genital source domain needs its own declared boundary and membership policy before a common pelvic chart is fitted. Its source curves remain retained evidence, but they must not be fitted into a genital surface or silently treated as a third leg. Any removal changes the fitting domain and its cycle count explicitly. Neither an invented average closure nor a sex-specific mesh copy resolves the domain mismatch.

## Existing longitudinal guide evidence

The saved `body-sagittal`, `body-coronal` and two `body-oblique` observations are full-body plane intersections through the pelvis support. For Jang and Emma, each body-side shoulder port intersects the sagittal and each oblique plane twice. Independently solving the original cubic Hermite port against the guide plane and the original guide against the port plane gives paired intersection residuals from 0.0002 to 0.263 mm. This is finite fitted-curve consistency, not a continuous source approximation bound.

The upper pelvis port has two sagittal and two intersections with each oblique plane. Each lower leg port has no sagittal intersection and two intersections with each oblique plane. Those curve and plane incidences can anchor geometric phase after the branches are matched by source incidence and orientation.

The actual female arm ports have no intersection with any of those four global guide planes. Cubic scalar extrema prove that the entire arm curve stays away from each plane. The smallest gap is the coronal plane: 4.174/4.179 mm for Jang left/right and 1.029/0.973 mm for Emma. Sagittal and oblique gaps are tens or hundreds of millimetres. Therefore these existing guides cannot carry the arm port phase across the saddle.

Won and Daniel arm ports cross the global coronal plane, while their sagittal and oblique planes still miss the arm port. This does not repair the female gap or establish one cohort-wide guide correspondence. Moreover the stored female body-coronal curves omit their expected body-port crossing region, with an existing exhausted-span diagnostic. A plane crossing computed on a port is not evidence that a missing saved guide segment was observed.

The slab ports explicitly retain `parameterCorrespondence: "contour-identity-only"`. Their saved first knot and equal normalized physical phases must not be equated across ports or people. For example Jang's reflected left and right body-side after ports begin at different source positions approximately 197 mm apart vertically. Native loop publication order is not a common longitudinal guide.

## Planned limb guide planes

The pure helper `test/src/executable/reference-experiments/planReferenceLimbGuides.mts` consumes current accepted limb charts and their support map. With A proximal, B distal, bone `b=unit(B-A)`, registered forward `F=[1,0,0]`, projected forward `f=unit(F-b*dot(F,b))` and across `a=cross(f,b)`, it returns two plans per limb:

| Plan | Plane normal supplied as axis | Reference | Signed coordinate mm |
| --- | --- | --- | --- |
| `<chart>-guide-forward-v1` | a | b | dot(a,A) |
| `<chart>-guide-across-v1` | f | b | dot(f,A) |

Both planes contain the unchanged actual bone chain and are orthogonal. The first also contains projected forward; the second contains across. The plan retains source support names, endpoints, the parent physical domain, units, selection basis and full-native-body selection. Collapsed chains, parallel projected forward and inconsistent chart endpoints or axes remain refused. The helper performs no I/O, extraction, fit or publication. The existing official observer owns all subsequent curves and source-incidence receipts.

These new guide observations still retain every component and every intersection. A component and port incidence match must precede choosing an anterior/posterior or across-side phase anchor. The name is geometric phase, not material phase. Original physical Hermite intervals and derivatives are preserved through any later phase map with its actual chain-rule Jacobian.

## Common interior-law identification

The following is a proposed identification workflow, not an already qualified branch surface. Port phase, the excluded pelvic domain and transverse jets must be fixed before its coefficients have a common meaning.

1. Select the actual slab component from its exact source cycles and surrounding rig domain. Preserve multi-event and four-cycle cases explicitly. Extend the work domain to the main owner's generated connection ports only along observed source incidence, rather than declaring a local 5 or 10 mm slab to be the complete shoulder or pelvis.
2. Use the existing and newly observed 3D guide curves to mark corresponding port intersections and their oriented order. Shared source graph indexing supplies an offline homology check, while the actual saddle and intersection points may move between neighboring source vertices. Solve a monotone phase map through these anchors and retain its physical parameter Jacobian.
3. Map the qualified multiply connected source domain to one abstract chart with its declared cycles and guide seams. A source topology graph can support the offline chart solve; it is not shipped as a runtime facet model. Check boundary bijection, orientation and every chart element for overlap. Positive local orientation alone is not a proof of global injectivity; [Lipman's sufficient conditions](https://arxiv.org/abs/1310.0955) distinguish the required boundary and interior conditions.
4. Let the main boundary owner supply one base extension G of the actual common port curves and their physical transverse jets. Boundary position alone leaves the interior shape unidentified. Ribbon methods explicitly separate boundary curves and cross-derivatives from interior control; the [BME authors' research overview](https://3dgeo.iit.bme.hu/pages/research/multisided/) includes multiply connected domains and interior controls, without establishing that a particular template fits these observations.
5. Fit a low-dimensional vector residual `S(u,v;q)=G(u,v;q)+L(q)*w(u,v)*sum(theta_j(q)*p_j(u,v))`, initially using the six total-degree-two monomials `1,u,v,u²,uv,v²`. Choose a chart-specific w whose value and first derivatives vanish on every declared port, so the fit cannot alter the boundary jets. Three-cycle and four-cycle charts require different admitted domains; changing tessellation is not a substitute.
6. Jointly fit the shared coefficients to all recovered interior section and longitudinal-guide samples in physical 3D, with each person's total weight equal. Begin with an intercept and one already supported shape coordinate. Keep the source-course calibration separate and retain original curve directions and physical intervals. Inspect matrix rank and singular values; fit additional physical ratios only when an omitted-person conditional holdout supports them.
7. Reserve whole guide arcs and interior sections from the fitting rows, then report per-region and per-person position, silhouette and normal residuals separately from port error. A lower pooled RMS cannot hide a saddle fold, wrong branch membership, loss of posterior volume or a regression in another person. The main actual-render round must then inspect the entire connected region and its neighbors.

This construction has a small common coefficient population and exact boundary-jet ownership. The observations, rather than an average bridge or extra section layers, decide the interior shape. At this stage no joint branch fit, valid pelvic exclusion chart or actual generated branch render has been established.
