
import React, { useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DocumentArrowUpIcon, SparklesIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '../../constants';
import { LoadingSpinner } from '../common/LoadingSpinner';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const pdfJsVersion = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
}

interface EditalUploadOnlyStepProps {
  onPdfUploaded: (editalText: string, fileName: string) => void;
  isLoading: boolean; 
}

export const EditalUploadOnlyStep: React.FC<EditalUploadOnlyStepProps> = ({ onPdfUploaded, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfParseMessage, setPdfParseMessage] = useState<string | null>(null);
  const [pdfParseError, setPdfParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Build text line by line, respecting TextItem.hasEOL more closely
      let line = "";
      textContent.items.forEach(item => {
        if ('str' in item) {
          line += item.str;
          if (('hasEOL' in item && item.hasEOL)) {
            fullText += line.trim() + "\n";
            line = "";
          } else {
            line += " "; // Add space if not EOL, to separate words
          }
        }
      });
      if (line.trim()) { // Add any remaining text on the line
        fullText += line.trim() + "\n";
      }
      fullText += "\n"; // Add an extra newline between pages as a clearer separator
    }
    // Normalize spaces: replace multiple spaces with one, but preserve newlines.
    // Trim spaces around newlines, then replace multiple newlines with a double newline (paragraph-like).
    let normalizedText = fullText.replace(/[ \t]+/g, ' '); // Remove multiple spaces/tabs
    normalizedText = normalizedText.replace(/\n[ \t]+/g, '\n'); // Remove spaces/tabs after newline
    normalizedText = normalizedText.replace(/[ \t]+\n/g, '\n'); // Remove spaces/tabs before newline
    normalizedText = normalizedText.replace(/\n{3,}/g, '\n\n'); // Collapse 3+ newlines to 2
    return normalizedText.trim();
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setPdfParseError('Erro: Por favor, selecione um arquivo PDF.');
        setPdfParseMessage(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setPdfParseError(null);
      setPdfParseMessage(`Analisando "${file.name}"...`);
      setIsParsingPdf(true);
      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
            setPdfParseError(`Não foi possível extrair texto do PDF "${file.name}". O arquivo pode estar vazio, protegido ou ser uma imagem.`);
            setPdfParseMessage(null);
        } else {
            setPdfParseMessage(`"${file.name}" processado com sucesso!`);
            onPdfUploaded(text, file.name); 
        }
      } catch (e) {
        console.error("Erro ao processar PDF:", e);
        setPdfParseError(`Erro ao processar PDF: ${(e as Error).message}. Tente outro arquivo.`);
        setPdfParseMessage(null);
      } finally {
        setIsParsingPdf(false);
      }
    }
  }, [onPdfUploaded]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <SparklesIcon className="w-16 h-16 text-white animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-800 via-sky-700 to-indigo-800 bg-clip-text text-transparent">
            ConcursoGenius
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-700 font-semibold mb-4">
            Seu Plano de Estudos Inteligente
          </p>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Revolucione seus estudos com nossa IA avançada. Envie o edital e receba um plano personalizado,
            otimizado especialmente para o seu perfil e objetivos.
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="relative max-w-4xl mx-auto">
          {/* Background Decorations */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-sky-200/30 to-blue-300/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-200/30 to-purple-300/30 rounded-full blur-3xl"></div>
          
          <Card className="relative bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-6 transform hover:rotate-6 transition-transform duration-300">
                <DocumentArrowUpIcon className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Envie seu Edital
              </h2>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Nossa IA analisará cada detalhe do edital para criar o plano de estudos mais eficiente para você.
              </p>
            </div>

            {/* Upload Area */}
            <div className="mb-8">
              <input
                type="file"
                id="pdf-upload-main"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input-hidden"
                ref={fileInputRef}
                disabled={isLoading || isParsingPdf}
              />
              
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group ${
                  isParsingPdf || isLoading 
                    ? 'border-slate-300 bg-slate-50' 
                    : 'border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 hover:border-sky-400'
                }`}
                onClick={triggerFileInput}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isParsingPdf || isLoading 
                      ? 'bg-slate-200' 
                      : 'bg-sky-500 group-hover:bg-sky-600 shadow-lg group-hover:shadow-xl'
                  }`}>
                    {isParsingPdf || isLoading ? (
                      <LoadingSpinner size="md" />
                    ) : (
                      <DocumentArrowUpIcon className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {isParsingPdf ? 'Analisando seu edital...' : isLoading ? 'Carregando...' : 'Clique para enviar ou arraste o arquivo aqui'}
                  </h3>
                  
                  <p className="text-sm text-slate-500">
                    Suportamos apenas arquivos PDF • Tamanho máximo: 50MB
                  </p>
                  
                  {selectedFile && !isParsingPdf && (
                    <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status Messages */}
            {isParsingPdf && pdfParseMessage && (
              <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
                <LoadingSpinner size="sm" color="text-blue-600" />
                <span className="ml-3 font-medium">{pdfParseMessage}</span>
              </div>
            )}

            {!isParsingPdf && pdfParseMessage && !pdfParseError && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 mr-3 text-green-500" />
                <span className="font-medium">{pdfParseMessage}</span>
              </div>
            )}

            {pdfParseError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 mr-3 text-red-500" />
                <span className="font-medium">{pdfParseError}</span>
              </div>
            )}

            {/* Process Steps */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-2xl font-bold text-center text-slate-800 mb-8 flex items-center justify-center">
                <InformationCircleIcon className="w-7 h-7 text-sky-500 mr-3"/>
                Como Funciona Nossa IA?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Análise Inteligente</h4>
                  <p className="text-sm text-slate-600">Nossa IA extrai e analisa todas as informações do edital automaticamente</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Personalização</h4>
                  <p className="text-sm text-slate-600">Criamos um plano baseado no seu perfil, tempo disponível e objetivos</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Acompanhamento</h4>
                  <p className="text-sm text-slate-600">Dashboard inteligente e Coach IA para maximizar seus resultados</p>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-12 p-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
              <h3 className="text-xl font-bold text-slate-800 text-center mb-6">
                🚀 O que você vai receber:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                  <span className="text-slate-700">Cronograma de estudos personalizado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-700">Resumos e questões geradas por IA</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-700">Dashboard com progresso detalhado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-slate-700">Coach IA para dúvidas 24/7</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
