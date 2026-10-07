import { assertSafeStories, type Story, type StoryField, type NumberEvidence } from './storyRules.ts';

type NoteNumber = { id: string; value: string; quote: string };
const fields: StoryField[] = ['title', 'requirement', 'situation', 'task', 'action', 'result'];

export function numbersFromNotes(notes: string): NoteNumber[] {
  const numbers: NoteNumber[] = [];
  for (const quote of notes.split(/\r?\n/)) {
    for (const match of quote.matchAll(/(?<![\p{L}\p{N}])[$€£₹]?-?\d+(?:,\d{3})*(?:\.\d+)?(?:[kKmMbB]|%)?(?![\p{L}\p{N}])/gu)) {
      numbers.push({ id: `n${numbers.length}`, value: match[0], quote });
    }
  }
  return numbers;
}

function calculate(values: string[], operation: string): string {
  // Integer arithmetic preserves decimal accuracy; never evaluate model-supplied code.
  const parts = values.map(value => {
    const match = value.match(/^([$€£₹]?)(-?\d[\d,]*)(?:\.(\d+))?([kKmMbB%]?)$/)!;
    const fraction = match[3] ?? '';
    return { currency: match[1], suffix: match[4], scale: fraction.length,
      amount: BigInt(match[2].replaceAll(',', '') + fraction) };
  });
  if (parts.some(p => p.currency !== parts[0].currency || p.suffix !== parts[0].suffix)) throw new Error('Calculation units differ.');
  const scale = Math.max(...parts.map(p => p.scale));
  const amounts = parts.map(p => p.amount * 10n ** BigInt(scale - p.scale));
  const amount = operation === 'sum' ? amounts.reduce((a,b) => a+b, 0n) : amounts[0] - amounts[1];
  if (amount < 0n) throw new Error('Use a blank for an unsupported negative result.');
  const digits = amount.toString().padStart(scale + 1, '0');
  const decimal = scale ? `${digits.slice(0,-scale)}.${digits.slice(-scale)}`.replace(/\.?0+$/, '') : digits;
  return `${parts[0].currency}${decimal}${parts[0].suffix}`;
}

export function resolveNoteStories(stories: Story[], notes: string): Story[] {
  const catalog = numbersFromNotes(notes);
  if (!stories.every(story => fields.some(field => /\bxx\b/.test(story[field])))) {
    throw new Error('Keep an explicit xx blank for a missing numerical detail.');
  }
  // Keep milestone one's exact validator; mask only server-resolved references.
  const masked = stories.map(story => {
    const copy = { ...story };
    for (const field of fields) copy[field] = story[field].replace(/\[\[[^\]]*\]\]/g, 'xx');
    copy.result += ' xx';
    return copy;
  });
  assertSafeStories(masked);
  return stories.map(story => {
    const resolved: Story = { ...story, evidence: [] };
    for (const field of fields) {
      let output = '';
      let cursor = 0;
      for (const match of story[field].matchAll(/\[\[([^\]]*)\]\]/g)) {
        output += story[field].slice(cursor, match.index);
        const token = match[1];
        const direct = /^n\d+$/.test(token);
        const calculation = token.match(/^(sum|difference):(n\d+(?:,n\d+)+)$/);
        if (!direct && !calculation) throw new Error('Unknown number reference.');
        const ids = direct ? [token] : calculation![2].split(',');
        if (calculation?.[1] === 'difference' && ids.length !== 2) throw new Error('Difference needs a pair.');
        if (new Set(ids).size !== ids.length) throw new Error('Repeated calculation inputs.');
        const sources = ids.map(id => {
          const source = catalog.find(n => n.id === id);
          if (!source) throw new Error('Number is absent from the notes.');
          return source;
        });
        const value = direct ? sources[0].value : calculate(sources.map(s => s.value), calculation![1]);
        const equation = direct ? null : `${sources.map(s => s.value).join(calculation![1] === 'sum' ? ' + ' : ' - ')} = ${value}, ${sources.length === 2 ? 'both' : 'all'} from your notes`;
        const evidence: NumberEvidence = { field, start: output.length, end: output.length + value.length,
          value, label: direct ? 'from your notes' : 'calculated',
          quote: [...new Set(sources.map(s => s.quote))].join('\n'), calculation: equation };
        resolved.evidence!.push(evidence);
        output += value;
        cursor = match.index + match[0].length;
      }
      resolved[field] = output + story[field].slice(cursor);
    }
    return resolved;
  });
}
