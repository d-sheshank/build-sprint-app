import { StrictMode, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient, useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import type { Story } from './storyRules';
import './style.css';

function App() {
  const generate = useAction(api.stories.generate);
  const [jd, setJd] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [busy, setBusy] = useState(false);
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
    setStories([]);
    try {
      setStories(await generate({ jobDescription: jd }));
    } catch (error) {
      setError(error instanceof ConvexError && typeof error.data === 'string' ? error.data : 'Could not generate your drafts. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return <>
    <header className="masthead"><a href="/" aria-label="Story prep home" className="brand"><svg width="25" height="27" viewBox="0 0 25 27" fill="none" aria-hidden="true"><path d="M3 3h12v7H3zM10 10h12v7H10zM3 17h12v7H3z" stroke="currentColor" strokeWidth="2"/></svg>Story prep</a><span>Interview preparation</span></header>
    <main>
      <div className="intro"><h1>Your experience.<br/>A clearer story.</h1><p>Start with the job description. Get three drafts in the STAR format: situation, task, action and result.</p></div>
      <div className="workspace">
        <form onSubmit={submit} className="input-pane">
          <h2>The role you’re preparing for</h2>
          <label htmlFor="jd">Job description</label>
          <p className="help" id="jd-help">Paste the role’s responsibilities and requirements.</p>
          <textarea id="jd" aria-describedby="jd-help jd-note" maxLength={20000} value={jd} onChange={event => setJd(event.target.value)} disabled={busy} placeholder="Paste the job description here…" spellCheck={false}/>
          <p className="help" id="jd-note">Only a job description is needed. Your drafts stay on this page until you close or refresh it.</p>
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" disabled={busy || !jd.trim()}>{busy ? 'Preparing your stories…' : stories.length ? 'Generate new stories' : 'Generate three stories'}<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></button>
        </form>
        <section className="output-pane" aria-labelledby="drafts-heading" aria-busy={busy}>
          <div className="output-heading"><h2 id="drafts-heading">Your story drafts</h2><span className="draft-label">Start with what’s true</span></div>
          <p className="notice">These are starting points, not claims about your experience. Replace <strong>xx</strong> with verified numbers and <strong>[brackets]</strong> with details that actually happened.</p>
          <p className="status" role="status">{busy ? 'Reading the role and drafting your stories. This may take a moment.' : stories.length ? 'Your three drafts are ready.' : ''}</p>
          {stories.length ? <div className="stories">{stories.map((story, index) => <article key={index} className="story">
            <h3>{story.title}</h3>
            <p className="requirement">For this role: {story.requirement}</p>
            <dl>{(['situation', 'task', 'action', 'result'] as const).map(section => <div key={section}><dt>{section.charAt(0).toUpperCase() + section.slice(1)}</dt><dd>{story[section]}</dd></div>)}</dl>
          </article>)}</div> : !busy && <div className="empty"><div className="star-structure" aria-hidden="true"><span>Situation</span><span>Task</span><span>Action</span><span>Result</span></div><h3>A little structure goes a long way.</h3><p>Your drafts will connect the role’s requirements to experiences you can bring to an interview.</p><p className="empty-note">No made-up numbers. Every figure starts as <strong>xx</strong>.</p></div>}
        </section>
      </div>
    </main>
    <footer>A starting point for your real experience.</footer>
  </>;
}
const client = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
createRoot(document.getElementById('root')!).render(<StrictMode><ConvexProvider client={client}><App/></ConvexProvider></StrictMode>);
