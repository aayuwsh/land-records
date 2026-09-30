import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { MapPlot, LandRecord, RecordMapLink } from '@/types';
import { Map as MapIcon, Layers, Eye, AlertTriangle, Maximize2 } from 'lucide-react';

export function MapsPage() {
  const [plots, setPlots] = useState<MapPlot[]>([]);
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [links, setLinks] = useState<RecordMapLink[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<MapPlot | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null);
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  async function loadMapData() {
    setLoading(true);
    const [plotsRes, recordsRes, linksRes] = await Promise.all([
      supabase.from('map_plots').select('*'),
      supabase.from('land_records').select('*'),
      supabase.from('record_map_links').select('*'),
    ]);
    setPlots((plotsRes.data || []) as MapPlot[]);
    setRecords((recordsRes.data || []) as LandRecord[]);
    setLinks((linksRes.data || []) as RecordMapLink[]);
    setLoading(false);
  }

  function handlePlotClick(plot: MapPlot) {
    setSelectedPlot(plot);
    const link = links.find((l) => l.map_plot_id === plot.id);
    if (link) {
      const rec = records.find((r) => r.id === link.land_record_id);
      setSelectedRecord(rec || null);
    } else {
      setSelectedRecord(null);
    }
  }

  const villages = [...new Set(plots.map((p) => p.village).filter(Boolean))] as string[];
  const filteredPlots = villageFilter === 'all' ? plots : plots.filter((p) => p.village === villageFilter);

  // SVG coordinate system: 560 x 560 viewBox
  const svgWidth = 560;
  const svgHeight = 560;

  function getPolygonPoints(coords: number[][]): string {
    return coords.map(([x, y]) => `${x},${y}`).join(' ');
  }

  function getPlotColor(plot: MapPlot): string {
    if (plot.validation_status === 'unverified') return '#d4d3cd';
    if (plot.is_ai_derived) return '#c47830';
    const link = links.find((l) => l.map_plot_id === plot.id);
    if (link && link.match_status === 'verified') return '#3d7068';
    if (link) return '#4a6fa5';
    return '#b4b4b4';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            Cadastral Map Visualization
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">GIS Maps</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="bg-transparent border border-[#e5e4de] px-3 py-2 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
          >
            <option value="all">All Villages</option>
            {villages.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de] flex items-center justify-between">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
              <MapIcon size={12} /> Cadastral Map — {villageFilter === 'all' ? 'All Villages' : villageFilter}
            </p>
            <div className="flex items-center gap-3 text-[9px] mono-data">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#3d7068]" /> Verified</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#4a6fa5]" /> Linked</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#c47830]" /> AI-derived</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#d4d3cd]" /> Unverified</span>
            </div>
          </div>
          <div className="p-4 bg-[#f7f6f2]/50 relative">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: '600px' }}>
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e4de" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

              {/* Plots */}
              {filteredPlots.map((plot) => {
                const isSelected = selectedPlot?.id === plot.id;
                const color = getPlotColor(plot);
                return (
                  <g key={plot.id} onClick={() => handlePlotClick(plot)} style={{ cursor: 'pointer' }}>
                    <polygon
                      points={getPolygonPoints(plot.geometry.coordinates)}
                      fill={isSelected ? color : `${color}40`}
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                    {plot.geometry.type === 'polygon' && plot.geometry.coordinates.length > 0 && (
                      <text
                        x={(plot.geometry.coordinates[0][0] + plot.geometry.coordinates[1][0]) / 2}
                        y={(plot.geometry.coordinates[0][1] + plot.geometry.coordinates[2][1]) / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#1c1c1c"
                        style={{ font: '600 9px "Space Mono", monospace', pointerEvents: 'none' }}
                      >
                        {plot.survey_number}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase mt-2 text-center">
              Prototype / Mock — SVG-based cadastral visualization. Production will use PostGIS + Leaflet.
            </p>
          </div>
        </div>

        {/* Sidebar: Plot details */}
        <div className="space-y-4">
          {selectedPlot && (
            <div className="border border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Layers size={12} /> Plot Details
                </p>
              </div>
              <div className="divide-y divide-[#e5e4de]">
                {[
                  { label: 'Plot Number', value: selectedPlot.plot_number },
                  { label: 'Survey Number', value: selectedPlot.survey_number },
                  { label: 'Village', value: selectedPlot.village },
                  { label: 'Tehsil', value: selectedPlot.tehsil },
                  { label: 'District', value: selectedPlot.district },
                  { label: 'Area', value: selectedPlot.area ? `${selectedPlot.area} ${selectedPlot.area_unit}` : null },
                ].map((f) => (
                  <div key={f.label} className="px-4 py-2.5 flex justify-between items-center">
                    <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{f.label}</span>
                    <span className="text-sm text-[#1c1c1c]">{f.value || '—'}</span>
                  </div>
                ))}
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Geometry</span>
                  <span className="text-[10px] mono-data" style={{
                    color: selectedPlot.is_ai_derived ? '#c47830' : '#3d7068'
                  }}>
                    {selectedPlot.is_ai_derived ? 'AI-Derived' : 'Authoritative'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Validation</span>
                  <span className="text-[10px] mono-data uppercase tracking-[0.1em]" style={{
                    color: selectedPlot.validation_status === 'verified' ? '#3d7068' :
                           selectedPlot.validation_status === 'requires_validation' ? '#c47830' : '#6b7280'
                  }}>
                    {selectedPlot.validation_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {selectedPlot.is_ai_derived && (
                <div className="px-4 py-3 bg-[#faf3e8] border-t border-[#e5e4de]">
                  <p className="text-[10px] text-[#c47830] flex items-center gap-2">
                    <AlertTriangle size={11} /> AI-derived geometry requires validation
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Linked record */}
          {selectedRecord && (
            <Link
              to={`/records/${selectedRecord.id}`}
              className="block border border-[#e5e4de] hover:border-[#3d7068] editorial-ease"
            >
              <div className="px-4 py-3 border-b border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Eye size={12} /> Linked Land Record
                </p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Owner</span>
                  <span className="text-[#1c1c1c]">{selectedRecord.owner_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Area</span>
                  <span className="mono-data text-[#1c1c1c]">{selectedRecord.area} {selectedRecord.area_unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Classification</span>
                  <span className="text-[#1c1c1c]">{selectedRecord.land_classification}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Status</span>
                  <span className="text-[10px] mono-data uppercase tracking-[0.1em]" style={{
                    color: selectedRecord.verification_status === 'verified' || selectedRecord.verification_status === 'approved' ? '#3d7068' : '#c47830'
                  }}>
                    {selectedRecord.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Mutation</span>
                  <span className="mono-data text-[#1c1c1c]">{selectedRecord.mutation_number || '—'}</span>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-[#e5e4de] text-center">
                <span className="text-[10px] mono-data text-[#3d7068] tracking-[0.15em] uppercase">View Full Record</span>
              </div>
            </Link>
          )}

          {!selectedPlot && (
            <div className="border border-[#e5e4de] p-8 text-center">
              <Maximize2 size={20} className="mx-auto text-[#e5e4de] mb-2" />
              <p className="text-sm text-[#b4b4b4]">Click a plot to view details</p>
            </div>
          )}

          {/* Stats */}
          <div className="border border-[#e5e4de] p-4">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-3">Map Statistics</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#6b7280]">Total Plots</span>
                <span className="mono-data text-[#1c1c1c]">{plots.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6b7280]">Linked Records</span>
                <span className="mono-data text-[#1c1c1c]">{links.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6b7280]">AI-Derived</span>
                <span className="mono-data text-[#c47830]">{plots.filter((p) => p.is_ai_derived).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6b7280]">Verified</span>
                <span className="mono-data text-[#3d7068]">{plots.filter((p) => p.validation_status === 'verified').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
