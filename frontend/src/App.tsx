import { useState } from 'react';
import axios from 'axios';

interface PredictionResult {
  prediction: string;
  confidence: string;
  original_image: string;
  heatmap_image: string;
  contour_image: string;
}

const SAMPLES = [
  { id: '01', name: 'Acute Otitis Media',   key: 'AcuteOtitisMedia' },
  { id: '02', name: 'Chronic Otitis Media', key: 'ChronicOtitisMedia' },
  { id: '03', name: 'Earwax Impaction',     key: 'EarwaxImpaction' },
  { id: '04', name: 'Normal',               key: 'Normal' },
  { id: '05', name: 'Tympanosclerosis',     key: 'Tympanosclerosis' },
];

const CONDITION_INFO: Record<string, { summary: string; note: string }> = {
  AcuteOtitisMedia: {
    summary: 'A sudden bacterial or viral infection of the middle ear, causing inflammation and fluid build-up behind the eardrum. Commonly presents with ear pain, fever, and temporary hearing reduction.',
    note: 'Typically resolves with antibiotics or watchful waiting depending on severity and patient age.',
  },
  ChronicOtitisMedia: {
    summary: 'A persistent or recurring infection of the middle ear lasting more than three months. Often associated with a perforated eardrum and ongoing discharge. Can lead to long-term hearing loss if untreated.',
    note: 'Management may include ear drops, antibiotics, or surgical intervention such as tympanoplasty.',
  },
  EarwaxImpaction: {
    summary: 'An excessive build-up of cerumen (earwax) that partially or fully blocks the ear canal. Can cause muffled hearing, a sensation of fullness, and occasional tinnitus.',
    note: 'Treated with irrigation, manual removal, or softening drops. Avoid cotton swabs as they push wax deeper.',
  },
  Normal: {
    summary: 'The tympanic membrane appears healthy — translucent, intact, and with a normal light reflex. No signs of infection, perforation, fluid, or abnormal tissue detected.',
    note: 'No intervention required. Routine follow-up as clinically indicated.',
  },
  Tympanosclerosis: {
    summary: 'Calcified white plaques on the tympanic membrane resulting from prior inflammation or repeated ear infections. The deposits are typically benign and do not always affect hearing.',
    note: 'Most cases require no treatment. Audiological assessment is recommended if hearing loss is suspected.',
  },
};

const inter   = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const RED     = '#7f1d1d';
const BG      = '#f5f0ed';
const SURFACE = '#ede8e4';
const WHITE   = '#faf7f5';

function ResultImage({ label, src }: { label: string; src: string }) {
  return (
    <div>
      <div style={{ aspectRatio: '1', background: SURFACE, borderRadius: 10, border: '1px solid #ddd8d4', overflow: 'hidden' }}>
        <img src={`data:image/png;base64,${src}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={label} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 500, color: '#aaa49f', textAlign: 'center', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function App() {
  const [file, setFile]                     = useState<File | null>(null);
  const [preview, setPreview]               = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<PredictionResult | null>(null);
  const [statusMessage, setStatusMessage]   = useState('Analyzing...');
  const [tab, setTab]                       = useState<'upload' | 'sample'>('upload');
  const [selectedSample, setSelectedSample] = useState<typeof SAMPLES[0] | null>(null);

  const formatLabel = (label: string) => label.replace(/([A-Z])/g, ' $1').trim();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload  = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });

  const canRun = !loading && (tab === 'upload' ? !!file : !!selectedSample);

  const runAnalysis = async () => {
    if (!canRun) return;
    setLoading(true);
    setResult(null);
    setStatusMessage('Waking up the GPU...');
    const timer = setTimeout(
      () => setStatusMessage('Server is cold starting (this may take up to 2 mins)...'),
      10000,
    );
    try {
      const base64Image =
        tab === 'upload' && file
          ? await fileToBase64(file)
          : selectedSample!.key;
      const res = await axios.post('/api/predict', { input: { image: base64Image } });
      if (res.data?.output) setResult(res.data.output);
    } catch (err) {
      console.error('Error calling AI:', err);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const conditionInfo = result ? CONDITION_INFO[result.prediction] : null;

  return (
    <div style={{ fontFamily: inter, background: BG, height: '100vh', display: 'flex', alignItems: 'flex-start', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(127,29,29,0.15); border-radius: 2px; }
        .left-scroll::-webkit-scrollbar { width: 3px; }
        .left-scroll::-webkit-scrollbar-track { background: transparent; margin: 20px 0; }
        .left-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 100px; transition: background 0.2s; }
        .left-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
        .left-scroll:hover::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
        .left-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .left-scroll:hover { scrollbar-color: rgba(255,255,255,0.2) transparent; }
      `}</style>

      {/* ── LEFT — burgundy floating panel ── */}
      <div className="left-scroll" style={{
        width: 340, flexShrink: 0,
        margin: 16,
        borderRadius: 20,
        boxShadow: 'none',
        height: 'calc(100vh - 32px)',
        overflowY: 'scroll',
        overflowX: 'hidden',
        background: RED,
      }}>
        <div style={{
          width: '100%', minHeight: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '28px 24px',
          gap: 0,
        }}>
        {/* Hero */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Vision Transformer · SupConViT</div>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 10 }}>
            OtoScan
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
            Otoscopic image classification for five middle ear conditions, designed to support clinical decision-making in ENT practice.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Tympanic · Membrane · Analysis</div>
          </div>
        </div>

        {/* Input label */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Input
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 9, padding: 3, gap: 3, marginBottom: 10 }}>
          {(['upload', 'sample'] as const).map(t => (
            <button key={t}
              onClick={() => { setTab(t); setResult(null); setSelectedSample(null); }}
              style={{
                flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                textAlign: 'center', border: 'none', borderRadius: 7,
                cursor: 'pointer', fontFamily: inter, transition: 'all 0.15s',
                background: tab === t ? WHITE : 'transparent',
                color: tab === t ? RED : 'rgba(255,255,255,0.45)',
              }}>
              {t === 'upload' ? 'Upload' : 'Sample'}
            </button>
          ))}
        </div>

        {/* Upload zone */}
        {tab === 'upload' && (
          <>
            <label style={{
              display: 'block', border: '1.5px dashed rgba(255,255,255,0.22)', borderRadius: 12,
              cursor: 'pointer', background: 'rgba(0,0,0,0.15)', marginBottom: 10,
              overflow: 'hidden',
            }}>
              <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              {preview ? (
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: 8 }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block', maxHeight: 'none' }} />
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 10V3M4.5 5.5L7 3l2.5 2.5" /><path d="M2 12h10" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Drop image here</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>PNG or JPG · up to 10 MB</div>
                </div>
              )}
              {preview && (
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 10V3M4.5 5.5L7 3l2.5 2.5" /><path d="M2 12h10" />
                  </svg>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</span>
                </div>
              )}
            </label>
          </>
        )}

        {/* Sample grid */}
        {tab === 'sample' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, marginBottom: 10 }}>
            {SAMPLES.map(s => (
              <div key={s.key} onClick={() => setSelectedSample(s)}
                style={{
                  background: selectedSample?.key === s.key ? WHITE : 'rgba(255,255,255,0.08)',
                  borderRadius: 9,
                  border: `1px solid ${selectedSample?.key === s.key ? WHITE : 'rgba(255,255,255,0.1)'}`,
                  padding: '10px 8px 9px', cursor: 'pointer', transition: 'all 0.12s',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
                }}>
                <div style={{ fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: selectedSample?.key === s.key ? 'rgba(127,29,29,0.45)' : 'rgba(255,255,255,0.25)' }}>
                  {s.id}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3, color: selectedSample?.key === s.key ? RED : 'rgba(255,255,255,0.65)' }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Run button */}
        <button onClick={runAnalysis} disabled={!canRun}
          style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: canRun ? WHITE : 'rgba(255,255,255,0.1)',
            color: canRun ? RED : 'rgba(255,255,255,0.25)',
            fontFamily: inter, fontSize: 13, fontWeight: 800,
            cursor: canRun ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {loading && (
            <span style={{ width: 12, height: 12, border: '1.5px solid rgba(127,29,29,0.2)', borderTopColor: RED, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          )}
          {loading ? 'Processing...' : 'Run Analysis'}
        </button>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '16px 0' }} />

        {/* Class legend */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          5 classes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {SAMPLES.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', minWidth: 18 }}>{s.id}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{s.name}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '16px 0' }} />

        {/* Model details */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          MODEL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Architecture', value: 'Custom ViT-Small' },
            { label: 'Loss',       value: 'CE + SupCon' },
            { label: 'Macro F1',   value: '0.9715' },
            { label: 'Accuracy',   value: '97.31%' },
            { label: 'AUC range',  value: '0.993 – 0.999' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{value}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* ── RIGHT — warm light ── */}
      <div style={{ flex: 1, background: BG, display: 'flex', flexDirection: 'column', padding: '28px 24px', gap: 14, overflowY: 'auto', height: '100vh' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#bbb5b0' }}>Results</span>
          <span style={{ background: SURFACE, border: '1px solid #ddd8d3', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 600, color: '#bbb5b0' }}>
            v04 · 2026
          </span>
        </div>

        {/* Empty state */}
        {!result && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px dashed #d4cfc9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#ccc8c3" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="9" cy="9" r="6" /><path d="M9 6v3.5M9 12v.5" />
              </svg>
            </div>
            <div style={{ fontSize: 12, color: '#c4bfba', fontWeight: 500 }}>Upload or pick a sample to begin</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ background: 'rgba(127,29,29,0.07)', border: '1px solid rgba(127,29,29,0.15)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: RED, animation: 'pulse 1.5s ease-in-out infinite' }}>
              {statusMessage}
            </span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.5s ease' }}>

            {/* Classification card */}
            <div style={{ background: WHITE, border: '1px solid #e6e0db', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb5b0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                AI Classification
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#1c1410', letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase' }}>
                  {formatLabel(result.prediction)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#bbb5b0', marginBottom: 4 }}>Confidence</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: RED, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {result.confidence}
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: '#eee9e4', marginBottom: 16 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <ResultImage label="Original"      src={result.original_image} />
                <ResultImage label="Attention map" src={result.heatmap_image} />
                <ResultImage label="Detection"     src={result.contour_image} />
              </div>
            </div>

            {/* Condition description */}
            {conditionInfo && (
              <div style={{ background: WHITE, border: '1px solid #e6e0db', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb5b0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  About this condition
                </div>
                <p style={{ fontSize: 13, fontWeight: 400, color: '#5a5350', lineHeight: 1.75, marginBottom: 14 }}>
                  {conditionInfo.summary}
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: SURFACE, borderRadius: 10, padding: '11px 14px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={RED} strokeWidth="1.4" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="7" cy="7" r="5.5" /><path d="M7 5v3M7 9.5v.5" />
                  </svg>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#8a837e', lineHeight: 1.65 }}>
                    {conditionInfo.note}
                  </p>
                </div>
              </div>
            )}

            {/* Clinical disclaimer */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(127,29,29,0.06)', border: '1px solid rgba(127,29,29,0.14)', borderRadius: 12, padding: '13px 16px' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={RED} strokeWidth="1.4" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M7.5 1L1 13h13L7.5 1z" /><path d="M7.5 6v3M7.5 10.5v.5" />
              </svg>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: RED, marginBottom: 4 }}>For clinical support only</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9b948f', lineHeight: 1.65 }}>
                  This result is AI-generated and should not replace a clinician's assessment. Always confirm findings with a qualified medical professional before making any diagnostic or treatment decisions.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Author credit */}
        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#cdc8c3' }}>
            Built by <span style={{ fontWeight: 700, color: '#bbb5b0' }}>Dyutin Robin</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#d4cfc9' }}>OtoScan · 2026</span>
        </div>
      </div>
    </div>
  );
}