import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle, 
  RefreshCw,
  Folder,
  Move,
  Settings,
  X,
  Filter
} from 'lucide-react';
import clsx from 'clsx';

// --- API HANDLING ---

const callApi = async (method, ...args) => {
  // Check dynamically because pywebview is injected asynchronously
  if (window.pywebview) {
    try {
      return await window.pywebview.api[method](...args);
    } catch (error) {
      console.error(`API Error (${method}):`, error);
      return null;
    }
  } else {
    // Mocks for browser dev
    console.log(`Mock Call: ${method}`, args);
    if (method === 'select_folder') return 'C:/Users/Mock/Pictures/Vacation';
    if (method === 'scan_images') return Array.from({length: 5}, (_, i) => `photo_${i+1}.jpg`);
    if (method === 'load_image') return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
    if (method === 'move_image') return { success: true };
    return null;
  }
};

// --- COMPONENTS ---

// ... (Button, IconButton, DestinationCard components remain unchanged) ...

const FilterPopup = ({ filters, onToggle, onClose }) => {
  const options = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-16 right-6 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl p-4 z-50 backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <span className="text-sm font-semibold">File Types</span>
        <button onClick={onClose}><X size={14} className="text-gray-400 hover:text-white" /></button>
      </div>
      <div className="space-y-2">
        {options.map(ext => (
          <label key={ext} className="flex items-center gap-3 cursor-pointer group">
            <div className={clsx(
              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
              filters.includes(ext) ? "bg-blue-500 border-blue-500" : "border-gray-500 group-hover:border-gray-400"
            )}>
              {filters.includes(ext) && <CheckCircle size={10} className="text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={filters.includes(ext)}
              onChange={() => onToggle(ext)}
            />
            <span className="text-sm text-gray-300 group-hover:text-white uppercase">{ext}</span>
          </label>
        ))}
      </div>
    </motion.div>
  );
}

const Button = ({ children, onClick, variant = 'primary', className, disabled, ...props }) => {
  const base = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/5",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={clsx(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

const IconButton = ({ icon: Icon, onClick, variant = 'secondary', className, disabled, size = 20 }) => {
  return (
    <Button onClick={onClick} variant={variant} disabled={disabled} className={clsx("!p-3", className)}>
      <Icon size={size} />
    </Button>
  );
};

const DestinationCard = ({ path, index, onClick, onRemove }) => {
  const parts = path.split(/[/\\]/);
  const name = parts[parts.length - 1] || path;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onClick}
      className="group relative flex-shrink-0 w-36 h-32 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-300"></div>
      
      {/* Shortcut Indicator */}
      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
        {index + 1}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
        <div className="mb-3 p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 group-hover:text-white group-hover:bg-blue-500 transition-all duration-300">
          <Folder size={24} />
        </div>
        <span className="text-xs font-medium text-gray-300 group-hover:text-white line-clamp-2 leading-tight break-all max-w-full">
          {name}
        </span>
      </div>

      {/* Remove Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(path); }}
        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

// --- MAIN APP ---

function App() {
  const [sourcePath, setSourcePath] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(['png', 'jpg', 'jpeg', 'gif', 'webp']);

  // --- Logic ---
  
  const loadRef = useRef(currentIndex);

  const scan = async () => {
      if (!sourcePath) return;
      setLoading(true);
      const imgs = await callApi('scan_images', sourcePath, filters);
      setImages(imgs || []);
      // Reset index if out of bounds or just 0
      setCurrentIndex(0); 
      setLoading(false);
  };

  // Rescan when filters change, but only if source is selected
  useEffect(() => {
    if (sourcePath) {
        scan();
    }
  }, [filters, sourcePath]); // Re-run when source or filters change. 
  // Wait, if sourcePath changes, this runs.
  // Original handleSelectSource calls scan manually. 
  // If we rely on useEffect, we can simplify handleSelectSource.
  
  useEffect(() => {
    if (!images.length || currentIndex >= images.length) {
        setCurrentImageSrc(null);
        return;
    }

    const load = async () => {
      setLoadingImage(true);
      const filename = images[currentIndex];
      const sep = sourcePath.includes('\\') ? '\\' : '/';
      const fullPath = `${sourcePath}${sep}${filename}`;
      
      const b64 = await callApi('load_image', fullPath);
      if (currentIndex === loadRef.current) { 
        setCurrentImageSrc(b64);
        setLoadingImage(false);
      }
    };

    loadRef.current = currentIndex;
    load();
  }, [currentIndex, images, sourcePath]);


  const handleSelectSource = async () => {
    const path = await callApi('select_folder');
    if (path) {
      setSourcePath(path);
      // The useEffect [filters, sourcePath] will trigger scan() automatically
    }
  };

  const handleToggleFilter = (ext) => {
    setFilters(prev => 
      prev.includes(ext) 
        ? prev.filter(f => f !== ext) 
        : [...prev, ext]
    );
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
    
    const filename = images[currentIndex];
    const res = await callApi('move_image', filename, sourcePath, destPath);
    
    if (res && res.success) {
      const newImages = [...images];
      newImages.splice(currentIndex, 1);
      setImages(newImages);
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

  useEffect(() => {
    const handleKey = (e) => {
      // Ignore if no images
      if (!images.length) return;

      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      
      const num = parseInt(e.key);
      if (!isNaN(num) && num > 0 && num <= destinations.length) {
        handleMove(destinations[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [destinations, currentIndex, images]);


  // --- Render ---

  if (!sourcePath) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-8 max-w-2xl px-6"
        >
          <div className="mb-8 relative inline-block">
             <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
             <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl relative">
                <FolderOpen size={64} className="text-blue-500" />
             </div>
          </div>
          
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Image Sorter <span className="text-blue-500">Pro</span>
            </h1>
            <p className="text-xl text-gray-400 font-light">
              Organize your chaos. The fastest way to sort thousands of images.
            </p>
          </div>

          <Button onClick={handleSelectSource} className="mx-auto !text-lg !px-8 !py-4 shadow-blue-900/20">
            <FolderOpen size={24} />
            Open Source Folder
          </Button>
        </motion.div>
      </div>
    );
  }

  const isDone = images.length === 0 && !loading;

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative font-sans">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[10%] left-[20%] w-[60%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-md z-20 relative">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FolderOpen size={16} className="text-white" />
            </div>
            <div className="flex flex-col mr-4">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Source</span>
                <span className="text-sm font-semibold truncate max-w-[300px]" title={sourcePath}>
                    {sourcePath.split(/[/\\]/).pop()}
                </span>
            </div>
             <Button onClick={handleSelectSource} variant="ghost" className="!px-3 !py-1 text-xs gap-1 h-8">
                <RefreshCw size={14} /> Change
            </Button>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <ImageIcon size={14} className="text-gray-400"/>
                <span className="text-sm font-medium">{images.length} <span className="text-gray-500">pending</span></span>
             </div>
             
             {/* Filter Button */}
             <div className="relative">
                <Button 
                    onClick={() => setShowFilters(!showFilters)} 
                    variant={showFilters ? 'primary' : 'secondary'}
                    className="!px-3 !py-1 h-9 rounded-lg"
                >
                    <Filter size={16} />
                    {filters.length !== 5 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#0a0a0a]"></span>}
                </Button>
                
                <AnimatePresence>
                    {showFilters && (
                        <FilterPopup 
                            filters={filters} 
                            onToggle={handleToggleFilter} 
                            onClose={() => setShowFilters(false)}
                        />
                    )}
                </AnimatePresence>
             </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Nav */}
        <div className="w-20 hidden md:flex items-center justify-center">
           <IconButton 
              icon={ArrowLeft} 
              onClick={handlePrev} 
              disabled={currentIndex === 0 || isDone} 
              className="!w-12 !h-12 !rounded-full !bg-white/5 hover:!bg-white/10 !border-none" 
              size={24}
           />
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
            <div className="relative w-full h-full max-w-5xl max-h-full flex flex-col">
                
                {/* Image Container */}
                <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#111] border border-white/5 shadow-2xl flex items-center justify-center group">
                    <AnimatePresence mode="wait">
                        {isDone ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={48} className="text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-bold mb-2">All Caught Up!</h2>
                                <p className="text-gray-400 mb-8">This folder is empty.</p>
                                <Button onClick={handleSelectSource} variant="secondary">
                                    <RefreshCw size={18} /> Select New Folder
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={images[currentIndex]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center p-1"
                            >
                                {loadingImage ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Loading</span>
                                    </div>
                                ) : currentImageSrc ? (
                                    <>
                                        {/* Blurred Background for Fill */}
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 saturate-150 transition-all duration-500"
                                            style={{ backgroundImage: `url(${currentImageSrc})` }}
                                        />
                                        <img 
                                            src={currentImageSrc} 
                                            className="relative max-w-full max-h-full object-contain rounded-xl shadow-lg z-10 transition-transform duration-500" 
                                            alt=""
                                        />
                                    </>
                                ) : (
                                    <div className="text-gray-600 flex flex-col items-center">
                                        <ImageIcon size={48} className="mb-2 opacity-20"/>
                                        <p>No Preview Available</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Image Info Overlay */}
                    {!isDone && (
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-sm font-mono text-gray-300">
                                {images[currentIndex]}
                             </div>
                             <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-bold text-gray-400">
                                {currentIndex + 1} / {images.length}
                             </div>
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* Right Nav */}
        <div className="w-20 hidden md:flex items-center justify-center">
            <IconButton 
              icon={ArrowRight} 
              onClick={handleNext} 
             disabled={currentIndex === images.length - 1 || isDone} 
              className="!w-12 !h-12 !rounded-full !bg-white/5 hover:!bg-white/10 !border-none" 
              size={24}
           />
        </div>
      </main>

      {/* Bottom Dock (Destinations) */}
      <footer className="h-48 border-t border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl z-30 flex flex-col">
         <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
             <div className="flex items-center gap-2 text-gray-400">
                 <Move size={14} />
                 <span className="text-xs font-bold uppercase tracking-widest">Destinations</span>
             </div>
             
             <button 
                onClick={handleAddDestination}
                className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wider"
             >
                 <Plus size={14} /> Add Folder
             </button>
         </div>

         <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center px-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
             <AnimatePresence initial={false}>
                {destinations.map((path, idx) => (
                    <DestinationCard 
                        key={path} 
                        path={path} 
                        index={idx} 
                        onClick={() => handleMove(path)}
                        onRemove={handleRemoveDestination}
                    />
                ))}
            </AnimatePresence>

            <button 
                onClick={handleAddDestination}
                className="flex-shrink-0 w-24 h-24 border border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-all group"
            >
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10">
                    <Plus size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider">New</span>
            </button>
         </div>
      </footer>
    </div>
  )
}

export default App
