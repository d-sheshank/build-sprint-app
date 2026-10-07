import { Fragment, StrictMode, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient, useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import type { Story, StoryField } from './storyRules';
import './style.css';

function StoryText({ story, field, storyIndex }: { story: Story; field: StoryField; storyIndex: number }) {
  const evidence = story.evidence?.filter(item => item.field === field) ?? [];
  let cursor = 0;
  return <>{evidence.map((item, index) => {
    const before = story[field].slice(cursor, item.start);
    cursor = item.end;
    const id = `source-${storyIndex}-${field}-${index}`;
    return <Fragment key={id}>{before}<button type="button" className="number-source" popoverTarget={id} aria-label={`${item.value}, ${item.label}`}>
      {item.value}<span>{item.label}</span>
    </button><div id={id} popover="auto" role="dialog" aria-label="Number source" className="source-popup">
      <h3>{item.value} — {item.label}</h3>
      {item.calculation && <p>{item.calculation}</p>}
      <p>Exact line from your notes:</p><blockquote>{item.quote}</blockquote>
      <button type="button" popoverTarget={id} popoverTargetAction="hide">Close source</button>
    </div></Fragment>;
  })}{story[field].slice(cursor)}</>;
}

function App() {
  const generate = useAction(api.stories.generate);
  const [jd, setJd] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [generatedJd, setGeneratedJd] = useState('');
  const [usedNotes, setUsedNotes] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (jd.trim().length < 100) {
      setError('Paste more of the job description, including its responsibilities.');
      return;
    }
    setBusy(true);
    setNotesError('');
    try {
      setStories(await generate({ jobDescription: jd }));
      setGeneratedJd(jd.trim());
      setUsedNotes(false);
      setNotes('');
    } catch (error) {
      setError(error instanceof ConvexError && typeof error.data === 'string' ? error.data : 'Could not generate your drafts. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function regenerate(event: FormEvent) {
    event.preventDefault();
    if (busy || !notes.trim()) return;
    setNotesError('');
    setError('');
    setBusy(true);
    try {
      const updated = await generate({ jobDescription: generatedJd, notes });
      setStories(updated);
      setUsedNotes(true);
    } catch (error) {
      setNotesError(error instanceof ConvexError && typeof error.data === 'string' ? error.data : 'Could not update your stories. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return <>
    <header className="masthead"><a href="/" aria-label="Story prep home" className="brand"><svg width="25" height="27" viewBox="0 0 25 27" fill="none" aria-hidden="true"><path d="M3 3h12v7H3zM10 10h12v7H10zM3 17h12v7H3z" stroke="currentColor" strokeWidth="2"/></svg>Story prep</a><span>Interview preparation</span></header>
    <main>
      <div className="intro"><h1>Your experience.<br/>A clearer story.</h1><p>Start with the job description. Get three drafts in the STAR format: situation, task, action and result.</p></div>
      <div className="workspace">
        <div className="input-column"><form onSubmit={submit} className="input-pane">
          <h2>The role you’re preparing for</h2>
          <label htmlFor="jd">Job description</label>
          <p className="help" id="jd-help">Paste the role’s responsibilities and requirements.</p>
          <textarea id="jd" aria-describedby="jd-help jd-note" maxLength={20000} value={jd} onChange={event => setJd(event.target.value)} disabled={busy} placeholder="Paste the job description here…" spellCheck={false}/>
          <p className="help" id="jd-note">Only a job description is needed. Your drafts stay on this page until you close or refresh it.</p>
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" disabled={busy || !jd.trim()}>{busy ? 'Preparing your stories…' : stories.length ? 'Generate new stories' : 'Generate three stories'}<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></button>
        </form>
        {stories.length > 0 && jd.trim() === generatedJd && <form onSubmit={regenerate} className="notes-pane">
          <h2>Make these stories yours</h2>
          <label htmlFor="notes">Your notes</label>
          <p id="notes-help" className="help">Paste your profile, past projects or achievements. Include numbers you can back up.</p>
          <textarea id="notes" aria-describedby="notes-help notes-note" value={notes} onChange={event => setNotes(event.target.value)} maxLength={20000} disabled={busy} placeholder="What did you work on? What changed?"/>
          <p id="notes-note" className="help">Numbers will link to your exact notes or show how they were calculated. Missing numbers stay xx. Your notes stay on this page until you close or refresh it.</p>
          {notesError && <p role="alert" className="error">{notesError}</p>}
          <button type="submit" disabled={busy || !notes.trim()}>{busy ? 'Preparing your stories…' : 'Update stories from my notes'}</button>
        </form>}</div>
        <section className="output-pane" aria-labelledby="drafts-heading" aria-busy={busy}>
          <div className="output-heading"><h2 id="drafts-heading">Your story drafts</h2><span className="draft-label">Start with what’s true</span></div>
          <p className="notice">{usedNotes ? <>These drafts use your notes. Click a number’s label to check its source. <strong>xx</strong> and <strong>[brackets]</strong> still need your real details.</> : <>These are starting points, not claims about your experience. Replace <strong>xx</strong> with verified numbers and <strong>[brackets]</strong> with details that actually happened.</>}</p>
          <p className="status" role="status">{busy ? 'Reading the role and drafting your stories. This may take a moment.' : stories.length ? 'Your three drafts are ready.' : ''}</p>
          {stories.length ? <div className="stories">{stories.map((story, index) => <article key={index} className="story" data-evidence={JSON.stringify(story.evidence ?? [])}>
            <h3 data-story-text={story.title}><StoryText story={story} field="title" storyIndex={index}/></h3>
            <p className="requirement" data-story-text={story.requirement}>For this role: <StoryText story={story} field="requirement" storyIndex={index}/></p>
            <dl>{(['situation', 'task', 'action', 'result'] as const).map(section => <div key={section}><dt>{section.charAt(0).toUpperCase() + section.slice(1)}</dt><dd data-story-text={story[section]}><StoryText story={story} field={section} storyIndex={index}/></dd></div>)}</dl>
          </article>)}</div> : !busy && <div className="empty"><div className="star-structure" aria-hidden="true"><span>Situation</span><span>Task</span><span>Action</span><span>Result</span></div><h3>A little structure goes a long way.</h3><p>Your drafts will connect the role’s requirements to experiences you can bring to an interview.</p><p className="empty-note">No made-up numbers. Every figure starts as <strong>xx</strong>.</p></div>}
        </section>
      </div>
    </main>
    <footer>A starting point for your real experience.</footer>
  </>;
}
const client = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
createRoot(document.getElementById('root')!).render(<StrictMode><ConvexProvider client={client}><App/></ConvexProvider></StrictMode>);
