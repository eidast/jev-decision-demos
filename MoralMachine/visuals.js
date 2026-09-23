// These IDs map the demo's original group descriptions to official Moral Machine character portraits.
// The portraits are illustrative; action, location, and outcome are defined by the scenario text.
export const groupIcons = {
  '3 adult men': ['man', 'man', 'man'],
  '3 adult women': ['woman', 'woman', 'woman'],
  '2 adult men': ['man', 'man'],
  '2 adult women': ['woman', 'woman'],
  '2 older adults': ['oldman', 'oldwoman'],
  '2 children': ['boy', 'girl'],
  '1 older woman': ['oldwoman'],
  '1 girl': ['girl'],
  '2 athletes': ['maleathlete', 'femaleathlete'],
  '2 people with larger bodies': ['fatman', 'fatwoman'],
  '1 athlete': ['maleathlete'],
  '1 person with a larger body': ['fatman'],
  '1 executive woman': ['businesswoman'],
  '1 person without housing': ['homeless'],
  '2 executives': ['businessman', 'businesswoman'],
  '2 people without housing': ['homeless', 'homeless'],
  '2 dogs': ['dog', 'dog'],
  '2 adults': ['man', 'woman'],
  '1 cat': ['cat'],
  '1 adult': ['man'],
  '5 adults': ['man', 'woman', 'man', 'woman', 'man'],
  '4 adults': ['man', 'woman', 'man', 'woman'],
  '2 adult passengers': ['man', 'woman'],
  '3 adult pedestrians': ['man', 'woman', 'man'],
};

function iconsFor(description) {
  const icons = groupIcons[description];
  if (!icons) throw new Error(`No character portraits mapped for: ${description}`);
  return icons;
}

export function addScenarioVisuals(scenario) {
  return {
    ...scenario,
    a: { ...scenario.a, visuals: { spared: iconsFor(scenario.a.spared), harmed: iconsFor(scenario.a.harmed) } },
    b: { ...scenario.b, visuals: { spared: iconsFor(scenario.b.spared), harmed: iconsFor(scenario.b.harmed) } },
  };
}
