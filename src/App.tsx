import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlueprintMap } from './components/BlueprintMap';
import { TitleLandscape } from './components/TitleLandscape';
import { BuildSequence } from './components/hud/BuildSequence';
import { DistrictInspector } from './components/hud/DistrictInspector';
import { SpiritDialogue } from './components/hud/SpiritDialogue';
import { TitleScreen } from './components/hud/TitleScreen';
import { WorldHUD } from './components/hud/WorldHUD';
import { WorldJournal } from './components/hud/WorldJournal';
import { spiritForFolder } from './data/spirits';
import { askSpirit, directoriesFor, inspectRepository } from './lib/github';
import type { AppPhase, ChatMessage, RepositoryData } from './types';

const WorldCanvas = lazy(() => import('./components/WorldCanvas').then((module) => ({ default: module.WorldCanvas })));

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('title');
  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [error, setError] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [focusVersion, setFocusVersion] = useState(0);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [talking, setTalking] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const buildTimer = useRef<number | undefined>(undefined);
  const guideRequest = useRef(0);
  const selectedFolderRef = useRef<string | null>(null);
  const handleWebGLFailure = useCallback(() => setWebglFailed(true), []);

  const directories = useMemo(() => repository ? directoriesFor(repository) : [], [repository]);
  const activeDirectory = directories.find((directory) => directory.name === selectedFolder) || null;
  useEffect(() => () => { if (buildTimer.current) window.clearTimeout(buildTimer.current); }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (journalOpen) setJournalOpen(false);
      else if (blueprintOpen) setBlueprintOpen(false);
      else if (talking) setTalking(false);
      else { selectedFolderRef.current = null; setSelectedFolder(null); setSelectedFile(null); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [blueprintOpen, journalOpen, talking]);

  const analyze = useCallback(async (url: string) => {
    if (buildTimer.current) window.clearTimeout(buildTimer.current);
    guideRequest.current += 1;
    setChatBusy(false);
    selectedFolderRef.current = null;
    setError('');
    setRepository(null);
    setSelectedFolder(null);
    setSelectedFile(null);
    setConversation([]);
    setJournalOpen(false);
    setBlueprintOpen(false);
    setWebglFailed(false);
    setPhase('scanning');
    try {
      const data = await inspectRepository(url);
      setRepository(data);
      selectedFolderRef.current = null;
      setSelectedFolder(null);
      setSelectedFile(null);
      setPhase('building');
      buildTimer.current = window.setTimeout(() => setPhase('explore'), 2450);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'GitHub could not map that repository.');
      setPhase('title');
    }
  }, []);

  const chooseFolder = useCallback((folder: string) => {
    if (selectedFolderRef.current !== folder) { guideRequest.current += 1; setChatBusy(false); setConversation([]); }
    selectedFolderRef.current = folder;
    setSelectedFolder(folder);
    setSelectedFile(null);
    setFocusVersion((version) => version + 1);
    setTalking(false);
  }, []);

  const chooseFile = useCallback((folder: string, path: string) => {
    if (selectedFolderRef.current !== folder) { guideRequest.current += 1; setChatBusy(false); setConversation([]); }
    selectedFolderRef.current = folder;
    setSelectedFolder(folder);
    setSelectedFile(path);
    setFocusVersion((version) => version + 1);
    setTalking(false);
  }, []);

  const openSpirit = useCallback((folder: string) => {
    if (selectedFolderRef.current !== folder) { guideRequest.current += 1; setChatBusy(false); setConversation([]); }
    selectedFolderRef.current = folder;
    setSelectedFolder(folder);
    setSelectedFile(null);
    setFocusVersion((version) => version + 1);
    setTalking(true);
  }, []);

  const chooseInspectorFile = useCallback((path: string) => {
    setSelectedFile(path);
    setFocusVersion((version) => version + 1);
  }, []);

  const clearSelection = useCallback(() => {
    selectedFolderRef.current = null;
    setSelectedFolder(null);
    setSelectedFile(null);
    setFocusVersion((version) => version + 1);
  }, []);

  const sendQuestion = useCallback(async (question: string) => {
    if (!repository || !selectedFolder || chatBusy) return;
    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextConversation = [...conversation, userMessage];
    const requestId = ++guideRequest.current;
    setConversation(nextConversation);
    setChatBusy(true);
    try {
      const profile = spiritForFolder(selectedFolder, repository.structure);
      const result = await askSpirit(repository, selectedFolder, profile.id, nextConversation);
      if (requestId === guideRequest.current) setConversation((messages) => [...messages, {
        role: 'assistant',
        content: result.answer,
        headline: result.headline,
        points: result.points,
        nextStep: result.nextStep,
        evidence: result.evidence,
      }]);
    } catch (cause) {
      if (requestId !== guideRequest.current) return;
      const message = cause instanceof Error ? cause.message : 'The guide could not answer just now.';
      setConversation((messages) => [...messages, {
        role: 'assistant',
        content: `${message} The map and file links are still here if you want to keep exploring.`,
      }]);
    } finally {
      if (requestId === guideRequest.current) setChatBusy(false);
    }
  }, [chatBusy, conversation, repository, selectedFolder]);

  const goHome = useCallback(() => {
    if (buildTimer.current) window.clearTimeout(buildTimer.current);
    guideRequest.current += 1;
    setChatBusy(false);
    selectedFolderRef.current = null;
    setPhase('title');
    setRepository(null);
    setSelectedFolder(null);
    setSelectedFile(null);
    setConversation([]);
    setJournalOpen(false);
    setBlueprintOpen(false);
    setError('');
    setWebglFailed(false);
  }, []);

  const selectAtlasDistrict = (folder: string) => {
    chooseFolder(folder);
    setBlueprintOpen(false);
  };

  return <div className={`app-shell phase-${phase}`}>
    {phase === 'title' && <TitleLandscape />}
    {phase !== 'title' && (!blueprintOpen || phase === 'scanning' || phase === 'building') && !webglFailed && <Suspense fallback={<div className="world-canvas loading-landscape"><TitleLandscape /></div>}><WorldCanvas
      data={repository}
      phase={phase}
      selectedFolder={selectedFolder}
      selectedFile={selectedFile}
      focusVersion={focusVersion}
      onDistrict={chooseFolder}
      onFile={chooseFile}
      onSpirit={openSpirit}
      onFailure={handleWebGLFailure}
    /></Suspense>}
    {phase === 'title' && <TitleScreen error={error} onAnalyze={analyze} />}
    {(phase === 'scanning' || phase === 'building') && <BuildSequence phase={phase} data={repository} />}

    {phase === 'explore' && repository && webglFailed && <BlueprintMap data={repository} selectedFolder={selectedFolder} fallback onSelect={chooseFolder} onClose={goHome} />}
    {phase === 'explore' && repository && !webglFailed && blueprintOpen && <BlueprintMap data={repository} selectedFolder={selectedFolder} onSelect={selectAtlasDistrict} onClose={() => setBlueprintOpen(false)} />}

    {phase === 'explore' && repository && (webglFailed || !blueprintOpen) && activeDirectory && talking && <SpiritDialogue
      key={activeDirectory.name}
      data={repository}
      directory={activeDirectory}
      messages={conversation}
      busy={chatBusy}
      onSend={sendQuestion}
      onClose={() => setTalking(false)}
    />}
    {phase === 'explore' && repository && (webglFailed || !blueprintOpen) && activeDirectory && !talking && <DistrictInspector
      key={activeDirectory.name}
      data={repository}
      directory={activeDirectory}
      selectedFile={selectedFile}
      onClose={clearSelection}
      onTalk={() => setTalking(true)}
      onFile={chooseInspectorFile}
    />}

    {phase === 'explore' && repository && !blueprintOpen && !webglFailed && <>
      <WorldHUD
        data={repository}
        selectedFolder={selectedFolder}
        onSelect={chooseFolder}
        onJournal={() => setJournalOpen(true)}
        onBlueprint={() => setBlueprintOpen(true)}
        onHome={goHome}
      />
      {journalOpen && <WorldJournal data={repository} onClose={() => setJournalOpen(false)} />}
    </>}
  </div>;
}
