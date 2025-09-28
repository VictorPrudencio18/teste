
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
    <Card title="Bem-vindo ao ConcursoGenius!" className="max-w-2xl mx-auto text-center">
      <SparklesIcon className="w-20 h-20 text-amber-400 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-slate-800 mb-3 font-display">Seu Plano de Estudos Inteligente Começa Aqui</h2>
      <p className="text-slate-600 mb-8 text-lg leading-relaxed">
        Envie o edital do seu concurso em formato PDF. Nossa Inteligência Artificial <SparklesIcon className="inline w-5 h-5 text-amber-500" /> irá analisá-lo para ajudar a montar o plano de estudos perfeito para você.
      </p>

      <div className="mb-6">
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
            variant="primary"
            className="w-full md:w-auto px-10 py-4 text-lg"
            leftIcon={<DocumentArrowUpIcon className="w-6 h-6"/>}
        >
            {isParsingPdf ? 'Analisando PDF...' : isLoading ? 'Carregando...' : 'Enviar Edital em PDF'}
        </Button>
      </div>
      
      {isParsingPdf && pdfParseMessage && (
        <div className="mt-4 flex items-center justify-center text-md text-sky-700">
          <LoadingSpinner size="sm" color="text-sky-600" /> 
          <span className="ml-2.5">{pdfParseMessage}</span>
        </div>
      )}

      {!isParsingPdf && pdfParseMessage && !pdfParseError && ( 
         <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm inline-flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 mr-2"/> {pdfParseMessage}
        </div>
      )}

      {pdfParseError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm inline-flex items-center justify-center">
          <XCircleIcon className="w-5 h-5 mr-2" /> {pdfParseError}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-slate-200">
        <h3 className="text-xl font-semibold text-slate-700 mb-3 flex items-center justify-center">
            <InformationCircleIcon className="w-6 h-6 text-sky-500 mr-2"/>
            Como funciona?
        </h3>
        <ol className="list-decimal list-inside text-left text-slate-600 space-y-2 max-w-md mx-auto">
            <li>Você envia o PDF do edital.</li>
            <li>Nossa IA identifica os cargos disponíveis.</li>
            <li>Você seleciona seu cargo alvo.</li>
            <li>Informa suas preferências de estudo.</li>
            <li>Recebe um plano de estudos completo e personalizado!</li>
        </ol>
      </div>
    </Card>
  );
};
