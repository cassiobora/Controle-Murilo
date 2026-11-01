import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'mobile-banner' | 'sidebar' }> = ({
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'mobile-banner') {
      return (
        <div className="bg-gradient-to-r from-cyan-950/90 to-slate-900 border border-cyan-800/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Instalar Controle Murilo</p>
              <p className="text-[11px] text-slate-400 truncate">Acesse como App no seu celular</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          onClick={install}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 transition-all shadow-xs"
        >
          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">Instalar no Smartphone</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-medium transition-colors"
        title="Instalar aplicativo Controle Murilo no celular ou computador"
      >
        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'mobile-banner' ? (
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Adicionar à Tela de Início</p>
                <p className="text-[11px] text-slate-400 truncate">Acesso rápido no iPhone/iPad</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-900/50 rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
            >
              <span>Como Instalar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Instalar iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#111827] border border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">1. Toque em Compartilhar</strong>
                    <span className="text-slate-400 text-[11px]">No Safari, toque no ícone de compartilhamento na barra inferior.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">2. Adicionar à Tela de Início</strong>
                    <span className="text-slate-400 text-[11px]">Role para baixo nas opções e toque em "Adicionar à Tela de Início".</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-bold text-white transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback prompt button for devices where beforeinstallprompt isn't fired yet
  const [showUniversalGuide, setShowUniversalGuide] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUniversalGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        title="Instruções para adicionar à tela inicial do celular"
      >
        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Instalar no Celular</span>
      </button>

      {showUniversalGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#111827] border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Instalar no Celular</h3>
              </div>
              <button
                onClick={() => setShowUniversalGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-cyan-400 block font-semibold">Android (Google Chrome)</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Toque nos três pontinhos no canto superior direito e selecione <span className="text-white font-medium">"Instalar aplicativo"</span> ou <span className="text-white font-medium">"Adicionar à tela inicial"</span>.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block font-semibold">iPhone / iPad (Safari)</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Toque no botão <span className="text-white font-medium">Compartilhar</span> na barra inferior do Safari e escolha <span className="text-white font-medium">"Adicionar à Tela de Início"</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUniversalGuide(false)}
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2 text-xs font-bold text-white transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

