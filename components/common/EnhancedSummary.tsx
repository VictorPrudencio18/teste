import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ReadingModeToggle } from './ReadingModeToggle';
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  StarIcon, 
  BeakerIcon, 
  FireIcon, 
  EyeIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  CubeTransparentIcon, 
  BoltIcon, 
  MagnifyingGlassIcon,
  LightBulbIcon,
  CheckCircleIcon,
  SparklesIcon,
  ClockIcon,
  BrainIcon,
  InformationCircleIcon
} from '../../constants';
import { marked } from 'marked';

interface SummarySection {
  id: string;
  title: string;
  content: string;
  type: 'concept' | 'example' | 'definition' | 'procedure' | 'theory' | 'application';
  importance: 'low' | 'medium' | 'high' | 'critical';
  estimatedReadTime: number;
  keywords: string[];
}

interface EnhancedSummaryProps {
  summaryContent: string;
  topicName: string;
  onRegenerateSummary: () => void;
  isLoading: boolean;
}

interface ReadingProgress {
  totalSections: number;
  completedSections: number;
  timeSpent: number;
  lastReadSection: string | null;
}

type ReadingMode = 'structured' | 'linear' | 'focus';

const SECTION_TYPE_CONFIG = {
  concept: { icon: BrainIcon, color: 'from-purple-500 to-indigo-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  example: { icon: LightBulbIcon, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  definition: { icon: BookOpenIcon, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  procedure: { icon: CogIcon, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  theory: { icon: BeakerIcon, color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  application: { icon: BoltIcon, color: 'from-red-500 to-pink-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const IMPORTANCE_CONFIG = {
  low: { priority: 1, label: 'Básico', color: 'text-slate-600', bgColor: 'bg-slate-100', badgeColor: 'bg-slate-500' },
  medium: { priority: 2, label: 'Importante', color: 'text-blue-700', bgColor: 'bg-blue-100', badgeColor: 'bg-blue-500' },
  high: { priority: 3, label: 'Essencial', color: 'text-amber-700', bgColor: 'bg-amber-100', badgeColor: 'bg-amber-500' },
  critical: { priority: 4, label: 'Fundamental', color: 'text-red-700', bgColor: 'bg-red-100', badgeColor: 'bg-red-500' },
};

export const EnhancedSummary: React.FC<EnhancedSummaryProps> = ({
  summaryContent,
  topicName,
  onRegenerateSummary,
  isLoading
}) => {
  const [sections, setSections] = useState<SummarySection[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    totalSections: 0,
    completedSections: 0,
    timeSpent: 0,
    lastReadSection: null
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showStats, setShowStats] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [readingMode, setReadingMode] = useState<ReadingMode>('structured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showReadingTips, setShowReadingTips] = useState(false);

  // Parse the summary content into structured sections
  useEffect(() => {
    if (summaryContent) {
      const parsedSections = parseContentIntoSections(summaryContent);
      setSections(parsedSections);
      setReadingProgress(prev => ({
        ...prev,
        totalSections: parsedSections.length
      }));
    }
  }, [summaryContent]);

  // Update reading progress
  useEffect(() => {
    setReadingProgress(prev => ({
      ...prev,
      completedSections: completedSections.size
    }));
  }, [completedSections]);

  // Start reading timer
  useEffect(() => {
    if (sections.length > 0 && !readingStartTime) {
      setReadingStartTime(Date.now());
    }
  }, [sections, readingStartTime]);

  const parseContentIntoSections = (content: string): SummarySection[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const sections: SummarySection[] = [];
    let currentSection: Partial<SummarySection> = {};
    let sectionContent: string[] = [];
    let sectionIndex = 0;

    // Enhanced parsing logic to create structured sections
    for (const line of lines) {
      if (line.startsWith('##') || line.startsWith('#')) {
        // Save previous section if exists
        if (currentSection.title && sectionContent.length > 0) {
          sections.push({
            id: `section-${sectionIndex}`,
            title: currentSection.title,
            content: sectionContent.join('\n'),
            type: inferSectionType(currentSection.title, sectionContent.join(' ')),
            importance: inferImportance(currentSection.title, sectionContent.join(' ')),
            estimatedReadTime: Math.max(1, Math.ceil(sectionContent.join(' ').split(' ').length / 200)),
            keywords: extractKeywords(sectionContent.join(' '))
          });
          sectionIndex++;
        }
        
        // Start new section
        currentSection = {
          title: line.replace(/^#+\s*/, '').trim()
        };
        sectionContent = [];
      } else if (line.trim() && currentSection.title) {
        sectionContent.push(line);
      }
    }

    // Add last section
    if (currentSection.title && sectionContent.length > 0) {
      sections.push({
        id: `section-${sectionIndex}`,
        title: currentSection.title,
        content: sectionContent.join('\n'),
        type: inferSectionType(currentSection.title, sectionContent.join(' ')),
        importance: inferImportance(currentSection.title, sectionContent.join(' ')),
        estimatedReadTime: Math.max(1, Math.ceil(sectionContent.join(' ').split(' ').length / 200)),
        keywords: extractKeywords(sectionContent.join(' '))
      });
    }

    // If no sections found, create a single section
    if (sections.length === 0) {
      sections.push({
        id: 'section-0',
        title: 'Resumo Principal',
        content: content,
        type: 'concept',
        importance: 'high',
        estimatedReadTime: Math.max(1, Math.ceil(content.split(' ').length / 200)),
        keywords: extractKeywords(content)
      });
    }

    return sections;
  };

  const inferSectionType = (title: string, content: string): SummarySection['type'] => {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('exemplo') || titleLower.includes('case') || contentLower.includes('por exemplo')) return 'example';
    if (titleLower.includes('definição') || titleLower.includes('conceito') || titleLower.includes('o que é')) return 'definition';
    if (titleLower.includes('procedimento') || titleLower.includes('processo') || titleLower.includes('como')) return 'procedure';
    if (titleLower.includes('teoria') || titleLower.includes('fundamento') || titleLower.includes('base teórica')) return 'theory';
    if (titleLower.includes('aplicação') || titleLower.includes('prática') || titleLower.includes('uso')) return 'application';
    
    return 'concept';
  };

  const inferImportance = (title: string, content: string): SummarySection['importance'] => {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    const criticalWords = ['fundamental', 'essencial', 'crítico', 'importante', 'central', 'principal'];
    const highWords = ['relevante', 'significativo', 'destacar', 'notar'];
    
    const criticalCount = criticalWords.filter(word => 
      titleLower.includes(word) || contentLower.includes(word)
    ).length;
    
    const highCount = highWords.filter(word => 
      titleLower.includes(word) || contentLower.includes(word)
    ).length;
    
    if (criticalCount > 0 || titleLower.includes('introdução') || titleLower.includes('resumo')) return 'critical';
    if (highCount > 0 || content.length > 300) return 'high';
    if (content.length > 150) return 'medium';
    return 'low';
  };

  const extractKeywords = (content: string): string[] => {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['sobre', 'através', 'também', 'assim', 'quando', 'onde', 'como', 'para', 'pela', 'pelo'].includes(word));
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const markSectionAsRead = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
    setReadingProgress(prev => ({
      ...prev,
      lastReadSection: sectionId,
      timeSpent: readingStartTime ? Math.floor((Date.now() - readingStartTime) / 1000) : 0
    }));
  };

  const filteredSections = sections.filter(section => {
    const matchesImportance = filterImportance === 'all' || section.importance === filterImportance;
    const matchesType = filterType === 'all' || section.type === filterType;
    const matchesSearch = searchQuery === '' || 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply reading mode filters
    if (readingMode === 'focus') {
      const matchesFocus = section.importance === 'critical' || section.importance === 'high';
      return matchesImportance && matchesType && matchesSearch && matchesFocus;
    }
    
    return matchesImportance && matchesType && matchesSearch;
  });

  // Sort sections based on reading mode
  const sortedSections = [...filteredSections].sort((a, b) => {
    if (readingMode === 'structured') {
      // Sort by importance first, then by type
      const importancePriority = IMPORTANCE_CONFIG[b.importance].priority - IMPORTANCE_CONFIG[a.importance].priority;
      if (importancePriority !== 0) return importancePriority;
      return a.type.localeCompare(b.type);
    }
    // For linear mode, keep original order
    return 0;
  });

  const getProgressPercentage = () => {
    return readingProgress.totalSections > 0 
      ? Math.round((readingProgress.completedSections / readingProgress.totalSections) * 100)
      : 0;
  };

  const getTotalReadingTime = () => {
    return sections.reduce((total, section) => total + section.estimatedReadTime, 0);
  };

  const formatReadingTime = (minutes: number) => {
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Topic Info and Progress */}
      <Card className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <DocumentTextIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">{topicName}</h2>
              <p className="text-sky-100 text-sm">Resumo Inteligente Estruturado</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{sections.length}</div>
              <div className="text-xs text-sky-100">Seções</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatReadingTime(getTotalReadingTime())}</div>
              <div className="text-xs text-sky-100">Leitura</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{getProgressPercentage()}%</div>
              <div className="text-xs text-sky-100">Progresso</div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Stats and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Reading Mode Toggle */}
        <ReadingModeToggle 
          currentMode={readingMode}
          onModeChange={setReadingMode}
        />
        
        {/* Search and Actions */}
        <div className="flex flex-wrap gap-4 items-center justify-between flex-1">
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar no resumo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showStats ? 'primary' : 'outline'}
              onClick={() => setShowStats(!showStats)}
              leftIcon={<InformationCircleIcon className="w-4 h-4" />}
            >
              {showStats ? 'Ocultar' : 'Ver'} Stats
            </Button>
            
            <Button
              size="sm"
              variant={showReadingTips ? 'primary' : 'outline'}
              onClick={() => setShowReadingTips(!showReadingTips)}
              leftIcon={<LightBulbIcon className="w-4 h-4" />}
            >
              Dicas
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerateSummary}
              isLoading={isLoading}
              leftIcon={<SparklesIcon className="w-4 h-4" />}
            >
              Regenerar
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
              className="text-sm border border-slate-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="all">Todas Importâncias</option>
              <option value="critical">Fundamental</option>
              <option value="high">Essencial</option>
              <option value="medium">Importante</option>
              <option value="low">Básico</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-slate-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="concept">Conceitos</option>
              <option value="definition">Definições</option>
              <option value="example">Exemplos</option>
              <option value="procedure">Procedimentos</option>
              <option value="theory">Teoria</option>
              <option value="application">Aplicações</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reading Tips */}
      {showReadingTips && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
            <LightBulbIcon className="w-5 h-5 mr-2" />
            Dicas de Leitura Eficiente
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-700">
            <div className="space-y-2">
              <p><strong>Modo Estruturado:</strong> Organiza por prioridade - comece pelos fundamentais</p>
              <p><strong>Modo Linear:</strong> Leitura sequencial tradicional do início ao fim</p>
              <p><strong>Modo Foco:</strong> Apenas conteúdo crítico e essencial</p>
            </div>
            <div className="space-y-2">
              <p><strong>💡 Dica:</strong> Use a busca para encontrar conceitos específicos rapidamente</p>
              <p><strong>⭐ Sugestão:</strong> Marque seções como lidas para acompanhar seu progresso</p>
              <p><strong>🎯 Estratégia:</strong> Revise as palavras-chave antes de estudar outras áreas</p>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Panel */}
      {showStats && (
        <Card className="bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-sky-600" />
            Estatísticas de Leitura
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sections.filter(s => s.type === 'concept').length}</div>
              <div className="text-xs text-slate-600">Conceitos</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sections.filter(s => s.type === 'definition').length}</div>
              <div className="text-xs text-slate-600">Definições</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{sections.filter(s => s.type === 'example').length}</div>
              <div className="text-xs text-slate-600">Exemplos</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-slate-600">{Math.floor(readingProgress.timeSpent / 60)}min</div>
              <div className="text-xs text-slate-600">Tempo Lido</div>
            </div>
          </div>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {searchQuery && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
              {sortedSections.length} resultado(s) encontrado(s) para "{searchQuery}"
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                >
                  limpar busca
                </button>
              )}
            </p>
          </div>
        )}

        {readingMode === 'focus' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm flex items-center">
              <FireIcon className="w-4 h-4 mr-2" />
              Modo Foco ativo - mostrando apenas conteúdo essencial e fundamental
            </p>
          </div>
        )}

        {sortedSections.map((section, index) => {
          const config = SECTION_TYPE_CONFIG[section.type];
          const importanceConfig = IMPORTANCE_CONFIG[section.importance];
          const isExpanded = expandedSections.has(section.id);
          const isCompleted = completedSections.has(section.id);
          const IconComponent = config.icon;

          return (
            <Card 
              key={section.id}
              className={`relative overflow-hidden border-l-4 ${config.borderColor} transition-all duration-200 hover:shadow-lg ${isCompleted ? 'bg-green-50' : ''}`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color} text-white shadow-sm`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800 font-display">{section.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${importanceConfig.badgeColor}`}>
                        {importanceConfig.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {section.estimatedReadTime} min
                      </span>
                      <span className="capitalize">{section.type.replace('_', ' ')}</span>
                      {section.keywords.length > 0 && (
                        <span className="flex items-center">
                          <span className="mr-1">🏷️</span>
                          {section.keywords.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isCompleted && (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSectionExpansion(section.id)}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    {isExpanded ? '−' : '+'}
                  </Button>
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div 
                    className="prose prose-slate max-w-none text-slate-700 leading-relaxed
                               prose-headings:font-display prose-headings:text-slate-800 
                               prose-strong:text-slate-900 prose-a:text-sky-600 hover:prose-a:text-sky-700
                               prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                               prose-blockquote:border-l-4 prose-blockquote:border-sky-300 prose-blockquote:pl-4
                               prose-ul:my-2 prose-li:my-1"
                    dangerouslySetInnerHTML={{ 
                      __html: marked.parse(section.content) 
                    }} 
                  />
                  
                  {/* Keywords */}
                  {section.keywords.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                        Palavras-chave
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {section.keywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 text-xs bg-sky-100 text-sky-800 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Mark as Read Button */}
                  {!isCompleted && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => markSectionAsRead(section.id)}
                        leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Marcar como Lido
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Section Number Badge */}
              <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                {index + 1}/{sortedSections.length}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Completion Message */}
      {getProgressPercentage() === 100 && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
          <div className="flex flex-col items-center space-y-3">
            <CheckCircleIcon className="w-16 h-16" />
            <div>
              <h3 className="text-xl font-bold">Parabéns! 🎉</h3>
              <p className="text-green-100">Você completou a leitura de todo o resumo!</p>
              <p className="text-sm text-green-200 mt-1">
                Tempo total: {formatReadingTime(Math.floor(readingProgress.timeSpent / 60))}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};