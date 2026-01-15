import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ArrowRight, ArrowLeft, Image as ImageIcon, Plus, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const isPyWebView = typeof window.pywebview !== 'undefined';

const callApi = async (method, ...args) => {
  if (isPyWebView) {
    try {
      return await window.pywebview.api[method](...args);
    } catch (error) {
      console.error(`API Error (${method}):`, error);
      return null;
    }
  } else {
    console.warn(`Mock API Call: ${method}`, args);
    // Mocks for browser testing
    if (method === 'select_folder') return '/mock/path/to/folder';
    if (method === 'scan_images') return ['img1.jpg', 'img2.png', 'img3.webp'];
    if (method === 'load_image') return 'https://placehold.co/600x400';
    if (method === 'move_image') return { success: true };
    return null;
  }
};

function App() {
  const [sourcePath, setSourcePath] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  // Load image when index changes
  useEffect(() => {
    if (!images.length || currentIndex >= images.length) {
        setCurrentImageSrc(null);
        return;
    }

    const load = async () => {
      setLoadingImage(true);
      const filename = images[currentIndex];
      const path = sourcePath + "/" + filename; // Simple path join, valid for API to handle logic if needed, but python backend takes full path
      // Actually backend `load_image` takes full path. And `scan_images` returns filenames.
      // We should construct full path or let backend handle it.
      // Backend `load_image` expects absolute path.
      // We need to join folder + filename. But in JS windows/linux separators differ.
      // Better to pass folder and filename to `load_image`?
      // Helper: let's assume `path` strings from python are valid.
      // We will perform naive join, or better, update backend to take (folder, filename).
      // Update backend later? For now, we manually join with '/' which usually works in Python open() on Windows too, but safer:
      // We'll pass the full path string assuming forward slash or backslash.
      // Actually, let's just use a helper to join in JS for display ??
      // Let's modify backend `load_image` to take folder and filename to be safe, OR just concat in JS.
      // Windows accepts '/' in python paths.
      
      // Let's pass the absolute path constructed in JS.
      // wait, `sourcePath` comes from python `os.path`.
      // It might have backslashes.
      const sep = sourcePath.includes('\\') ? '\\' : '/';
      const fullPath = `${sourcePath}${sep}${filename}`;
      
      const b64 = await callApi('load_image', fullPath);
      setCurrentImageSrc(b64);
      setLoadingImage(false);
    };

    load();
  }, [currentIndex, images, sourcePath]);

  const handleSelectSource = async () => {
    const path = await callApi('select_folder');
    if (path) {
      setSourcePath(path);
      setLoading(true);
      const imgs = await callApi('scan_images', path);
      setImages(imgs || []);
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  const handleAddDestination = async () => {
    const path = await callApi('select_folder');
    if (path && !destinations.includes(path)) {
      setDestinations([...destinations, path]);
    }
  };

  const handleRemoveDestination = (path) => {
    setDestinations(destinations.filter(d => d !== path));
  }

  const handleMove = async (destPath) => {
    if (!images[currentIndex]) return;
    
    // Optimistic UI update could be risky if move fails, but provides better feel.
    // For safety, we wait.
    const filename = images[currentIndex];
    const res = await callApi('move_image', filename, sourcePath, destPath);
    
    if (res && res.success) {
      // Remove from list
      const newImages = [...images];
      newImages.splice(currentIndex, 1);
      setImages(newImages);
      // Index stays same unless it was last
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }
    } else {
      alert("Failed to move image: " + (res?.error || "Unknown error"));
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(c => c + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(c => c - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      // Add number keys for destinations? 1-9
      const num = parseInt(e.key);
      if (!isNaN(num) && num > 0 && num <= destinations.length) {
        handleMove(destinations[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [destinations, currentIndex, images]);


  if (!sourcePath) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-lg"
        >
          <div className="mx-auto w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/10">
            <FolderOpen size={48} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Image Sorter Pro
          </h1>
          <p className="text-gray-400 text-lg">
            Rapidly sort your photos into destination folders with a modern, keyboard-friendly interface.
          </p>
          <button 
            onClick={handleSelectSource}
            className="px-8 py-4 bg-primary hover:bg-blue-600 active:scale-95 transition-all rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/20 flex items-center gap-3 mx-auto"
          >
            <FolderOpen size={20} />
            Select Source Folder
          </button>
        </motion.div>
      </div>
    );
  }

  const isDone = images.length === 0 && !loading;

  return (
    <div className="h-screen w-screen bg-background text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-surface/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Sorter</span>
            <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-400 font-mono text-ellipsis overflow-hidden max-w-[200px] whitespace-nowrap" title={sourcePath}>
                {sourcePath}
            </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
            <span>{images.length} images remaining</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Left */}
        <button onClick={handlePrev} disabled={currentIndex === 0} 
            className="w-16 flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors z-20">
            <ArrowLeft size={32} />
        </button>

        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
            <AnimatePresence mode="wait">
                {isDone ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <CheckCircle size={80} className="text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold">All Done!</h2>
                        <p className="text-gray-400 mt-2">No more images in this folder.</p>
                        <button onClick={handleSelectSource} className="mt-8 text-primary hover:underline flex items-center gap-2 mx-auto">
                           <RefreshCw size={16}/> Select Different Folder
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key={images[currentIndex]}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {loadingImage ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        ) : currentImageSrc ? (
                            <img 
                                src={currentImageSrc} 
                                alt="Current" 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <ImageIcon size={48} className="mb-2 opacity-50"/>
                                <p>No Preview</p>
                            </div>
                        )}
                        
                        <div className="absolute bottom-4 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-sm font-mono border border-white/10">
                            {images[currentIndex]}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Navigation Right */}
        <button onClick={handleNext} disabled={currentIndex === images.length - 1} 
            className="w-16 flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors z-20">
            <ArrowRight size={32} />
        </button>
      </div>

      {/* Footer Controls / Destinations */}
      <div className="h-auto min-h-[140px] bg-surface p-6 border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Destinations</h3>
            <button onClick={handleAddDestination} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                <Plus size={14} /> Add Folder
            </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {destinations.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm py-4">
                    Add destination folders to start sorting
                </div>
            )}
            
            {destinations.map((path, idx) => {
                // Extract folder name safely
                const parts = path.split(/[/\\]/);
                const name = parts[parts.length - 1] || path;
                
                return (
                    <button 
                        key={path}
                        onClick={() => handleMove(path)}
                        className="group relative flex-shrink-0 w-32 h-24 bg-background hover:bg-primary/20 hover:border-primary border-2 border-transparent rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer"
                    >
                        <div className="absolute top-2 left-2 text-[10px] font-bold text-gray-500 group-hover:text-primary opacity-50">{idx + 1}</div>
                        <FolderOpen size={24} className="mb-2 text-primary" />
                        <span className="text-xs font-medium line-clamp-2 w-full break-words leading-tight">{name}</span>
                        
                        <div 
                            onClick={(e) => { e.stopPropagation(); handleRemoveDestination(path); }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <Trash2 size={10} />
                        </div>
                    </button>
                )
            })}
             <button 
                onClick={handleAddDestination}
                className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 rounded-xl flex items-center justify-center transition-all text-gray-500 hover:text-white"
            >
                <Plus size={24} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default App
