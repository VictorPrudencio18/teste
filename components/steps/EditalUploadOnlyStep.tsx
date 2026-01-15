
import React, { useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DocumentArrowUpIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, AcademicCapIcon } from '../../constants';
import { LoadingSpinner } from '../common/LoadingSpinner';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;
}

interface EditalUploadOnlyStepProps {
  onPdfUploaded: (editalText: string, fileName: string) => void;
  isLoading: boolean; 
}

export const EditalUploadOnlyStep: React.FC<EditalUploadOnlyStepProps> = ({ onPdfUploaded, isLoading }) => {
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
      let line = "";
      textContent.items.forEach(item => {
        if ('str' in item) {
          line += item.str;
          if (('hasEOL' in item && item.hasEOL)) {
            fullText += line.trim() + "\n";
            line = "";
          } else {
            line += " "; 
          }
        }
      });
      if (line.trim()) fullText += line.trim() + "\n";
      fullText += "\n"; 
    }
    let normalizedText = fullText.replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n'); 
    return normalizedText.trim();
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setPdfParseError('Apenas arquivos PDF são aceitos.');
        setPdfParseMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setPdfParseError(null);
      setPdfParseMessage(`Lendo "${file.name}"...`);
      setIsParsingPdf(true);
      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
            setPdfParseError(`O PDF parece estar vazio ou é uma imagem.`);
            setPdfParseMessage(null);
        } else {
            setPdfParseMessage(`Pronto!`);
            onPdfUploaded(text, file.name); 
        }
      } catch (e) {
        setPdfParseError(`Erro ao ler PDF: ${(e as Error).message}`);
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center max-w-3xl mx-auto mb-10 fade-in">
         <div className="inline-flex items-center justify-center p-3 bg-sky-50 rounded-2xl mb-6 shadow-sm">
             <AcademicCapIcon className="w-10 h-10 text-sky-600" />
         </div>
         <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-display mb-6 leading-tight">
            Sua Aprovação Começa <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500">Aqui.</span>
         </h1>
         <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transforme editais complexos em planos de estudo personalizados em segundos usando Inteligência Artificial.
         </p>
         
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="file"
              id="pdf-upload-main"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input-hidden"
              ref={fileInputRef}
              disabled={isLoading || isParsingPdf}
            />
            <Button
                onClick={triggerFileInput}
                isLoading={isParsingPdf || isLoading}
                disabled={isParsingPdf || isLoading}
                size="lg"
                className="w-full sm:w-auto px-10 py-5 text-lg shadow-sky-200 hover:shadow-sky-300 shadow-xl transform hover:-translate-y-1 transition-all"
                leftIcon={<DocumentArrowUpIcon className="w-6 h-6"/>}
            >
                {isParsingPdf ? 'Processando...' : 'Carregar Edital (PDF)'}
            </Button>
            <div className="hidden sm:flex text-slate-400 text-sm font-medium items-center">
                 <SparklesIcon className="w-4 h-4 mr-2"/> IA Gemini 3 Powered
            </div>
         </div>

         {/* Feedback Messages */}
         <div className="min-h-[60px] mt-6 flex items-center justify-center">
            {isParsingPdf && pdfParseMessage && (
                <span className="flex items-center text-sky-600 bg-sky-50 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                    <LoadingSpinner size="sm" color="text-sky-600" className="mr-2" /> {pdfParseMessage}
                </span>
            )}
            {!isParsingPdf && pdfParseError && (
                <span className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-full text-sm font-medium border border-red-100">
                    <XCircleIcon className="w-5 h-5 mr-2" /> {pdfParseError}
                </span>
            )}
             {!isParsingPdf && !pdfParseError && pdfParseMessage && (
                <span className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-medium border border-green-100">
                    <CheckCircleIcon className="w-5 h-5 mr-2" /> {pdfParseMessage}
                </span>
            )}
         </div>
      </div>
      
      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-10 opacity-80">
          <Card className="text-center !p-6 bg-white/50 backdrop-blur-sm border-slate-100 hover:bg-white transition-colors">
              <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600 font-bold">1</div>
              <h3 className="font-bold text-slate-800">Envie o PDF</h3>
              <p className="text-sm text-slate-500 mt-2">Nossa IA lê o edital completo instantaneamente.</p>
          </Card>
          <Card className="text-center !p-6 bg-white/50 backdrop-blur-sm border-slate-100 hover:bg-white transition-colors">
              <div className="bg-sky-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-sky-600 font-bold">2</div>
              <h3 className="font-bold text-slate-800">Escolha o Cargo</h3>
              <p className="text-sm text-slate-500 mt-2">Identificamos as vagas e extraímos o conteúdo exato.</p>
          </Card>
          <Card className="text-center !p-6 bg-white/50 backdrop-blur-sm border-slate-100 hover:bg-white transition-colors">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-green-600 font-bold">3</div>
              <h3 className="font-bold text-slate-800">Estude com IA</h3>
              <p className="text-sm text-slate-500 mt-2">Receba resumos, questões e flashcards automáticos.</p>
          </Card>
      </div>
    </div>
  );
};
