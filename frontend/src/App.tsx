import { useState } from 'react';
import axios from 'axios';


function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }

  const uploadImage = async () => {
    if(!file) return;
    const formData = new FormData();
    formData.append('file', file)

    try{
        const res = await axios.post("https://middle-ear-backend-270122873653.us-central1.run.app/predict", formData);
        setPrediction(res.data.class)
    } catch(err){
      console.error("Error calling AI:", err);
    }
  }

  return (
    <div className='min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6'>
      <div className='max-w-md w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8'>
        <h1 className='text-3xl font-bold text-center mb-8 txt-blue-400'>
          Middle Ear AI
        </h1>

        <div className='mb-6'>
          <label className='block text-sm font-medium mb-2 text-slate-300'>
            Upload Otoscopic Image
          </label>
          <input
            type='file'
            onChange={onFileChange}
            className='w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700'
          />
        </div>
        {preview && (
            <div className='mb-6 rounded-lg overflow-hidden border border-slate-600'>
              <img src={preview} alt='Preview' className='w-full h-auto'/>
            </div>
        )}

        <button
          onClick={uploadImage}
          disabled={!file}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            !file
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/20"
          }`}
        >
          Analyze with AI          
        </button>
        
        {prediction && (
          <div className="mt-8 p-4 bg-slate-700/50 border border-green-500/30 rounded-xl text-center">
            <p className='text-slate-400 text-sm uppercase tracking-wider'>Result</p>
            <p className="text-2xl font-bond text-green-400 mt-1">{prediction}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;