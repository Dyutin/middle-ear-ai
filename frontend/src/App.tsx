import { useState } from 'react';
import axios from 'axios';

interface PredictionResult {
  prediction: string;
  confidence: string;
  original_image: string;
  heatmap_image: string;
  contour_image: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);


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
      setLoading(false);
    }
  }

  return (
      <div className='min-h-screen bg-slate-900 text-white flex flex-col items-center p-10'>
        <div className='max-w-2xl w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8'>
          <h1 className='text-3xl font-bold text-center mb-8 text-blue-400'>
            Middle Ear AI
          </h1>

          <div className='mb-6'>
            <label className='block text-sm font-medium mb-2 text-slate-300 text-center'>
              Upload Otoscopic Image
            </label>
            <input
              type='file'
              onChange={onFileChange}
              className='w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer'
            />
          </div>

          {preview && !result && (
            <div className='mb-6 rounded-xl overflow-hidden border border-slate-700 bg-slate-900'>
              <p className="text-[10px] text-slate-500 uppercase text-center py-1">Selection Preview</p>
              <img src={preview} alt='Selected Preview' className='w-full h-auto max-h-64 object-contain'/>
            </div>
          )}

          <button
            onClick={uploadImage}
            disabled={!file || loading}
            className={`w-full py-3 rounded-xl font-bold transition-all mb-8 ${
              !file || loading
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/20"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze with AI"}          
          </button>

          {/* RESULTS SECTION */}
          {result && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="p-6 bg-slate-900/50 border border-green-500/30 rounded-2xl text-center">
                  <p className='text-slate-400 text-sm uppercase tracking-wider'>Diagnosis</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{formatLabel(result.prediction)}</p>
                  <p className="text-slate-500 text-sm mt-2">Confidence: {result.confidence}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center">
                      <p className="text-xs text-slate-400 uppercase mb-2">Original</p>
                      <img src={`data:image/png;base64,${result.original_image}`} alt="Original" className="rounded-lg border border-slate-600 w-full" />
                  </div>
                  <div className="flex flex-col items-center">
                      <p className="text-xs text-slate-400 uppercase mb-2">Attention Map</p>
                      <img src={`data:image/png;base64,${result.heatmap_image}`} alt="Heatmap" className="rounded-lg border border-slate-600 w-full" />
                  </div>
                  <div className="flex flex-col items-center">
                      <p className="text-xs text-slate-400 uppercase mb-2">Detection</p>
                      <img src={`data:image/png;base64,${result.contour_image}`} alt="Contour" className="rounded-lg border border-slate-600 w-full" />
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}

export default App;