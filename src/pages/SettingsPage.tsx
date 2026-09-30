import { useState } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { Settings as SettingsIcon, Cog, Gauge, Shield, Database } from 'lucide-react';

export function SettingsPage() {
  const { showToast } = useToastContext();
  const [thresholds, setThresholds] = useState({
    high_confidence: '90',
    medium_confidence: '70',
    low_confidence: '70',
  });
  const [config, setConfig] = useState({
    ocr_model: 'tesseract-v1',
    language_default: 'en',
    max_upload_size: '50',
    auto_validate: true,
    require_verification: true,
  });

  function saveSettings() {
    showToast('Settings saved (prototype — not persisted)', 'success');
  }

  const settingsSections = [
    { key: 'ai', label: 'AI & Model Settings', icon: Cog },
    { key: 'thresholds', label: 'Confidence Thresholds', icon: Gauge },
    { key: 'security', label: 'Security & Access', icon: Shield },
    { key: 'system', label: 'System Configuration', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          System Configuration
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Settings</h1>
      </div>

      {/* AI/Model settings */}
      <div className="border border-[#e5e4de]">
        <div className="px-4 py-3 border-b border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
            <Cog size={12} /> AI & Model Settings
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
              OCR Engine
            </label>
            <select
              value={config.ocr_model}
              onChange={(e) => setConfig({ ...config, ocr_model: e.target.value })}
              className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            >
              <option value="tesseract-v1">Tesseract v1 (Prototype)</option>
              <option value="paddleocr">PaddleOCR (Production)</option>
              <option value="trocr">TrOCR for Handwriting</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
              Default Language
            </label>
            <select
              value={config.language_default}
              onChange={(e) => setConfig({ ...config, language_default: e.target.value })}
              className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c1c1c]">Auto-validate high-confidence records</p>
              <p className="text-[10px] text-[#b4b4b4] mt-0.5">Automatically validate records above threshold</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, auto_validate: !config.auto_validate })}
              className={`w-10 h-5 rounded-full transition-colors ${config.auto_validate ? 'bg-[#3d7068]' : 'bg-[#e5e4de]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.auto_validate ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Confidence thresholds */}
      <div className="border border-[#e5e4de]">
        <div className="px-4 py-3 border-b border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
            <Gauge size={12} /> Confidence Thresholds
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] mono-data text-[#3d7068] tracking-[0.15em] uppercase mb-2">
                High (≥)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.high_confidence}
                  onChange={(e) => setThresholds({ ...thresholds, high_confidence: e.target.value })}
                  className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
                />
                <span className="text-xs mono-data text-[#b4b4b4]">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[9px] mono-data text-[#c47830] tracking-[0.15em] uppercase mb-2">
                Review (≥)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.medium_confidence}
                  onChange={(e) => setThresholds({ ...thresholds, medium_confidence: e.target.value })}
                  className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
                />
                <span className="text-xs mono-data text-[#b4b4b4]">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[9px] mono-data text-[#b54545] tracking-[0.15em] uppercase mb-2">
                Manual {'<'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholds.low_confidence}
                  onChange={(e) => setThresholds({ ...thresholds, low_confidence: e.target.value })}
                  className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
                />
                <span className="text-xs mono-data text-[#b4b4b4]">%</span>
              </div>
            </div>
          </div>
          <div className="bg-[#eaf2f0]/20 border border-[#e5e4de] p-3 text-xs text-[#6b7280]">
            Records with confidence ≥ {thresholds.high_confidence}% are auto-validated.
            Records between {thresholds.medium_confidence}% and {thresholds.high_confidence}% are flagged for review.
            Records below {thresholds.low_confidence}% require manual verification.
          </div>
        </div>
      </div>

      {/* Security settings */}
      <div className="border border-[#e5e4de]">
        <div className="px-4 py-3 border-b border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
            <Shield size={12} /> Security & Access
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
              Max Upload Size (MB)
            </label>
            <input
              type="number"
              value={config.max_upload_size}
              onChange={(e) => setConfig({ ...config, max_upload_size: e.target.value })}
              className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1c1c1c]">Require verification for all records</p>
              <p className="text-[10px] text-[#b4b4b4] mt-0.5">Even high-confidence records need officer approval</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, require_verification: !config.require_verification })}
              className={`w-10 h-5 rounded-full transition-colors ${config.require_verification ? 'bg-[#3d7068]' : 'bg-[#e5e4de]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.require_verification ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="border border-[#e5e4de]">
        <div className="px-4 py-3 border-b border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
            <Database size={12} /> System Information
          </p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Database', value: 'PostgreSQL (Supabase)' },
            { label: 'Storage', value: 'Supabase Storage' },
            { label: 'Auth', value: 'Supabase Auth' },
            { label: 'OCR Pipeline', value: 'Prototype — Mock' },
            { label: 'GIS Engine', value: 'SVG (Prototype) → PostGIS' },
            { label: 'Integration', value: 'Mock Adapters' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between border-b border-[#e5e4de] py-2">
              <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{item.label}</span>
              <span className="text-xs text-[#1c1c1c]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={saveSettings}
        className="bg-[#3d7068] text-[#f7f6f2] px-6 py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease"
      >
        Save Settings
      </button>
    </div>
  );
}
