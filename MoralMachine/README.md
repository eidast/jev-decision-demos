# Moral Machine: published scenario structure

**Source review:** September 22, 2026. **Scope:** the self-driving car Judge experiment described by Awad and colleagues in 2018. This is background for the independent demo in this repository.

## Can every scenario be listed?

There is no fixed list of 13 cases. In the published Judge mode, a session contains 13 generated dilemmas: 12 are drawn from a space of approximately **26 million possibilities**, and one is entirely random. The site also lets visitors design and share their own scenarios. The 13 cases seen by one visitor are therefore not a complete catalog. This document records the published structure and dimensions; it does not claim to enumerate every generated or user-created case. [Original study, Methods](https://politics.media.mit.edu/papers/Rahwan.pdf), [MIT Media Lab project page](https://www.media.mit.edu/projects/moral-machine/overview/).

In each published Judge dilemma, a self-driving vehicle faces an unavoidable crash and two outcomes: stay on course or swerve. One outcome spares a group of one to five characters while killing another group of one to five; the other reverses their fates. The participant selects the outcome they find more acceptable. The study does not establish a correct ethical answer.

## Session composition

The 12 focused dilemmas include **two for each of six character dimensions**, plus one fully random dilemma. Their order and concrete characters vary. Three further properties are randomized within the focused dilemmas: which group is spared without intervention, whether both groups are pedestrians or one rides in the car, and whether pedestrians cross legally. [Original study, Methods](https://politics.media.mit.edu/papers/Rahwan.pdf).

| Focus family | Dilemmas per session | Illustrative contrast, not a copied case |
| --- | ---: | --- |
| Gender | 2 | Male versus female characters. |
| Age | 2 | Young versus older characters. |
| Physical fitness | 2 | Athletic characters versus characters represented with larger bodies. |
| Social status | 2 | Higher versus lower represented social status. |
| Species | 2 | Humans versus pets. |
| Number of characters | 2 | A larger versus a smaller group. |
| Fully random | 1 | A combination without one of those assigned focus families. |

The study analyzes **nine attributes**, not nine separate scenarios:

1. Humans versus pets.
2. Staying on course versus swerving.
3. Passengers versus pedestrians.
4. More versus fewer lives.
5. Male versus female characters.
6. Young versus older characters.
7. Pedestrians crossing legally versus illegally.
8. Athletic versus larger-bodied characters.
9. Higher versus lower represented social status.

Several attributes can be present in one dilemma. The original study also uses some characters to vary the situations without assigning them to a target dimension. [Awad et al., *The Moral Machine experiment*](https://doi.org/10.1038/s41586-018-0637-6).

## The study's 20 characters

The following English labels paraphrase the characters shown in figure 2 of the original paper. They describe the experiment's representations, not the value of anyone's life.

| Grouping for this document | Characters |
| --- | --- |
| Reference adults | Man; woman. |
| Childhood and pregnancy | Baby in a stroller; girl; boy; pregnant woman. |
| Older adults | Older man; older woman. |
| Professions and social position | Male doctor; female doctor; male executive; female executive; person without housing. |
| Represented fitness or body size | Male athlete; female athlete; larger-bodied man; larger-bodied woman. |
| Other | Person depicted as a criminal; dog; cat. |

## Relationship to this demo

The demo contains 13 **original, fixed cases** in `scenarios.js`: two cases for each of the six focus families and one mixed case. It does not implement Moral Machine's random generator, reproduce a live Judge session or its screenshots, or compare the participant with the study's human vote data. See [the experiment protocol](../docs/EXPERIMENT.md) for every demo case and its limitations.
The demo uses a limited set of official character portrait icons to illustrate the groups in its own cases. These portraits are attributed separately; they are not screenshots of official scenarios. See [third-party asset provenance](../THIRD_PARTY_ASSETS.md).

## Primary sources

- [Moral Machine official site](https://www.moralmachine.net/).
- [MIT Media Lab project overview](https://www.media.mit.edu/projects/moral-machine/overview/).
- [Awad et al. (2018), Nature](https://doi.org/10.1038/s41586-018-0637-6).
- [Copy of the original article hosted at MIT, including Methods and figure 2](https://politics.media.mit.edu/papers/Rahwan.pdf).
