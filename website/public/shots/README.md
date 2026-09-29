# Collection captures

These images are actual deterministic viewer captures. The new PNGs are byte-for-byte copies of the building authors' retained local captures. The site presents the productions' prototype appearance. Individual props retain their experimental projects' completion status. The original review captures and source remain in those projects.

| Public image | Production capture | Capture basis |
| --- | --- | --- |
| `ancient-exterior.png` | `experimental/ancient-civic-temple/.wiki/successor-whole-final/reference.01-exterior.png` | `e4e217bfff943cd9` |
| `ancient-interior.png` | `experimental/ancient-civic-temple/.wiki/successor-whole-final/reference.04-worship-hall.png` | `e4e217bfff943cd9` |
| `modern-exterior.png` | `experimental/modern-suburban-house/.wiki/building-current-328a15a878c4/house-exterior.png` | `328a15a878c4` |
| `modern-interior.png` | `experimental/modern-suburban-house/.wiki/building-current-328a15a878c4/house-interior.png` | `328a15a878c4` |
| `future-exterior.png` | `experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-12-anchor/references--01-exterior.png` | `14-12-anchor` |
| `future-interior.png` | `experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-12-anchor/references--03-common-room.png` | `14-12-anchor` |

The temple's retained frames were carried into its final building review after its scene payload and daylight module were checked for byte parity. Its final reviewed source basis is `24fef08c794bfb71`. The future house's retained capture basis was carried into its final building review after its geometry, transforms, materials, and lighting inputs were checked for parity. Its final reviewed source basis is `45037cf911312fd58fa5edc6adac8ea5c7942cf8f435281c897e7aa33166d73f`. The capture table records the retained frames' own basis.

The existing `reference-exterior.webp`, `reference-courtyard.webp`, `hall.webp`, `ground-plan.webp`, and `frame-axonometric.webp` were captured from the public manor viewer and are unchanged. Their corresponding authored view IDs are `reference-exterior`, `reference-courtyard`, `hall--corner-b`, `ground-plan`, and `frame-axonometric`.

When a building's visible inputs change, recapture the affected views and update this table. Interior images are stored in inert HTML templates and load on selection. Lower-row exterior images use native lazy loading; the collection's JavaScript does not load the 3D engine or any production payload.
