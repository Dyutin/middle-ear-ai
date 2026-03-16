import { useState } from 'react';
import axios from 'axios';

interface PredictionResult {
  prediction: string;
  confidence: string;
  original_image: string;
  heatmap_image: string;
  contour_image: string;
}

function ResultImage({ label, src }: { label: string, src: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
      <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">{label}</p>
      <div className="rounded-lg overflow-hidden aspect-square bg-black border border-slate-800">
        <img src={`data:image/png;base64,${src}`} className="w-full h-full object-cover" alt={label} />
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("Analyzing...");

  const formatLabel = (label: string) => {
    return label.replace(/([A-Z])/g, ' $1').trim();
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject)=>{
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1]
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }
  const uploadImage = async () => {
    if(!file) return
    setLoading(true);
    setResult(null);
    setStatusMessage("Waking up the GPU...");
    const coldStartTimer = setTimeout(() => {
    setStatusMessage("Server is cold starting (this may take up to 2 mins)...");
  }, 10000);

    try{
       const base64Image = await fileToBase64(file)

       const res = await axios.post("/api/predict", 
        {
          input: { image: base64Image }
        }
      );

       if (res.data && res.data.output) {
          setResult(res.data.output);
          console.log("Confidence:", res.data.output.confidence)
       }
    } catch(err){
      console.error("Error calling AI:", err)
    } finally {
      clearTimeout(coldStartTimer);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">
            MIDDLE EAR <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Diagnostic Assistance System</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Input</h2>
              
              <div className="space-y-4">
                <input
                  type="file"
                  onChange={onFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-blue-400 hover:file:bg-slate-700 cursor-pointer"
                />

                {preview && !result && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-square flex items-center justify-center">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}

                <button
                  onClick={uploadImage}
                  disabled={!file || loading}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                    !file || loading 
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95"
                  }`}
                >
                  {loading && <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />}
                  {loading ? "Processing..." : "Run Analysis"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-center">
                <p className="text-blue-400 text-[11px] font-bold uppercase animate-pulse">{statusMessage}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-8">
            {!result && !loading ? (
              <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex items-center justify-center text-slate-600">
                <p className="text-sm">Upload an otoscopic image to begin analysis</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Main Diagnosis Card */}
                <div className="bg-blue-600 p-8 rounded-3xl shadow-2xl shadow-blue-500/10">
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-tighter mb-1">AI Classification</p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-4xl font-black text-white uppercase">{formatLabel(result.prediction)}</h3>
                    <div className="text-right">
                      <p className="text-blue-200 text-[10px] font-bold uppercase">Confidence</p>
                      <p className="text-2xl font-mono text-white">{result.confidence}</p>
                    </div>
                  </div>
                </div>

                {/* Explainability Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ResultImage label="Original" src={result.original_image} />
                  <ResultImage label="Attention Map" src={result.heatmap_image} />
                  <ResultImage label="Detection" src={result.contour_image} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;