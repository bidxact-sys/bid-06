import React, { useState, useRef, useEffect } from 'react';
import { X, FileQuestion, Plus, Mic, MicOff, Loader2 } from 'lucide-react';
import { RfiItem, RfiPriority } from '../types';

interface NewRfiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rfi: RfiItem) => void;
}

export const NewRfiModal: React.FC<NewRfiModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('Turner Construction');
  const [project, setProject] = useState('Metro Heights Tower');
  const [priority, setPriority] = useState<RfiPriority>('HIGH');
  const [csiDivision, setCsiDivision] = useState('03 20 00 Concrete Reinforcing');
  const [assignedLeadName, setAssignedLeadName] = useState('Marcus Vance');
  const [description, setDescription] = useState('');
  const [deltaCost, setDeltaCost] = useState('');

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up recognition instance when unmounting or modal closes
  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // noop
      }
      setIsListening(false);
    }
  }, [isOpen]);

  const toggleVoiceDictation = () => {
    setSpeechError(null);

    // If currently listening, stop
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // noop
        }
      }
      setIsListening(false);
      return;
    }

    // Check browser compatibility for Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let accumulatedFinal = '';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinal += transcriptChunk + ' ';
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        setDescription((prev) => {
          // Append transcript cleanly
          const base = prev.trim();
          const spoken = (accumulatedFinal + interimTranscript).trim();
          if (!base) return spoken;
          // If previous already ends with part of the speech, handle safely
          return `${base} ${spoken}`.replace(/\s+/g, ' ');
        });

        // Reset buffer once applied to avoid duplication
        accumulatedFinal = '';
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          // Silence timeout, don't show noisy error
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError(err?.message || 'Could not start speech recognition.');
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const idNumber = Math.floor(100 + Math.random() * 900);
    const newRfi: RfiItem = {
      id: `RFI-2024-${idNumber}`,
      submittedTime: 'Submitted Just now',
      title: title.trim(),
      description: description.trim() || 'Technical clarification submitted for pre-construction estimating.',
      fullQuery: description.trim(),
      client,
      project,
      assignedLead: {
        name: assignedLeadName,
        initials: assignedLeadName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
        role: 'Estimating Lead',
        avatarColor: '#172554',
      },
      status: 'AWAITING_RESPONSE',
      statusLabel: 'AWAITING RESPONSE',
      priority,
      csiDivision,
      deltaCost: deltaCost ? parseFloat(deltaCost) : 0,
      deltaTonnage: 0,
    };

    onSubmit(newRfi);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#ff7886]/15 border border-[#ff7886]/30 flex items-center justify-center text-[#ffb4ab]">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Submit New Pre-Con Architectural RFI
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Directs clarification request to Architect / Engineer of Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Subject / Title */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
              RFI Subject / Inquiry Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Level 2 Shear Wall Tie-Down Re-specification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none transition-colors"
            />
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Client General Contractor
              </label>
              <select
                value={client}
                onChange={(e) => {
                  setClient(e.target.value);
                  if (e.target.value === 'Turner Construction') setProject('Metro Heights Tower');
                  if (e.target.value === 'Skanska USA') setProject('Biotech Innovation Lab');
                  if (e.target.value === 'Balfour Beatty') setProject('Harbor Logistics Hub');
                  if (e.target.value === 'Clark Construction') setProject('Apex Life Science Campus');
                }}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              >
                <option value="Turner Construction">Turner Construction</option>
                <option value="Skanska USA">Skanska USA</option>
                <option value="Balfour Beatty">Balfour Beatty</option>
                <option value="Clark Construction">Clark Construction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Target Project
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          {/* CSI Division & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                CSI MasterFormat Division
              </label>
              <select
                value={csiDivision}
                onChange={(e) => setCsiDivision(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none font-mono"
              >
                <option value="03 20 00 Concrete Reinforcing">03 20 00 Concrete Reinforcing</option>
                <option value="05 12 00 Structural Steel Framing">05 12 00 Structural Steel Framing</option>
                <option value="23 31 00 HVAC Ducts & Casings">23 31 00 HVAC Ducts & Casings</option>
                <option value="08 44 00 Curtain Wall and Glazed Assemblies">08 44 00 Curtain Wall & Glazing</option>
                <option value="26 05 00 Common Work Results for Electrical">26 05 00 Electrical Systems</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Resolution Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RfiPriority)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none font-mono"
              >
                <option value="CRITICAL">CRITICAL (Direct Bid Blocker)</option>
                <option value="HIGH">HIGH (SLA 24h)</option>
                <option value="MEDIUM">MEDIUM (SLA 48h)</option>
                <option value="LOW">LOW (Informational)</option>
              </select>
            </div>
          </div>

          {/* Assigned Lead & Estimated Delta Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Assigned Lead
              </label>
              <select
                value={assignedLeadName}
                onChange={(e) => setAssignedLeadName(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              >
                <option value="Marcus Vance">Marcus Vance (Managing Principal)</option>
                <option value="David Chen">David Chen (Senior MEP Estimator)</option>
                <option value="Umer">Umer (Lead Steel Estimator)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Estimated Delta Cost ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={deltaCost}
                onChange={(e) => setDeltaCost(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          {/* Detailed Question / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold">
                Technical Query & Drawing References
              </label>
              <button
                type="button"
                id="rfi-voice-dictate-btn"
                onClick={toggleVoiceDictation}
                title={isListening ? 'Stop voice recording' : 'Dictate with microphone (Web Speech API)'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer border ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-sm shadow-red-500/20'
                    : 'bg-[#1b2339] text-[#4edea3] hover:bg-[#232d48] border-[#2d3449] hover:border-[#4edea3]/40'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    <Mic className="w-3.5 h-3.5" />
                    <span>Listening... (Click to stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Dictate</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                id="rfi-description-input"
                placeholder="Cite sheet numbers, conflicting spec sections, and potential takeoff delta (or click 'Voice Dictate' to speak)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full bg-[#0b1326] border rounded-md p-3 text-xs text-[#dae2fd] outline-none resize-none leading-relaxed transition-colors ${
                  isListening ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-[#222a3d] focus:border-[#4edea3]'
                }`}
              />
              {isListening && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[10px] font-mono text-red-400 bg-[#131b2e]/90 px-2 py-0.5 rounded border border-red-500/30 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Transcribing speech...
                </div>
              )}
            </div>

            {speechError && (
              <p className="mt-1 text-[11px] text-[#ffb4ab] font-mono">
                {speechError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-[#222a3d] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono text-[#86948a] hover:text-[#dae2fd]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Pre-Con RFI</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
