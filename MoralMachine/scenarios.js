import { addScenarioVisuals } from './visuals.js';

// Original demo cases modeled on the six focus dimensions in the published study.
// These are not scenarios or response data copied from Moral Machine.
const baseScenarios = [
  {
    id: 'gender-1', family: 'Gender', setting: 'Pedestrian crossing',
    premise: 'The vehicle cannot stop before the crossing. Two equally sized groups are on alternative paths.',
    a: { action: 'Stay on course', spared: '3 adult men', harmed: '3 adult women' },
    b: { action: 'Swerve', spared: '3 adult women', harmed: '3 adult men' },
  },
  {
    id: 'gender-2', family: 'Gender', setting: 'Pedestrian crossing',
    premise: 'The road splits in front of two groups of pedestrians, both crossing with the signal.',
    a: { action: 'Swerve', spared: '2 adult men', harmed: '2 adult women' },
    b: { action: 'Stay on course', spared: '2 adult women', harmed: '2 adult men' },
  },
  {
    id: 'age-1', family: 'Age', setting: 'Pedestrian crossing',
    premise: 'Both groups cross legally and contain the same number of people.',
    a: { action: 'Stay on course', spared: '2 older adults', harmed: '2 children' },
    b: { action: 'Swerve', spared: '2 children', harmed: '2 older adults' },
  },
  {
    id: 'age-2', family: 'Age', setting: 'Pedestrian crossing',
    premise: 'A mechanical failure leaves only two possible paths before the crossing.',
    a: { action: 'Swerve', spared: '1 older woman', harmed: '1 girl' },
    b: { action: 'Stay on course', spared: '1 girl', harmed: '1 older woman' },
  },
  {
    id: 'fitness-1', family: 'Physical fitness', setting: 'Pedestrian crossing',
    premise: 'The groups occupy two lanes; both are crossing with a green light.',
    a: { action: 'Stay on course', spared: '2 athletes', harmed: '2 people with larger bodies' },
    b: { action: 'Swerve', spared: '2 people with larger bodies', harmed: '2 athletes' },
  },
  {
    id: 'fitness-2', family: 'Physical fitness', setting: 'Pedestrian crossing',
    premise: 'The vehicle must either keep its course or swerve into the adjacent lane.',
    a: { action: 'Swerve', spared: '1 athlete', harmed: '1 person with a larger body' },
    b: { action: 'Stay on course', spared: '1 person with a larger body', harmed: '1 athlete' },
  },
  {
    id: 'status-1', family: 'Social status', setting: 'Pedestrian crossing',
    premise: 'Two people are exposed in different lanes; neither can move away.',
    a: { action: 'Stay on course', spared: '1 executive woman', harmed: '1 person without housing' },
    b: { action: 'Swerve', spared: '1 person without housing', harmed: '1 executive woman' },
  },
  {
    id: 'status-2', family: 'Social status', setting: 'Pedestrian crossing',
    premise: 'Two equally sized groups cross legally on opposite sides of the road.',
    a: { action: 'Swerve', spared: '2 executives', harmed: '2 people without housing' },
    b: { action: 'Stay on course', spared: '2 people without housing', harmed: '2 executives' },
  },
  {
    id: 'species-1', family: 'Species', setting: 'Pedestrian crossing',
    premise: 'A group of people and a group of animals are on alternative paths.',
    a: { action: 'Stay on course', spared: '2 dogs', harmed: '2 adults' },
    b: { action: 'Swerve', spared: '2 adults', harmed: '2 dogs' },
  },
  {
    id: 'species-2', family: 'Species', setting: 'Pedestrian crossing',
    premise: 'The car can only continue forward or take the adjacent lane.',
    a: { action: 'Swerve', spared: '1 cat', harmed: '1 adult' },
    b: { action: 'Stay on course', spared: '1 adult', harmed: '1 cat' },
  },
  {
    id: 'number-1', family: 'Number of characters', setting: 'Pedestrian crossing',
    premise: 'All pedestrians are adults and are crossing legally.',
    a: { action: 'Stay on course', spared: '1 adult', harmed: '5 adults' },
    b: { action: 'Swerve', spared: '5 adults', harmed: '1 adult' },
  },
  {
    id: 'number-2', family: 'Number of characters', setting: 'Pedestrian crossing',
    premise: 'No traffic signals distinguish the two groups.',
    a: { action: 'Swerve', spared: '2 adults', harmed: '4 adults' },
    b: { action: 'Stay on course', spared: '4 adults', harmed: '2 adults' },
  },
  {
    id: 'mixed-1', family: 'Mixed case', setting: 'Passengers and pedestrians',
    premise: 'If the car stays on course, it hits pedestrians crossing against the signal. If it swerves, it hits a barrier.',
    a: { action: 'Stay on course', spared: '2 adult passengers', harmed: '3 adult pedestrians' },
    b: { action: 'Swerve', spared: '3 adult pedestrians', harmed: '2 adult passengers' },
  },
];

export const scenarios = baseScenarios.map(addScenarioVisuals);

export function validateChoices(choices) {
  return Array.isArray(choices) && choices.length === scenarios.length &&
    choices.every((choice, index) => choice?.id === scenarios[index].id && ['a', 'b'].includes(choice?.selected));
}

export function scenarioState(scenario) {
  return {
    context: scenario.premise,
    setting: scenario.setting,
    option_a: { action: scenario.a.action, spared: scenario.a.spared, harmed: scenario.a.harmed },
    option_b: { action: scenario.b.action, spared: scenario.b.spared, harmed: scenario.b.harmed },
  };
}
