import React, { useState, useEffect } from 'react';
import { Globe, GitBranch, MessageSquare, TrendingUp, BookOpen, ExternalLink, ArrowRight, Compass } from 'lucide-react';
import { ExternalIntelEngine, IntelCategory, IntelLink } from '../engine/externalIntelEngine';

interface ExternalIntelViewerProps {
  decisionContext: string;
  sector: string;
}

const TYPE_ICONS: Record<IntelLink['type'], React.ReactNode> = {
  github: <GitBranch className="w-4 h-4" />,
  forum: <MessageSquare className="w-4 h-4" />,
  research: <BookOpen className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  social: <Globe className="w-4 h-4" />
};

const TYPE_COLORS: Record<IntelLink['type'], string> = {
  github: 'text-slate-300 bg-slate-800 border-slate-700',
  forum: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  research: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  trending: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  social: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
};

export const ExternalIntelViewer: React.FC<ExternalIntelViewerProps> = ({
  decisionContext,
  sector
}) => {
  const [categories, setCategories] = useState<IntelCategory[]>([]);
  const [extractedKeywords, setExtractedKeywords] = useState('');

  useEffect(() => {
    // Generate links based on the problem context
    const fallbackContext = decisionContext || 'Strategic Architecture';
    const links = ExternalIntelEngine.generateLinks(fallbackContext, sector as any);
    setCategories(links);
    
    // For display, roughly extract keywords (using same logic privately in engine, we just re-do it here for UI)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'build', 'create']);
    const words = fallbackContext.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
    const meaningfulWords = words.filter(w => w.length > 2 && !stopWords.has(w));
    setExtractedKeywords(meaningfulWords.slice(0, 3).join(' ') || 'Architecture');
  }, [decisionContext, sector]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-500" />
            External Intel & Validation Hub
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Triangulate tricky decisions by tapping into global consensus, open-source trends, and peer-reviewed research.
          </p>
        </div>
        
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1 min-w-[200px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Extraction Query</span>
          <div className="text-sm font-mono text-cyan-400 font-semibold truncate">
            "{extractedKeywords}"
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((category, idx) => (
          <div key={idx} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
              {category.categoryName}
            </h3>
            
            <div className="space-y-3">
              {category.links.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md border ${TYPE_COLORS[link.type]}`}>
                        {TYPE_ICONS[link.type]}
                      </div>
                      <span className="font-bold text-slate-200 text-sm group-hover:text-cyan-400 transition-colors">
                        {link.title}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {link.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 px-2 py-0.5 bg-slate-900 rounded">
                      SRC: {link.source}
                    </span>
                    <span className="text-cyan-500/0 group-hover:text-cyan-500 transition-colors flex items-center gap-1">
                      Execute Query <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
