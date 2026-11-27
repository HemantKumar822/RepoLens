import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { ChatMessage, DirectoryNode, RepositoryData } from '../../types';
import { githubFileUrl } from '../../lib/github';
import { spiritForFolder } from '../../data/spirits';

interface Props {
  data: RepositoryData;
  directory: DirectoryNode;
  messages: ChatMessage[];
  busy: boolean;
  onSend: (question: string) => void;
  onClose: () => void;
}

export function SpiritDialogue({ data, directory, messages, busy, onSend, onClose }: Props) {
  const profile = spiritForFolder(directory.name, data.structure);
  const [question, setQuestion] = useState('');
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => { if (history.current) history.current.scrollTop = history.current.scrollHeight; }, [messages, busy]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || busy) return;
    onSend(question.trim());
    setQuestion('');
  };

  return <aside className="spirit-panel" aria-label={`Talk with ${profile.name}`}>
    <div className="spirit-panel-top"><span>AI FIELD GUIDE / {directory.name}</span><button className="close-control" onClick={onClose} aria-label="Close conversation">×</button></div>
    <div className="spirit-profile">
      <div className={`spirit-portrait spirit-${profile.role}`} aria-hidden="true"><i /><b /><span /></div>
      <div><h2>{profile.name} <small>{profile.title}</small></h2><p>{profile.greeting}</p></div>
    </div>
    <div className="grounding-note"><span className="grounding-glyph" aria-hidden="true">⌁</span><span>Reads a few repo files. Every source link opens the exact file.</span></div>
    <div className="chat-history" ref={history} role="log" aria-label={`${profile.name} conversation`} aria-live="polite" aria-relevant="additions text">
      {messages.map((message, index) => <div className={`chat-message ${message.role === 'user' ? 'player-message' : `guide-message guide-${profile.role}`}`} key={`${index}-${message.role}`}>
        {message.role === 'user' ? <><span className="chat-author">YOU</span><p>{message.content}</p></> : <>
          <div className="guide-answer-top"><span className="chat-author">AI GUIDE · {profile.name.toUpperCase()}</span><span className="guide-sigil" aria-hidden="true">{profile.symbol}</span></div>
          {message.headline && <h3 className="guide-headline">{message.headline}</h3>}
          <p>{message.content}</p>
          {message.points?.length ? <ul className="guide-points">{message.points.map((point, pointIndex) => <li key={`${pointIndex}-${point}`}>{point}</li>)}</ul> : null}
          {message.nextStep && <button className="guide-next-step" onClick={() => onSend(message.nextStep!)} disabled={busy}>
            <span>NEXT TRAIL</span><strong>{message.nextStep}</strong><b aria-hidden="true">↗</b>
          </button>}
        </>}
        {message.evidence?.length ? <div className="evidence-links" aria-label="Sources for this reply"><span>OPEN THE SOURCES</span>{message.evidence.map((path) => <a key={path} href={githubFileUrl(data.repository.url, data.repository.defaultBranch, path)} target="_blank" rel="noreferrer">{path} ↗</a>)}</div> : null}
      </div>)}
      {busy && <div className="chat-thinking" role="status"><span /><span /><span /> {profile.name} is checking the files</div>}
      {!messages.length && <div className="chat-start"><span>START A TRAIL</span><p>Pick a question or ask your own.</p><div className="question-suggestions">{profile.questions.map((suggestion) => <button key={suggestion} onClick={() => onSend(suggestion)} disabled={busy}>{suggestion}<span aria-hidden="true">↗</span></button>)}</div></div>}
    </div>
    <form className="chat-composer" onSubmit={submit}>
      <label htmlFor="spirit-question">ASK {profile.name.toUpperCase()}</label>
      <div><input id="spirit-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={400} placeholder="What should I read first?" disabled={busy} /><button disabled={!question.trim() || busy} aria-label="Send question">{busy ? '…' : '↑'}</button></div>
      <small>Public repository files only.</small>
    </form>
  </aside>;
}
