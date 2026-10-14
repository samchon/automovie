# Parts, one junction, one subdivision

## Decision

Build the skeleton first on `AutoMovieHumanoidBone` and `HUMANOID_REST_FRAME`. Part generators emit quad control cages with typed boundary rings. One junction module joins rings on cages, and one Catmull-Clark subdivision runs over the whole joined cage. Landmarks are semantic coordinates, never vertex indices.

A part is a region of one continuous mass, cut only where the cross-section is a simple tube: mid upper arm, mid thigh, wrist, ankle, neck, and the ear attachment. The shoulder, armpit, hip and groin stay inside the trunk because the deltoid, trapezius and gluteus maximus cross them. Facial features are generator modules that shape one continuous face surface; eyeballs, teeth, tongue, nails and hair are separate meshes.

## Reasons

- Each part can be refined alone from every side before joining, which is how the form quality is reached.
- A seam made by joining finished surfaces needs repair afterwards. Joining control cages and subdividing once makes the joined surface one Catmull-Clark limit surface, which is C2 wherever the cage is regular and tangent-plane continuous at extraordinary vertices (`../techniques/subdivision-and-cage.md`), so the seam is smooth by construction.
- A tube-to-tube cut has a simple ring on both sides, so the ring contract stays small (count, orientation, start mark, frame). A cut across a muscle that spans two regions would split one mass.
- Building everything from one skeleton and rest frame avoids reconciling independently sourced geometry by registration or optimization.
- Semantic coordinates (part, station, angle or patch parameters) survive any change of identity; a vertex index does not (`../failures/basis-era.md`).
- The same cage connectivity for every identity gives one topology and one UV layout per profile, so one texture, garment or downstream asset fits every person.

## Consequences

- Subdivision level is the resolution parameter; emitted primitive counts grow with it, not with authored features.
- Where two rings differ in count, the junction owns the transition patch, and its extraordinary vertices are placed deliberately (`../techniques/junction-and-seams.md`).
- Normals come from the limit surface, not from averaging the final triangles, so UV seams never split shading.
