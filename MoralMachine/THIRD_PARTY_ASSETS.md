# Third-party visual assets

The files in `public/assets/moral-machine/` are character portrait SVGs from the official [Moral Machine](https://www.moralmachine.net/) asset host. They were retrieved on September 22, 2026 and are included unchanged. The demo scales and arranges them to illustrate its own authored cases; it does not reuse official scenario screenshots, official case data, or human responses.

**Creator and attribution:** Moral Machine, Scalable Cooperation at MIT Media Lab. The [MIT Media Lab project page](https://www.media.mit.edu/projects/moral-machine/overview/) labels the project [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). That page gives a project-level notice; the SVG files themselves do not include separate license metadata. This repository treats these portraits as project artwork and attributes them accordingly. This is an inference about the asset-level scope from the official project notice. The artwork is **not covered by this repository's MIT license**. The UI links to the project, license, and a public credits page. No endorsement by the creators is implied.

Every file below was downloaded from `https://avgame.s3-accelerate.amazonaws.com/images/sprites/characters/<filename>` and is used as a decorative group portrait in the decision options. The filename is the original filename. The SHA-256 hashes allow a later source comparison.

| File | SHA-256 |
| --- | --- |
| `boy_passenger.svg` | `5a0947e3bd4306340cb7274bab805d8d37d0707e64b7403862ddbed727d58ead` |
| `businessman_passenger.svg` | `0147d4d45775572156c6666248dcaf96a790faca81326f278ccf4461e5bcf927` |
| `businesswoman_passenger.svg` | `518eff2502a2f7014da871cab783f3639402ae2bb1f1ac66f64e68425ecd846c` |
| `cat_passenger.svg` | `791e936cd4ff94140afe55c7e9880aee8f73feaabd968418b9a6aa62756a1f9f` |
| `dog_passenger.svg` | `634a9b6d0c224dad6566c6cd972d6ec76073ce1658ff9e09287e5ab45d98a8cc` |
| `fatman_passenger.svg` | `23f512ade26efe00fe5d51eb10fb7f78860c33d2a5e3eb7bfe5b8c3ba23b3316` |
| `fatwoman_passenger.svg` | `e4d3ad63f754319ea4273346df5fe9bf270e6c1fd739f362a1b59582079ea1ab` |
| `femaleathlete_passenger.svg` | `2e58c9e1a1fd788889e14d7da9d47b00b5b8584fd2c93ddcc0b52ff88c8aa42d` |
| `girl_passenger.svg` | `e3022cfd3e9f01b2e2c2bbbb9e309da0d7e08221464b660377dcab1af414565e` |
| `homeless_passenger.svg` | `006f9d5208a6345e356749c8c6dc7776db551e6178a872eb8ef8cc9363e9d527` |
| `maleathlete_passenger.svg` | `35abe5e55e91965426f8f96dbc5b179e40066626068df88222eab116afb6e4a5` |
| `man_passenger.svg` | `126564410b3c08c85e7e46eef7f8bec8b249630132bd18f82513925b7b06d812` |
| `oldman_passenger.svg` | `49cf0e9d41a69df818f9991e2d0d5fb4a1efc9578e8c07cba0ffe47d2577e650` |
| `oldwoman_passenger.svg` | `071ed96f5d56e210faa3d6438362fa62682a480404e673f92d804f9d61bc5a40` |
| `woman_passenger.svg` | `75c1ab03bcccaf9db2e840c3f71a132b242ba6b0ba597a4f712b08ff0b05c98f` |

The English group descriptions and portrait assignments are original demo code in `visuals.js`. Some official files have names ending in `_passenger`; here they represent character identity only. A portrait does not assert whether a character is a passenger or pedestrian, or whether they are spared or harmed. The scenario text provides those facts. If a portrait's identity does not match a future scenario, update the mapping and the case documentation together.

The README preview in `docs/assets/` contains the same portraits within screenshots of this demo. Those derivative images retain the attribution above. See [preview provenance](docs/assets/README.md) for the capture conditions and example-run boundary.
