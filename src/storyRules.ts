export type Story = {
  title: string;
  requirement: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  evidence?: NumberEvidence[];
};

export type StoryField = 'title' | 'requirement' | 'situation' | 'task' | 'action' | 'result';
export type NumberEvidence = {
  field: StoryField;
  start: number;
  end: number;
  value: string;
  label: 'from your notes' | 'calculated';
  quote: string;
  calculation: string | null;
};

// Reject rather than guess whether a number came from the candidate or the JD.
const numberWords = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|half|quarter|double|doubled|triple|tripled|twice|thrice|dozen)\b/i;
export function assertSafeStories(stories: Story[]): Story[] {
  if (stories.length !== 3) throw new Error('Exactly three stories are required.');
  for (const story of stories) {
    for (const key of ['title', 'requirement', 'situation', 'task', 'action', 'result'] as const) {
      const value = story[key];
      if (typeof value !== 'string' || !value.trim()) throw new Error('A story section is missing.');
      if (/\p{N}/u.test(value) || numberWords.test(value)) {
        throw new Error('A story contains a number instead of xx.');
      }
    }
    if (!/\bxx\b/.test(story.result)) throw new Error('The result needs an xx blank.');
  }
  return stories;
}
