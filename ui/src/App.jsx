import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
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
  Filter,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Video,
  Play,
  ArrowUpDown,
} from "lucide-react";
import clsx from "clsx";

// ...

// ... (Other components)

const ZoomableImage = forwardRef(({ src, alt }, ref) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reset function
  const resetZoom = () => {
    setScale(1);
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  useImperativeHandle(ref, () => ({
    resetZoom,
  }));

  // Reset zoom when src changes
  useEffect(() => {
    // Instant reset without animation when image changes
    setScale(1);
    x.set(0);
    y.set(0);
  }, [src]);

  const handleWheel = (e) => {
    e.stopPropagation();
    const delta = -Math.sign(e.deltaY) * 0.25;
    const newScale = Math.min(Math.max(1, scale + delta), 8);
    setScale(newScale);

    // If zooming out to 1, animate reset position
    if (newScale === 1) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
      onWheel={handleWheel}
      onPointerDown={(e) => {
        if (scale > 1) {
          dragControls.start(e);
        }
      }}
      style={{ touchAction: "none" }}
    >
      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity z-50">
        <button
          className="p-1.5 hover:text-blue-400 text-white transition active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            const newScale = Math.max(1, scale - 0.5);
            setScale(newScale);
            if (newScale === 1) {
              animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
              animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
            }
          }}
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-mono min-w-[3rem] text-center text-gray-300">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="p-1.5 hover:text-blue-400 text-white transition active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(8, s + 0.5));
          }}
        >
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-4 bg-white/20 mx-1"></div>
        <button
          className="p-1.5 hover:text-blue-400 text-white transition active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            resetZoom();
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <motion.img
        src={src}
        alt={alt}
        className={clsx(
          "relative max-w-full max-h-full object-contain z-10 transition-shadow",
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        )}
        animate={{ scale }}
        // Bind motion values to style (framer motion handles this efficiently)
        style={{
          x,
          y,
          boxShadow:
            scale > 1 ? "0 20px 50px -12px rgba(0, 0, 0, 0.5)" : "none",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag={scale > 1}
        dragListener={false}
        dragControls={dragControls}
        // Remove tight constraints, allow free movement but with friction if going far
        dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
        dragElastic={0.05}
      />
    </div>
  );
});

const MetadataPanel = ({ data, onClose }) => {
  if (!data) return null;

  const items = [
    { label: "Resolution", value: data.resolution },
    { label: "Size", value: data.size },
    { label: "Format", value: data.format },
    { label: "Date", value: data.date },
    { label: "Camera", value: data.camera },
    { label: "ISO", value: data.iso },
    { label: "Aperture", value: data.aperture },
    { label: "Shutter", value: data.shutter },
  ];

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute top-16 right-0 bottom-20 w-64 bg-black/40 backdrop-blur-xl border-l border-white/10 p-6 z-20 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Info size={18} className="text-blue-400" /> Info
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {items.map(
          (item, idx) =>
            item.value && (
              <div key={idx} className="group">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  {item.label}
                </span>
                <span className="text-sm text-gray-200 font-mono break-words">
                  {item.value}
                </span>
              </div>
            ),
        )}
        <div className="pt-4 border-t border-white/10">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Filename
          </span>
          <span className="text-xs text-gray-400 break-all">
            {data.filename}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

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
    if (method === "select_folder") return "C:/Users/Mock/Pictures/Vacation";
    if (method === "scan_images")
      return Array.from({ length: 5 }, (_, i) => `photo_${i + 1}.jpg`);
    if (method === "load_image")
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
    if (method === "move_image") return { success: true };
    if (method === "delete_image") return { success: true };
    if (method === "restore_image") return { success: true };
    if (method === "get_image_metadata")
      return {
        resolution: "1920x1080",
        size: "2.5 MB",
        format: "JPEG",
        date: "2023:01:01 12:00:00",
        camera: "Sony A7III",
        iso: "100",
        aperture: "f/2.8",
        shutter: "1/200",
      };
    return null;
  }
};

// --- SETTINGS POPUP ---

const SettingsPopup = ({ isOpen, onClose, shortcuts, onSave }) => {
  const [localShortcuts, setLocalShortcuts] = useState(shortcuts);
  const [listening, setListening] = useState(null); // 'next', 'prev', 'delete'

  useEffect(() => {
    if (isOpen) {
      setLocalShortcuts(shortcuts);
      setListening(null); // Reset listening state when opening
    }
  }, [isOpen, shortcuts]);

  useEffect(() => {
    const handlerecord = (e) => {
      if (!listening) return;
      e.preventDefault();
      e.stopPropagation();
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      const key = e.key;
      setLocalShortcuts((prev) => ({ ...prev, [listening]: key }));
      setListening(null);
    };

    if (listening) {
      window.addEventListener("keydown", handlerecord);
    }
    return () => window.removeEventListener("keydown", handlerecord);
  }, [listening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#09090b] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Settings className="text-indigo-500" size={20} />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Keyboard Shortcuts
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {[
            { id: "prev", label: "Previous Media", icon: ArrowLeft },
            { id: "next", label: "Next Media", icon: ArrowRight },
            { id: "delete", label: "Move to Trash", icon: Trash2 },
          ].map((action) => (
            <div
              key={action.id}
              className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "p-2 rounded-md bg-zinc-900 border border-white/5 transition-colors",
                    action.id === "delete"
                      ? "text-red-400/70 group-hover:text-red-400 group-hover:bg-red-500/10 group-hover:border-red-500/20"
                      : "text-indigo-400/70 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20",
                  )}
                >
                  <action.icon size={16} />
                </div>
                <span className="text-zinc-300 group-hover:text-white transition-colors text-sm font-medium">
                  {action.label}
                </span>
              </div>

              <button
                onClick={() => setListening(action.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-md font-mono text-xs font-semibold border transition-all min-w-[100px] text-center shadow-sm",
                  listening === action.id
                    ? "bg-indigo-500 text-white border-indigo-400 ring-2 ring-indigo-500/20"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800",
                )}
              >
                {listening === action.id
                  ? "Press Key..."
                  : localShortcuts[action.id]}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 pt-6 border-t border-white/5">
          <div className="flex-1 text-xs text-zinc-500">
            Click a key to rebind.
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sm h-9 px-4 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(localShortcuts)}
            className="bg-indigo-600 text-white hover:bg-indigo-500 border-none h-9 px-6 text-sm font-semibold shadow-lg shadow-indigo-900/20 rounded-lg transition-all"
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- COMPONENTS ---

// ... (Button, IconButton, DestinationCard components remain unchanged) ...

const Button = ({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  ...props
}) => {
  const base =
    "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    secondary:
      "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/5",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
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

const IconButton = ({
  icon: Icon,
  onClick,
  variant = "secondary",
  className,
  disabled,
  size = 20,
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={clsx("!p-3", className)}
    >
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
      className="group relative flex-shrink-0 w-40 h-32 cursor-pointer"
    >
      <div className="absolute inset-0 bg-[#0f0f0f] hover:bg-[#151520] rounded-2xl border border-white/5 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"></div>

      {/* Shortcut Indicator */}
      <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-colors">
        {index + 1}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-3 p-2.5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-xl text-gray-400 group-hover:text-white group-hover:from-indigo-500 group-hover:to-violet-500 shadow-inner group-hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
          <Folder size={24} />
        </div>
        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-100 line-clamp-2 leading-tight break-all max-w-full transition-colors">
          {name}
        </span>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(path);
        }}
        className="absolute -top-2 -right-2 w-7 h-7 bg-[#1a1a1a] border border-white/10 hover:bg-red-500 hover:border-red-400 text-gray-400 hover:text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 z-10"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
};

const FilterPopup = ({ filters, onToggle, onClose }) => {
  // Grouped filters for better UX
  const groups = [
    { name: "Common", exts: ["jpg", "jpeg", "png", "webp", "gif"] },
    {
      name: "RAW",
      exts: ["arw", "cr2", "cr3", "nef", "raf", "dng", "orf", "rw2"],
    },
    { name: "Video", exts: ["mp4", "mov", "avi", "mkv", "webm"] },
  ];

  // Flatten all extensions for "Toggle All" logic
  const allExts = groups.flatMap((g) => g.exts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-12 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 w-72 z-50 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <span className="text-sm font-bold text-gray-300">File Filters</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider pl-1 flex items-center gap-2">
              {group.name === "Video" && <Video size={12} />}
              {group.name === "RAW" && <Settings size={12} />}
              {group.name === "Common" && <ImageIcon size={12} />}
              {group.name}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.exts.map((ext) => (
                <button
                  key={ext}
                  onClick={() => onToggle(ext)}
                  className={clsx(
                    "px-2 py-1.5 text-[10px] font-mono rounded-md border transition-all text-center uppercase truncate",
                    filters.includes(ext)
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_-3px_rgba(99,102,241,0.3)]"
                      : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-400",
                  )}
                >
                  .{ext}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- THUMBNAIL COMPONENT ---

const Thumbnail = ({ filename, sourcePath, current, onClick }) => {
  const isActive = current;

  const sep = sourcePath.includes("\\") ? "\\" : "/";
  // Double encode if needed? No, Flask request.args handles URL decoding once.
  // encodeURIComponent creates valid generic URL.
  const fullPath = `${sourcePath}${sep}${filename}`;
  const src = `http://127.0.0.1:23456/thumbnail?path=${encodeURIComponent(fullPath)}`;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group",
        isActive
          ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 z-10"
          : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100",
      )}
    >
      <img
        src={src}
        className="w-full h-full object-cover"
        alt={filename}
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none"; // Hide if fails
          // e.target.parentElement.classList.add('bg-red-900'); // Optional visual indicator
        }}
      />
      {isActive && (
        <div className="absolute inset-0 ring-2 ring-blue-500 rounded-lg" />
      )}
    </div>
  );
};

// --- Alert Popup ---

const AlertPopup = ({ isOpen, onClose, onConfirm, title, description }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
        <div className="bg-white/5 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-transparent hover:bg-white/10 text-white border border-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20"
          >
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Error Boundary ---

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black text-red-500 p-10 overflow-auto whitespace-pre-wrap font-mono relative z-50">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="mb-4">{this.state.error?.toString()}</p>
          <div className="bg-gray-900 p-4 rounded text-sm text-gray-400">
            {this.state.errorInfo?.componentStack}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ... (App component)

function App() {
  // ... (State and hooks)
  const [sourcePath, setSourcePath] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [filters, setFilters] = useState([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "arw",
    "cr2",
    "cr3",
    "nef",
    "raf",
    "dng",
    "orf",
    "rw2",
    "mp4",
    "mov",
    "avi",
    "mkv",
    "webm",
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [history, setHistory] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);

  // Shortcuts State
  const DEFAULT_SHORTCUTS = {
    prev: "ArrowLeft",
    next: "ArrowRight",
    delete: "Delete",
  };
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const saved = localStorage.getItem("mediasort_shortcuts");
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [sortConfig, setSortConfig] = useState({ by: "name", order: "asc" }); // 'name', 'date', 'size'
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    localStorage.setItem("mediasort_shortcuts", JSON.stringify(shortcuts));
  }, [shortcuts]);

  const imageRef = useRef(null);
  const thumbnailRefs = useRef([]); // Ensure initialized

  // ... (Logic methods)
  // ...

  // ... (Effects)

  // ... (Key handlers)

  // --- Render ---

  // --- Logic ---

  // Carousel window logic
  // Show 3 previous and up to 12 next images
  const carouselStartIndex = Math.max(0, currentIndex - 3);
  const carouselEndIndex = Math.min(images.length, currentIndex + 12);
  const carouselImages = images.slice(carouselStartIndex, carouselEndIndex);

  const loadRef = useRef(currentIndex);

  const scan = async () => {
    if (!sourcePath) return;
    setLoading(true);
    // Pass sort config to backend
    const imgs = await callApi(
      "scan_images",
      sourcePath,
      filters,
      sortConfig.by,
      sortConfig.order,
    );
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
  }, [filters, sourcePath, sortConfig]);

  useEffect(() => {
    loadRef.current = currentIndex; // Update ref

    if (!images.length || currentIndex >= images.length) {
      setCurrentImageSrc(null);
      setMetadata(null);
      return;
    }

    const load = async () => {
      setLoadingImage(true);
      const filename = images[currentIndex];
      const sep = sourcePath.includes("\\") ? "\\" : "/";
      const fullPath = `${sourcePath}${sep}${filename}`;

      // OPTIMIZATION: Use direct HTTP URL instead of Base64 via Bridge
      // This is much faster and lighter on memory
      const url = `http://127.0.0.1:23456/view?path=${encodeURIComponent(fullPath)}`;

      const ext = filename.split(".").pop().toLowerCase();
      const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);

      if (isVideo) {
        // Keep video| prefix for render logic
        setCurrentImageSrc(`video|${url}`);
      } else {
        setCurrentImageSrc(url);
      }

      setLoadingImage(false);

      // Fetch metadata (keep as API call since it uses Pillow/Exif)
      const meta = await callApi("get_image_metadata", fullPath);
      if (currentIndex === loadRef.current) {
        setMetadata(meta);
      }
    };
    load();
  }, [currentIndex, images, sourcePath]);

  const handleUndo = async () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    let res;

    if (lastAction.type === "move") {
      res = await callApi(
        "move_image",
        lastAction.filename,
        lastAction.to,
        lastAction.from,
      );
    } else if (lastAction.type === "delete") {
      res = await callApi(
        "restore_image",
        lastAction.filename,
        lastAction.from,
      );
    }

    if (res && res.success) {
      setHistory((prev) => prev.slice(0, -1));
      const newImages = [lastAction.filename, ...images];
      setImages(newImages);
      setCurrentIndex(0);
    } else {
      alert("Undo failed: " + (res?.error || "Unknown error"));
    }
  };

  const handleSelectSource = async () => {
    const path = await callApi("select_folder");
    if (path) {
      setSourcePath(path);
      // The useEffect [filters, sourcePath] will trigger scan() automatically
    }
  };

  const handleToggleFilter = (ext) => {
    setFilters((prev) =>
      prev.includes(ext) ? prev.filter((f) => f !== ext) : [...prev, ext],
    );
  };

  const handleAddDestination = async () => {
    const path = await callApi("select_folder");
    if (path && !destinations.includes(path)) {
      setDestinations([...destinations, path]);
    }
  };

  const handleRemoveDestination = (path) => {
    setDestinations(destinations.filter((d) => d !== path));
  };

  const handleMove = async (destPath) => {
    if (!images[currentIndex]) return;

    const filename = images[currentIndex];
    const res = await callApi("move_image", filename, sourcePath, destPath);

    if (res && res.success) {
      setHistory((prev) => [
        ...prev,
        { type: "move", filename, from: sourcePath, to: destPath },
      ]);
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

  const handleDeleteClick = () => {
    if (!images[currentIndex]) return;
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    setShowDeleteAlert(false);
    if (!images[currentIndex]) return;

    const filename = images[currentIndex];
    const res = await callApi("delete_image", filename, sourcePath);

    if (res && res.success) {
      setHistory((prev) => [
        ...prev,
        { type: "delete", filename, from: sourcePath },
      ]);
      const newImages = [...images];
      newImages.splice(currentIndex, 1);
      setImages(newImages);
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }
    } else {
      alert("Failed to delete image: " + (res?.error || "Unknown error"));
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex((c) => c + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((c) => c - 1);
  };

  useEffect(() => {
    const handleKey = (e) => {
      // Ignore if typing in an input (if we had any) or if settings open
      if (showSettings) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ignore if no images
      if (!images.length) return;

      if (e.key === shortcuts.next) handleNext();
      if (e.key === shortcuts.prev) handlePrev();
      if (e.key === shortcuts.delete) handleDeleteClick();

      const num = parseInt(e.key);
      if (!isNaN(num) && num > 0 && num <= destinations.length) {
        handleMove(destinations[num - 1]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [destinations, currentIndex, images, history, shortcuts, showSettings]);

  // --- Render ---

  if (!sourcePath) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-purple-600/10 rounded-full blur-[100px]" />

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
              Video and Image <span className="text-blue-500">Sorter</span>
            </h1>
            <p className="text-xl text-gray-400 font-light">
              Organize your chaos. The fastest way to sort thousands of media.
            </p>
          </div>

          <Button
            onClick={handleSelectSource}
            className="mx-auto !text-lg !px-8 !py-4 shadow-blue-900/20"
          >
            <FolderOpen size={24} />
            Open Source Folder
          </Button>
        </motion.div>
      </div>
    );
  }

  const isDone = images.length === 0 && !loading;

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col overflow-hidden relative font-sans selection:bg-indigo-500/30">
      {/* Global Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-400 font-bold tracking-widest animate-pulse">
            SCANNING FOLDER...
          </p>
        </div>
      )}
      {/* Refined Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] left-[10%] w-[70%] h-[50%] bg-indigo-900/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[60%] bg-fuchsia-900/05 rounded-full blur-[130px]" />
      </div>

      {/* Modern Glass Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl z-20 relative shadow-sm">
        <div className="flex items-center gap-5">
          <div className="group flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <FolderOpen size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest leading-none mb-1">
                Source
              </span>
              <span
                className="text-sm font-semibold truncate max-w-[250px] text-gray-100"
                title={sourcePath}
              >
                {sourcePath.split(/[/\\]/).pop()}
              </span>
            </div>
          </div>
          <Button
            onClick={handleSelectSource}
            variant="ghost"
            className="!px-3 !py-1.5 text-xs gap-1.5 h-auto text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
          >
            <RefreshCw size={12} /> Change
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2.5 backdrop-blur-md">
            <ImageIcon size={14} className="text-indigo-400" />
            <span className="text-sm font-medium text-gray-200">
              {images.length} <span className="text-gray-500">pending</span>
            </span>
          </div>

          <div className="w-px h-6 bg-white/10 mx-2"></div>

          {/* Undo Button */}
          <Button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="!p-2.5 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white disabled:opacity-20 transition-all"
            title="Undo (Ctrl+Z)"
            variant="ghost"
          >
            <RotateCcw size={18} />
          </Button>

          {/* Delete Button */}
          <Button
            onClick={handleDeleteClick}
            className="!p-2.5 w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-500 hover:text-red-400 transition-all"
            title="Delete Image (Del)"
            variant="ghost"
          >
            <Trash2 size={18} />
          </Button>

          <div className="w-px h-6 bg-white/10 mx-2"></div>

          {/* Tools Group */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <Button
              onClick={() => setShowMetadata(!showMetadata)}
              variant="ghost"
              className={clsx(
                "!p-2 w-9 h-9 rounded-lg transition-all",
                showMetadata
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
              title="Toggle Info"
            >
              <Info size={18} />
            </Button>

            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              className="!p-2 w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Keyboard Shortcuts"
            >
              <Settings size={18} />
            </Button>

            {/* Sort Button */}
            <div className="relative">
              <Button
                onClick={() => setShowSort(!showSort)}
                variant="ghost"
                className={clsx(
                  "!p-2 w-9 h-9 rounded-lg transition-all",
                  showSort
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
                title="Sort Files"
              >
                <ArrowUpDown size={18} />
              </Button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 0 }}
                    animate={{ opacity: 1, scale: 1, y: 4 }}
                    exit={{ opacity: 0, scale: 0.95, y: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full right-0 w-56 bg-[#09090b] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 ring-1 ring-black/5"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">
                      Sort Order
                    </div>
                    {[
                      { label: "Name (A-Z)", by: "name", order: "asc" },
                      { label: "Name (Z-A)", by: "name", order: "desc" },
                      { label: "Date (Newest)", by: "date", order: "desc" },
                      { label: "Date (Oldest)", by: "date", order: "asc" },
                      { label: "Size (Largest)", by: "size", order: "desc" },
                      { label: "Size (Smallest)", by: "size", order: "asc" },
                    ].map((opt) => {
                      const isActive =
                        sortConfig.by === opt.by &&
                        sortConfig.order === opt.order;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => {
                            setSortConfig({ by: opt.by, order: opt.order });
                            setShowSort(false);
                          }}
                          className={clsx(
                            "text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center group relative",
                            isActive
                              ? "bg-indigo-500/10 text-indigo-400 font-medium"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                          )}
                        >
                          <span className="z-10">{opt.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="sortActive"
                              className="absolute inset-0 rounded-lg bg-indigo-500/5 border border-indigo-500/10"
                            />
                          )}
                          {isActive && (
                            <CheckCircle size={14} className="z-10" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                className={clsx(
                  "!p-2 w-9 h-9 rounded-lg transition-all",
                  showFilters
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Filter size={18} />
                {filters.length !== 13 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1e1e1e]"></span>
                )}
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
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative z-10 flex-col">
        <AnimatePresence>
          {showMetadata && (
            <MetadataPanel
              data={metadata}
              onClose={() => setShowMetadata(false)}
            />
          )}
        </AnimatePresence>

        <div className="flex-1 flex w-full relative">
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
          <div
            className="flex-1 flex flex-col items-center justify-center p-4 min-h-0"
            onClick={(e) => {
              // Reset zoom if clicking the padding area (outside image container)
              if (e.target === e.currentTarget) {
                imageRef.current?.resetZoom();
              }
            }}
          >
            <div className="relative w-full h-full max-w-5xl max-h-full flex flex-col">
              {/* Image Container */}
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-[0_0_60px_-15px_rgba(79,70,229,0.1)] flex items-center justify-center group ring-1 ring-white/5">
                {/* Content */}
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
                  <div className="absolute inset-0 flex items-center justify-center p-1">
                    {loadingImage ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-500 uppercase tracking-widest">
                          Loading
                        </span>
                      </div>
                    ) : currentImageSrc ? (
                      <>
                        {/* Blurred Background for Fill */}
                        {!currentImageSrc.startsWith("video|") && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 saturate-150 transition-all duration-500"
                            style={{
                              backgroundImage: `url(${currentImageSrc})`,
                            }}
                          />
                        )}

                        {currentImageSrc.startsWith("video|") ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/80 relative z-10">
                            <video
                              src={currentImageSrc.substring(6)}
                              type={
                                images[currentIndex].endsWith(".mp4")
                                  ? "video/mp4"
                                  : images[currentIndex].endsWith(".webm")
                                    ? "video/webm"
                                    : images[currentIndex].endsWith(".mov")
                                      ? "video/mp4"
                                      : undefined
                              }
                              controls
                              autoPlay
                              muted
                              playsInline
                              preload="auto"
                              className="max-w-full max-h-full rounded-lg shadow-2xl"
                              onError={(e) => console.error("Video Error:", e)}
                            />
                          </div>
                        ) : (
                          <ZoomableImage
                            ref={imageRef}
                            src={currentImageSrc}
                            alt=""
                          />
                        )}
                      </>
                    ) : (
                      <div className="text-gray-600 flex flex-col items-center">
                        <ImageIcon size={48} className="mb-2 opacity-20" />
                        <p>No Preview Available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Info Overlay */}
                {/* Image Info Overlay */}
                {!isDone && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-sm font-mono text-gray-300 pointer-events-auto">
                      {images[currentIndex]}
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-bold text-gray-400 flex items-center pointer-events-auto">
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
        </div>

        {/* Thumbnail Carousel */}
        {!isDone && (
          <div className="h-28 w-full border-t border-white/5 bg-black/10 backdrop-blur-sm flex items-center justify-center relative">
            <div className="flex gap-2 p-4 overflow-hidden mask-linear-fade max-w-full">
              {/* Previous Indicator */}
              {carouselStartIndex > 0 && (
                <div className="w-8 flex items-center justify-center text-gray-600">
                  ...
                </div>
              )}

              {carouselImages.map((image, idx) => {
                if (!image || typeof image !== "string") return null;
                const actualIdx = carouselStartIndex + idx;
                const isCurrent = actualIdx === currentIndex;
                const ext = image.split(".").pop().toLowerCase();
                const isVideoFile = [
                  "mp4",
                  "mov",
                  "avi",
                  "mkv",
                  "webm",
                ].includes(ext);

                return (
                  <button
                    key={image || idx}
                    ref={(el) => (thumbnailRefs.current[actualIdx] = el)}
                    onClick={() => {
                      setCurrentIndex(actualIdx);
                    }}
                    className={clsx(
                      "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 transform group",
                      isCurrent
                        ? "ring-2 ring-indigo-500 scale-110 z-10 shadow-lg shadow-indigo-500/50"
                        : "opacity-60 hover:opacity-100 hover:scale-105 hover:ring-1 hover:ring-white/20",
                    )}
                  >
                    <Thumbnail
                      filename={image}
                      sourcePath={sourcePath}
                      current={isCurrent}
                    />

                    {isVideoFile && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/20 shadow-md">
                          <Play
                            size={14}
                            className="fill-white text-white ml-0.5"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay for Text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  </button>
                );
              })}
              {carouselEndIndex < images.length && (
                <div className="w-8 flex items-center justify-center text-gray-600">
                  ...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Dock (Destinations) */}
      <footer className="h-52 border-t border-white/5 bg-[#080808]/90 backdrop-blur-2xl z-30 flex flex-col shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-gray-400">
            <Move size={14} className="text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Destinations
            </span>
          </div>

          <button
            onClick={handleAddDestination}
            className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
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
            className="flex-shrink-0 w-36 h-32 border border-dashed border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-indigo-400 transition-all group"
          >
            <div className="p-3 rounded-full bg-white/5 group-hover:bg-indigo-500/10 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">
              New Folder
            </span>
          </button>
        </div>
      </footer>

      <AlertPopup
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={confirmDelete}
        title="Delete Image?"
        description={`Are you sure you want to permanently delete "${images[currentIndex] || "this image"}"? This action cannot be undone.`}
      />

      <SettingsPopup
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        shortcuts={shortcuts}
        onSave={(newShortcuts) => {
          setShortcuts(newShortcuts);
          setShowSettings(false);
        }}
      />
    </div>
  );
}

// Wrap Export
const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;
