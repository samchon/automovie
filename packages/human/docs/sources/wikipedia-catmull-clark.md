# Wikipedia, Catmull-Clark subdivision surface

https://en.wikipedia.org/wiki/Catmull%E2%80%93Clark_subdivision_surface.

## Licence

CC BY-SA text. Human copies no text and uses the article as a summary of the primary papers it cites (Catmull and Clark 1978, Stam 1998, Peters and Reif 1998, DeRose, Kass and Truong 1998). A JSDoc that states these rules cites Catmull and Clark 1978 directly.

## What it says

- Face point: the average of the face's points. Edge point: (A + F + M + E) / 4 from the two adjacent face points and the two endpoints. Vertex point: (F + 2R + (n - 3)P) / n with valence n, F the average of adjacent face points and R the average of incident edge midpoints.
- After one step all faces are quads, and the number of extraordinary points stays constant.
- The limit surface is C2 at regular vertices and G1 at extraordinary vertices.
- Catmull and Clark chose the weights for appearance and showed convergence to bicubic B-spline surfaces.

## What Human takes

The refinement rules and the continuity statement (`../techniques/subdivision-and-cage.md`).
