import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Brief, CaptionsResult, Idea } from './types';
import './App.css'

const defaultBrief: Omit<Brief, 'id'> = {
  niche: '',
  tone: '',
  audience: '',
  goals: '',
  schedule: '',
  competitors: '',
  keywords: '',
};

const pages = [
  { title: 'Setup & Brand Brief', sub: 'Configure your brand once, used everywhere', ai: false, human: true },
  { title: 'Ideation', sub: 'AI generates & scores video concepts for your niche', ai: true, human: false },
  { title: 'Script Writer', sub: 'AI writes full hook + body + CTA scripts', ai: true, human: false },
  { title: 'Voice & Visuals', sub: 'Free tools to generate voice and visuals', ai: false, human: false },
  { title: 'Captions & Hashtags', sub: 'Platform-optimised copy for every channel', ai: true, human: false },
  { title: 'Review Checklist', sub: 'Quick quality gate before you publish', ai: false, human: true },
  { title: 'Analytics Digest', sub: 'Paste metrics — AI extracts what worked', ai: true, human: false },
];

const toneOptions = [
  'Educational',
  'Entertaining',
  'Motivational',
  'Funny/Witty',
  'Professional',
  'Raw/Authentic',
  'Luxury',
  'Minimalist',
];

const scheduleOptions = ['1x per week', '3x per week', 'Daily', '2x daily'];

const scriptStyles = [
  'Voiceover (no talking head)',
  'Talking head',
  'Text on screen only',
  'Hybrid',
];

const initialChecklist = [false, false, false, false, false, false];

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [brief, setBrief] = useState(defaultBrief);
  const [trend, setTrend] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [scriptDuration, setScriptDuration] = useState('30s');
  const [scriptStyle, setScriptStyle] = useState(scriptStyles[0]);
  const [scriptNotes, setScriptNotes] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [captionTopic, setCaptionTopic] = useState('');
  const [captions, setCaptions] = useState<CaptionsResult>({ tiktok: '', instagram: '', youtube: '' });
  const [activeCaptionPlatform, setActiveCaptionPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [checklist, setChecklist] = useState(initialChecklist);
  const [analyticsInput, setAnalyticsInput] = useState('');
  const [analyticsOutput, setAnalyticsOutput] = useState('');
  const [busy, setBusy] = useState({
    bootstrap: false,
    saveBrief: false,
    ideation: false,
    script: false,
    captions: false,
    analytics: false,
  });
  const [error, setError] = useState('');

  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? null,
    [ideas, selectedIdeaId],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setBusy((prev) => ({ ...prev, bootstrap: true }));
        const session = await api.getSession();
        if (Array.isArray(session.checklist) && session.checklist.length === 6) {
          setChecklist(session.checklist);
        }

        if (session.activeBriefId) {
          const loadedBrief = await api.getBrief(session.activeBriefId);
          setBriefId(loadedBrief.id ?? null);
          setBrief({
            niche: loadedBrief.niche,
            tone: loadedBrief.tone,
            audience: loadedBrief.audience,
            goals: loadedBrief.goals,
            schedule: loadedBrief.schedule,
            competitors: loadedBrief.competitors,
            keywords: loadedBrief.keywords,
          });
        }
      } catch (bootstrapError) {
        const message = bootstrapError instanceof Error ? bootstrapError.message : 'Failed to load session';
        setError(message);
      } finally {
        setBusy((prev) => ({ ...prev, bootstrap: false }));
      }
    };

    void bootstrap();
  }, []);

  const updateBriefField = (field: keyof Omit<Brief, 'id'>, value: string) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };

  const saveBrief = async () => {
    if (!brief.niche.trim()) {
      setError('Please enter a niche first');
      return;
    }

    try {
      setError('');
      setBusy((prev) => ({ ...prev, saveBrief: true }));

      const payload = { ...brief };
      const saved = briefId ? await api.updateBrief(briefId, payload) : await api.createBrief(payload);

      if (saved.id) {
        setBriefId(saved.id);
        await api.setActiveBrief(saved.id);
      }

      setCurrentPage(1);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save brief';
      setError(message);
    } finally {
      setBusy((prev) => ({ ...prev, saveBrief: false }));
    }
  };

  const runIdeation = async () => {
    if (!briefId) {
      setError('Save your brief before generating ideas.');
      return;
    }

    try {
      setError('');
      setBusy((prev) => ({ ...prev, ideation: true }));
      const generatedIdeas = await api.generateIdeas({
        briefId,
        trendingTopic: trend.trim() || undefined,
      });
      setIdeas(generatedIdeas);
      setSelectedIdeaId(null);
      setCaptionTopic('');
    } catch (ideationError) {
      const message = ideationError instanceof Error ? ideationError.message : 'Unable to generate ideas';
      setError(message);
    } finally {
      setBusy((prev) => ({ ...prev, ideation: false }));
    }
  };

  const runScript = async () => {
    if (!selectedIdea) {
      setError('Select an idea first.');
      return;
    }

    try {
      setError('');
      setBusy((prev) => ({ ...prev, script: true }));

      const script = await api.generateScript({
        ideaId: selectedIdea.id,
        duration: scriptDuration,
        style: scriptStyle,
        notes: scriptNotes.trim() || undefined,
      });

      setScriptText(script.content);
    } catch (scriptError) {
      const message = scriptError instanceof Error ? scriptError.message : 'Unable to generate script';
      setError(message);
    } finally {
      setBusy((prev) => ({ ...prev, script: false }));
    }
  };

  const runCaptions = async () => {
    if (!selectedIdea) {
      setError('Select an idea first.');
      return;
    }

    const topic = captionTopic.trim() || selectedIdea.hook;

    if (!topic) {
      setError('Add a topic or choose an idea with a hook.');
      return;
    }

    try {
      setError('');
      setBusy((prev) => ({ ...prev, captions: true }));
      const generated = await api.generateCaptions({
        ideaId: selectedIdea.id,
        topic,
      });
      setCaptions(generated);
    } catch (captionsError) {
      const message = captionsError instanceof Error ? captionsError.message : 'Unable to generate captions';
      setError(message);
    } finally {
      setBusy((prev) => ({ ...prev, captions: false }));
    }
  };

  const runAnalytics = async () => {
    if (!briefId) {
      setError('Save your brief first.');
      return;
    }

    if (!analyticsInput.trim()) {
      setError('Paste some analytics data first.');
      return;
    }

    try {
      setError('');
      setBusy((prev) => ({ ...prev, analytics: true }));
      const analysis = await api.generateAnalytics({
        briefId,
        metricsInput: analyticsInput,
      });
      setAnalyticsOutput(analysis);
    } catch (analyticsError) {
      const message = analyticsError instanceof Error ? analyticsError.message : 'Unable to analyze metrics';
      setError(message);
    } finally {
      setBusy((prev) => ({ ...prev, analytics: false }));
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError('Clipboard access is blocked in this browser context.');
    }
  };

  const copyVoiceover = async () => {
    if (!scriptText) return;
    const match = scriptText.match(/\[VOICEOVER SCRIPT\]([\s\S]*)$/);
    const text = match?.[1]?.trim() || scriptText;
    await copyToClipboard(text);
  };

  const toggleChecklist = (index: number) => {
    const next = checklist.map((item, idx) => (idx === index ? !item : item));
    setChecklist(next);
    void api.updateSession({ checklist: next }).catch(() => undefined);
  };

  const renderProgress = () => (
    <div className="progress-strip">
      {pages.map((_, index) => (
        <div
          key={index}
          className={`progress-step${index < currentPage ? ' done' : ''}${index === currentPage ? ' current' : ''}`}
        />
      ))}
    </div>
  );

  const renderError =
    error.length > 0 ? (
      <div className="tip-box tip-error" role="alert">
        {error}
      </div>
    ) : null;

  const renderBriefPage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-purple">✦</div> Brand Brief
        </div>
        <div className="row field">
          <div>
            <label htmlFor="niche">Niche / Industry</label>
            <input
              id="niche"
              placeholder="e.g. Personal finance, fitness, cooking…"
              value={brief.niche}
              onChange={(event) => updateBriefField('niche', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tone">Brand Tone</label>
            <select id="tone" value={brief.tone} onChange={(event) => updateBriefField('tone', event.target.value)}>
              <option value="">Select tone…</option>
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="audience">Target Audience</label>
          <input
            id="audience"
            placeholder="e.g. Women 25–35 interested in budgeting and financial freedom"
            value={brief.audience}
            onChange={(event) => updateBriefField('audience', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="goals">Content Goals</label>
          <input
            id="goals"
            placeholder="e.g. Grow followers, drive newsletter signups, sell digital product"
            value={brief.goals}
            onChange={(event) => updateBriefField('goals', event.target.value)}
          />
        </div>
        <div className="row field">
          <div>
            <label htmlFor="schedule">Posting Schedule</label>
            <select
              id="schedule"
              value={brief.schedule}
              onChange={(event) => updateBriefField('schedule', event.target.value)}
            >
              <option value="">Select…</option>
              {scheduleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="competitors">Main Competitors / Inspirations</label>
            <input
              id="competitors"
              placeholder="e.g. @GrahamStephan, @AliAbdaal"
              value={brief.competitors}
              onChange={(event) => updateBriefField('competitors', event.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="keywords">Keywords / Topics to cover</label>
          <textarea
            id="keywords"
            placeholder="e.g. budgeting tips, investing for beginners, saving money hacks, side hustles"
            value={brief.keywords}
            onChange={(event) => updateBriefField('keywords', event.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={saveBrief} disabled={busy.saveBrief}>
            {busy.saveBrief ? 'Saving…' : 'Save Brief & Continue →'}
          </button>
        </div>
      </div>
      <div className="tip-box">
        💡 Fill this once. Every AI step (ideation, scripts, captions) reuses your saved brand brief.
      </div>
    </>
  );

  const renderIdeationPage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-purple">✦</div> What's trending this week? (optional)
        </div>
        <div className="field">
          <label htmlFor="trend">Trending topics or hooks you've spotted</label>
          <input
            id="trend"
            placeholder="e.g. viral savings challenge, 30-day reset"
            value={trend}
            onChange={(event) => setTrend(event.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={runIdeation} disabled={busy.ideation || !briefId}>
            {busy.ideation ? 'Generating…' : 'Generate 6 Ideas with AI →'}
          </button>
        </div>
      </div>

      {ideas.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="icon icon-green">★</div> Select an idea to script
          </div>
          <div className="ideas-grid">
            {ideas.map((idea) => (
              <button
                type="button"
                key={idea.id}
                className={`idea-card ${selectedIdeaId === idea.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedIdeaId(idea.id);
                  setCaptionTopic(idea.hook);
                  setScriptDuration(idea.duration || '30s');
                }}
              >
                <div className="idea-num">IDEA {idea.num} · Score {idea.score}/100</div>
                <div className="idea-hook">“{idea.hook}”</div>
                <div className="idea-concept">{idea.concept}</div>
                <div className="idea-meta">
                  <span className="tag">{idea.format}</span>
                  <span className="tag">{idea.duration}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setCurrentPage(2)}
              disabled={!selectedIdeaId}
            >
              Write Script for Selected Idea →
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderScriptPage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-purple">✦</div> Script Settings
        </div>
        {selectedIdea && (
          <div className="tip-box tip-compact">Using idea: “{selectedIdea.hook}” · {selectedIdea.format}</div>
        )}
        <div className="row field">
          <div>
            <label htmlFor="script-duration">Video Duration</label>
            <select
              id="script-duration"
              value={scriptDuration}
              onChange={(event) => setScriptDuration(event.target.value)}
            >
              {['15s', '30s', '45s', '60s', '90s'].map((duration) => (
                <option key={duration} value={duration}>
                  {duration}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="script-style">Style</label>
            <select id="script-style" value={scriptStyle} onChange={(event) => setScriptStyle(event.target.value)}>
              {scriptStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="script-notes">Extra notes (optional)</label>
          <input
            id="script-notes"
            placeholder="e.g. Mention free guide and keep language simple"
            value={scriptNotes}
            onChange={(event) => setScriptNotes(event.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={runScript} disabled={!selectedIdea || busy.script}>
            {busy.script ? 'Writing…' : 'Generate Full Script →'}
          </button>
        </div>
      </div>

      {scriptText && (
        <div className="card">
          <div className="card-title">
            <div className="icon icon-green">✎</div> Generated Script
          </div>
          <div className="output-box">
            {scriptText}
            <button className="copy-btn" type="button" onClick={() => copyToClipboard(scriptText)}>
              Copy
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setCurrentPage(3)}>
              Next: Voice & Visuals →
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={copyVoiceover}>
              Copy Voiceover Only
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderVoicePage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-blue">🎙</div> Step 1 — Generate Voiceover (Free)
        </div>
        <div className="tip-box tip-compact">Copy the VOICEOVER SCRIPT from Step 2 and paste it into ElevenLabs.</div>
        <div className="ext-grid">
          <a className="ext-card" href="https://elevenlabs.io" target="_blank" rel="noreferrer">
            <div className="ext-name">ElevenLabs</div>
            <div className="ext-desc">Best AI voice quality. Free 10k chars/mo</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
          <a className="ext-card" href="https://murf.ai" target="_blank" rel="noreferrer">
            <div className="ext-name">Murf AI</div>
            <div className="ext-desc">Free plan, studio-quality voices</div>
            <span className="ext-price badge badge-free">Free trial</span>
          </a>
          <a className="ext-card" href="https://ttsmaker.com" target="_blank" rel="noreferrer">
            <div className="ext-name">TTSMaker</div>
            <div className="ext-desc">Unlimited free TTS, many voices</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="icon icon-blue">🎬</div> Step 2 — Get Free Stock Visuals
        </div>
        <div className="ext-grid">
          <a className="ext-card" href="https://pexels.com/videos" target="_blank" rel="noreferrer">
            <div className="ext-name">Pexels Videos</div>
            <div className="ext-desc">HD stock video, no attribution needed</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
          <a className="ext-card" href="https://pixabay.com/videos" target="_blank" rel="noreferrer">
            <div className="ext-name">Pixabay Videos</div>
            <div className="ext-desc">Large free library, commercial use ok</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
          <a className="ext-card" href="https://mixkit.co" target="_blank" rel="noreferrer">
            <div className="ext-name">Mixkit</div>
            <div className="ext-desc">Free video clips + templates</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div className="icon icon-blue">✂️</div> Step 3 — Assemble the Reel (Free)
        </div>
        <div className="ext-grid">
          <a className="ext-card" href="https://www.capcut.com" target="_blank" rel="noreferrer">
            <div className="ext-name">CapCut (Desktop)</div>
            <div className="ext-desc">Auto-captions, transitions, B-roll sync, templates</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
          <a className="ext-card" href="https://www.canva.com/video-editor" target="_blank" rel="noreferrer">
            <div className="ext-name">Canva Video</div>
            <div className="ext-desc">Great for text-heavy reels and branded templates</div>
            <span className="ext-price badge badge-free">Free</span>
          </a>
          <a className="ext-card" href="https://invideo.io" target="_blank" rel="noreferrer">
            <div className="ext-name">InVideo AI</div>
            <div className="ext-desc">Text-to-video — paste script, get video</div>
            <span className="ext-price badge badge-free">4 exports/wk free</span>
          </a>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="button" onClick={() => setCurrentPage(4)}>
          Next: Captions & Hashtags →
        </button>
      </div>
    </>
  );

  const renderCaptionsPage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-purple">✦</div> Generate Captions & Hashtags
        </div>
        <div className="field">
          <label htmlFor="caption-topic">Video topic / reel hook</label>
          <input
            id="caption-topic"
            placeholder="e.g. 3 budgeting mistakes I made in my 20s"
            value={captionTopic}
            onChange={(event) => setCaptionTopic(event.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={runCaptions} disabled={!selectedIdea || busy.captions}>
            {busy.captions ? 'Generating…' : 'Generate for All Platforms →'}
          </button>
        </div>
      </div>

      {captions.tiktok && (
        <div className="card">
          <div className="card-title">
            <div className="icon icon-green">✎</div> Platform Captions
          </div>
          <div className="platform-tabs">
            {[
              { id: 'tiktok', label: 'TikTok' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'youtube', label: 'YouTube Shorts' },
            ].map((platform) => (
              <button
                key={platform.id}
                className={`p-tab ${activeCaptionPlatform === platform.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveCaptionPlatform(platform.id as 'tiktok' | 'instagram' | 'youtube')}
              >
                {platform.label}
              </button>
            ))}
          </div>
          <div className="output-box">
            {captions[activeCaptionPlatform]}
            <button
              className="copy-btn"
              type="button"
              onClick={() => copyToClipboard(captions[activeCaptionPlatform])}
            >
              Copy
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setCurrentPage(5)}>
              Next: Review →
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderReviewPage = () => {
    const items = [
      { label: 'Hook lands in first 2 seconds', sub: 'Is the opening line punchy enough to stop the scroll?' },
      { label: 'Captions are accurate', sub: 'Check auto-captions in CapCut for errors before export' },
      { label: 'Audio is clear, no clipping', sub: 'Listen through once at normal volume' },
      { label: 'Brand tone is consistent', sub: 'Does it sound like your brand voice?' },
      { label: 'CTA is clear', sub: 'Is it obvious what the viewer should do next?' },
      { label: 'Caption & hashtags copied', sub: 'Ready to paste into TikTok, Instagram, YouTube Shorts' },
    ];

    return (
      <>
        {renderProgress()}
        <div className="card">
          <div className="card-title">
            <div className="icon icon-amber">✓</div> Pre-Publish Checklist
          </div>
          <div className="checklist">
            {items.map((item, index) => (
              <button
                type="button"
                key={item.label}
                className={`check-item ${checklist[index] ? 'checked' : ''}`}
                onClick={() => toggleChecklist(index)}
              >
                <div className="check-box">{checklist[index] ? '✓' : ''}</div>
                <div>
                  <div className="check-label">{item.label}</div>
                  <div className="check-sub">{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="button" onClick={() => setCurrentPage(3)}>
              ← Back to Voice & Visuals
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setCurrentPage(6)}>
              View Analytics Setup →
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderAnalyticsPage = () => (
    <>
      {renderProgress()}
      <div className="card">
        <div className="card-title">
          <div className="icon icon-purple">✦</div> Paste Your Performance Data
        </div>
        <div className="field">
          <label htmlFor="analytics">Paste metrics from TikTok/IG/YouTube studio</label>
          <textarea
            id="analytics"
            style={{ minHeight: 140 }}
            value={analyticsInput}
            onChange={(event) => setAnalyticsInput(event.target.value)}
            placeholder={`Reel 1: 48k views, 3.2% like rate, 890 shares, 12s avg watch time\nReel 2: 12k views, 1.8% like rate, 120 shares, 8s avg watch time`}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={runAnalytics} disabled={busy.analytics || !briefId}>
            {busy.analytics ? 'Analysing…' : 'Analyse with AI →'}
          </button>
        </div>
      </div>

      {analyticsOutput && (
        <div className="card">
          <div className="card-title">
            <div className="icon icon-green">★</div> AI Insights
          </div>
          <div className="output-box">
            {analyticsOutput}
            <button className="copy-btn" type="button" onClick={() => copyToClipboard(analyticsOutput)}>
              Copy
            </button>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setCurrentPage(1)}>
              Use insights → Generate new ideas ↗
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 0:
        return renderBriefPage();
      case 1:
        return renderIdeationPage();
      case 2:
        return renderScriptPage();
      case 3:
        return renderVoicePage();
      case 4:
        return renderCaptionsPage();
      case 5:
        return renderReviewPage();
      case 6:
        return renderAnalyticsPage();
      default:
        return renderBriefPage();
    }
  };

  return (
    <div className="app-shell">
      <aside>
        <div className="logo">
          <div className="logo-icon">R</div>
          <div>
            <div className="logo-text">ReelStudio</div>
            <div className="logo-sub">AI Automation</div>
          </div>
        </div>
        <nav>
          <div className="nav-section">Workflow</div>
          {pages.map((page, index) => (
            <button
              key={page.title}
              className={`nav-item ${currentPage === index ? 'active' : ''}`}
              type="button"
              onClick={() => setCurrentPage(index)}
            >
              <div className="nav-step">{index}</div>
              {page.title}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="api-badge">
            <div className="api-dot" /> Node API connected
          </div>
        </div>
      </aside>

      <main>
        <div className="topbar">
          <div>
            <div className="topbar-title">{pages[currentPage].title}</div>
            <div className="topbar-sub">{pages[currentPage].sub}</div>
          </div>
          <div className="topbar-right">
            <span className="badge badge-free">Single-user mode</span>
            {pages[currentPage].ai && <span className="badge badge-ai">AI step</span>}
            {pages[currentPage].human && <span className="badge badge-human">Human step</span>}
          </div>
        </div>
        <div className="content">
          {busy.bootstrap ? (
            <div className="welcome">
              <h1>Loading your workspace…</h1>
            </div>
          ) : (
            <>
              {renderError}
              {renderContent()}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
