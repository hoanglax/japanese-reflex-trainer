import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ReflexTraining } from './components/ReflexTraining';
import { VocabManager } from './components/VocabManager';
import { DataEntry } from './components/DataEntry';
import { Analytics } from './components/Analytics';
import { DeveloperStudio } from './components/DeveloperStudio';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { INITIAL_VOCAB } from './data/initialVocab';
import { VocabItem, PracticeLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('reflex');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [apiConfigured, setApiConfigured] = useState<boolean>(true);

  // Local storage persistence for vocab list
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    const saved = localStorage.getItem('jp_reflex_vocab');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_VOCAB;
  });

  // Local storage persistence for practice logs
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>(() => {
    const saved = localStorage.getItem('jp_reflex_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('jp_reflex_vocab', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('jp_reflex_logs', JSON.stringify(practiceLogs));
  }, [practiceLogs]);

  // Check health endpoint
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiConfigured(data.aiConfigured))
      .catch(() => setApiConfigured(false));
  }, []);

  // Hotkey '?' handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Add new single item
  const handleAddVocab = (itemData: Omit<VocabItem, 'id' | 'createdAt' | 'srsLevel' | 'easeFactor' | 'intervalDays' | 'nextReview' | 'masteryScore'>) => {
    const newItem: VocabItem = {
      ...itemData,
      id: `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      srsLevel: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      nextReview: new Date().toISOString(),
      masteryScore: 0,
    };
    setVocabList((prev) => [newItem, ...prev]);
  };

  // Bulk add items (from CSV/JSON/AI)
  const handleBulkAddVocab = (rawItems: any[]) => {
    const newItems: VocabItem[] = rawItems.map((raw, idx) => ({
      id: `vocab-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      japanese: raw.japanese || '',
      kana: raw.kana || '',
      romaji: raw.romaji || '',
      vietnamese: raw.vietnamese || '',
      type: raw.type || 'Từ vựng',
      jlpt: raw.jlpt || 'N3',
      exampleJp: raw.exampleJp || raw.example_jp || '',
      exampleVi: raw.exampleVi || raw.example_vi || '',
      notes: raw.notes || '',
      createdAt: new Date().toISOString(),
      srsLevel: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      nextReview: new Date().toISOString(),
      masteryScore: 0,
    }));

    setVocabList((prev) => [...newItems, ...prev]);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setVocabList((prev) => prev.filter((item) => item.id !== id));
  };

  // Update SRS Score
  const handleUpdateSRS = (vocabId: string, score: number) => {
    setVocabList((prev) =>
      prev.map((item) => {
        if (item.id === vocabId) {
          const newScore = Math.min(100, Math.max(0, (item.masteryScore || 0) + (score >= 75 ? 15 : -10)));
          return { ...item, masteryScore: newScore };
        }
        return item;
      })
    );
  };

  // Record practice log
  const handleRecordLog = (logData: any) => {
    const newLog: PracticeLog = {
      ...logData,
      id: `log-${Date.now()}`,
    };
    setPracticeLogs((prev) => [...prev, newLog]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vocabCount={vocabList.length}
        apiConfigured={apiConfigured}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Workspace Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {activeTab === 'reflex' && (
          <ReflexTraining
            vocabList={vocabList}
            onUpdateSRS={handleUpdateSRS}
            onRecordLog={handleRecordLog}
          />
        )}

        {activeTab === 'repository' && (
          <VocabManager
            vocabList={vocabList}
            onDeleteItem={handleDeleteItem}
            onNavigateToEntry={() => setActiveTab('data-entry')}
          />
        )}

        {activeTab === 'data-entry' && (
          <DataEntry
            onAddVocab={handleAddVocab}
            onBulkAddVocab={handleBulkAddVocab}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            practiceLogs={practiceLogs}
            vocabList={vocabList}
          />
        )}

        {activeTab === 'dev-studio' && <DeveloperStudio />}
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
