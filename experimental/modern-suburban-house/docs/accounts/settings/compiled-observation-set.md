# Settings compiled-observation-set account

## Compiled observation coverage {#compiled-observation-coverage}

<!--
@evidence contracts/compiled-observation-set.md#review-denominator-derived-from-topology This account closes the compiled topology-derived observation denominator for the whole production.
@evidenceReview contracts/compiled-observation-set.md#review-denominator-derived-from-topology #9804e2b The current compiled source at revision 1789575342449.4854 yields 15 exterior, 31 opening, and 135 room observations, totaling 181; I selected every compiled id in the source-backed viewer and each raster decoded at 804x1211 with visible house pixels and no page error. The external GPU-backed reviewer and independent observer measurement remain unverified because this account records the author-side sweep, not their independent judgment.
-->

The production-wide denominator is now concretely observed on the current source basis: 15 exterior records (setting, four elevations, six corners, four roof views), 31 opening records, and 135 room records (15 rooms × threshold, four inside corners, and four cardinal views). The viewer selection status named each selected id and room focus; the complete 181-frame sweep used Chromium 151.0.0.0 at a 804x1211 viewport capture with an ANGLE AMD Radeon(TM) 8060S Graphics Direct3D11 WebGL probe, while the authored viewer itself remained a 2D canvas. All 181 PNG outputs decoded and contained visible pixels. This observation supports denominator coverage and current source/render availability only; independent semantic judgment and observer measurement are unverified.
